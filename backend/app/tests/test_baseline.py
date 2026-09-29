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
async def test_baseline_creates_duplicates_under_retries():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        headers = {
            "X-Tenant-Id": "org_001",
            "X-Role": "ADMIN"
        }
        payload = {
            "tenant_id": "org_001",
            "customer_id": "CUST1001",
            "external_reference": "EXT-BASE-RETRY-100",
            "amount": 2500,
            "currency": "INR"
        }
        
        # Send baseline request 3 times (simulating retries)
        r1 = await client.post("/baseline/orders", json=payload, headers=headers)
        r2 = await client.post("/baseline/orders", json=payload, headers=headers)
        r3 = await client.post("/baseline/orders", json=payload, headers=headers)
        
        assert r1.status_code == 200
        assert r2.status_code == 200
        assert r3.status_code == 200
        
        # Baseline assigns THREE DIFFERENT order IDs for identical logical operation!
        id1 = r1.json()["id"]
        id2 = r2.json()["id"]
        id3 = r3.json()["id"]
        
        assert len({id1, id2, id3}) == 3, "Baseline must produce duplicate order records!"
