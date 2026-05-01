package com.rentit;

import com.rentit.config.RateLimitingConfig;
import io.github.bucket4j.Bucket;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class RateLimitingTest {

    @Test
    public void testAuthenticationRateLimit() {
        Bucket bucket = RateLimitingConfig.getAuthenticationBucket("192.168.1.1");
        
        // Should allow 10 requests
        for (int i = 0; i < 10; i++) {
            assertTrue(bucket.tryConsume(1), "Request " + (i + 1) + " should be allowed");
        }
        
        // 11th request should fail
        assertFalse(bucket.tryConsume(1), "11th request should be rate limited");
    }

    @Test
    public void testRegistrationRateLimit() {
        Bucket bucket = RateLimitingConfig.getRegistrationBucket("192.168.1.2");
        
        // Should allow 5 requests
        for (int i = 0; i < 5; i++) {
            assertTrue(bucket.tryConsume(1), "Request " + (i + 1) + " should be allowed");
        }
        
        // 6th request should fail
        assertFalse(bucket.tryConsume(1), "6th request should be rate limited");
    }

    @Test
    public void testGlobalRateLimit() {
        Bucket bucket = RateLimitingConfig.getGlobalBucket();
        
        // Should allow 1000 requests
        for (int i = 0; i < 100; i++) { // Test subset
            assertTrue(bucket.tryConsume(1), "Request " + (i + 1) + " should be allowed");
        }
    }
}
