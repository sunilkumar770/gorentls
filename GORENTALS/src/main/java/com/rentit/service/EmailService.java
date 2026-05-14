package com.rentit.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:noreply@gorentals.com}")
    private String fromEmail;

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    @Async
    public void sendPasswordResetEmail(String to, String token) {
        try {
            String resetUrl = frontendUrl + "/reset-password?token=" + token;
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject("GoRentals - Password Reset Request");
            message.setText("To reset your password, click the link below:\n\n" +
                    resetUrl + "\n\n" +
                    "This link will expire in 1 hour.");
            mailSender.send(message);
            log.info("Password reset email sent to {}", to);
        } catch (Exception e) {
            log.error("Failed to send password reset email to {}", to, e);
        }
    }

    /**
     * Notifies the renter that their refund has been processed.
     *
     * @param to         renter email address
     * @param refundId   Razorpay refund ID
     * @param amountINR  refund amount in INR
     * @param bookingId  platform booking ID (for reference)
     */
    @Async
    public void sendRefundProcessedEmail(String to, String refundId, BigDecimal amountINR, String bookingId) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject("GoRentals - Refund Processed");
            message.setText(
                    "Your refund has been processed successfully.\n\n" +
                    "Refund ID  : " + refundId + "\n" +
                    "Amount     : \u20b9" + amountINR + "\n" +
                    "Booking ID : " + bookingId + "\n\n" +
                    "The amount will be credited to your original payment method within 5-7 business days.\n\n" +
                    "Thank you for using GoRentals."
            );
            mailSender.send(message);
            log.info("Refund notification sent to {} for refundId={}", to, refundId);
        } catch (Exception e) {
            log.error("Failed to send refund notification to {}: {}", to, e.getMessage(), e);
        }
    }

    /**
     * Notifies the owner that the payout to their account has been completed.
     *
     * @param to        owner email address
     * @param payoutId  platform payout ID
     * @param amountINR payout amount in INR
     * @param bookingId platform booking ID (for reference)
     */
    @Async
    public void sendPayoutProcessedEmail(String to, String payoutId, BigDecimal amountINR, String bookingId) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject("GoRentals - Payout Completed");
            message.setText(
                    "Your payout has been processed successfully.\n\n" +
                    "Payout ID  : " + payoutId + "\n" +
                    "Amount     : \u20b9" + amountINR + "\n" +
                    "Booking ID : " + bookingId + "\n\n" +
                    "Funds will be credited to your registered bank account within 1-2 business days.\n\n" +
                    "Thank you for listing on GoRentals."
            );
            mailSender.send(message);
            log.info("Payout notification sent to {} for payoutId={}", to, payoutId);
        } catch (Exception e) {
            log.error("Failed to send payout notification to {}: {}", to, e.getMessage(), e);
        }
    }

    /**
     * Notifies the owner that a payout attempt has failed.
     *
     * @param to          owner email address
     * @param payoutId    platform payout ID
     * @param bookingId   platform booking ID (for reference)
     * @param reason      failure reason from Razorpay
     */
    @Async
    public void sendPayoutFailedEmail(String to, String payoutId, String bookingId, String reason) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject("GoRentals - Payout Failed");
            message.setText(
                    "Unfortunately, your payout could not be completed.\n\n" +
                    "Payout ID  : " + payoutId + "\n" +
                    "Booking ID : " + bookingId + "\n" +
                    "Reason     : " + reason + "\n\n" +
                    "Our team has been notified and will retry the payout shortly. " +
                    "If this issue persists, please contact support@gorentals.com.\n\n" +
                    "We apologize for the inconvenience."
            );
            mailSender.send(message);
            log.info("Payout failure notification sent to {} for payoutId={}", to, payoutId);
        } catch (Exception e) {
            log.error("Failed to send payout failure notification to {}: {}", to, e.getMessage(), e);
        }
    }
}
