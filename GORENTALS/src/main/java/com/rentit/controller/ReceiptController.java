package com.rentit.controller;

import com.rentit.exception.BusinessException;
import com.rentit.model.Booking;
import com.rentit.model.User;
import com.rentit.repository.BookingRepository;
import com.rentit.repository.UserRepository;
import com.rentit.service.ReceiptService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Exposes receipt download endpoint for renters.
 *
 * GET /api/bookings/{bookingId}/receipt
 *   → Returns a branded PDF receipt for the booking.
 *   → Only accessible by the booking's renter or an ADMIN.
 */
@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class ReceiptController {

    private final ReceiptService      receiptService;
    private final BookingRepository   bookingRepository;
    private final UserRepository      userRepository;

    /**
     * Download a PDF receipt for a specific booking.
     *
     * @param bookingId   UUID of the booking
     * @param userDetails authenticated caller (injected from JWT)
     * @return PDF byte stream with download headers
     */
    @GetMapping("/{bookingId}/receipt")
    public ResponseEntity<byte[]> downloadReceipt(
        @PathVariable UUID bookingId,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> BusinessException.notFound("Booking", bookingId));

        User caller = userRepository.findByEmail(userDetails.getUsername())
            .orElseThrow(() -> BusinessException.notFound("User", userDetails.getUsername()));

        boolean isRenter = booking.getRenter().getId().equals(caller.getId());
        boolean isAdmin  = caller.getUserType() == User.UserType.ADMIN;

        if (!isRenter && !isAdmin) {
            throw BusinessException.forbidden(
                "Only the renter or an admin can download this receipt.");
        }

        byte[] pdf = receiptService.generateBookingReceipt(bookingId);

        String filename = "receipt-" + bookingId + ".pdf";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", filename);
        headers.setContentLength(pdf.length);

        return ResponseEntity.ok()
            .headers(headers)
            .body(pdf);
    }
}
