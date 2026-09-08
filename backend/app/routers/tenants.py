from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Dict, Any

from backend.app.database import get_db
from backend.app.models.public import Tenant
from backend.app.auth.RBAC import get_current_user, UserContext

router = APIRouter(tags=["Tenants"])

@router.get("/api/tenants")
async def list_tenants(
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Tenant))
    tenants = result.scalars().all()
    return [
        {
            "id": t.id,
            "name": t.name,
            "schema_name": t.schema_name,
            "status": t.status,
            "created_at": t.created_at.isoformat()
        } for t in tenants
    ]
