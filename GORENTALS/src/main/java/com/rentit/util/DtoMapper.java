package com.rentit.util;

import com.rentit.dto.*;
import com.rentit.dto.messaging.*;
import com.rentit.model.*;
import com.rentit.model.enums.BookingStatus;
import com.rentit.model.enums.EscrowStatus;
import java.math.BigDecimal;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * Centralized mapper for converting entities to DTOs.
 * Reduces service layer bloat and ensures consistency.
 */
public class DtoMapper {

    public static ListingResponse mapToListingResponse(Listing listing) {
        if (listing == null) return null;
        User owner = listing.getOwner();
        
        return ListingResponse.builder()
                .id(listing.getId())
                .owner(mapToUserPublicResponse(owner))
                .title(listing.getTitle())
                .description(listing.getDescription())
                .category(listing.getCategory())
                .type(listing.getType())
                .pricePerDay(listing.getPricePerDay())
                .securityDeposit(listing.getSecurityDeposit())
                .location(listing.getLocation())
                .city(listing.getCity())
                .state(listing.getState())
                .specifications(listing.getSpecifications())
                .images(listing.getImages())
                .isAvailable(listing.getIsAvailable())
                .isPublished(listing.getIsPublished())
                .totalRatings(listing.getTotalRatings())
                .ratingCount(listing.getRatingCount())
                .createdAt(listing.getCreatedAt())
                .updatedAt(listing.getUpdatedAt())
                .build();
    }

    public static UserPublicResponse mapToUserPublicResponse(User user) {
        if (user == null) return null;
        boolean isVerified = user.getProfile() != null && 
                            user.getProfile().getKycStatus() == UserProfile.KYCStatus.APPROVED;
        
        return UserPublicResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .isVerified(isVerified)
                .build();
    }

    public static BookingResponse mapToBookingResponse(Booking booking) {
        if (booking == null) return null;
        
        Listing l = booking.getListing();
        User renter = booking.getRenter();
        User owner = (l != null) ? l.getOwner() : null;

        return BookingResponse.builder()
            .id(booking.getId())
            .listing(l != null ? ListingResponse.builder()
                .id(l.getId())
                .title(l.getTitle())
                .pricePerDay(l.getPricePerDay())
                .images(l.getImages())
                .city(l.getCity())
                .location(l.getLocation())
                .category(l.getCategory())
                .build() : null)
            .renter(mapToUserPublicResponse(renter))
            .owner(mapToUserPublicResponse(owner))
            .startDate(booking.getStartDate())
            .endDate(booking.getEndDate())
            .totalDays(booking.getTotalDays())
            .rentalAmount(booking.getRentalAmount())
            .securityDeposit(booking.getSecurityDeposit())
            .totalAmount(booking.getTotalAmount())
            .gstAmount(Objects.requireNonNullElse(booking.getGstAmount(), BigDecimal.ZERO))
            .platformFee(Objects.requireNonNullElse(booking.getPlatformFee(), BigDecimal.ZERO))
            .status(booking.getBookingStatus() != null ? booking.getBookingStatus().name() : "PENDING_PAYMENT")
            .escrowStatus(booking.getEscrowStatus() != null ? booking.getEscrowStatus().name() : "PENDING")
            .paymentStatus(booking.getPaymentStatus() != null ? booking.getPaymentStatus() : "PENDING")
            .razorpayOrderId(booking.getRazorpayOrderId())
            .razorpayPaymentId(booking.getRazorpayPaymentId())
            .createdAt(booking.getCreatedAt())
            .updatedAt(booking.getUpdatedAt())
            .build();
    }

    public static ConversationResponse mapToConversationResponse(Conversation conv, String userEmail) {
        if (conv == null) return null;
        
        User participant = conv.getOwner().getEmail().equals(userEmail) 
                           ? conv.getRenter() : conv.getOwner();
        
        return ConversationResponse.builder()
            .id(conv.getId())
            .listingId(conv.getListing().getId())
            .listingTitle(conv.getListing().getTitle())
            .otherUser(ConversationResponse.OtherUserDto.builder()
                .id(participant.getId())
                .fullName(participant.getFullName())
                .build())
            .lastMessage(conv.getLastMessageText())
            .lastMessageAt(conv.getLastMessageAt())
            .ownerUnread(conv.getOwnerUnread())
            .renterUnread(conv.getRenterUnread())
            .build();
    }

    public static MessageResponse mapToMessageResponse(ChatMessage msg) {
        if (msg == null) return null;
        return MessageResponse.builder()
            .id(msg.getId())
            .tempId(msg.getTempId() != null ? msg.getTempId().toString() : null)
            .conversationId(msg.getConversation().getId())
            .senderId(msg.getSender().getId())
            .senderName(msg.getSender().getFullName())
            .messageText(msg.getMessageText())
            .messageType(msg.getMessageType().name())
            .status(msg.getStatus().name())
            .read(ChatMessage.MessageStatus.READ.equals(msg.getStatus()))
            .createdAt(msg.getCreatedAt())
            .build();
    }

    public static UserProfileResponse mapToProfileResponse(User user, UserProfile profile) {
        if (user == null) return null;
        if (profile == null) profile = new UserProfile();
        
        return UserProfileResponse.builder()
            .id(user.getId())
            .email(user.getEmail())
            .fullName(user.getFullName())
            .phone(user.getPhone())
            .userType(user.getUserType().name())
            .isActive(user.getIsActive())
            .createdAt(user.getCreatedAt())
            .profilePicture(profile.getProfilePicture())
            .address(profile.getAddress())
            .city(profile.getCity())
            .state(profile.getState())
            .pincode(profile.getPincode())
            .dateOfBirth(profile.getDateOfBirth())
            .kycStatus(profile.getKycStatus() != null ? profile.getKycStatus().name() : "PENDING")
            .kycDocumentType(profile.getKycDocumentType())
            .kycDocumentId(profile.getKycDocumentId())
            .kycDocumentUrl(profile.getKycDocumentUrl())
            .autoApproveBookings(user.getSettings() != null ? user.getSettings().getAutoApproveBookings() : false)
            .build();
    }
}
