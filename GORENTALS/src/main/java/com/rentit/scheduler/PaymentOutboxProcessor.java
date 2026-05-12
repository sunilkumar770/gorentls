package com.rentit.scheduler;

import com.rentit.model.PaymentOutboxEvent;
import com.rentit.model.enums.OutboxStatus;
import com.rentit.model.enums.PaymentEventType;
import com.rentit.repository.PaymentOutboxRepository;
import com.rentit.service.RazorpayIntegrationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;

@Slf4j
@Component
public class PaymentOutboxProcessor {

    private final PaymentOutboxRepository paymentOutboxRepository;
    private final RazorpayIntegrationService razorpayService;
    private final org.springframework.data.redis.core.StringRedisTemplate redisTemplate;
    private final com.rentit.service.AlertService alertService;

    public PaymentOutboxProcessor(PaymentOutboxRepository paymentOutboxRepository,
                                  RazorpayIntegrationService razorpayService,
                                  @org.springframework.beans.factory.annotation.Autowired(required = false) org.springframework.data.redis.core.StringRedisTemplate redisTemplate,
                                  com.rentit.service.AlertService alertService) {
        this.paymentOutboxRepository = paymentOutboxRepository;
        this.razorpayService = razorpayService;
        this.redisTemplate = redisTemplate;
        this.alertService = alertService;
    }

    private static final String LOCK_KEY = "outbox:processor:lock";
    private static final long LOCK_TTL_SECONDS = 25;

    @Scheduled(fixedDelay = 30000) // Every 30 seconds
    public void processOutbox() {
        if (redisTemplate == null) {
            // Local mode: No distributed lock needed
            processEvents();
            return;
        }

        // Acquire distributed lock — only ONE instance processes at a time
        Boolean acquired = redisTemplate.opsForValue()
            .setIfAbsent(LOCK_KEY, "locked",
                         java.time.Duration.ofSeconds(LOCK_TTL_SECONDS));

        if (!Boolean.TRUE.equals(acquired)) {
            log.debug("Outbox processor lock held by another instance — skipping");
            return;
        }

        try {
            processEvents();
        } finally {
            redisTemplate.delete(LOCK_KEY);
        }
    }

    @Transactional
    public void processEvents() {
        List<PaymentOutboxEvent> pending = paymentOutboxRepository
                .findByStatusOrderByCreatedAtAsc(OutboxStatus.PENDING, PageRequest.of(0, 10));

        if (pending.isEmpty()) return;

        log.info("Processing {} pending payment outbox events", pending.size());

        for (PaymentOutboxEvent event : pending) {
            try {
                if (event.getType() == PaymentEventType.CAPTURE) {
                    razorpayService.capturePayment(
                            event.getRazorpayPaymentId(),
                            event.getAmount()
                    );
                    log.info("Successfully captured payment for booking: {}", event.getBookingId());
                } else if (event.getType() == PaymentEventType.REFUND) {
                    // Refund logic if needed
                }

                event.setStatus(OutboxStatus.PROCESSED);
                event.setProcessedAt(Instant.now());
            } catch (Exception e) {
                log.error("Failed to process payment outbox event {} for booking {}: {}", 
                        event.getId(), event.getBookingId(), e.getMessage());
                
                event.setRetryCount(event.getRetryCount() + 1);
                event.setLastError(e.getMessage());
                
                if (event.getRetryCount() >= 5) {
                    event.setStatus(OutboxStatus.FAILED);
                    log.error("Payment outbox event {} failed after max retries. Manual intervention required.", event.getId());
                    alertService.sendCriticalAlert(
                        "Payment Capture Failed", 
                        "Outbox event " + event.getId() + " for booking " + event.getBookingId() + " failed permanently after 5 retries. Error: " + e.getMessage()
                    );
                }
            }
            paymentOutboxRepository.save(event);
        }
    }
}
