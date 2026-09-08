import os
try:
    from pydantic_settings import BaseSettings
except ImportError:
    class BaseSettings:
        pass


class Settings:
    PROJECT_NAME: str = "Idempotency & Concurrency Test Harness"
    API_V1_STR: str = "/api"
    
    # Default PostgreSQL URL, fallback to SQLite if needed
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "sqlite+aiosqlite:///./idempotency_harness.db"
    )
    SYNC_DATABASE_URL: str = os.getenv(
        "SYNC_DATABASE_URL",
        "sqlite:///./idempotency_harness.db"
    )
    
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-key-for-harness-demo")
    
    DEFAULT_TENANTS = [
        {"id": "org_001", "name": "Acme Corp", "schema_name": "tenant_org_001"},
        {"id": "org_002", "name": "Global Tech", "schema_name": "tenant_org_002"},
        {"id": "org_003", "name": "Fintech Solutions", "schema_name": "tenant_org_003"},
    ]
    
    DEFAULT_USERS = [
        {"id": "usr_admin", "tenant_id": "org_001", "username": "admin_alice", "email": "alice@acme.com", "role": "ADMIN"},
        {"id": "usr_operator", "tenant_id": "org_001", "username": "op_bob", "email": "bob@acme.com", "role": "OPERATOR"},
        {"id": "usr_partner", "tenant_id": "org_001", "username": "partner_charlie", "email": "charlie@partner.com", "role": "EXTERNAL_PARTNER"},
        {"id": "usr_viewer", "tenant_id": "org_001", "username": "viewer_dave", "email": "dave@acme.com", "role": "VIEWER"},
    ]

settings = Settings()
