package com.rentit.config;

import com.rentit.repository.BookingRepository;
import com.rentit.repository.PayoutRepository;
import com.rentit.service.RazorpayIntegrationService;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Component
public class EscrowHealthIndicator implements HealthIndicator {

    private final BookingRepository bookingRepo;
    private final PayoutRepository payoutRepo;
    private final RazorpayIntegrationService razorpay;

    public EscrowHealthIndicator(BookingRepository bookingRepo,
                                 PayoutRepository payoutRepo,
                                 RazorpayIntegrationService razorpay,
                                 MeterRegistry meterRegistry) {
        this.bookingRepo = bookingRepo;
        this.payoutRepo = payoutRepo;
        this.razorpay = razorpay;
        
        // Register gauges on startup
        Gauge.builder("escrow.bookings.dispute_window_expired", 
                () -> bookingRepo.countByDisputeWindowExpiredAndNotResolved(Instant.now()))
            .description("Bookings past dispute window but not yet paid out")
            .register(meterRegistry);
            
        Gauge.builder("escrow.payouts.pending", 
                () -> payoutRepo.countByStatus(com.rentit.model.enums.PayoutStatus.PENDING))
            .description("Payouts waiting for T+2 execution")
            .register(meterRegistry);
            
        Gauge.builder("escrow.payouts.failed", 
                () -> payoutRepo.countByStatus(com.rentit.model.enums.PayoutStatus.FAILED))
            .description("Payouts that failed and need retry")
            .register(meterRegistry);
    }

    @Override
    public Health health() {
        // Check 1: Razorpay API reachable
        boolean razorpayUp;
        try {
            razorpayUp = razorpay.ping(); 
        } catch (Exception e) {
            razorpayUp = false;
        }

        // Check 2: Payout queue depth
        long pendingPayouts = payoutRepo.countByStatus(
            com.rentit.model.enums.PayoutStatus.PENDING);
        long failedPayouts = payoutRepo.countByStatus(
            com.rentit.model.enums.PayoutStatus.FAILED);

        // Check 3: Stuck bookings (dispute window expired but not resolved)
        long stuckBookings = bookingRepo.countByDisputeWindowExpiredAndNotResolved(
            Instant.now().minus(24, ChronoUnit.HOURS));

        Health.Builder builder = razorpayUp ? Health.up() : Health.down();
        
        return builder
            .withDetail("razorpay.api.reachable", razorpayUp)
            .withDetail("payouts.pending", pendingPayouts)
            .withDetail("payouts.failed", failedPayouts)
            .withDetail("bookings.stuck.after_dispute_window", stuckBookings)
            .withDetail("ledger.review_required", stuckBookings > 0 ? "YES" : "NO")
            .build();
    }
}
