package com.rentit;

import com.rentit.config.RateLimitConfig;
import io.github.bucket4j.Bucket;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.ConfigDataApplicationContextInitializer;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit.jupiter.SpringExtension;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(SpringExtension.class)
@ContextConfiguration(classes = RateLimitConfig.class, initializers = ConfigDataApplicationContextInitializer.class)
@ActiveProfiles("test")
public class RateLimitingTest {

    @Autowired
    private RateLimitConfig config;

    @Test
    public void testAuthenticationRateLimit() {
        Bucket bucket = config.getBucketForIp("auth", "192.168.1.1", config::createAuthBucket);
        
        // Should allow 5 requests (based on application-test.yml)
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
