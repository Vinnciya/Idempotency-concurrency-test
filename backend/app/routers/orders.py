import time
import uuid
import asyncio
from typing import Optional, List
from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from backend.app.database import get_db
from backend.app.schemas.order import OrderCreateRequest, OrderResponse
from backend.app.models.public import Tenant
from backend.app.models.tenant import Order

from backend.app.services.tenant_resolver import resolve_tenant
from backend.app.services.idempotency import IdempotencyService
from backend.app.auth.RBAC import get_current_user, UserContext, require_permission
from backend.app.middleware.trace_middleware import log_trace

router = APIRouter(tags=["Orders"])

@router.post("/baseline/orders", response_model=OrderResponse)
async def create_order_baseline(
    body: OrderCreateRequest,
    simulate_delay_ms: int = Query(0),
    simulate_timeout: bool = Query(False),
    simulate_failure: bool = Query(False),
    x_user_id: Optional[str] = Header("usr_admin", alias="X-User-Id"),
    x_role: Optional[str] = Header("ADMIN", alias="X-Role"),
    db: AsyncSession = Depends(get_db)
):
    """
    NAIVE BASELINE IMPLEMENTATION (Deliberately Unsafe)
    1. Receive request.
    2. Insert order without idempotency check or lock.
    3. Commit transaction.
    4. Return response.
    Under retries or concurrent requests, this WILL produce duplicate records!
    """
    start_time = time.time()
    await resolve_tenant(body.tenant_id, db)
    
    if simulate_delay_ms > 0:
        await asyncio.sleep(simulate_delay_ms / 1000.0)
        
    order_id = f"ORD-BASE-{uuid.uuid4().hex[:8].upper()}"
    new_order = Order(
        id=order_id,
        tenant_id=body.tenant_id,
        customer_id=body.customer_id,
        external_reference=body.external_reference,
        amount=body.amount,
        currency=body.currency,
        status="CREATED"
    )
    
    if simulate_failure:
        # Transaction failure simulation
        latency = (time.time() - start_time) * 1000
        await log_trace(
            session=db,
            tenant_id=body.tenant_id,
            endpoint="/baseline/orders",
            event="BASELINE_TXN_FAILURE",
            status_str="FAILED",
            latency_ms=latency,
            user_id=x_user_id,
            role=x_role,
            transaction_state="ROLLED_BACK",
            error="Simulated Baseline Database Transaction Failure"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Simulated Baseline Database Transaction Failure"
        )
        
    db.add(new_order)
    await db.commit()
    await db.refresh(new_order)
    
    latency = (time.time() - start_time) * 1000
    
    # Check if duplicate record exists for this external_reference in this tenant
    dup_check = await db.execute(
        select(func.count(Order.id)).where(
            Order.tenant_id == body.tenant_id,
            Order.external_reference == body.external_reference
        )
    )
    dup_count = dup_check.scalar() or 1
    
    trace_status = "DUPLICATE_CREATED" if dup_count > 1 else "SUCCESS"
    
    if simulate_timeout:
        # Simulate timeout: DB record inserted, but client receives 504 Gateway Timeout!
        await log_trace(
            session=db,
            tenant_id=body.tenant_id,
            endpoint="/baseline/orders",
            event="BASELINE_TIMEOUT_SIMULATED",
            status_str="TIMEOUT",
            latency_ms=latency,
            user_id=x_user_id,
            role=x_role,
            record_id=new_order.id,
            error="Simulated Network Timeout after DB insert"
        )
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Network Timeout: Server processed request but response lost."
        )

    await log_trace(
        session=db,
        tenant_id=body.tenant_id,
        endpoint="/baseline/orders",
        event="BASELINE_ORDER_CREATED",
        status_str=trace_status,
        latency_ms=latency,
        user_id=x_user_id,
        role=x_role,
        record_id=new_order.id
    )
    
    return new_order


@router.post("/safe/orders", response_model=OrderResponse)
async def create_order_safe(
    body: OrderCreateRequest,
    idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key"),
    retry_number: int = Header(0, alias="X-Retry-Number"),
    simulate_delay_ms: int = Query(0),
    simulate_timeout: bool = Query(False),
    simulate_failure: bool = Query(False),
    current_user: UserContext = Depends(require_permission("create_order")),
    db: AsyncSession = Depends(get_db)
):
    """
    PROPOSED SAFE IDEMPOTENT IMPLEMENTATION
    1. Require Idempotency-Key.
    2. Scope key by (tenant_id, operation, idempotency_key).
    3. Store idempotency key with UNIQUE constraint.
    4. Detect duplicate requests & payload hash mismatches (409 Conflict).
    5. Return cached response for retries.
    6. Ensure atomic transaction boundary.
    """
    start_time = time.time()
    await resolve_tenant(body.tenant_id, db)
    
    if not idempotency_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Header 'Idempotency-Key' is required for /safe/orders"
        )
        
    payload_dict = body.model_dump()
    operation = "CREATE_ORDER"
    
    # 1. Begin or retrieve idempotency record
    is_cached, cached_body, cached_status, record = await IdempotencyService.begin_or_retrieve(
        session=db,
        tenant_id=body.tenant_id,
        operation=operation,
        idempotency_key=idempotency_key,
        payload=payload_dict
    )
    
    if is_cached and cached_body:
        latency = (time.time() - start_time) * 1000
        await log_trace(
            session=db,
            tenant_id=body.tenant_id,
            endpoint="/safe/orders",
            event="IDEMPOTENT_CACHE_HIT",
            status_str="DUPLICATE_PREVENTED",
            latency_ms=latency,
            idempotency_key=idempotency_key,
            user_id=current_user.user_id,
            role=current_user.role,
            retry_number=retry_number,
            record_id=cached_body.get("id")
        )
        # Mark response as duplicate prevented for UI indication
        cached_body["is_duplicate_prevented"] = True
        return cached_body

    if simulate_delay_ms > 0:
        await asyncio.sleep(simulate_delay_ms / 1000.0)

    if simulate_failure:
        # Simulate transaction failure before commit (CASE 5)
        # Rollback transaction so idempotency record and order record are cleanly cleared!
        await db.rollback()
        latency = (time.time() - start_time) * 1000
        await log_trace(
            session=db,
            tenant_id=body.tenant_id,
            endpoint="/safe/orders",
            event="TXN_SIMULATED_FAILURE_ROLLBACK",
            status_str="FAILED",
            latency_ms=latency,
            idempotency_key=idempotency_key,
            user_id=current_user.user_id,
            role=current_user.role,
            transaction_state="ROLLED_BACK",
            error="Simulated Database Failure Before Commit"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Transaction failed and rolled back. Safe retry can be re-attempted."
        )

    # 2. Insert business order record
    order_id = f"ORD-SAFE-{uuid.uuid4().hex[:8].upper()}"
    new_order = Order(
        id=order_id,
        tenant_id=body.tenant_id,
        customer_id=body.customer_id,
        external_reference=body.external_reference,
        amount=body.amount,
        currency=body.currency,
        status="CREATED"
    )
    db.add(new_order)
    await db.flush()

    response_data = {
        "id": new_order.id,
        "tenant_id": new_order.tenant_id,
        "customer_id": new_order.customer_id,
        "external_reference": new_order.external_reference,
        "amount": new_order.amount,
        "currency": new_order.currency,
        "status": new_order.status,
        "created_at": new_order.created_at.isoformat(),
        "is_duplicate_prevented": False,
        "idempotency_key": idempotency_key
    }

    # 3. Complete idempotency record
    await IdempotencyService.complete_record(
        session=db,
        record=record,
        response_code=200,
        response_data=response_data
    )

    latency = (time.time() - start_time) * 1000

    if simulate_timeout:
        # Timeout simulation after commit (CASE 3)
        await log_trace(
            session=db,
            tenant_id=body.tenant_id,
            endpoint="/safe/orders",
            event="SAFE_TIMEOUT_SIMULATED",
            status_str="TIMEOUT",
            latency_ms=latency,
            idempotency_key=idempotency_key,
            user_id=current_user.user_id,
            role=current_user.role,
            record_id=new_order.id,
            error="Simulated Network Timeout: Record committed, client received timeout."
        )
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Network Timeout: Operation committed on server, client will retry with same key."
        )

    await log_trace(
        session=db,
        tenant_id=body.tenant_id,
        endpoint="/safe/orders",
        event="SAFE_ORDER_CREATED",
        status_str="SUCCESS",
        latency_ms=latency,
        idempotency_key=idempotency_key,
        user_id=current_user.user_id,
        role=current_user.role,
        record_id=new_order.id
    )

    return new_order


@router.post("/api/orders", response_model=OrderResponse)
async def create_order_generic(
    body: OrderCreateRequest,
    idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key"),
    current_user: UserContext = Depends(require_permission("create_order")),
    db: AsyncSession = Depends(get_db)
):
    """Standard API route delegating to safe endpoint if key is present"""
    if idempotency_key:
        return await create_order_safe(body=body, idempotency_key=idempotency_key, current_user=current_user, db=db)
    else:
        return await create_order_baseline(body=body, db=db)


@router.get("/api/orders", response_model=List[OrderResponse])
async def list_orders(
    tenant_id: str = Query("org_001"),
    current_user: UserContext = Depends(require_permission("view_order")),
    db: AsyncSession = Depends(get_db)
):
    query = select(Order).where(Order.tenant_id == tenant_id).order_by(Order.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()
