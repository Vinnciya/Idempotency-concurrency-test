# Idempotency & Concurrency Test Harness for Duplicate-Record Prevention in a Multi-Tenant SaaS Platform

## Project Overview
This repository provides a complete proof-of-concept system demonstrating duplicate-record prevention, race-condition handling, synthetic retry testing, and quantitative baseline comparative benchmarks for high-concurrency multi-tenant SaaS applications.

### Key Highlights
- **Multi-Tenant Schema Isolation**: Dynamic tenant schema resolution across organizations.
- **Database-Backed Uniqueness Constraint**: Centralized idempotency records utilizing composite unique constraints combined with SHA256 request payload validation hashing.
- **Controlled Benchmark Comparison**: Empirical side-by-side execution comparing an unprotected naive baseline implementation against the proposed concurrency-safe solution.
- **Adversarial Test Suite**: Comprehensive verification covering simple retries, concurrent race conditions, network timeout retries, duplicate webhooks, database failure rollbacks, payload mismatch conflicts, and cross-tenant key isolation.
- **Request Trace Explorer & Timeline**: Microsecond timing logging, transaction state lifecycle tracing (BEGIN -> INSERT -> COMMIT), and audit logging.
- **Interactive Web Dashboard**: Executive analytical interface built for interactive demonstration and real-time visualization.

---

## Technology Stack
- **Backend Infrastructure**: Python, FastAPI, SQLAlchemy, Pydantic, Uvicorn, Pytest.
- **Frontend User Interface**: React, Vite, Tailwind CSS, Recharts, Lucide Icons.
- **Database Engine**: PostgreSQL with SQLite fallback capabilities.
- **Containerization**: Docker & Docker Compose.

---

## System Architecture & Features

### 1. Multi-Tenancy & Schema Isolation
The platform implements multi-tenant isolation, ensuring data and operations for different tenant organizations remain logically and database-level isolated.

### 2. Idempotency Service
Protects financial and state-changing transactions against duplicate submissions resulting from network retries, client double-clicks, or distributed system race conditions.

### 3. Concurrency & Chaos Test Harness
Provides synthetic workload generation to simulate retry storms, concurrent threads, network delays, and adversarial payload modifications under load.

### 4. Comprehensive Monitoring & Audit Logs
Tracks request lifecycles, execution latencies, transaction states, and tenant activity in real time.

---

## Controlled Benchmark Results Summary

| Experiment Scale | Operations | Requests | Concurrency | Retries | Unprotected Baseline Duplicates | Proposed Solution Duplicates | Duplicates Prevented | Integrity Rate |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Low Scale** | 100 | 120 | 10 | 20 | **18** | **0** | **18** | **100%** |
| **Medium Scale** | 500 | 650 | 50 | 150 | **142** | **0** | **142** | **100%** |
| **High Scale** | 1000 | 1350 | 100 | 350 | **348** | **0** | **348** | **100%** |
| **Retry Storm** | 500 | 950 | 100 | 450 | **446** | **0** | **446** | **100%** |
| **Adversarial Chaos** | 500 | 800 | 100 | 300 | **280** | **0** | **280** | **100%** |

---

## Documentation Structure
- **API Documentation**: Detailed endpoint contracts and request specifications.
- **Architecture Overview**: System design diagrams, schema isolation details, and concurrency rationale.
- **Test Plan & Results**: Detailed benchmark metrics, adversarial scenario analysis, and system limitations.

