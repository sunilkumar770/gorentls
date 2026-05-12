# PRD — Phase 6: Production Hardening & Scale Readiness

## Goal
Transition GoRentals from a functional prototype to a production-grade, scalable platform by closing concurrency gaps, ensuring payment atomicity, enabling horizontal scaling, and implementing robust observability.

## 1. Concurrency & Data Integrity (P0)
- **Pessimistic Locking**: Use `LockModeType.PESSIMISTIC_WRITE` in `ItemRepository` during booking creation.
- **Conflict Query**: Re-validate availability inside the locked transaction.
- **Idempotency**: Add `idempotencyKey` to `Booking` entity to prevent duplicate submissions.

## 2. Payment Atomicity (P0)
- **Outbox Pattern**: Implement `PaymentOutboxEvent` table.
- **Atomic Capture**: Update booking to `CONFIRMED` and write to outbox in one transaction.
- **Outbox Processor**: A `@Scheduled` task to process capture requests via Razorpay API.

## 3. Infrastructure Scaling
- **Redis Broker Relay**: Replace Simple STOMP broker with Redis relay for multi-node support.
- **WebSocket Auth**: Add `ChannelInterceptor` to validate JWT on every message.
- **Connection Pool**: Tune HikariCP to 20 max connections.
- **Indexes**: Create indexes for bookings and conversations (CONCURRENTLY).

## 4. Security & Compliance
- **Cookie Security**: Set `httpOnly`, `secure`, `sameSite=Strict` on JWT cookies.
- **Rate Limiting**: Implement `Bucket4j` filter for sensitive endpoints (20 req/min).
- **Role Re-verification**: Explicitly check DB for role on all OWNER endpoints.

## 5. Observability & DevOps
- **JSON Logging**: Configure Logstash Logback encoder.
- **Trace correlation**: Implement `X-Trace-Id` filter for end-to-end request tracing.
- **Error Monitoring**: Add global error boundary and `/api/errors` endpoint.
- **Multi-stage Docker**: Create production-hardened Dockerfile and Compose.
- **Health Checks**: Add Spring Boot Actuator gates in Compose.

## 6. Verification
- **k6 Load Test**: Simulate 50 concurrent booking requests to verify exactly 1 success.
- **Failure Injection**: Verify payment retry logic if Razorpay is down.
