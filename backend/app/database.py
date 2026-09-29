import os
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import text, select
from backend.app.config import settings
from backend.app.models.public import Base, Tenant, User, AuditLog, StakeholderFeedback
from backend.app.models.tenant import Order, Customer, WebhookEvent

# Async Engine setup
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False
)

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

async def init_db(drop_first: bool = False):
    async with engine.begin() as conn:
        if drop_first:
            await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
        
    # Seed default tenants and users
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Tenant))
        existing_tenants = result.scalars().all()
        if not existing_tenants:
            for t_data in settings.DEFAULT_TENANTS:
                tenant = Tenant(
                    id=t_data["id"],
                    name=t_data["name"],
                    schema_name=t_data["schema_name"],
                    status="ACTIVE"
                )
                session.add(tenant)
                
            for u_data in settings.DEFAULT_USERS:
                user = User(
                    id=u_data["id"],
                    tenant_id=u_data["tenant_id"],
                    username=u_data["username"],
                    email=u_data["email"],
                    role=u_data["role"]
                )
                session.add(user)
            
            # Add initial sample customers
            for t_id in ["org_001", "org_002", "org_003"]:
                cust = Customer(
                    id=f"cust_{t_id}_101",
                    tenant_id=t_id,
                    customer_id=f"CUST_{t_id}_1001",
                    name="Alpha Customer",
                    email=f"cust1001@{t_id}.com"
                )
                session.add(cust)
                
            try:
                await session.commit()
            except Exception:
                await session.rollback()
