package com.rentit.controller;

import com.rentit.dto.BookingRequest;
import com.rentit.dto.BookingResponse;
import com.rentit.dto.BookingStatusUpdateRequest;
import com.rentit.service.BookingService;
import com.rentit.model.enums.BookingStatus;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.UUID;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @PostMapping
    @PreAuthorize("hasAnyRole('RENTER', 'USER', 'ADMIN')")
    public ResponseEntity<BookingResponse> createBooking(
            @Valid @RequestBody BookingRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.status(HttpStatus.CREATED)
                             .body(bookingService.createBooking(request, userDetails.getUsername()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<BookingResponse> getBooking(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(bookingService.getBookingById(id, userDetails.getUsername()));
    }

    @GetMapping("/my-bookings")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Page<BookingResponse>> getMyBookings(
            @AuthenticationPrincipal UserDetails userDetails,
            Pageable pageable) {
        return ResponseEntity.ok(bookingService.getBookingsByUser(userDetails.getUsername(), pageable));
    }

    @GetMapping("/owner/bookings")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<Page<BookingResponse>> getOwnerBookings(
            @AuthenticationPrincipal UserDetails userDetails,
            Pageable pageable) {
        return ResponseEntity.ok(bookingService.getBookingsForOwner(userDetails.getUsername(), pageable));
    }

    @PostMapping("/{id}/confirm")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<BookingResponse> confirmBooking(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(bookingService.confirmBooking(id, userDetails.getUsername()));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<BookingResponse> rejectBooking(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(bookingService.rejectBooking(id, userDetails.getUsername()));
    }

    @PatchMapping("/{id}/cancel")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<BookingResponse> cancelBooking(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(bookingService.updateStatus(id, BookingStatus.CANCELLED, userDetails.getUsername()));
    }



    @PatchMapping("/{id}/status")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<BookingResponse> updateStatus(
            @PathVariable UUID id,
            @Valid @RequestBody BookingStatusUpdateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        BookingStatus newStatus = BookingStatus.valueOf(request.getStatus().toUpperCase());
        return ResponseEntity.ok(bookingService.updateStatus(id, newStatus, userDetails.getUsername()));
    }

    @PatchMapping("/{id}/complete")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<BookingResponse> completeBooking(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(bookingService.updateStatus(id, BookingStatus.COMPLETED, userDetails.getUsername()));
    }
}
