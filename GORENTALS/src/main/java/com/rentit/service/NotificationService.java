package com.rentit.service;

import com.rentit.model.Notification;
import com.rentit.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    // ─── SEND ────────────────────────────────────────────────────────────────

    public void sendNotification(UUID userId, String title, String message, String type) {
        Notification n = new Notification();
        n.setUserId(userId);
        n.setTitle(title);
        n.setMessage(message);
        n.setType(type);
        n.setIsRead(false);
        n.setCreatedAt(LocalDateTime.now());
        notificationRepository.save(n);
    }

    public void sendNotification(String userId, String title, String message, String type) {
        sendNotification(UUID.fromString(userId), title, message, type);
    }

    // ─── READ ─────────────────────────────────────────────────────────────────

    public Page<Notification> getNotifications(UUID userId, Pageable pageable) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
    }

    public long countUnread(UUID userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    // ─── MARK READ ────────────────────────────────────────────────────────────

    @Transactional
    public void markAsRead(UUID notificationId, UUID userId) {
        Notification n = notificationRepository.findById(notificationId)
            .orElseThrow(() -> new RuntimeException("Notification not found"));
        if (!n.getUserId().equals(userId)) {
            throw new RuntimeException("Access denied");
        }
        n.setIsRead(true);
        notificationRepository.save(n);
    }

    @Transactional
    public void markAllAsRead(UUID userId) {
        notificationRepository.findByUserIdAndIsReadFalse(userId)
            .forEach(n -> {
                n.setIsRead(true);
                notificationRepository.save(n);
            });
    }

    // ─── DELETE ───────────────────────────────────────────────────────────────

    @Transactional
    public void deleteNotification(UUID notificationId, UUID userId) {
        Notification n = notificationRepository.findById(notificationId)
            .orElseThrow(() -> new RuntimeException("Notification not found"));
        if (!n.getUserId().equals(userId)) {
            throw new RuntimeException("Access denied");
        }
        notificationRepository.delete(n);
    }
}