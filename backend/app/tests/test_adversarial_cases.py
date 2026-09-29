import pytest
import pytest_asyncio
import asyncio
import httpx
from backend.app.main import app
from backend.app.database import init_db

@pytest_asyncio.fixture(autouse=True, scope="function")
async def setup_test_database():
    await init_db(drop_first=True)


@pytest.mark.asyncio
async def test_case_1_simple_retry():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        headers = {
            "X-Tenant-Id": "org_001",
            "Idempotency-Key": "TEST-KEY-CASE-1",
            "X-Role": "ADMIN"
        }
        payload = {
            "tenant_id": "org_001",
            "customer_id": "CUST1001",
            "external_reference": "EXT-CASE1",
            "amount": 2500,
            "currency": "INR"
        }
        
        # Request 1
        r1 = await client.post("/safe/orders", json=payload, headers=headers)
        assert r1.status_code == 200
        d1 = r1.json()
        assert d1["is_duplicate_prevented"] is False
        order_id = d1["id"]

        # Request 2 (Retry 1)
        r2 = await client.post("/safe/orders", json=payload, headers=headers)
        assert r2.status_code == 200
        d2 = r2.json()
        assert d2["is_duplicate_prevented"] is True
        assert d2["id"] == order_id

        # Request 3 (Retry 2)
        r3 = await client.post("/safe/orders", json=payload, headers=headers)
        assert r3.status_code == 200
        d3 = r3.json()
        assert d3["is_duplicate_prevented"] is True
        assert d3["id"] == order_id


@pytest.mark.asyncio
async def test_case_2_concurrent_race():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        headers = {
            "X-Tenant-Id": "org_001",
            "Idempotency-Key": "TEST-KEY-CONCURRENT-RACE",
            "X-Role": "ADMIN"
        }
        payload = {
            "tenant_id": "org_001",
            "customer_id": "CUST1001",
            "external_reference": "EXT-CONCURRENT",
            "amount": 3000,
            "currency": "INR"
        }

        # Send 10 concurrent requests simultaneously
        tasks = [client.post("/safe/orders", json=payload, headers=headers) for _ in range(10)]
        responses = await asyncio.gather(*tasks)

        status_codes = [r.status_code for r in responses]
        assert all(sc == 200 for sc in status_codes)

        # Verify all return the exact SAME order ID!
        order_ids = [r.json()["id"] for r in responses]
        assert len(set(order_ids)) == 1


@pytest.mark.asyncio
async def test_case_3_timeout_retry():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        headers = {
            "X-Tenant-Id": "org_001",
            "Idempotency-Key": "TEST-KEY-TIMEOUT",
            "X-Role": "ADMIN"
        }
        payload = {
            "tenant_id": "org_001",
            "customer_id": "CUST1001",
            "external_reference": "EXT-TIMEOUT",
            "amount": 1500,
            "currency": "INR"
        }

        # First request receives simulated timeout (504)
        r1 = await client.post("/safe/orders?simulate_timeout=true", json=payload, headers=headers)
        assert r1.status_code == 504

        # Client retries with same key
        r2 = await client.post("/safe/orders", json=payload, headers=headers)
        assert r2.status_code == 200
        assert r2.json()["is_duplicate_prevented"] is True


@pytest.mark.asyncio
async def test_case_4_duplicate_webhook():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        headers = {
            "Idempotency-Key": "WEBHOOK-KEY-999"
        }
        payload = {
            "tenant_id": "org_001",
            "event_id": "EVT-PAYMENT-001",
            "event_type": "PAYMENT_RECEIVED",
            "payload": {"amount": 5000, "status": "SUCCESS"}
        }

        # Webhook 1
        r1 = await client.post("/api/webhooks", json=payload, headers=headers)
        assert r1.status_code == 200
        assert r1.json()["is_duplicate_prevented"] is False

        # Webhook 2 (Duplicate delivery)
        r2 = await client.post("/api/webhooks", json=payload, headers=headers)
        assert r2.status_code == 200
        assert r2.json()["is_duplicate_prevented"] is True


@pytest.mark.asyncio
async def test_case_5_transaction_failure():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        headers = {
            "X-Tenant-Id": "org_001",
            "Idempotency-Key": "TEST-KEY-TXN-FAIL",
            "X-Role": "ADMIN"
        }
        payload = {
            "tenant_id": "org_001",
            "customer_id": "CUST1001",
            "external_reference": "EXT-TXNFAIL",
            "amount": 900,
            "currency": "INR"
        }

        # First attempt hits simulated failure -> 500 & Rollback
        r1 = await client.post("/safe/orders?simulate_failure=true", json=payload, headers=headers)
        assert r1.status_code == 500

        # Safe retry succeeds cleanly because failed transaction was rolled back!
        r2 = await client.post("/safe/orders", json=payload, headers=headers)
        assert r2.status_code == 200
        assert r2.json()["is_duplicate_prevented"] is False


@pytest.mark.asyncio
async def test_case_6_same_key_different_payload():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        headers = {
            "X-Tenant-Id": "org_001",
            "Idempotency-Key": "TEST-KEY-MISMATCH",
            "X-Role": "ADMIN"
        }
        payload1 = {
            "tenant_id": "org_001",
            "customer_id": "CUST1001",
            "external_reference": "EXT-MISMATCH",
            "amount": 1000,
            "currency": "INR"
        }
        payload2 = {
            "tenant_id": "org_001",
            "customer_id": "CUST1001",
            "external_reference": "EXT-MISMATCH",
            "amount": 5000, # Different amount!
            "currency": "INR"
        }

        # First payload succeeds
        r1 = await client.post("/safe/orders", json=payload1, headers=headers)
        assert r1.status_code == 200

        # Second payload with SAME key is rejected with 409 Conflict
        r2 = await client.post("/safe/orders", json=payload2, headers=headers)
        assert r2.status_code == 409
        assert "different request payload" in r2.json()["detail"]


@pytest.mark.asyncio
async def test_case_7_cross_tenant_isolation():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # Same idempotency key used in Org 1 and Org 2
        key = "SHARED-KEY-CROSS-TENANT"
        
        # Org 1
        h1 = {"X-Tenant-Id": "org_001", "Idempotency-Key": key, "X-Role": "ADMIN"}
        p1 = {"tenant_id": "org_001", "customer_id": "CUST1001", "external_reference": "EXT-CROSS1", "amount": 1200, "currency": "INR"}
        r1 = await client.post("/safe/orders", json=p1, headers=h1)
        assert r1.status_code == 200

        # Org 2 (Independent tenant execution!)
        h2 = {"X-Tenant-Id": "org_002", "Idempotency-Key": key, "X-Role": "ADMIN"}
        p2 = {"tenant_id": "org_002", "customer_id": "CUST1001", "external_reference": "EXT-CROSS2", "amount": 1200, "currency": "INR"}
        r2 = await client.post("/safe/orders", json=p2, headers=h2)
        assert r2.status_code == 200
        
        # Verify two distinct orders created across tenants!
        assert r1.json()["id"] != r2.json()["id"]
