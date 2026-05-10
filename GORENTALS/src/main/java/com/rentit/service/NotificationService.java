package com.rentit.service;

import com.rentit.exception.BusinessException;
import com.rentit.model.Notification;
import com.rentit.repository.NotificationRepository;
import com.rentit.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository         userRepository;
    private final SimpMessagingTemplate  messagingTemplate;

    // ─── SEND ────────────────────────────────────────────────────────────────
    @Transactional
    public void sendNotification(UUID userId, String title, String message, String type) {
        Notification n = new Notification();
        n.setUserId(userId);
        n.setTitle(title);
        n.setMessage(message);
        n.setType(type);
        n.setIsRead(false);
        n.setCreatedAt(LocalDateTime.now());
        notificationRepository.save(n);

        // Real-time broadcast
        if (userId != null) {
            messagingTemplate.convertAndSendToUser(
                userId.toString(),
                "/topic/notifications",
                n
            );
        } else {
            // If system alert (null user), broadcast to global or specific admin topic
            messagingTemplate.convertAndSend(
                "/topic/global-notifications",
                n
            );
        }
    }

    @Transactional
    public void broadcastNotification(String title, String message, String type) {
        notificationRepository.broadcast(title, message, type);
        // Also broadcast to a global topic for real-time UI updates
        messagingTemplate.convertAndSend("/topic/global-notifications", title + ": " + message);
    }


    // ─── READ ─────────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public Page<Notification> getNotifications(UUID userId, Pageable pageable) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
    }

    @Transactional(readOnly = true)
    public long countUnread(UUID userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    // ─── MARK READ ────────────────────────────────────────────────────────────

    @Transactional
    public void markAsRead(UUID notificationId, UUID userId) {
        Notification n = notificationRepository.findById(notificationId)
            .orElseThrow(() -> BusinessException.notFound("Notification", notificationId));
        if (!n.getUserId().equals(userId)) {
            throw BusinessException.forbidden("Access denied to notification " + notificationId);
        }
        n.setIsRead(true);
        notificationRepository.save(n);
    }

    @Transactional
    public void markAllAsRead(UUID userId) {
        notificationRepository.markAllRead(userId);
    }

    // ─── DELETE ───────────────────────────────────────────────────────────────

    @Transactional
    public void deleteNotification(UUID notificationId, UUID userId) {
        Notification n = notificationRepository.findById(notificationId)
            .orElseThrow(() -> BusinessException.notFound("Notification", notificationId));
        if (!n.getUserId().equals(userId)) {
            throw BusinessException.forbidden("Access denied to notification " + notificationId);
        }
        notificationRepository.delete(n);
    }

    /**
     * Notify both renter and owner about a successful payment capture.
     */
    @Transactional
    public void notifyPaymentCaptured(com.rentit.model.Booking booking, com.rentit.model.Payment payment) {
        if (booking == null || payment == null) return;
        
        // Notify Owner
        if (booking.getListing() != null && booking.getListing().getOwner() != null) {
            sendNotification(
                booking.getListing().getOwner().getId(),
                "Payment Received",
                String.format("Payment of ₹%s received for booking of '%s' by %s.",
                    payment.getAmount(), booking.getListing().getTitle(), booking.getRenter().getFullName()),
                "PAYMENT_RECEIVED"
            );
        }

        // Notify Renter
        if (booking.getRenter() != null) {
            sendNotification(
                booking.getRenter().getId(),
                "Payment Successful",
                String.format("Your payment of ₹%s for '%s' was successful. Status: %s",
                    payment.getAmount(), booking.getListing().getTitle(), booking.getBookingStatus()),
                "PAYMENT_SUCCESS"
            );
        }
    }
}
