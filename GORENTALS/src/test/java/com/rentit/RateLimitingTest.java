package com.rentit;

import com.rentit.config.RateLimitConfig;
import io.github.bucket4j.Bucket;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class RateLimitingTest {

    private final RateLimitConfig config = new RateLimitConfig();

    @Test
    public void testAuthenticationRateLimit() {
        Bucket bucket = config.getBucketForIp("auth", "192.168.1.1", config::createAuthBucket);
        
        // Should allow 5 requests (new limit)
        for (int i = 0; i < 5; i++) {
            assertTrue(bucket.tryConsume(1), "Request " + (i + 1) + " should be allowed");
        }
        
        // 6th request should fail
        assertFalse(bucket.tryConsume(1), "6th request should be rate limited");
    }

    @Test
    public void testRegistrationRateLimit() {
        Bucket bucket = config.getBucketForIp("register", "192.168.1.2", config::createRegistrationBucket);
        
        // Should allow 5 requests
        for (int i = 0; i < 5; i++) {
            assertTrue(bucket.tryConsume(1), "Request " + (i + 1) + " should be allowed");
        }
        
        // 6th request should fail
        assertFalse(bucket.tryConsume(1), "6th request should be rate limited");
    }

    @Test
    public void testGlobalRateLimit() {
        Bucket bucket = config.getGlobalBucket();
        
        // Should allow 1000 requests
        for (int i = 0; i < 100; i++) { // Test subset
            assertTrue(bucket.tryConsume(1), "Request " + (i + 1) + " should be allowed");
        }
    }
}
