package com.rentit.service;

import com.rentit.model.Notification;
import com.rentit.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    // Method that accepts UUID
    public void sendNotification(UUID userId, String title, String message, String type) {
        Notification notification = new Notification();
        notification.setUserId(userId);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(type);
        notification.setIsRead(false);
        notification.setCreatedAt(LocalDateTime.now());
        
        notificationRepository.save(notification);
    }

    // Overloaded method that accepts String (converts to UUID)
    public void sendNotification(String userId, String title, String message, String type) {
        try {
            UUID uuid = UUID.fromString(userId);
            sendNotification(uuid, title, message, type);
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid UUID format: " + userId);
        }
    }
}