package com.rentit.service;

import com.rentit.model.Booking;
import com.rentit.model.enums.LedgerAccount;
import com.rentit.model.enums.LedgerDirection;
import com.rentit.repository.BookingRepository;
import com.rentit.repository.LedgerTransactionRepository;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class LedgerReconciliationService {

    private static final Logger log = LoggerFactory.getLogger(LedgerReconciliationService.class);

    private final BookingRepository bookingRepo;
    private final LedgerTransactionRepository ledgerRepo;

    public LedgerReconciliationService(BookingRepository bookingRepo,
                                       LedgerTransactionRepository ledgerRepo) {
        this.bookingRepo = bookingRepo;
        this.ledgerRepo = ledgerRepo;
    }

    /**
     * Runs every hour. Verifies that for every booking with ledger entries,
     * SUM(ledger.credits for RENTER_ESCROW) == booking.advanceAmount + booking.remainingAmount.
     * 
     * Logs ERROR if mismatch found — this is a data integrity bug that must be fixed immediately.
     */
    @Scheduled(fixedDelay = 60 * 60 * 1000) // every hour
    @SchedulerLock(name = "LedgerReconciliationService_reconcile", lockAtMostFor = "PT55M")
    @Transactional(readOnly = true)
    public void reconcile() {
        log.info("Starting ledger reconciliation");
        
        List<Booking> bookingsWithLedger = bookingRepo.findBookingsWithLedgerEntries();
        
        int checked = 0;
        int mismatches = 0;
        
        for (Booking booking : bookingsWithLedger) {
            BigDecimal ledgerTotal = ledgerRepo.sumByBookingAndAccountAndDirection(
                booking.getId(),
                LedgerAccount.RENTER_ESCROW,
                LedgerDirection.CREDIT
            );
            
            BigDecimal expected = BigDecimal.ZERO;
            if (booking.getAdvanceAmount() != null) {
                expected = expected.add(booking.getAdvanceAmount());
            }
            if (booking.getRemainingAmount() != null) {
                expected = expected.add(booking.getRemainingAmount());
            }
            
            if (ledgerTotal.compareTo(expected) != 0) {
                log.error("LEDGER MISMATCH: bookingId={} ledgerTotal={} expected={} " +
                          "escrowStatus={}",
                    booking.getId(), ledgerTotal, expected, booking.getEscrowStatus());
                mismatches++;
            }
            checked++;
        }
        
        log.info("Ledger reconciliation complete: checked={} mismatches={}", 
            checked, mismatches);
    }
}
