import hashlib
import json
import asyncio
from datetime import datetime
from typing import Tuple, Optional, Any, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
from backend.app.models.public import IdempotencyRecord

def compute_request_hash(payload: Dict[str, Any]) -> str:
    serialized = json.dumps(payload, sort_keys=True)
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()

class IdempotencyService:
    @staticmethod
    async def begin_or_retrieve(
        session: AsyncSession,
        tenant_id: str,
        operation: str,
        idempotency_key: str,
        payload: Dict[str, Any]
    ) -> Tuple[bool, Optional[Dict[str, Any]], Optional[int], Optional[IdempotencyRecord]]:
        """
        Returns (is_cached, cached_response_body, cached_status_code, record)
        - If is_cached is True: return cached response immediately.
        - If is_cached is False: caller executes business operation and must call complete_record!
        """
        request_hash = compute_request_hash(payload)
        
        # 1. Check existing record
        query = select(IdempotencyRecord).where(
            IdempotencyRecord.tenant_id == tenant_id,
            IdempotencyRecord.operation == operation,
            IdempotencyRecord.idempotency_key == idempotency_key
        )
        result = await session.execute(query)
        record = result.scalar_one_or_none()
        
        if record:
            # Check payload mismatch (CASE 6)
            if record.request_hash != request_hash:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Idempotency-Key '{idempotency_key}' was previously used with a different request payload."
                )
            
            if record.status == "COMPLETED":
                # Original response returned (CASE 1 & CASE 3)
                body = json.loads(record.response_body) if record.response_body else {}
                return True, body, record.response_code, record
            
            elif record.status == "IN_PROGRESS":
                # Concurrent request in progress! Poll/wait up to 5 seconds for completion (CASE 2)
                for _ in range(25):
                    await asyncio.sleep(0.1)
                    await session.refresh(record)
                    if record.status == "COMPLETED":
                        body = json.loads(record.response_body) if record.response_body else {}
                        return True, body, record.response_code, record
                
                # If still in progress or failed, return stored or 409
                if record.status == "COMPLETED":
                    body = json.loads(record.response_body) if record.response_body else {}
                    return True, body, record.response_code, record
                else:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail="Concurrent request with same Idempotency-Key is still processing."
                    )
        
        # 2. Record does not exist -> insert IN_PROGRESS record using DB unique constraint
        new_record = IdempotencyRecord(
            tenant_id=tenant_id,
            operation=operation,
            idempotency_key=idempotency_key,
            request_hash=request_hash,
            status="IN_PROGRESS",
            created_at=datetime.utcnow()
        )
        session.add(new_record)
        
        try:
            await session.flush() # Enforce DB constraint immediately
        except IntegrityError:
            await session.rollback()
            # DB level race condition caught! Poll for completed result
            query = select(IdempotencyRecord).where(
                IdempotencyRecord.tenant_id == tenant_id,
                IdempotencyRecord.operation == operation,
                IdempotencyRecord.idempotency_key == idempotency_key
            )
            res = await session.execute(query)
            existing = res.scalar_one_or_none()
            if existing:
                if existing.request_hash != request_hash:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail=f"Idempotency-Key '{idempotency_key}' payload mismatch."
                    )
                for _ in range(25):
                    await asyncio.sleep(0.1)
                    await session.refresh(existing)
                    if existing.status == "COMPLETED":
                        body = json.loads(existing.response_body) if existing.response_body else {}
                        return True, body, existing.response_code, existing
            
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Concurrent execution detected via database uniqueness constraint."
            )

        return False, None, None, new_record

    @staticmethod
    async def complete_record(
        session: AsyncSession,
        record: IdempotencyRecord,
        response_code: int,
        response_data: Dict[str, Any]
    ):
        record.status = "COMPLETED"
        record.response_code = response_code
        record.response_body = json.dumps(response_data)
        record.completed_at = datetime.utcnow()
        await session.commit()
