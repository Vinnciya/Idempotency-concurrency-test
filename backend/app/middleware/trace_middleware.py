import time
import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.models.public import RequestTrace

async def log_trace(
    session: AsyncSession,
    tenant_id: str,
    endpoint: str,
    event: str,
    status_str: str,
    latency_ms: float,
    idempotency_key: Optional[str] = None,
    user_id: Optional[str] = "usr_admin",
    role: Optional[str] = "ADMIN",
    retry_number: int = 0,
    transaction_id: Optional[str] = None,
    transaction_state: Optional[str] = "COMMITTED",
    error: Optional[str] = None,
    record_id: Optional[str] = None,
    trace_id: Optional[str] = None,
    request_id: Optional[str] = None
) -> RequestTrace:
    if not trace_id:
        trace_id = f"TRC-{int(time.time()*1000)}-{uuid.uuid4().hex[:6]}"
    if not request_id:
        request_id = f"REQ-{uuid.uuid4().hex[:8]}"
    if not transaction_id:
        transaction_id = f"TXN-{uuid.uuid4().hex[:8]}"

    trace = RequestTrace(
        trace_id=trace_id,
        request_id=request_id,
        tenant_id=tenant_id,
        user_id=user_id,
        role=role,
        endpoint=endpoint,
        idempotency_key=idempotency_key,
        retry_number=retry_number,
        transaction_id=transaction_id,
        transaction_state=transaction_state,
        event=event,
        status=status_str,
        latency_ms=round(latency_ms, 2),
        error=error,
        record_id=record_id,
        timestamp=datetime.utcnow()
    )
    session.add(trace)
    try:
        await session.commit()
    except Exception:
        await session.rollback()
    return trace
