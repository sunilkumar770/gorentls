package com.rentit.service;

import com.lowagie.text.*;
import com.lowagie.text.pdf.*;
import com.lowagie.text.pdf.draw.LineSeparator;
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

/**
 * Generates PDF booking receipts for renters.
 *
 * The PDF includes: GoRentals branding, booking reference, rental dates,
 * item details, renter name, and a full financial breakdown with GST,
 * platform fee, security deposit, advance paid, and remaining balance.
 */
@Service
@RequiredArgsConstructor
public class ReceiptService {

    private static final Logger log = LoggerFactory.getLogger(ReceiptService.class);
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd MMM yyyy");
    private static final Color BRAND_BLUE  = new Color(30, 64, 175);
    private static final Color LIGHT_GRAY  = new Color(180, 180, 180);

    private final BookingRepository bookingRepository;

    /**
     * Generate a PDF receipt for the given booking.
     *
     * @param bookingId the booking UUID
     * @return raw PDF bytes ready to be streamed to the client
     * @throws BusinessException if booking not found
     * @throws RuntimeException if PDF generation fails
     */
    @Transactional(readOnly = true)
    public byte[] generateBookingReceipt(UUID bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> BusinessException.notFound("Booking", bookingId));

        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            Document doc = new Document(PageSize.A4, 50, 50, 60, 50);
            PdfWriter.getInstance(doc, baos);
            doc.open();

            buildHeader(doc);
            buildMetaTable(doc, booking);
            buildSeparator(doc);
            buildFinancialTable(doc, booking);
            buildFooter(doc, booking);

            doc.close();
            log.info("Receipt generated for booking={}", bookingId);
            return baos.toByteArray();

        } catch (Exception e) {
            log.error("Failed to generate receipt for booking {}: {}", bookingId, e.getMessage(), e);
            throw new RuntimeException("Receipt generation failed for booking: " + bookingId, e);
        }
    }

    // ── PDF Section Builders ───────────────────────────────────────────────────

    private void buildHeader(Document doc) throws DocumentException {
        Font brandFont  = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 26, BRAND_BLUE);
        Font smallGray  = FontFactory.getFont(FontFactory.HELVETICA, 9, LIGHT_GRAY);
        Font titleFont  = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 13, Color.DARK_GRAY);

        Paragraph brand = new Paragraph("GoRentals", brandFont);
        brand.setAlignment(Element.ALIGN_LEFT);
        doc.add(brand);

        Paragraph tagline = new Paragraph("Rent Anything. Anywhere.", smallGray);
        tagline.setSpacingAfter(4);
        doc.add(tagline);

        LineSeparator line = new LineSeparator(1f, 100f, BRAND_BLUE, Element.ALIGN_CENTER, -2);
        doc.add(new Chunk(line));

        Paragraph receiptTitle = new Paragraph("\nBOOKING RECEIPT", titleFont);
        receiptTitle.setAlignment(Element.ALIGN_CENTER);
        receiptTitle.setSpacingAfter(12);
        doc.add(receiptTitle);
    }

    private void buildMetaTable(Document doc, Booking booking) throws DocumentException {
        Font labelFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Color.DARK_GRAY);
        Font valueFont = FontFactory.getFont(FontFactory.HELVETICA, 10, Color.DARK_GRAY);

        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(100);
        table.setSpacingAfter(12);

        addMetaRow(table, "Booking Reference", booking.getId().toString().toUpperCase(), labelFont, valueFont);
        addMetaRow(table, "Item", booking.getListing().getTitle(), labelFont, valueFont);
        addMetaRow(table, "Renter", booking.getRenter().getFullName(), labelFont, valueFont);
        addMetaRow(table, "Rental Period",
            booking.getStartDate().format(DATE_FMT) + "  →  " + booking.getEndDate().format(DATE_FMT),
            labelFont, valueFont);
        addMetaRow(table, "Total Days", String.valueOf(booking.getTotalDays()), labelFont, valueFont);
        addMetaRow(table, "Booking Status", booking.getBookingStatus().name(), labelFont, valueFont);

        doc.add(table);
    }

    private void buildSeparator(Document doc) throws DocumentException {
        LineSeparator line = new LineSeparator(1f, 100f, BRAND_BLUE, Element.ALIGN_CENTER, -2);
        doc.add(new Chunk(line));
    }

    private void buildFinancialTable(Document doc, Booking booking) throws DocumentException {
        Font labelFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Color.DARK_GRAY);
        Font valueFont = FontFactory.getFont(FontFactory.HELVETICA, 10, Color.DARK_GRAY);
        Font secTitle  = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 13, Color.DARK_GRAY);

        Paragraph finTitle = new Paragraph("\nPayment Summary\n", secTitle);
        finTitle.setSpacingAfter(8);
        doc.add(finTitle);

        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(100);
        table.setSpacingAfter(16);

        addFinRow(table, "Base Rental Amount",  booking.getRentalAmount(),   labelFont, valueFont, false);
        addFinRow(table, "GST (18%)",           booking.getGstAmount(),      labelFont, valueFont, false);
        addFinRow(table, "Platform Fee",        booking.getPlatformFee(),    labelFont, valueFont, false);
        addFinRow(table, "Security Deposit",    booking.getSecurityDeposit(),labelFont, valueFont, false);
        addFinRow(table, "TOTAL AMOUNT",        booking.getTotalAmount(),    labelFont, valueFont, true);

        Paragraph breakTitle = new Paragraph("\nPayment Breakdown\n", secTitle);
        breakTitle.setSpacingAfter(8);
        doc.add(table);
        doc.add(breakTitle);

        PdfPTable breakTable = new PdfPTable(2);
        breakTable.setWidthPercentage(100);
        breakTable.setSpacingAfter(12);
        addFinRow(breakTable, "Advance Paid",   booking.getAdvanceAmount(),   labelFont, valueFont, false);

        BigDecimal remaining = booking.getRemainingAmount() != null
            ? booking.getRemainingAmount() : BigDecimal.ZERO;
        addFinRow(breakTable, "Remaining Balance", remaining, labelFont, valueFont, false);
        doc.add(breakTable);
    }

    private void buildFooter(Document doc, Booking booking) throws DocumentException {
        Font smallGray = FontFactory.getFont(FontFactory.HELVETICA, 9, LIGHT_GRAY);
        LineSeparator line = new LineSeparator(1f, 100f, BRAND_BLUE, Element.ALIGN_CENTER, -2);
        doc.add(new Chunk(line));

        Paragraph footer = new Paragraph(
            "\nThis is a system-generated receipt. For queries, contact support@gorentals.com", smallGray);
        footer.setAlignment(Element.ALIGN_CENTER);
        footer.setSpacingBefore(8);
        doc.add(footer);

        if (booking.getRazorpayPaymentId() != null) {
            Paragraph payRef = new Paragraph(
                "Razorpay Payment ID: " + booking.getRazorpayPaymentId(), smallGray);
            payRef.setAlignment(Element.ALIGN_CENTER);
            doc.add(payRef);
        }
    }

    // ── Cell Helpers ───────────────────────────────────────────────────────────

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
        Font vFont = bold ? FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, BRAND_BLUE)  : vf;
        String amtStr = (amount != null) ? String.format("₹%.2f", amount) : "₹0.00";

        PdfPCell lc = new PdfPCell(new Phrase(label, lFont));
        lc.setBorder(bold ? Rectangle.TOP : Rectangle.NO_BORDER);
        lc.setPaddingTop(bold ? 8 : 3);
        lc.setPaddingBottom(5);

        PdfPCell vc = new PdfPCell(new Phrase(amtStr, vFont));
        vc.setBorder(bold ? Rectangle.TOP : Rectangle.NO_BORDER);
        vc.setPaddingTop(bold ? 8 : 3);
        vc.setPaddingBottom(5);
        vc.setHorizontalAlignment(Element.ALIGN_RIGHT);

        t.addCell(lc);
        t.addCell(vc);
    }
}
