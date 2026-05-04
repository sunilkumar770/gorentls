# PRD: Booking Receipt Generation & Owner Payment Notification

## Overview
Complete the GoRentals booking flow by implementing:
1. PDF receipt download for renters after booking payment
2. In-app owner notification with billing details after each payment captured

## Dependencies
- Spring Boot 3.x (already present)
- OpenPDF (to be added to pom.xml)
- Existing NotificationService, BookingEscrowService, BookingService

---

## User Story US-R01: Add OpenPDF Dependency

### Acceptance Criteria
- `pom.xml` has the `com.github.librepdf:openpdf:2.0.2` dependency added under `<dependencies>`.
- `./mvnw clean compile -DskipTests` passes with exit code 0.

### Implementation
In `GORENTALS/pom.xml`, inside the `<dependencies>` block, add:
```xml
<!-- PDF Receipt Generation -->
<dependency>
    <groupId>com.github.librepdf</groupId>
    <artifactId>openpdf</artifactId>
    <version>2.0.2</version>
</dependency>
```

---

## User Story US-R02: Create ReceiptService

### Acceptance Criteria
- File exists: `src/main/java/com/rentit/service/ReceiptService.java`
- `generateBookingReceipt(UUID bookingId)` returns `byte[]` (a valid PDF).
- The PDF contains: GoRentals header, booking reference, dates, item title, renter name, financial breakdown (Rental Amount, GST, Platform Fee, Security Deposit, Advance Paid, Remaining Due, Total).
- Method throws `BusinessException.notFound(...)` if booking not found.

### Implementation
Create file `src/main/java/com/rentit/service/ReceiptService.java`:

```java
package com.rentit.service;

import com.lowagie.text.*;
import com.lowagie.text.pdf.*;
import com.rentit.exception.BusinessException;
import com.rentit.model.Booking;
import com.rentit.repository.BookingRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReceiptService {

    private static final Logger log = LoggerFactory.getLogger(ReceiptService.class);
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd MMM yyyy");
    private static final Color BRAND_BLUE = new Color(30, 64, 175);
    private static final Color LIGHT_GRAY = new Color(248, 249, 250);

    private final BookingRepository bookingRepository;

    @Transactional(readOnly = true)
    public byte[] generateBookingReceipt(UUID bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> BusinessException.notFound("Booking", bookingId));

        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            Document doc = new Document(PageSize.A4, 50, 50, 60, 50);
            PdfWriter.getInstance(doc, baos);
            doc.open();

            // ── Header ──────────────────────────────────────────────────────
            Font brandFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 26, BRAND_BLUE);
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 13, Color.DARK_GRAY);
            Font labelFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Color.DARK_GRAY);
            Font valueFont = FontFactory.getFont(FontFactory.HELVETICA, 10, Color.DARK_GRAY);
            Font smallGray = FontFactory.getFont(FontFactory.HELVETICA, 9, Color.GRAY);

            Paragraph brand = new Paragraph("GoRentals", brandFont);
            brand.setAlignment(Element.ALIGN_LEFT);
            doc.add(brand);

            Paragraph tagline = new Paragraph("Rent Anything. Anywhere.", smallGray);
            tagline.setSpacingAfter(4);
            doc.add(tagline);

            // Separator line
            LineSeparator line = new LineSeparator(1f, 100f, BRAND_BLUE, Element.ALIGN_CENTER, -2);
            doc.add(new Chunk(line));

            Paragraph receiptTitle = new Paragraph("\nBOOKING RECEIPT", titleFont);
            receiptTitle.setAlignment(Element.ALIGN_CENTER);
            receiptTitle.setSpacingAfter(12);
            doc.add(receiptTitle);

            // ── Booking Meta ─────────────────────────────────────────────────
            PdfPTable metaTable = new PdfPTable(2);
            metaTable.setWidthPercentage(100);
            metaTable.setSpacingAfter(12);
            addMetaRow(metaTable, "Booking Reference", booking.getId().toString().toUpperCase(), labelFont, valueFont);
            addMetaRow(metaTable, "Item", booking.getListing().getTitle(), labelFont, valueFont);
            addMetaRow(metaTable, "Renter", booking.getRenter().getFullName(), labelFont, valueFont);
            addMetaRow(metaTable, "Rental Period",
                booking.getStartDate().format(DATE_FMT) + " → " + booking.getEndDate().format(DATE_FMT),
                labelFont, valueFont);
            addMetaRow(metaTable, "Total Days", String.valueOf(booking.getTotalDays()), labelFont, valueFont);
            addMetaRow(metaTable, "Status", booking.getBookingStatus().name(), labelFont, valueFont);
            doc.add(metaTable);

            doc.add(new Chunk(line));

            // ── Financial Breakdown ──────────────────────────────────────────
            Paragraph finTitle = new Paragraph("\nPayment Summary\n", titleFont);
            finTitle.setSpacingAfter(8);
            doc.add(finTitle);

            PdfPTable finTable = new PdfPTable(2);
            finTable.setWidthPercentage(100);
            finTable.setSpacingAfter(12);
            addFinRow(finTable, "Base Rental Amount", booking.getRentalAmount(), labelFont, valueFont, false);
            addFinRow(finTable, "GST (18%)", booking.getGstAmount(), labelFont, valueFont, false);
            addFinRow(finTable, "Platform Fee", booking.getPlatformFee(), labelFont, valueFont, false);
            addFinRow(finTable, "Security Deposit", booking.getSecurityDeposit(), labelFont, valueFont, false);
            addFinRow(finTable, "Total Amount", booking.getTotalAmount(), labelFont, valueFont, true);
            addFinRow(finTable, "Advance Paid", booking.getAdvanceAmount(), labelFont, valueFont, false);
            BigDecimal remaining = booking.getTotalAmount().subtract(booking.getAdvanceAmount());
            addFinRow(finTable, "Remaining Balance",
                remaining.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : remaining,
                labelFont, valueFont, false);
            doc.add(finTable);

            doc.add(new Chunk(line));

            // ── Footer ───────────────────────────────────────────────────────
            Paragraph footer = new Paragraph(
                "\nThis is a system-generated receipt. For queries contact support@gorentals.com",
                smallGray);
            footer.setAlignment(Element.ALIGN_CENTER);
            footer.setSpacingBefore(8);
            doc.add(footer);

            if (booking.getRazorpayPaymentId() != null) {
                Paragraph payRef = new Paragraph(
                    "Payment Reference: " + booking.getRazorpayPaymentId(), smallGray);
                payRef.setAlignment(Element.ALIGN_CENTER);
                doc.add(payRef);
            }

            doc.close();
            log.info("Receipt generated for booking={}", bookingId);
            return baos.toByteArray();

        } catch (Exception e) {
            log.error("Failed to generate receipt for booking {}: {}", bookingId, e.getMessage(), e);
            throw new RuntimeException("Receipt generation failed", e);
        }
    }

    private void addMetaRow(PdfPTable t, String label, String value, Font lf, Font vf) {
        PdfPCell lc = new PdfPCell(new Phrase(label, lf));
        lc.setBorder(Rectangle.NO_BORDER);
        lc.setPaddingBottom(6);
        PdfPCell vc = new PdfPCell(new Phrase(value, vf));
        vc.setBorder(Rectangle.NO_BORDER);
        vc.setPaddingBottom(6);
        vc.setHorizontalAlignment(Element.ALIGN_RIGHT);
        t.addCell(lc);
        t.addCell(vc);
    }

    private void addFinRow(PdfPTable t, String label, BigDecimal amount, Font lf, Font vf, boolean bold) {
        Font lFont = bold ? FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, Color.BLACK) : lf;
        Font vFont = bold ? FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, BRAND_BLUE) : vf;
        PdfPCell lc = new PdfPCell(new Phrase(label, lFont));
        lc.setBorder(bold ? Rectangle.TOP : Rectangle.NO_BORDER);
        lc.setPaddingTop(bold ? 6 : 3);
        lc.setPaddingBottom(5);
        PdfPCell vc = new PdfPCell(new Phrase(
            "₹" + (amount != null ? String.format("%.2f", amount) : "0.00"), vFont));
        vc.setBorder(bold ? Rectangle.TOP : Rectangle.NO_BORDER);
        vc.setPaddingTop(bold ? 6 : 3);
        vc.setPaddingBottom(5);
        vc.setHorizontalAlignment(Element.ALIGN_RIGHT);
        t.addCell(lc);
        t.addCell(vc);
    }
}
```

---

## User Story US-R03: Create Receipt Download Endpoint

### Acceptance Criteria
- File exists: `src/main/java/com/rentit/controller/ReceiptController.java`
- `GET /api/bookings/{bookingId}/receipt` returns HTTP 200 with `Content-Type: application/pdf` and `Content-Disposition: attachment; filename=receipt-{bookingId}.pdf`
- Only the renter of the booking or an ADMIN can access the endpoint (403 otherwise).
- Returns 404 if booking not found.

### Implementation
Create file `src/main/java/com/rentit/controller/ReceiptController.java`:

```java
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

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class ReceiptController {

    private final ReceiptService receiptService;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;

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
            throw BusinessException.forbidden("Access denied: only the renter or admin can download receipts.");
        }

        byte[] pdf = receiptService.generateBookingReceipt(bookingId);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment",
            "receipt-" + bookingId + ".pdf");

        return ResponseEntity.ok()
            .headers(headers)
            .body(pdf);
    }
}
```

---

## User Story US-R04: Owner Notification on Payment Captured

### Acceptance Criteria
- After `applyAdvance()` in `BookingEscrowService`, the owner receives a notification:
  - Title: "New Booking Confirmed – Payment Received"
  - Message includes: item title, renter name, advance amount, platform fee, GST, booking dates.
- After `applyFinal()`, the owner receives a notification:
  - Title: "Final Payment Received"
  - Message includes: item title, renter name, final amount, total escrow now held.
- `NotificationService` is injected into `BookingEscrowService`.

### Implementation
Modify `src/main/java/com/rentit/service/BookingEscrowService.java`:

1. Add `NotificationService` constructor injection.
2. After `bookingRepo.save(booking)` in `applyAdvance()`, call:
```java
notifyOwnerAdvanceReceived(booking);
```
3. After `bookingRepo.save(booking)` in `applyFinal()`, call:
```java
notifyOwnerFinalPaymentReceived(booking);
```
4. Add private helper methods:
```java
private void notifyOwnerAdvanceReceived(Booking booking) {
    try {
        UUID ownerId = booking.getListing().getOwner().getId();
        String msg = String.format(
            "Great news! A booking for '%s' has been confirmed.\n" +
            "Renter: %s\n" +
            "Dates: %s → %s\n" +
            "Advance Received: ₹%.2f\n" +
            "Platform Fee: ₹%.2f | GST: ₹%.2f\n" +
            "Booking ID: %s",
            booking.getListing().getTitle(),
            booking.getRenter().getFullName(),
            booking.getStartDate(), booking.getEndDate(),
            booking.getAdvanceAmount(),
            booking.getPlatformFee(),
            booking.getGstAmount(),
            booking.getId()
        );
        notificationService.sendNotification(ownerId,
            "New Booking Confirmed – Payment Received", msg, "PAYMENT_RECEIVED");
    } catch (Exception e) {
        log.warn("Failed to notify owner for booking {}: {}", booking.getId(), e.getMessage());
    }
}

private void notifyOwnerFinalPaymentReceived(Booking booking) {
    try {
        UUID ownerId = booking.getListing().getOwner().getId();
        BigDecimal totalHeld = booking.getAdvanceAmount().add(booking.getRemainingAmount());
        String msg = String.format(
            "Final payment received for your item '%s'.\n" +
            "Renter: %s | Total Escrow Held: ₹%.2f\n" +
            "The item is now IN USE. Booking ID: %s",
            booking.getListing().getTitle(),
            booking.getRenter().getFullName(),
            totalHeld,
            booking.getId()
        );
        notificationService.sendNotification(ownerId,
            "Final Payment Received", msg, "FINAL_PAYMENT_RECEIVED");
    } catch (Exception e) {
        log.warn("Failed to notify owner for booking {}: {}", booking.getId(), e.getMessage());
    }
}
```

---

## User Story US-R05: Frontend – Receipt Download Button

### Acceptance Criteria
- File: `gorentals-frontend/src/services/bookings.ts` — add `downloadReceipt(bookingId: string): Promise<Blob>` function.
- Renter booking card/detail page shows a "Download Receipt" button for CONFIRMED/IN_USE/COMPLETED bookings.
- Clicking the button triggers the download in the browser.

### Implementation

**Add to `gorentals-frontend/src/services/bookings.ts`:**
```typescript
export const downloadReceipt = async (bookingId: string): Promise<Blob> => {
  const response = await axios.get(`/api/bookings/${bookingId}/receipt`, {
    responseType: 'blob',
  });
  return response.data;
};

export const triggerReceiptDownload = async (bookingId: string): Promise<void> => {
  const blob = await downloadReceipt(bookingId);
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `receipt-${bookingId}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
```

**Verification:**
- Run `./mvnw clean compile -DskipTests` — must pass.
- Run `./mvnw clean test` — all existing tests must pass.
- The endpoint `GET /api/bookings/{bookingId}/receipt` returns a valid PDF blob.
