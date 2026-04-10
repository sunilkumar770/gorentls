package com.rentit.dto;

import com.rentit.model.Conversation;
import java.time.LocalDateTime;
import java.util.UUID;

public class ConversationResponse {
    private UUID id, listingId, bookingId, renterId, ownerId;
    private String listingTitle, renterName, renterEmail, ownerName, ownerEmail;
    private String lastMessage;
    private LocalDateTime lastMessageAt, createdAt;
    private Integer renterUnread, ownerUnread;

    public static ConversationResponse from(Conversation c) {
        ConversationResponse r = new ConversationResponse();
        r.id = c.getId();
        r.listingId = c.getListing().getId();
        r.listingTitle = c.getListing().getTitle();
        r.bookingId = c.getBooking() != null ? c.getBooking().getId() : null;
        r.renterId = c.getRenter().getId();
        r.renterName = c.getRenter().getFullName();
        r.renterEmail = c.getRenter().getEmail();
        r.ownerId = c.getOwner().getId();
        r.ownerName = c.getOwner().getFullName();
        r.ownerEmail = c.getOwner().getEmail();
        r.lastMessage = c.getLastMessage();
        r.lastMessageAt = c.getLastMessageAt();
        r.renterUnread = c.getRenterUnread();
        r.ownerUnread = c.getOwnerUnread();
        r.createdAt = c.getCreatedAt();
        return r;
    }

    public UUID getId() { return id; }
    public UUID getListingId() { return listingId; }
    public String getListingTitle() { return listingTitle; }
    public UUID getBookingId() { return bookingId; }
    public UUID getRenterId() { return renterId; }
    public String getRenterName() { return renterName; }
    public String getRenterEmail() { return renterEmail; }
    public UUID getOwnerId() { return ownerId; }
    public String getOwnerName() { return ownerName; }
    public String getOwnerEmail() { return ownerEmail; }
    public String getLastMessage() { return lastMessage; }
    public LocalDateTime getLastMessageAt() { return lastMessageAt; }
    public Integer getRenterUnread() { return renterUnread; }
    public Integer getOwnerUnread() { return ownerUnread; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
