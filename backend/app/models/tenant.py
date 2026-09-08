from datetime import datetime
from sqlalchemy import String, Integer, Float, Text, DateTime, Column, UniqueConstraint
from backend.app.models.public import Base

class Order(Base):
    __tablename__ = "orders"
    
    id = Column(String(50), primary_key=True)
    tenant_id = Column(String(50), nullable=False, index=True)
    customer_id = Column(String(50), nullable=False, index=True)
    external_reference = Column(String(100), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    currency = Column(String(10), nullable=False, default="INR")
    status = Column(String(30), nullable=False, default="CREATED")
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

class Customer(Base):
    __tablename__ = "customers"
    
    id = Column(String(50), primary_key=True)
    tenant_id = Column(String(50), nullable=False, index=True)
    customer_id = Column(String(50), nullable=False)
    name = Column(String(100), nullable=False)
    email = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint('tenant_id', 'customer_id', name='uix_tenant_customer'),
    )

class WebhookEvent(Base):
    __tablename__ = "webhook_events"
    
    id = Column(String(50), primary_key=True)
    tenant_id = Column(String(50), nullable=False, index=True)
    event_id = Column(String(100), nullable=False, index=True)
    event_type = Column(String(50), nullable=False)
    payload_json = Column(Text, nullable=False)
    status = Column(String(30), nullable=False, default="PROCESSED")
    processed_at = Column(DateTime, default=datetime.utcnow)
