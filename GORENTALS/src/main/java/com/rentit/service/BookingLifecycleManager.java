package com.rentit.service;

import com.rentit.model.Booking;
import com.rentit.model.enums.BookingStatus;
import com.rentit.repository.BookingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class BookingLifecycleManager {

    private final BookingRepository     bookingRepository;
    private final NotificationService   notificationService;
    private final SimpMessagingTemplate messagingTemplate;
    private final ReceiptService        receiptService;

    /**
     * The single source of truth for transitioning a booking's status.
     * Triggers notifications and real-time dashboard updates.
     */
    @Transactional
    public void transition(Booking booking, BookingStatus nextStatus, String reason) {
        BookingStatus oldStatus = booking.getBookingStatus();
        if (oldStatus == nextStatus) return;

        log.info("LIFECYCLE: Booking {} transitioning {} -> {}. Reason: {}", 
            booking.getId(), oldStatus, nextStatus, reason);

        booking.setBookingStatus(nextStatus);
        booking.setUpdatedAt(LocalDateTime.now());
        bookingRepository.save(booking);

        // 1. Trigger Notifications
        sendNotifications(booking, nextStatus);

        // 2. Broadcast to UI
        broadcast(booking);
    }

    private void sendNotifications(Booking booking, BookingStatus status) {
        switch (status) {
            case CONFIRMED -> {
                notificationService.sendNotification(
                    booking.getRenter().getId(),
                    "Booking Confirmed",
                    "Your booking for " + booking.getListing().getTitle() + " is now confirmed.",
                    "BOOKING_CONFIRMED"
                );
                notificationService.sendNotification(
                    booking.getListing().getOwner().getId(),
                    "New Booking Confirmed",
                    "A new booking for " + booking.getListing().getTitle() + " has been confirmed.",
                    "OWNER_BOOKING_CONFIRMED"
                );
                // H-02: Trigger asynchronous receipt generation
                try {
                    receiptService.generateBookingReceipt(booking.getId());
                    log.info("LIFECYCLE: Receipt generated for booking {}", booking.getId());
                } catch (Exception e) {
                    log.error("LIFECYCLE: Failed to generate receipt for booking {}: {}", booking.getId(), e.getMessage());
                }
            }
            case IN_USE -> {
                notificationService.sendNotification(
                    booking.getRenter().getId(),
                    "Rental Started",
                    "You have successfully picked up " + booking.getListing().getTitle() + ".",
                    "RENTAL_STARTED"
                );
                notificationService.sendNotification(
                    booking.getListing().getOwner().getId(),
                    "Item Picked Up",
                    "Your item " + booking.getListing().getTitle() + " has been picked up.",
                    "OWNER_RENTAL_STARTED"
                );
            }
            case CANCELLED -> {
                notificationService.sendNotification(
                    booking.getRenter().getId(),
                    "Booking Cancelled",
                    "Your booking for " + booking.getListing().getTitle() + " has been cancelled.",
                    "BOOKING_CANCELLED"
                );
                notificationService.sendNotification(
                    booking.getListing().getOwner().getId(),
                    "Booking Cancelled",
                    "A booking for " + booking.getListing().getTitle() + " has been cancelled.",
                    "OWNER_BOOKING_CANCELLED"
                );
            }
            case COMPLETED -> {
                notificationService.sendNotification(
                    booking.getRenter().getId(),
                    "Rental Completed",
                    "Thank you for using GoRentals! Your rental of " + booking.getListing().getTitle() + " is complete.",
                    "RENTAL_COMPLETED"
                );
                notificationService.sendNotification(
                    booking.getListing().getOwner().getId(),
                    "Rental Completed",
                    "The rental for " + booking.getListing().getTitle() + " has been successfully completed.",
                    "OWNER_RENTAL_COMPLETED"
                );
            }
            case RETURNED -> {
                notificationService.sendNotification(
                    booking.getRenter().getId(),
                    "Item Returned",
                    "You have successfully returned " + booking.getListing().getTitle() + ". Waiting for owner confirmation.",
                    "ITEM_RETURNED"
                );
                notificationService.sendNotification(
                    booking.getListing().getOwner().getId(),
                    "Item Returned",
                    "The item " + booking.getListing().getTitle() + " has been returned by the renter. Please inspect and confirm completion.",
                    "OWNER_ITEM_RETURNED"
                );
            }
            // Note: PAID_OUT is an EscrowStatus, not a BookingStatus. 
            // Payout notifications should be handled separately or when status reaches COMPLETED.
            default -> {
                // PENDING, PENDING_PAYMENT, NO_SHOW, DISPUTED do not trigger direct status notifications here
            }
        }
    }

    private void broadcast(Booking booking) {
        String bookingTopic = "/topic/bookings/" + booking.getId() + "/status";
        String userTopic    = "/topic/bookings/user/" + booking.getRenter().getId();
        
        Map<String, String> payload = Map.of(
            "bookingId", booking.getId().toString(),
            "status",    booking.getBookingStatus().name(),
            "timestamp", LocalDateTime.now().toString()
        );

        try {
            messagingTemplate.convertAndSend(bookingTopic, payload);
            messagingTemplate.convertAndSend(userTopic,    payload);
            log.info("LIFECYCLE: Broadcasted update for booking {} to {} and {}", 
                booking.getId(), bookingTopic, userTopic);
        } catch (Exception e) {
            log.warn("LIFECYCLE: Failed to broadcast update for booking {}: {}", booking.getId(), e.getMessage());
        }
    }
}
