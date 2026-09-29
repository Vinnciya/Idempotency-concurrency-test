import os
import json
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.config import settings
from backend.app.database import init_db, get_db
from backend.app.routers import (
    orders,
    tenants,
    webhooks,
    test_harness,
    metrics,
    traces,
    audit,
    architecture,
    stakeholder
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB tables and seed default tenants
    await init_db()
    
    # Save synthetic validation dataset to data/validation/synthetic_dataset.json (Requirement 22)
    os.makedirs("data/validation", exist_ok=True)
    validation_sample = [
        {
            "tenant_id": "org_001",
            "user_id": "usr_admin",
            "role": "ADMIN",
            "operation_id": "OP-VALIDATION-001",
            "idempotency_key": "IDEMP-VAL-1001",
            "request_id": "REQ-VAL-001",
            "retry_number": 0,
            "concurrency_group": 1,
            "failure_type": "NONE",
            "timeout_flag": False,
            "expected_record_count": 1
        },
        {
            "tenant_id": "org_001",
            "user_id": "usr_admin",
            "role": "ADMIN",
            "operation_id": "OP-VALIDATION-001",
            "idempotency_key": "IDEMP-VAL-1001",
            "request_id": "REQ-VAL-002",
            "retry_number": 1,
            "concurrency_group": 1,
            "failure_type": "SIMULATED_RETRY",
            "timeout_flag": True,
            "expected_record_count": 1
        }
    ]
    with open("data/validation/synthetic_dataset.json", "w") as f:
        json.dump(validation_sample, f, indent=2)

    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Idempotency & Concurrency Test Harness for Duplicate-Record Prevention in a Multi-Tenant SaaS Platform",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware for React Vite Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(orders.router)
app.include_router(tenants.router)
app.include_router(webhooks.router)
app.include_router(test_harness.router)
app.include_router(metrics.router)
app.include_router(traces.router)
app.include_router(audit.router)
app.include_router(architecture.router)
app.include_router(stakeholder.router)

@app.get("/health")
async def health_check():
    return {
        "status": "HEALTHY",
        "service": settings.PROJECT_NAME,
        "database": "CONNECTED",
        "tenants_loaded": len(settings.DEFAULT_TENANTS)
    }

@app.get("/")
async def root():
    return {
        "message": "Welcome to Idempotency & Concurrency Test Harness API",
        "docs_url": "/docs",
        "health_url": "/health"
    }
