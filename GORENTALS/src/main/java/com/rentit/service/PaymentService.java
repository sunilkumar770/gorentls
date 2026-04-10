package com.rentit.service;

import com.razorpay.*;
import com.rentit.dto.PaymentInitiateRequest;
import com.rentit.dto.PaymentResponse;
import com.rentit.dto.PaymentVerificationRequest;
import com.rentit.model.Booking;
import com.rentit.model.Payment;
import com.rentit.repository.BookingRepository;
import com.rentit.repository.PaymentRepository;
import com.rentit.repository.UserRepository;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class PaymentService {

    @Value("${razorpay.key}")
    private String razorpayKey;

    @Value("${razorpay.secret}")
    private String razorpaySecret;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private UserRepository userRepository;

    private RazorpayClient razorpayClient;

    public PaymentService() throws RazorpayException {
        // Initialize will be done after properties are injected
    }

    @jakarta.annotation.PostConstruct
    public void init() throws RazorpayException {
        this.razorpayClient = new RazorpayClient(razorpayKey, razorpaySecret);
    }

    @Transactional
    public PaymentResponse initiatePayment(PaymentInitiateRequest request, String userEmail) {
        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        
        // Verify booking belongs to user
        if (!booking.getRenter().getEmail().equals(userEmail)) {
            throw new RuntimeException("Unauthorized");
        }
        
        try {
            // Create Razorpay order
            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", booking.getTotalAmount().multiply(new BigDecimal(100)).intValue());
            orderRequest.put("currency", "INR");
            orderRequest.put("receipt", "booking_" + booking.getId().toString());
            
            Order order = razorpayClient.orders.create(orderRequest);
            
            // Save payment record
            Payment payment = new Payment();
            payment.setBooking(booking);
            payment.setAmount(booking.getTotalAmount());
            payment.setPaymentType("RENTAL");
            payment.setRazorpayOrderId(order.get("id"));
            payment.setStatus("CREATED");
            payment.setCreatedAt(LocalDateTime.now());
            
            paymentRepository.save(payment);
            
            // Update booking with order ID
            booking.setRazorpayOrderId(order.get("id"));
            bookingRepository.save(booking);
            
            return PaymentResponse.builder()
                    .orderId(order.get("id"))
                    .amount(booking.getTotalAmount())
                    .currency("INR")
                    .key(razorpayKey)
                    .bookingId(booking.getId())
                    .build();
                    
        } catch (RazorpayException e) {
            throw new RuntimeException("Failed to create payment order: " + e.getMessage());
        }
    }

    @Transactional
    public void verifyPayment(PaymentVerificationRequest request) {
        try {
            // Verify payment signature
            String orderId = request.getOrderId();
            String paymentId = request.getPaymentId();
            String signature = request.getSignature();
            
            // Create verification object
            JSONObject options = new JSONObject();
            options.put("razorpay_order_id", orderId);
            options.put("razorpay_payment_id", paymentId);
            options.put("razorpay_signature", signature);
            
            boolean isValid = Utils.verifyPaymentSignature(options, razorpaySecret);
            
            if (!isValid) {
                throw new RuntimeException("Invalid payment signature");
            }
            
            // Update payment and booking status
            Payment payment = paymentRepository.findByRazorpayOrderId(orderId)
                    .orElseThrow(() -> new RuntimeException("Payment not found"));
            
            payment.setRazorpayPaymentId(paymentId);
            payment.setStatus("COMPLETED");
            payment.setUpdatedAt(LocalDateTime.now());
            paymentRepository.save(payment);
            
            Booking booking = payment.getBooking();
            booking.setPaymentStatus("COMPLETED");
            booking.setStatus(Booking.BookingStatus.CONFIRMED);
            booking.setRazorpayPaymentId(paymentId);
            booking.setUpdatedAt(LocalDateTime.now());
            bookingRepository.save(booking);
            
        } catch (Exception e) {
            throw new RuntimeException("Payment verification failed: " + e.getMessage());
        }
    }

    /**
     * Get payment by booking ID with authorization check
     */
    @Transactional(readOnly = true)
    public PaymentResponse getPaymentByBooking(UUID bookingId, String userEmail) {
        // Find the booking
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        
        // Check if user is authorized (renter or owner)
        boolean isRenter = booking.getRenter().getEmail().equals(userEmail);
        boolean isOwner = booking.getListing().getOwner().getEmail().equals(userEmail);
        
        if (!isRenter && !isOwner) {
            throw new RuntimeException("You are not authorized to view this payment");
        }
        
        // Find payment for this booking
        Payment payment = paymentRepository.findByBookingId(bookingId)
                .orElseThrow(() -> new RuntimeException("Payment not found for this booking"));
        
        // Return payment response
        return PaymentResponse.builder()
                .orderId(payment.getRazorpayOrderId())
                .amount(payment.getAmount())
                .currency("INR")
                .key(razorpayKey)
                .bookingId(booking.getId())
                .build();
    }

    /**
     * Get payment by order ID (for internal use)
     */
    @Transactional(readOnly = true)
    public PaymentResponse getPaymentByOrderId(String orderId) {
        Payment payment = paymentRepository.findByRazorpayOrderId(orderId)
                .orElseThrow(() -> new RuntimeException("Payment not found for order: " + orderId));
        
        return PaymentResponse.builder()
                .orderId(payment.getRazorpayOrderId())
                .amount(payment.getAmount())
                .currency("INR")
                .key(razorpayKey)
                .bookingId(payment.getBooking().getId())
                .build();
    }

    /**
     * Get payment status
     */
    @Transactional(readOnly = true)
    public String getPaymentStatus(UUID bookingId, String userEmail) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        
        boolean isRenter = booking.getRenter().getEmail().equals(userEmail);
        boolean isOwner = booking.getListing().getOwner().getEmail().equals(userEmail);
        
        if (!isRenter && !isOwner) {
            throw new RuntimeException("You are not authorized to view this payment status");
        }
        
        Payment payment = paymentRepository.findByBookingId(bookingId)
                .orElseThrow(() -> new RuntimeException("Payment not found"));
        
        return payment.getStatus();
    }

    /**
     * Process refund for a payment
     */
    @Transactional
    public void processRefund(UUID bookingId, String userEmail, BigDecimal amount, String reason) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        
        boolean isOwner = booking.getListing().getOwner().getEmail().equals(userEmail);
        boolean isAdmin = false; // Check if user is admin (you can add admin check logic)
        
        if (!isOwner && !isAdmin) {
            throw new RuntimeException("You are not authorized to process refund");
        }
        
        Payment payment = paymentRepository.findByBookingId(bookingId)
                .orElseThrow(() -> new RuntimeException("Payment not found"));
        
        if (!"COMPLETED".equals(payment.getStatus())) {
            throw new RuntimeException("Cannot refund payment that is not completed");
        }
        
        try {
            // Create refund request
            JSONObject refundRequest = new JSONObject();
            refundRequest.put("amount", amount.multiply(new BigDecimal(100)).intValue());
            refundRequest.put("speed", "normal");
            refundRequest.put("receipt", "refund_booking_" + bookingId);
            refundRequest.put("notes", new JSONObject().put("reason", reason));
            
            // Process refund with Razorpay
            Refund refund = razorpayClient.payments.refund(payment.getRazorpayPaymentId(), refundRequest);
            
            // Create refund payment record
            Payment refundPayment = new Payment();
            refundPayment.setBooking(booking);
            refundPayment.setAmount(amount.negate());
            refundPayment.setPaymentType("REFUND");
            refundPayment.setRazorpayOrderId(refund.get("id"));
            refundPayment.setRazorpayPaymentId(payment.getRazorpayPaymentId());
            refundPayment.setStatus("COMPLETED");
            refundPayment.setCreatedAt(LocalDateTime.now());
            
            paymentRepository.save(refundPayment);
            
            // Update original payment status
            payment.setStatus("REFUNDED");
            payment.setUpdatedAt(LocalDateTime.now());
            paymentRepository.save(payment);
            
        } catch (RazorpayException e) {
            throw new RuntimeException("Failed to process refund: " + e.getMessage());
        }
    }

    /**
     * Check if payment is completed for a booking
     */
    @Transactional(readOnly = true)
    public boolean isPaymentCompleted(UUID bookingId) {
        return paymentRepository.findByBookingId(bookingId)
                .map(payment -> "COMPLETED".equals(payment.getStatus()))
                .orElse(false);
    }

    @Transactional
    public void handleWebhook(String payload) {
        // Implement webhook handling for payment status updates
        // This would process Razorpay webhook events
        try {
            JSONObject webhookData = new JSONObject(payload);
            String event = webhookData.getString("event");
            
            if ("payment.captured".equals(event)) {
                // Handle successful payment
                JSONObject payment = webhookData.getJSONObject("payload").getJSONObject("payment").getJSONObject("entity");
                String orderId = payment.getString("order_id");
                
                Payment dbPayment = paymentRepository.findByRazorpayOrderId(orderId)
                        .orElseThrow(() -> new RuntimeException("Payment not found"));
                
                if (!"COMPLETED".equals(dbPayment.getStatus())) {
                    dbPayment.setRazorpayPaymentId(payment.getString("id"));
                    dbPayment.setStatus("COMPLETED");
                    dbPayment.setUpdatedAt(LocalDateTime.now());
                    paymentRepository.save(dbPayment);
                    
                    Booking booking = dbPayment.getBooking();
                    booking.setPaymentStatus("COMPLETED");
                    booking.setStatus(Booking.BookingStatus.CONFIRMED);
                    booking.setRazorpayPaymentId(payment.getString("id"));
                    booking.setUpdatedAt(LocalDateTime.now());
                    bookingRepository.save(booking);
                }
            } else if ("payment.failed".equals(event)) {
                // Handle failed payment
                JSONObject payment = webhookData.getJSONObject("payload").getJSONObject("payment").getJSONObject("entity");
                String orderId = payment.getString("order_id");
                
                Payment dbPayment = paymentRepository.findByRazorpayOrderId(orderId)
                        .orElseThrow(() -> new RuntimeException("Payment not found"));
                
                dbPayment.setStatus("FAILED");
                dbPayment.setUpdatedAt(LocalDateTime.now());
                paymentRepository.save(dbPayment);
                
                Booking booking = dbPayment.getBooking();
                booking.setPaymentStatus("FAILED");
                booking.setUpdatedAt(LocalDateTime.now());
                bookingRepository.save(booking);
            }
        } catch (Exception e) {
            // Log error but don't throw to prevent webhook failure
            System.err.println("Webhook processing failed: " + e.getMessage());
        }
    }
}