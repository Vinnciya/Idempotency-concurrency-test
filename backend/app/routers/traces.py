from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, List

from backend.app.database import get_db
from backend.app.models.public import RequestTrace
from backend.app.schemas.trace import RequestTraceResponse

router = APIRouter(tags=["Traces"])

@router.get("/api/traces", response_model=List[RequestTraceResponse])
async def get_traces(
    tenant_id: Optional[str] = Query(None),
    trace_id: Optional[str] = Query(None),
    idempotency_key: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    endpoint: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db)
):
    query = select(RequestTrace)
    
    if tenant_id:
        query = query.where(RequestTrace.tenant_id == tenant_id)
    if trace_id:
        query = query.where(RequestTrace.trace_id == trace_id)
    if idempotency_key:
        query = query.where(RequestTrace.idempotency_key == idempotency_key)
    if status:
        query = query.where(RequestTrace.status == status)
    if endpoint:
        query = query.where(RequestTrace.endpoint == endpoint)
        
    query = query.order_by(RequestTrace.timestamp.desc()).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()
