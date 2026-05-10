package com.rentit.config;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Configuration
public class RateLimitConfig {

    @Value("${rate-limiting.auth.requests:5}")
    private int authRequests;

    @Value("${rate-limiting.auth.duration-minutes:15}")
    private int authDurationMinutes;

    @Value("${rate-limiting.registration.requests:5}")
    private int registrationRequests;

    @Value("${rate-limiting.upload.requests:50}")
    private int uploadRequests;

    @Value("${rate-limiting.global.requests:1000}")
    private int globalRequests;

    /**
     * Per-IP buckets for payment endpoints.
     *   - 5 requests per minute for /api/payments/order
     *   - 10 requests per minute for /api/payments/confirm
     */
    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    @Bean
    public Map<String, Bucket> paymentRateLimitBuckets() {
        return buckets;
    }

    public Bucket createAuthBucket() {
        return Bucket.builder()
            .addLimit(Bandwidth.builder()
                .capacity(authRequests)
                .refillIntervally(authRequests, Duration.ofMinutes(authDurationMinutes))
                .build())
            .build();
    }

    public Bucket createRegistrationBucket() {
        return Bucket.builder()
            .addLimit(Bandwidth.builder()
                .capacity(registrationRequests)
                .refillIntervally(registrationRequests, Duration.ofMinutes(1))
                .build())
            .build();
    }

    public Bucket createUploadBucket() {
        return Bucket.builder()
            .addLimit(Bandwidth.builder()
                .capacity(uploadRequests)
                .refillIntervally(uploadRequests, Duration.ofMinutes(1))
                .build())
            .build();
    }

    public Bucket getGlobalBucket() {
        return buckets.computeIfAbsent("global", k ->
            Bucket.builder()
                .addLimit(Bandwidth.builder()
                    .capacity(globalRequests)
                    .refillIntervally(globalRequests, Duration.ofMinutes(1))
                    .build())
                .build()
        );
    }

    public Bucket getBucketForIp(String prefix, String ip, java.util.function.Supplier<Bucket> bucketSupplier) {
        return buckets.computeIfAbsent(prefix + ":" + ip, k -> bucketSupplier.get());
    }

    public Bucket createOrderBucket() {
        return Bucket.builder()
            .addLimit(Bandwidth.builder()
                .capacity(5)
                .refillIntervally(5, Duration.ofMinutes(1))
                .build())
            .build();
    }

    public Bucket confirmPaymentBucket() {
        return Bucket.builder()
            .addLimit(Bandwidth.builder()
                .capacity(10)
                .refillIntervally(10, Duration.ofMinutes(1))
                .build())
            .build();
    }

    public Bucket createWebhookBucket() {
        return Bucket.builder()
            .addLimit(Bandwidth.builder()
                .capacity(100)
                .refillIntervally(100, Duration.ofMinutes(1))
                .build())
            .build();
    }
}
