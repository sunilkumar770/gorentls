package com.rentit.service;

import com.rentit.repository.LedgerTransactionRepository;
import com.rentit.security.AuditLog;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * Service to reconcile the internal double-entry ledger.
 * Ensures that for every booking, Sum(Debits) == Sum(Credits).
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class LedgerReconciliationService {

    private final LedgerTransactionRepository ledgerRepo;
    private final NotificationService notificationService;

    /**
     * Periodically scan for unbalanced bookings.
     * Runs every 6 hours.
     */
    @Scheduled(cron = "0 0 */6 * * *")
    @Transactional(readOnly = true)
    public void runScheduledReconciliation() {
        log.info("Starting scheduled ledger reconciliation...");
        reconcileAll();
    }

    /**
     * Manual reconciliation trigger for admins.
     */
    @Transactional(readOnly = true)
    @AuditLog(action = "MANUAL_LEDGER_RECONCILIATION")
    public void reconcileAll() {
        List<UUID> unbalanced = ledgerRepo.findUnbalancedBookings();
        
        if (unbalanced.isEmpty()) {
            log.info("Ledger reconciliation complete: All bookings are balanced.");
            return;
        }

        log.error("CRITICAL: Found {} unbalanced bookings in the ledger!", unbalanced.size());
        
        for (UUID bookingId : unbalanced) {
            BigDecimal net = ledgerRepo.totalNetBalanceForBooking(bookingId);
            log.error("Booking {} is unbalanced by ₹{}", bookingId, net);
            
            // Alert system administrators
            notificationService.sendNotification(
                null, // System alert
                "Financial Inconsistency Detected",
                "Booking " + bookingId + " has an unbalanced ledger (net: ₹" + net + "). Immediate investigation required.",
                "FINANCIAL_DISCREPANCY"
            );
        }
    }
}
