from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

from backend.app.database import get_db
from backend.app.models.public import AuditLog

router = APIRouter(tags=["Audit Logs"])

@router.get("/api/audit")
async def get_audit_logs(
    tenant_id: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db)
):
    query = select(AuditLog)
    if tenant_id:
        query = query.where(AuditLog.tenant_id == tenant_id)
    query = query.order_by(AuditLog.timestamp.desc()).limit(limit)
    result = await db.execute(query)
    logs = result.scalars().all()
    return [
        {
            "id": log.id,
            "timestamp": log.timestamp.isoformat(),
            "tenant_id": log.tenant_id,
            "user_id": log.user_id,
            "role": log.role,
            "action": log.action,
            "resource": log.resource,
            "details": log.details_json
        } for log in logs
    ]
