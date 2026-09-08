from fastapi import Header, HTTPException, status, Depends
from typing import Optional

ROLE_PERMISSIONS = {
    "ADMIN": ["create_order", "view_order", "run_test", "view_metrics", "webhook", "admin_ops"],
    "OPERATOR": ["create_order", "view_order", "view_metrics"],
    "EXTERNAL_PARTNER": ["webhook", "create_order"],
    "VIEWER": ["view_order", "view_metrics"]
}

class UserContext:
    def __init__(self, user_id: str, tenant_id: str, role: str):
        self.user_id = user_id
        self.tenant_id = tenant_id
        self.role = role.upper()

    def has_permission(self, permission: str) -> bool:
        allowed = ROLE_PERMISSIONS.get(self.role, [])
        return permission in allowed

async def get_current_user(
    x_user_id: Optional[str] = Header("usr_admin", alias="X-User-Id"),
    x_tenant_id: Optional[str] = Header("org_001", alias="X-Tenant-Id"),
    x_role: Optional[str] = Header("ADMIN", alias="X-Role")
) -> UserContext:
    return UserContext(
        user_id=x_user_id or "usr_admin",
        tenant_id=x_tenant_id or "org_001",
        role=x_role or "ADMIN"
    )

def require_permission(permission: str):
    def permission_checker(current_user: UserContext = Depends(get_current_user)):
        if not current_user.has_permission(permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{current_user.role}' does not have required permission '{permission}'"
            )
        return current_user
    return permission_checker
