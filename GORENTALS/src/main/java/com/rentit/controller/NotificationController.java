package com.rentit.controller;

import com.rentit.dto.NotificationResponse;
import com.rentit.model.User;
import com.rentit.repository.UserRepository;
import com.rentit.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired private NotificationService notificationService;
    @Autowired private UserRepository      userRepository;

    private User resolveUser(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername())
            .orElseThrow(() -> new RuntimeException("User not found"));
    }

    /**
     * GET /api/notifications?page=0&size=20
     * Returns paginated notifications for the logged-in user.
     */
    @GetMapping
    public ResponseEntity<Page<NotificationResponse>> getNotifications(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {

        User user = resolveUser(userDetails);
        Pageable pageable = PageRequest.of(page, size);
        Page<NotificationResponse> result = notificationService
            .getNotifications(user.getId(), pageable)
            .map(NotificationResponse::from);
        return ResponseEntity.ok(result);
    }

    /**
     * GET /api/notifications/unread-count
     * Returns the unread badge count for the navbar bell icon.
     */
    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(
            @AuthenticationPrincipal UserDetails userDetails) {

        User user = resolveUser(userDetails);
        long count = notificationService.countUnread(user.getId());
        return ResponseEntity.ok(Map.of("unreadCount", count));
    }

    /**
     * PATCH /api/notifications/{id}/read
     * Marks a single notification as read.
     */
    @PatchMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID id) {

        User user = resolveUser(userDetails);
        notificationService.markAsRead(id, user.getId());
        return ResponseEntity.noContent().build();
    }

    /**
     * PATCH /api/notifications/read-all
     * Marks ALL notifications as read for the logged-in user.
     */
    @PatchMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(
            @AuthenticationPrincipal UserDetails userDetails) {

        User user = resolveUser(userDetails);
        notificationService.markAllAsRead(user.getId());
        return ResponseEntity.noContent().build();
    }

    /**
     * DELETE /api/notifications/{id}
     * Deletes a single notification (user can only delete their own).
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotification(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID id) {

        User user = resolveUser(userDetails);
        notificationService.deleteNotification(id, user.getId());
        return ResponseEntity.noContent().build();
    }
}
