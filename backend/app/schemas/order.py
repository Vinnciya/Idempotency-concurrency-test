from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime

class OrderCreateRequest(BaseModel):
    tenant_id: str = Field(..., json_schema_extra={"example": "org_001"})
    customer_id: str = Field(..., json_schema_extra={"example": "CUST1001"})
    external_reference: str = Field(..., json_schema_extra={"example": "EXT-ORD-10001"})
    amount: float = Field(..., json_schema_extra={"example": 2500.0})
    currency: str = Field("INR", json_schema_extra={"example": "INR"})

class OrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    tenant_id: str
    customer_id: str
    external_reference: str
    amount: float
    currency: str
    status: str
    created_at: datetime
    is_duplicate_prevented: Optional[bool] = False
    idempotency_key: Optional[str] = None

class WebhookEventRequest(BaseModel):
    tenant_id: str = Field(..., json_schema_extra={"example": "org_001"})
    event_id: str = Field(..., json_schema_extra={"example": "EVT-90001"})
    event_type: str = Field(..., json_schema_extra={"example": "ORDER_PAYMENT_SUCCESS"})
    payload: dict = Field(..., json_schema_extra={"example": {"order_id": "ORD-1001", "status": "PAID"}})
