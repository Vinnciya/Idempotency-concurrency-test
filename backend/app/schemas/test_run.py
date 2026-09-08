from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Dict, Any, List
from datetime import datetime

class TestConfig(BaseModel):
    test_type: str = Field("concurrent", json_schema_extra={"example": "concurrent"}) # normal, retry, concurrent, timeout, failure, webhook, comparison
    implementation: str = Field("SAFE", json_schema_extra={"example": "SAFE"}) # BASELINE, SAFE, COMPARISON
    num_tenants: int = Field(3, ge=1, le=10)
    num_operations: int = Field(50, ge=1, le=1000)
    concurrency: int = Field(10, ge=1, le=100)
    retry_probability: float = Field(0.2, ge=0.0, le=1.0)
    timeout_probability: float = Field(0.05, ge=0.0, le=1.0)
    failure_probability: float = Field(0.05, ge=0.0, le=1.0)
    duplicate_probability: float = Field(0.3, ge=0.0, le=1.0)
    max_retries: int = Field(3, ge=1, le=5)

class MetricResult(BaseModel):
    total_logical_ops: int = 0
    total_requests: int = 0
    total_retries: int = 0
    duplicate_attempts: int = 0
    duplicate_records_created: int = 0
    duplicate_records_prevented: int = 0
    inconsistent_records: int = 0
    failed_transactions: int = 0
    successful_transactions: int = 0
    success_rate: float = 0.0
    duplicate_rate: float = 0.0
    prevention_rate: float = 0.0
    record_integrity_rate: float = 0.0
    avg_latency_ms: float = 0.0
    p95_latency_ms: float = 0.0
    p99_latency_ms: float = 0.0
    throughput_rps: float = 0.0
    error_rate: float = 0.0

class TestRunResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    run_id: str
    name: str
    test_type: str
    implementation: str
    parameters: Dict[str, Any]
    metrics: MetricResult
    status: str
    started_at: datetime
    completed_at: Optional[datetime] = None
