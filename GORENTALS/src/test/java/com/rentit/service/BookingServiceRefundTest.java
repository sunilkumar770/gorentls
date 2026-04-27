package com.rentit.service;

import com.rentit.model.*;
import com.rentit.repository.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BookingServiceRefundTest {

    @Mock private BookingRepository bookingRepository;
    @Mock private PaymentRepository paymentRepository;
    @Mock private UserRepository userRepository;
    @Mock private NotificationService notificationService;

    @InjectMocks
    private BookingService bookingService;

    @Test
    void testCancelBookingWithRefund() {
        UUID bookingId = UUID.randomUUID();
        String email = "renter@test.com";

        User renter = new User();
        renter.setId(UUID.randomUUID());
        renter.setEmail(email);

        Listing listing = new Listing();
        listing.setTitle("Test Item");
        User owner = new User();
        owner.setId(UUID.randomUUID());
        listing.setOwner(owner);

        Booking booking = new Booking();
        booking.setId(bookingId);
        booking.setRenter(renter);
        booking.setListing(listing);
        booking.setStatus(BookingStatus.PENDING);
        booking.setPaymentStatus("COMPLETED");
        booking.setTotalAmount(new BigDecimal("1000.00"));
        booking.setSecurityDeposit(new BigDecimal("200.00"));

        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(booking));
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(renter));

        bookingService.cancelBooking(bookingId, email);

        // Verify refund payment created
        verify(paymentRepository).save(argThat(payment ->
            payment.getAmount().equals(new BigDecimal("1000.00")) &&
            "REFUND".equals(payment.getPaymentType())
        ));

        // Verify booking updated
        verify(bookingRepository).save(argThat(b ->
            b.getStatus() == BookingStatus.CANCELLED &&
            "REFUNDED".equals(b.getPaymentStatus())
        ));
    }

    @Test
    void testCompleteBookingWithDepositRefund() {
        UUID bookingId = UUID.randomUUID();
        String ownerEmail = "owner@test.com";

        User owner = new User();
        owner.setId(UUID.randomUUID());
        owner.setEmail(ownerEmail);

        Listing listing = new Listing();
        listing.setTitle("Test Item");
        listing.setOwner(owner);

        User renter = new User();
        renter.setId(UUID.randomUUID());

        Booking booking = new Booking();
        booking.setId(bookingId);
        booking.setRenter(renter);
        booking.setListing(listing);
        booking.setStatus(BookingStatus.CONFIRMED);
        booking.setSecurityDeposit(new BigDecimal("500.00"));

        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(booking));
        when(userRepository.findByEmail(ownerEmail)).thenReturn(Optional.of(owner));

        bookingService.completeBooking(bookingId, ownerEmail);

        // Verify deposit refund payment created
        verify(paymentRepository).save(argThat(payment ->
            payment.getAmount().equals(new BigDecimal("500.00")) &&
            "DEPOSIT_REFUND".equals(payment.getPaymentType())
        ));

        // Verify booking completed
        verify(bookingRepository).save(argThat(b -> b.getStatus() == BookingStatus.COMPLETED));
    }
}
