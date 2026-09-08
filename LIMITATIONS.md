# Production Limitations Report

## Limitations Breakdown

1. **Database Write Overhead**:
   Idempotency record insertion requires a database write before business logic execution. Highly optimized key caching in Redis can reduce DB reads for COMPLETED keys.

2. **Idempotency Storage Retention**:
   The `idempotency_records` table grows linearly with logical requests. A background cleanup cron job (e.g. purging keys older than 30 days) is recommended for production.

3. **Non-Transactional Side Effects**:
   External API calls (e.g., Stripe, Twilio) made during request execution cannot be atomically rolled back by a database transaction. Sagas or two-phase commit patterns must complement idempotency keys.

4. **Multi-Region Async Replication**:
   Cross-region multi-primary replication lag may allow concurrent race conditions if requests land simultaneously in two geographically distant regions before database indexes replicate.
