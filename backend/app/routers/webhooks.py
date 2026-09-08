import time
import json
import uuid
from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.app.database import get_db
from backend.app.schemas.order import WebhookEventRequest
from backend.app.models.tenant import WebhookEvent
from backend.app.models.public import IdempotencyRecord
from backend.app.services.idempotency import IdempotencyService
from backend.app.middleware.trace_middleware import log_trace

router = APIRouter(tags=["Webhooks"])

@router.post("/api/webhooks")
async def process_webhook(
    body: WebhookEventRequest,
    idempotency_key: str = Header(..., alias="Idempotency-Key"),
    db: AsyncSession = Depends(get_db)
):
    """
    DUPLICATE WEBHOOK HANDLING (CASE 4)
    Processes incoming partner webhooks idempotently using (tenant_id, "WEBHOOK", idempotency_key).
    """
    start_time = time.time()
    payload_dict = body.model_dump()
    operation = "WEBHOOK_EVENT"
    
    is_cached, cached_body, cached_status, record = await IdempotencyService.begin_or_retrieve(
        session=db,
        tenant_id=body.tenant_id,
        operation=operation,
        idempotency_key=idempotency_key,
        payload=payload_dict
    )
    
    if is_cached and cached_body:
        latency = (time.time() - start_time) * 1000
        await log_trace(
            session=db,
            tenant_id=body.tenant_id,
            endpoint="/api/webhooks",
            event="DUPLICATE_WEBHOOK_PREVENTED",
            status_str="DUPLICATE_PREVENTED",
            latency_ms=latency,
            idempotency_key=idempotency_key,
            record_id=cached_body.get("event_id")
        )
        cached_body["is_duplicate_prevented"] = True
        return cached_body

    webhook = WebhookEvent(
        id=f"WH-{uuid.uuid4().hex[:8]}",
        tenant_id=body.tenant_id,
        event_id=body.event_id,
        event_type=body.event_type,
        payload_json=json.dumps(body.payload),
        status="PROCESSED"
    )
    db.add(webhook)
    await db.flush()

    response_data = {
        "status": "SUCCESS",
        "event_id": body.event_id,
        "event_type": body.event_type,
        "webhook_record_id": webhook.id,
        "processed_at": webhook.processed_at.isoformat(),
        "is_duplicate_prevented": False
    }

    await IdempotencyService.complete_record(
        session=db,
        record=record,
        response_code=200,
        response_data=response_data
    )

    latency = (time.time() - start_time) * 1000
    await log_trace(
        session=db,
        tenant_id=body.tenant_id,
        endpoint="/api/webhooks",
        event="WEBHOOK_PROCESSED",
        status_str="SUCCESS",
        latency_ms=latency,
        idempotency_key=idempotency_key,
        record_id=webhook.id
    )

    return response_data
