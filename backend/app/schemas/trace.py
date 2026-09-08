from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class RequestTraceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    trace_id: str
    request_id: str
    tenant_id: str
    user_id: Optional[str] = None
    role: Optional[str] = None
    endpoint: str
    idempotency_key: Optional[str] = None
    retry_number: int = 0
    transaction_id: Optional[str] = None
    transaction_state: Optional[str] = None
    event: str
    status: str
    latency_ms: float
    error: Optional[str] = None
    record_id: Optional[str] = None
    timestamp: datetime
