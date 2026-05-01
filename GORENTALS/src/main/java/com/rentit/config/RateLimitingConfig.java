package com.rentit.config;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Bucket4j;
import io.github.bucket4j.Refill;
import org.springframework.context.annotation.Configuration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Rate Limiting Configuration using Bucket4j.
 * 
 * Limits:
 * - Global API: 1000 requests per minute
 * - Authentication: 10 requests per minute per IP
 * - User Registration: 5 requests per minute per IP
 * - File Upload: 50 requests per minute per IP
 */
@Configuration
public class RateLimitingConfig {

    private static final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    /**
     * Global rate limit: 1000 requests per minute for entire API
     */
    public static Bucket getGlobalBucket() {
        return buckets.computeIfAbsent("global", k ->
            Bucket4j.builder()
                .addLimit(Bandwidth.classic(1000, Refill.intervally(1000, java.time.Duration.ofMinutes(1))))
                .build()
        );
    }

    /**
     * Authentication rate limit: 10 requests per minute per IP
     * Protects against brute-force attacks on login endpoint
     */
    public static Bucket getAuthenticationBucket(String clientIp) {
        String key = "auth:" + clientIp;
        return buckets.computeIfAbsent(key, k ->
            Bucket4j.builder()
                .addLimit(Bandwidth.classic(10, Refill.intervally(10, java.time.Duration.ofMinutes(1))))
                .build()
        );
    }

    /**
     * User registration rate limit: 5 requests per minute per IP
     * Protects against account creation spam
     */
    public static Bucket getRegistrationBucket(String clientIp) {
        String key = "register:" + clientIp;
        return buckets.computeIfAbsent(key, k ->
            Bucket4j.builder()
                .addLimit(Bandwidth.classic(5, Refill.intervally(5, java.time.Duration.ofMinutes(1))))
                .build()
        );
    }

    /**
     * File upload rate limit: 50 requests per minute per IP
     * Protects against resource exhaustion
     */
    public static Bucket getFileUploadBucket(String clientIp) {
        String key = "upload:" + clientIp;
        return buckets.computeIfAbsent(key, k ->
            Bucket4j.builder()
                .addLimit(Bandwidth.classic(50, Refill.intervally(50, java.time.Duration.ofMinutes(1))))
                .build()
        );
    }
}
