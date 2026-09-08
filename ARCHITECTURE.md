# System Architecture & Concurrency Safety Specification

## Architecture Overview
```
Client / Test Workload Generator (httpx / asyncio)
               │
               ▼
  FastAPI Gateway (Routing & Validation)
               │
   ┌───────────┴───────────┐
   ▼                       ▼
Authentication & RBAC   Tenant Schema Resolver
   │                       │
   └───────────┬───────────┘
               ▼
       Idempotency Layer
 (SHA256 Payload Hash Check)
               │
               ▼
     Concurrency Control &
  Atomic Transaction Boundary
               │
               ▼
    PostgreSQL Database
 ├── Public Schema (tenants, idempotency_records, traces, test_runs, audit_logs)
 └── Tenant Schemas (orders, customers, webhook_events)
```

## Idempotency Strategy Comparison
| Strategy | Multi-Node Safe | Multi-Tenant Safe | ACID Protection | Throughput Impact |
| :--- | :--- | :--- | :--- | :--- |
| **DB UNIQUE Constraint + Atomic Txn** | YES | YES | YES | Minimal DB Overhead |
| **In-Memory Dictionary / Redis Lock** | NO | NO | NO | None |
| **Global Application Lock** | NO | YES | NO | Destroys Parallelism |
| **Check-Then-Insert (Baseline)** | NO | NO | NO | None |
