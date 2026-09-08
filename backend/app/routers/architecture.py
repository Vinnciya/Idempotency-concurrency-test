from fastapi import APIRouter
from backend.app.auth.RBAC import ROLE_PERMISSIONS

router = APIRouter(tags=["Architecture & Permissions"])

@router.get("/api/architecture")
async def get_architecture_details():
    return {
        "title": "Idempotency & Concurrency Test Harness for Duplicate-Record Prevention in a Multi-Tenant SaaS Platform",
        "layers": [
            {
                "name": "Client / Test Workload Generator",
                "description": "Simulates retries, network timeouts, concurrent HTTP clients, partner webhooks, and multi-tenant operations using httpx and asyncio."
            },
            {
                "name": "API Gateway / FastAPI Router",
                "description": "Handles routing, header extraction (Idempotency-Key, X-Tenant-Id, X-Role), request validation, and exception handling."
            },
            {
                "name": "Authentication & RBAC Layer",
                "description": "Enforces permission checks across ADMIN, OPERATOR, EXTERNAL_PARTNER, and VIEWER roles."
            },
            {
                "name": "Tenant Schema Resolver",
                "description": "Dynamically resolves target tenant database context ensuring multi-tenant data isolation."
            },
            {
                "name": "Idempotency Layer",
                "description": "Stores keys in idempotency_records table with UNIQUE(tenant_id, operation, idempotency_key). Checks SHA256 request payload hash to prevent payload mismatch conflicts (409)."
            },
            {
                "name": "Concurrency Control & Database Transaction Boundary",
                "description": "Database-level uniqueness constraints, transaction isolation, atomic commits/rollbacks, and SELECT FOR UPDATE / INSERT ON CONFLICT mechanisms."
            },
            {
                "name": "PostgreSQL Multi-Tenant Storage",
                "description": "Public schema for tenants, users, idempotency_records, request_traces, test_runs, audit_logs. Tenant schemas/tables for business models (orders, customers, webhook_events)."
            },
            {
                "name": "Observability & Request Trace Explorer",
                "description": "Captures microsecond-level timing, transaction state (BEGIN, COMMITTED, ROLLED_BACK), retry counts, and status for every request."
            }
        ],
        "concurrency_comparison": [
            {
                "strategy": "Database UNIQUE Constraint + Atomic Transaction",
                "safety": "High (Database Authority)",
                "multi_node_safe": True,
                "pros": "ACID compliance, works across all horizontal backend nodes, zero memory race conditions.",
                "cons": "Requires database write."
            },
            {
                "strategy": "In-Memory Dictionary / Redis Lock",
                "safety": "Low to Medium",
                "multi_node_safe": False,
                "pros": "Fast local lookup.",
                "cons": "Fails across multiple backend instances, prone to process crashes & key loss."
            },
            {
                "strategy": "Global Application Lock (Python asyncio.Lock)",
                "safety": "Low",
                "multi_node_safe": False,
                "pros": "Simple to code.",
                "cons": "Serializes all requests across all tenants, destroys throughput, single-node only."
            },
            {
                "strategy": "Simple 'Check-Then-Insert' (Baseline)",
                "safety": "None (Race condition guaranteed)",
                "multi_node_safe": False,
                "pros": "Naive baseline implementation.",
                "cons": "Two concurrent requests pass the check simultaneously before either inserts, creating duplicate records!"
            }
        ]
    }

@router.get("/api/permissions")
async def get_permissions():
    return {
        "roles": [
            {
                "role": "ADMIN",
                "description": "Full access: create, retry, run test harness, view metrics, webhook submission, audit access",
                "permissions": ROLE_PERMISSIONS["ADMIN"]
            },
            {
                "role": "OPERATOR",
                "description": "Operational access: create orders, view tenant orders, view metrics & traces",
                "permissions": ROLE_PERMISSIONS["OPERATOR"]
            },
            {
                "role": "EXTERNAL_PARTNER",
                "description": "Integration access: submit partner requests and webhooks",
                "permissions": ROLE_PERMISSIONS["EXTERNAL_PARTNER"]
            },
            {
                "role": "VIEWER",
                "description": "Read-only access: view dashboard, traces, and metrics",
                "permissions": ROLE_PERMISSIONS["VIEWER"]
            }
        ]
    }
