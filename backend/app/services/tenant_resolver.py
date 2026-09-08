from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.app.models.public import Tenant
from fastapi import HTTPException, status

async def resolve_tenant(tenant_id: str, session: AsyncSession) -> Tenant:
    result = await session.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tenant '{tenant_id}' not found or invalid"
        )
    if tenant.status != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Tenant '{tenant_id}' is inactive"
        )
    return tenant
