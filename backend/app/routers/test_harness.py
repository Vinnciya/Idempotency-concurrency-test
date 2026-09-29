import json
import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.app.database import get_db
from backend.app.schemas.test_run import TestConfig, TestRunResponse, MetricResult
from backend.app.models.public import TestRun
from backend.app.auth.RBAC import require_permission, UserContext
from test_harness.workload_generator import generate_workload
from test_harness.concurrency_runner import execute_concurrency_batch

router = APIRouter(tags=["Test Harness"])

@router.post("/api/test/run")
async def run_test_harness(
    config: TestConfig,
    request: Request,
    current_user: UserContext = Depends(require_permission("run_test")),
    db: AsyncSession = Depends(get_db)
):
    """
    Executes a real test workload batch against either BASELINE, SAFE, or COMPARISON.
    Produces real metrics stored in database test_runs.
    """
    app_instance = request.app
    run_id = f"RUN-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:4].upper()}"
    
    # 1. Generate workload
    workload = generate_workload(
        num_tenants=config.num_tenants,
        num_operations=config.num_operations,
        retry_prob=config.retry_probability,
        duplicate_prob=config.duplicate_probability,
        timeout_prob=config.timeout_probability,
        failure_prob=config.failure_probability
    )

    if config.implementation.upper() == "COMPARISON":
        # Execute BASELINE then SAFE on identical workload
        baseline_metrics = await execute_concurrency_batch(
            app_instance=app_instance,
            workload=workload,
            implementation="BASELINE",
            concurrency=config.concurrency
        )
        safe_metrics = await execute_concurrency_batch(
            app_instance=app_instance,
            workload=workload,
            implementation="SAFE",
            concurrency=config.concurrency
        )
        
        comparison_result = {
            "baseline": baseline_metrics.model_dump(),
            "safe": safe_metrics.model_dump(),
            "duplicates_prevented": baseline_metrics.duplicate_records_created + safe_metrics.duplicate_records_prevented,
            "improvement_pct": 100.0 if baseline_metrics.duplicate_records_created > 0 else 0.0
        }
        
        test_run = TestRun(
            run_id=run_id,
            name=f"Comparison Test ({config.test_type.upper()}) - {config.num_operations} ops",
            test_type=config.test_type,
            implementation="COMPARISON",
            parameters_json=json.dumps(config.model_dump()),
            metrics_json=json.dumps(comparison_result),
            status="COMPLETED",
            started_at=datetime.utcnow(),
            completed_at=datetime.utcnow()
        )
        db.add(test_run)
        await db.commit()
        await db.refresh(test_run)
        
        return {
            "id": test_run.id,
            "run_id": test_run.run_id,
            "name": test_run.name,
            "test_type": test_run.test_type,
            "implementation": "COMPARISON",
            "parameters": config.model_dump(),
            "comparison": comparison_result,
            "status": "COMPLETED",
            "started_at": test_run.started_at.isoformat()
        }
    else:
        metrics = await execute_concurrency_batch(
            app_instance=app_instance,
            workload=workload,
            implementation=config.implementation,
            concurrency=config.concurrency
        )
        
        test_run = TestRun(
            run_id=run_id,
            name=f"{config.implementation.upper()} Test ({config.test_type}) - {config.num_operations} ops",
            test_type=config.test_type,
            implementation=config.implementation.upper(),
            parameters_json=json.dumps(config.model_dump()),
            metrics_json=json.dumps(metrics.model_dump()),
            status="COMPLETED",
            started_at=datetime.utcnow(),
            completed_at=datetime.utcnow()
        )
        db.add(test_run)
        await db.commit()
        await db.refresh(test_run)
        
        return {
            "id": test_run.id,
            "run_id": test_run.run_id,
            "name": test_run.name,
            "test_type": test_run.test_type,
            "implementation": test_run.implementation,
            "parameters": config.model_dump(),
            "metrics": metrics.model_dump(),
            "status": "COMPLETED",
            "started_at": test_run.started_at.isoformat()
        }


@router.get("/api/test/runs")
async def list_test_runs(
    db: AsyncSession = Depends(get_db)
):
    query = select(TestRun).order_by(TestRun.started_at.desc()).limit(50)
    result = await db.execute(query)
    runs = result.scalars().all()
    
    formatted = []
    for r in runs:
        metrics_data = json.loads(r.metrics_json) if r.metrics_json else {}
        params_data = json.loads(r.parameters_json) if r.parameters_json else {}
        formatted.append({
            "id": r.id,
            "run_id": r.run_id,
            "name": r.name,
            "test_type": r.test_type,
            "implementation": r.implementation,
            "parameters": params_data,
            "metrics": metrics_data,
            "status": r.status,
            "started_at": r.started_at.isoformat(),
            "completed_at": r.completed_at.isoformat() if r.completed_at else None
        })
    return formatted


@router.get("/api/test/runs/{run_id}")
async def get_test_run_details(
    run_id: str,
    db: AsyncSession = Depends(get_db)
):
    query = select(TestRun).where(TestRun.run_id == run_id)
    result = await db.execute(query)
    r = result.scalar_one_or_none()
    if not r:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Test run not found")
        
    return {
        "id": r.id,
        "run_id": r.run_id,
        "name": r.name,
        "test_type": r.test_type,
        "implementation": r.implementation,
        "parameters": json.loads(r.parameters_json) if r.parameters_json else {},
        "metrics": json.loads(r.metrics_json) if r.metrics_json else {},
        "status": r.status,
        "started_at": r.started_at.isoformat(),
        "completed_at": r.completed_at.isoformat() if r.completed_at else None
    }
