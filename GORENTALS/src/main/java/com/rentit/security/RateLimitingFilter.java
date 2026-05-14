package com.rentit.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Map;

/**
 * C-3 / M-1 Fix: Rate Limiting Filter
 *
 * Improvements over the previous version:
 * 1. Extracts real client IP from X-Forwarded-For header (proxy-aware)
 * 2. Expanded coverage beyond /api/auth/ to payments, webhooks, and registration
 * 3. Different per-endpoint limits defined as constants
 * 4. Proper logging for rate limit violations
 *
 * NOTE: For multi-instance deployments, replace ConcurrentHashMap buckets
 * with a Redis-backed ProxyManager (bucket4j-redis) once bucket4j-redis
 * dependency is confirmed available on the target platform.
 * The interface contract here is identical — only the bucket store changes.
 */
@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(RateLimitingFilter.class);

    // Per-IP, per-path-prefix rate limit buckets
    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    @Value("${rate-limiting.enabled:true}")
    private boolean rateLimitingEnabled;

    // ── Endpoint-specific limits ────────────────────────────────────────────
    /** Auth endpoints: 5 requests per 1 minute (login, register) */
    private Bucket createAuthBucket() {
        return Bucket.builder()
            .addLimit(Bandwidth.builder()
                .capacity(5)
                .refillGreedy(5, Duration.ofMinutes(1))
                .build())
            .build();
    }

    /** Payment endpoints: 10 requests per 1 minute */
    private Bucket createPaymentBucket() {
        return Bucket.builder()
            .addLimit(Bandwidth.builder()
                .capacity(10)
                .refillGreedy(10, Duration.ofMinutes(1))
                .build())
            .build();
    }

    /** Webhook endpoints: 30 requests per 1 minute (Razorpay can burst) */
    private Bucket createWebhookBucket() {
        return Bucket.builder()
            .addLimit(Bandwidth.builder()
                .capacity(30)
                .refillGreedy(30, Duration.ofMinutes(1))
                .build())
            .build();
    }

    // ── IP Extraction (M-1 Fix) ─────────────────────────────────────────────
    /**
     * Extract the real client IP, respecting X-Forwarded-For from reverse proxies
     * (Render, AWS ALB, Cloudflare etc.).
     * Always takes the FIRST IP in the chain (closest to the client).
     */
    private String extractClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            // X-Forwarded-For: client, proxy1, proxy2
            return xff.split(",")[0].trim();
        }
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }
        return request.getRemoteAddr();
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        if (!rateLimitingEnabled) {
            filterChain.doFilter(request, response);
            return;
        }

        String path = request.getRequestURI();
        String clientIp = extractClientIp(request);

        // ── Auth endpoints: login, register (strictest limit)
        if (path.startsWith("/api/auth/")) {
            String bucketKey = "auth:" + clientIp;
            Bucket bucket = buckets.computeIfAbsent(bucketKey, k -> createAuthBucket());
            if (!bucket.tryConsume(1)) {
                log.warn("[RateLimit] AUTH limit exceeded for IP={} path={}", clientIp, path);
                sendRateLimitResponse(response);
                return;
            }
        }
        // ── Payment endpoints
        else if (path.startsWith("/api/payments/")) {
            String bucketKey = "payments:" + clientIp;
            Bucket bucket = buckets.computeIfAbsent(bucketKey, k -> createPaymentBucket());
            if (!bucket.tryConsume(1)) {
                log.warn("[RateLimit] PAYMENT limit exceeded for IP={} path={}", clientIp, path);
                sendRateLimitResponse(response);
                return;
            }
        }
        // ── Webhook endpoints
        else if (path.startsWith("/api/webhooks/") || path.equals("/api/payments/legacy/webhook")) {
            String bucketKey = "webhooks:" + clientIp;
            Bucket bucket = buckets.computeIfAbsent(bucketKey, k -> createWebhookBucket());
            if (!bucket.tryConsume(1)) {
                log.warn("[RateLimit] WEBHOOK limit exceeded for IP={} path={}", clientIp, path);
                sendRateLimitResponse(response);
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private void sendRateLimitResponse(HttpServletResponse response) throws IOException {
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType("application/json");
        response.getWriter().write("{\"error\":\"Too many requests. Please try again later.\",\"status\":429}");
    }
}
