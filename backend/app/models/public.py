from datetime import datetime
import json
from sqlalchemy import String, Integer, Float, Text, DateTime, UniqueConstraint, Index, Column
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class Tenant(Base):
    __tablename__ = "tenants"
    
    id = Column(String(50), primary_key=True)
    name = Column(String(100), nullable=False)
    schema_name = Column(String(50), nullable=False, unique=True)
    status = Column(String(20), default="ACTIVE")
    created_at = Column(DateTime, default=datetime.utcnow)

class User(Base):
    __tablename__ = "users"
    
    id = Column(String(50), primary_key=True)
    tenant_id = Column(String(50), nullable=False)
    username = Column(String(100), nullable=False)
    email = Column(String(100), nullable=False)
    role = Column(String(30), nullable=False, default="OPERATOR") # ADMIN, OPERATOR, EXTERNAL_PARTNER, VIEWER
    created_at = Column(DateTime, default=datetime.utcnow)

class IdempotencyRecord(Base):
    __tablename__ = "idempotency_records"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    tenant_id = Column(String(50), nullable=False, index=True)
    operation = Column(String(100), nullable=False, index=True)
    idempotency_key = Column(String(255), nullable=False, index=True)
    request_hash = Column(String(64), nullable=False)
    status = Column(String(20), nullable=False, default="IN_PROGRESS") # IN_PROGRESS, COMPLETED, FAILED
    response_code = Column(Integer, nullable=True)
    response_body = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    
    __table_args__ = (
        UniqueConstraint('tenant_id', 'operation', 'idempotency_key', name='uix_tenant_op_key'),
    )

class RequestTrace(Base):
    __tablename__ = "request_traces"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    trace_id = Column(String(50), nullable=False, index=True)
    request_id = Column(String(50), nullable=False)
    tenant_id = Column(String(50), nullable=False, index=True)
    user_id = Column(String(50), nullable=True)
    role = Column(String(30), nullable=True)
    endpoint = Column(String(100), nullable=False, index=True)
    idempotency_key = Column(String(255), nullable=True, index=True)
    retry_number = Column(Integer, default=0)
    transaction_id = Column(String(50), nullable=True)
    transaction_state = Column(String(30), nullable=True) # BEGIN, COMMITTED, ROLLED_BACK
    event = Column(String(100), nullable=False)
    status = Column(String(20), nullable=False) # SUCCESS, CONFLICT, DUPLICATE_PREVENTED, DUPLICATE_CREATED, ERROR
    latency_ms = Column(Float, default=0.0)
    error = Column(Text, nullable=True)
    record_id = Column(String(100), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

class TestRun(Base):
    __tablename__ = "test_runs"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    run_id = Column(String(50), nullable=False, unique=True, index=True)
    name = Column(String(100), nullable=False)
    test_type = Column(String(50), nullable=False) # normal, retry, concurrent, timeout, failure, webhook, comparison
    implementation = Column(String(20), nullable=False) # BASELINE, SAFE, COMPARISON
    parameters_json = Column(Text, nullable=False, default="{}")
    metrics_json = Column(Text, nullable=False, default="{}")
    status = Column(String(20), nullable=False, default="RUNNING") # RUNNING, COMPLETED, FAILED
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    tenant_id = Column(String(50), nullable=False, index=True)
    user_id = Column(String(50), nullable=True)
    role = Column(String(30), nullable=True)
    action = Column(String(50), nullable=False)
    resource = Column(String(100), nullable=False)
    details_json = Column(Text, nullable=True)

class StakeholderFeedback(Base):
    __tablename__ = "stakeholder_feedback"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    stakeholder_name = Column(String(100), nullable=False)
    role = Column(String(50), nullable=False)
    q1_visible = Column(Integer, nullable=False) # 1-5
    q2_clear_diff = Column(Integer, nullable=False)
    q3_understandable_dash = Column(Integer, nullable=False)
    q4_realistic_retry = Column(Integer, nullable=False)
    q5_convincing_concurrency = Column(Integer, nullable=False)
    q6_suitable_saas = Column(Integer, nullable=False)
    comments = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
