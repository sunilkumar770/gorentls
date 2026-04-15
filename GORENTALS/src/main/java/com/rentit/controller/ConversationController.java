package com.rentit.controller;

import com.rentit.dto.messaging.*;
import com.rentit.service.MessageService;
import jakarta.validation.Valid;   // Spring Boot 3.3.6
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/conversations")
public class ConversationController {

    private final MessageService messageService;
    public ConversationController(MessageService messageService) {
        this.messageService = messageService;
    }

    @GetMapping
    public ResponseEntity<List<ConversationResponse>> getUserConversations(
            @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(messageService.getUserConversations(ud.getUsername()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ConversationResponse> getConversation(
            @PathVariable UUID id, @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(messageService.getConversation(id, ud.getUsername()));
    }

    @PostMapping
    public ResponseEntity<ConversationResponse> startConversation(
            @Valid @RequestBody StartConversationRequest request,
            @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(messageService.startConversation(request, ud.getUsername()));
    }

    @GetMapping("/{id}/messages")
    public ResponseEntity<List<MessageResponse>> getMessages(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "50") int size,
            @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(messageService.getMessages(id, ud.getUsername(), page, size));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(
            @PathVariable UUID id, @AuthenticationPrincipal UserDetails ud) {
        messageService.markConversationRead(id, ud.getUsername());
        return ResponseEntity.noContent().build();
    }
}
