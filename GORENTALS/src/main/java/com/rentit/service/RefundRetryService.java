package com.rentit.service;

import com.rentit.model.RefundOutbox;
import com.rentit.repository.BookingRepository;
import com.rentit.repository.RefundOutboxRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class RefundRetryService {

    private final RefundOutboxRepository refundOutboxRepository;
    private final BookingRepository bookingRepository;
    private final RazorpayIntegrationService razorpayService;
    private final BookingEscrowService escrowService;
    private final BookingService bookingService;

    @Scheduled(fixedDelay = 60000) // Every 60 seconds
    @Transactional
    public void retryFailedRefunds() {
        List<RefundOutbox> pendingRefunds = refundOutboxRepository.findByStatusAndNextRetryAtBefore(
                "PENDING", LocalDateTime.now());
        
        if (pendingRefunds.isEmpty()) return;

        log.info("Found {} pending refunds for retry", pendingRefunds.size());

        for (RefundOutbox refund : pendingRefunds) {
            try {
                String razorpayRefundId = razorpayService.createRefund(
                        refund.getPaymentId(),
                        refund.getAmount(),
                        refund.getReason(),
                        refund.getBookingId()
                );

                // Fetch the booking entity directly for internal use
                bookingRepository.findById(refund.getBookingId()).ifPresent(booking -> {
                    escrowService.cancelAndRefund(
                        booking, 
                        refund.getAmount(), 
                        "Automated retry: " + refund.getReason(), 
                        razorpayRefundId
                    );
                });

                refund.setStatus("COMPLETED");
                refund.setUpdatedAt(LocalDateTime.now());
                refundOutboxRepository.save(refund);
                
                log.info("Successfully retried refund for booking: {}. Refund ID: {}", 
                    refund.getBookingId(), razorpayRefundId);

            } catch (Exception e) {
                int nextRetryCount = refund.getRetryCount() + 1;
                refund.setRetryCount(nextRetryCount);
                refund.setLastError(e.getMessage());
                
                if (nextRetryCount > 5) {
                    refund.setStatus("FAILED");
                    log.error("Refund permanently failed for booking {}: {}", refund.getBookingId(), e.getMessage());
                } else {
                    // Exponential backoff: 2^retryCount minutes
                    refund.setNextRetryAt(LocalDateTime.now().plusMinutes((long) Math.pow(2, nextRetryCount)));
                    log.warn("Refund retry {} failed for booking {}. Next retry at {}", 
                        nextRetryCount, refund.getBookingId(), refund.getNextRetryAt());
                }
                refundOutboxRepository.save(refund);
            }
        }
    }
}
