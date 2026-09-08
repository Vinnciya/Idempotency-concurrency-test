# API Documentation Reference

## Overview
All endpoints accept standard JSON payloads and multi-tenant authentication headers (`X-Tenant-Id`, `X-Role`, `X-User-Id`).

### 1. Create Order (Safe Solution)
`POST /safe/orders`

Headers:
- `X-Tenant-Id: org_001`
- `Idempotency-Key: IDEMP-ABC-123`

Request Body:
```json
{
  "tenant_id": "org_001",
  "customer_id": "CUST1001",
  "external_reference": "EXT-ORD-10001",
  "amount": 2500,
  "currency": "INR"
}
```

Response (200 OK):
```json
{
  "id": "ORD-SAFE-A1B2C3D4",
  "tenant_id": "org_001",
  "customer_id": "CUST1001",
  "external_reference": "EXT-ORD-10001",
  "amount": 2500,
  "currency": "INR",
  "status": "CREATED",
  "created_at": "2026-09-07T16:00:00.000Z",
  "is_duplicate_prevented": false,
  "idempotency_key": "IDEMP-ABC-123"
}
```

### 2. Create Order (Naive Baseline)
`POST /baseline/orders`

### 3. Duplicate Webhook Ingestion
`POST /api/webhooks`

### 4. Run Test Harness Benchmark
`POST /api/test/run`

### 5. System Metrics
`GET /api/metrics`

### 6. Request Trace Explorer
`GET /api/traces`
