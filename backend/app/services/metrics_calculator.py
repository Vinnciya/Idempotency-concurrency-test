import math
from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from backend.app.models.public import RequestTrace
from backend.app.models.tenant import Order

def _mean(numbers: List[float]) -> float:
    return sum(numbers) / len(numbers) if numbers else 0.0

def _percentile(numbers: List[float], p: float) -> float:
    if not numbers:
        return 0.0
    sorted_nums = sorted(numbers)
    k = (len(sorted_nums) - 1) * (p / 100.0)
    f = math.floor(k)
    c = math.ceil(k)
    if f == c:
        return sorted_nums[int(k)]
    d0 = sorted_nums[int(f)] * (c - k)
    d1 = sorted_nums[int(c)] * (k - f)
    return d0 + d1

async def calculate_system_metrics(db: AsyncSession) -> Dict[str, Any]:
    # 1. Fetch all traces
    result = await db.execute(select(RequestTrace))
    traces = result.scalars().all()
    
    if not traces:
        return {
            "total_logical_ops": 0,
            "total_requests": 0,
            "total_retries": 0,
            "duplicate_attempts": 0,
            "duplicate_records_created": 0,
            "duplicate_records_prevented": 0,
            "inconsistent_records": 0,
            "failed_transactions": 0,
            "successful_transactions": 0,
            "success_rate": 0.0,
            "duplicate_rate": 0.0,
            "prevention_rate": 0.0,
            "record_integrity_rate": 100.0,
            "avg_latency_ms": 0.0,
            "p95_latency_ms": 0.0,
            "p99_latency_ms": 0.0,
            "error_rate": 0.0
        }
        
    total_requests = len(traces)
    total_retries = sum(t.retry_number for t in traces if t.retry_number > 0)
    
    dup_prevented = sum(1 for t in traces if t.status == "DUPLICATE_PREVENTED")
    dup_created = sum(1 for t in traces if t.status == "DUPLICATE_CREATED")
    dup_attempts = dup_prevented + dup_created
    
    failed_txns = sum(1 for t in traces if t.status in ["FAILED", "ERROR", "TIMEOUT"])
    success_txns = sum(1 for t in traces if t.status in ["SUCCESS", "DUPLICATE_PREVENTED"])
    
    # Latencies (Pure Python)
    latencies = [t.latency_ms for t in traces]
    avg_latency = _mean(latencies)
    p95_latency = _percentile(latencies, 95)
    p99_latency = _percentile(latencies, 99)
    
    # Unique logical operations count
    unique_keys = set(t.idempotency_key for t in traces if t.idempotency_key)
    total_logical_ops = len(unique_keys) if unique_keys else (total_requests - dup_attempts)
    if total_logical_ops <= 0:
        total_logical_ops = max(1, total_requests)
        
    # Count orders in DB
    order_count_res = await db.execute(select(func.count(Order.id)))
    actual_records = order_count_res.scalar() or 0

    # Formulas
    success_rate = round((success_txns / total_requests) * 100.0, 2)
    duplicate_rate = round((dup_attempts / total_requests) * 100.0, 2)
    prevention_rate = round((dup_prevented / dup_attempts * 100.0), 2) if dup_attempts > 0 else 100.0
    
    # Record Integrity Rate
    record_integrity_rate = round((actual_records / max(1, total_logical_ops)) * 100.0, 2)
    error_rate = round((failed_txns / total_requests) * 100.0, 2)

    return {
        "total_logical_ops": total_logical_ops,
        "total_requests": total_requests,
        "total_retries": total_retries,
        "duplicate_attempts": dup_attempts,
        "duplicate_records_created": dup_created,
        "duplicate_records_prevented": dup_prevented,
        "inconsistent_records": max(0, actual_records - total_logical_ops) if dup_created > 0 else 0,
        "failed_transactions": failed_txns,
        "successful_transactions": success_txns,
        "success_rate": success_rate,
        "duplicate_rate": duplicate_rate,
        "prevention_rate": prevention_rate,
        "record_integrity_rate": min(100.0, record_integrity_rate),
        "avg_latency_ms": round(avg_latency, 2),
        "p95_latency_ms": round(p95_latency, 2),
        "p99_latency_ms": round(p99_latency, 2),
        "error_rate": error_rate
    }
