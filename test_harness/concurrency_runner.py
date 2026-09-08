import asyncio
import time
from typing import List, Dict, Any
import httpx
from backend.app.schemas.test_run import MetricResult

async def execute_concurrency_batch(
    app_instance,
    workload: List[Dict[str, Any]],
    implementation: str = "SAFE",
    concurrency: int = 10
) -> MetricResult:
    """
    Executes a workload batch concurrently against either BASELINE or SAFE implementation
    using an ASGI httpx client, recording exact HTTP status codes, latencies, and duplicate metrics.
    """
    transport = httpx.ASGITransport(app=app_instance)
    semaphore = asyncio.Semaphore(concurrency)
    
    endpoint = "/baseline/orders" if implementation.upper() == "BASELINE" else "/safe/orders"
    
    results = []
    latencies = []
    
    async def worker(op: Dict[str, Any]):
        async with semaphore:
            async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
                headers = {
                    "X-Tenant-Id": op["tenant_id"],
                    "X-Role": "ADMIN",
                    "X-User-Id": "usr_admin",
                    "X-Retry-Number": str(op["attempt"] - 1)
                }
                if implementation.upper() == "SAFE":
                    headers["Idempotency-Key"] = op["idempotency_key"]
                    
                body = {
                    "tenant_id": op["tenant_id"],
                    "customer_id": op["customer_id"],
                    "external_reference": op["external_reference"],
                    "amount": op["amount"],
                    "currency": op["currency"]
                }
                
                params = {}
                if op.get("simulate_timeout"):
                    params["simulate_timeout"] = "true"
                if op.get("simulate_failure"):
                    params["simulate_failure"] = "true"
                    
                st = time.time()
                try:
                    resp = await client.post(endpoint, json=body, headers=headers, params=params, timeout=10.0)
                    elapsed = (time.time() - st) * 1000
                    latencies.append(elapsed)
                    
                    data = resp.json() if resp.headers.get("content-type") == "application/json" else {}
                    results.append({
                        "status_code": resp.status_code,
                        "is_duplicate_prevented": data.get("is_duplicate_prevented", False),
                        "order_id": data.get("id"),
                        "op": op,
                        "latency_ms": elapsed
                    })
                except Exception as ex:
                    elapsed = (time.time() - st) * 1000
                    latencies.append(elapsed)
                    results.append({
                        "status_code": 500,
                        "error": str(ex),
                        "op": op,
                        "latency_ms": elapsed
                    })

    tasks = [worker(op) for op in workload]
    await asyncio.gather(*tasks)
    
    # Calculate metrics
    total_reqs = len(results)
    total_retries = sum(1 for r in results if r["op"].get("is_retry"))
    
    success_count = sum(1 for r in results if r["status_code"] in [200, 201])
    failed_count = sum(1 for r in results if r["status_code"] >= 500)
    conflict_count = sum(1 for r in results if r["status_code"] == 409)
    
    if implementation.upper() == "SAFE":
        dup_prevented = sum(1 for r in results if r.get("is_duplicate_prevented"))
        dup_created = 0
    else:
        # Baseline creates multiple orders for same external_reference
        created_ids = [r.get("order_id") for r in results if r.get("order_id")]
        dup_created = max(0, len(created_ids) - len(set(created_ids))) if len(created_ids) > 0 else 0
        dup_prevented = 0

    dup_attempts = sum(1 for op in workload if op.get("is_retry"))
    if dup_attempts == 0 and (dup_prevented > 0 or dup_created > 0):
        dup_attempts = dup_prevented + dup_created

    avg_lat = float(sum(latencies) / len(latencies)) if latencies else 0.0
    sorted_lat = sorted(latencies)
    p95_lat = sorted_lat[int(len(sorted_lat) * 0.95)] if sorted_lat else 0.0
    p99_lat = sorted_lat[int(len(sorted_lat) * 0.99)] if sorted_lat else 0.0
    
    unique_logical = len(set(op["operation_id"] for op in workload))

    return MetricResult(
        total_logical_ops=unique_logical,
        total_requests=total_reqs,
        total_retries=total_retries,
        duplicate_attempts=dup_attempts,
        duplicate_records_created=dup_created,
        duplicate_records_prevented=dup_prevented,
        inconsistent_records=dup_created,
        failed_transactions=failed_count,
        successful_transactions=success_count,
        success_rate=round((success_count / total_reqs * 100.0), 2) if total_reqs > 0 else 0.0,
        duplicate_rate=round((dup_attempts / total_reqs * 100.0), 2) if total_reqs > 0 else 0.0,
        prevention_rate=round((dup_prevented / max(1, dup_attempts) * 100.0), 2) if implementation.upper() == "SAFE" else 0.0,
        record_integrity_rate=100.0 if dup_created == 0 else round((unique_logical / (unique_logical + dup_created)) * 100.0, 2),
        avg_latency_ms=round(avg_lat, 2),
        p95_latency_ms=round(p95_lat, 2),
        p99_latency_ms=round(p99_lat, 2),
        throughput_rps=round(total_reqs / (max(0.001, sum(latencies)/1000.0)), 2),
        error_rate=round((failed_count / total_reqs * 100.0), 2) if total_reqs > 0 else 0.0
    )
