import uuid
import random
from typing import List, Dict, Any

def generate_workload(
    num_tenants: int = 3,
    num_operations: int = 50,
    retry_prob: float = 0.2,
    duplicate_prob: float = 0.3,
    timeout_prob: float = 0.05,
    failure_prob: float = 0.05
) -> List[Dict[str, Any]]:
    """
    Generates a realistic synthetic workload batch with logical operation IDs, 
    idempotency keys, tenant assignments, retry flags, and simulated failure directives.
    """
    tenants = [f"org_00{i+1}" for i in range(min(10, num_tenants))]
    operations = []
    
    for i in range(num_operations):
        tenant_id = random.choice(tenants)
        op_id = f"OP-{uuid.uuid4().hex[:8].upper()}"
        idemp_key = f"IDEMP-KEY-{uuid.uuid4().hex[:10].upper()}"
        ext_ref = f"EXT-ORD-{10000 + i}"
        customer_id = f"CUST{1000 + (i % 20)}"
        amount = float(random.randint(100, 5000))
        
        # Decide if this operation will be sent multiple times (retries or concurrent workers)
        attempts = 1
        if random.random() < duplicate_prob:
            attempts = random.randint(2, 5)
            
        is_payload_mismatch = (random.random() < 0.05) # 5% payload mismatch case
        
        for attempt_idx in range(attempts):
            simulate_timeout = (random.random() < timeout_prob)
            simulate_failure = (random.random() < failure_prob)
            
            payload_amount = amount
            if is_payload_mismatch and attempt_idx > 0:
                payload_amount = amount + 500.0 # Payload change for same key
                
            operations.append({
                "operation_id": op_id,
                "tenant_id": tenant_id,
                "customer_id": customer_id,
                "external_reference": ext_ref,
                "amount": payload_amount,
                "currency": "INR",
                "idempotency_key": idemp_key,
                "attempt": attempt_idx + 1,
                "is_retry": attempt_idx > 0,
                "simulate_timeout": simulate_timeout,
                "simulate_failure": simulate_failure
            })
            
    return operations
