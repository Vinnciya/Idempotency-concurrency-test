from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.database import get_db
from backend.app.services.metrics_calculator import calculate_system_metrics

router = APIRouter(tags=["Metrics"])

@router.get("/api/metrics")
async def get_metrics(db: AsyncSession = Depends(get_db)):
    return await calculate_system_metrics(db)
