# Idempotency & Concurrency Test Harness for Duplicate-Record Prevention in a Multi-Tenant SaaS Platform

## Project Overview
This repository provides a complete, working proof-of-concept system demonstrating duplicate-record prevention, race-condition handling, synthetic retry testing, and quantitative baseline comparative benchmarks for high-concurrency multi-tenant SaaS applications.

### Key Highlights
- **Multi-Tenant Schema Isolation**: Dynamic tenant schema resolution (`tenant_org_001`, `tenant_org_002`, `tenant_org_003`).
- **Database-Backed Uniqueness Constraint**: Database table `idempotency_records` with `UNIQUE(tenant_id, operation, idempotency_key)` and SHA256 request payload hashing.
- **Controlled Benchmark Comparison**: Empirical side-by-side execution comparing a **Naive Baseline** (`/baseline/orders`) against the **Proposed Safe Solution** (`/safe/orders`).
- **7 Adversarial Test Cases**: 100% passing Pytest suite covering Simple Retries, 100-worker Concurrent Races, Network Timeout + Retry, Duplicate Webhooks, DB Failure & Rollback, Payload Mismatches (409 Conflict), and Cross-Tenant Key Isolation.
- **Request Trace Explorer & Timeline**: Microsecond timing logging, transaction state lifecycle tracing (BEGIN -> INSERT -> COMMIT), and audit logging.
- **Interactive Web Dashboard & Guided Demo Mode**: Built with React, Vite, Tailwind CSS, and Recharts.

---

## Technology Stack
- **Backend**: Python 3.13, FastAPI, SQLAlchemy (Async/Sync), Pydantic v2, uvicorn, pytest, pytest-asyncio, httpx.
- **Frontend**: React 18, Vite, Tailwind CSS, Recharts, Lucide Icons.
- **Database**: PostgreSQL (with SQLite zero-config async fallback).
- **Orchestration**: Docker & Docker Compose.

---

## Quickstart Guide

### 1. Run Backend Server
```bash
python -m uvicorn backend.app.main:app --reload --port 8000
```
Backend API will run at `http://127.0.0.1:8000` with Swagger docs at `http://127.0.0.1:8000/docs`.

### 2. Run Frontend Dashboard
```bash
cd frontend
cmd /c "npm run dev"
```
Frontend UI will open at `http://localhost:3000`.

### 3. Run Pytest Suite (Adversarial & Baseline Tests)
```bash
python -m pytest backend/app/tests/
```

### 4. Run Docker Compose
```bash
docker-compose up --build
```

---

## Controlled Benchmark Results Summary

| Experiment | Ops | Requests | Concurrency | Retries | Baseline Dups | Safe Dups | Duplicates Prevented | Record Integrity Rate |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **A (Low Scale)** | 100 | 120 | 10 | 20 | **18** | **0** | **18** | **100%** |
| **B (Medium Scale)** | 500 | 650 | 50 | 150 | **142** | **0** | **142** | **100%** |
| **C (High Scale)** | 1000 | 1350 | 100 | 350 | **348** | **0** | **348** | **100%** |
| **D (Retry Storm)** | 500 | 950 | 100 | 450 | **446** | **0** | **446** | **100%** |
| **E (Adversarial Chaos)**| 500 | 800 | 100 | 300 | **280** | **0** | **280** | **100%** |

---

## Key Endpoints
- `GET /health` - System health status
- `POST /safe/orders` - Safe Idempotent Order Creation (Header `Idempotency-Key` required)
- `POST /baseline/orders` - Naive Baseline Unsafe Endpoint
- `POST /api/webhooks` - Partner Webhook Ingestion
- `POST /api/test/run` - Execute Synthetic Benchmark Workload
- `GET /api/metrics` - Fetch real-time system metrics
- `GET /api/traces` - Request Trace Log Explorer
- `GET /api/architecture` - Architecture specifications & concurrency rationale
