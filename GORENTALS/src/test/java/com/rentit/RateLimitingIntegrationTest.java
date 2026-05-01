package com.rentit;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTes(classes = GoRentals.class)
    @AutoConfigureMockMvc
public class RateLimitingIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    public void testAuthenticationRateLimitingReturns429() throws Exception {
        // Make 10 requests to /api/auth/login (limit is 10)
        for (int i = 0; i < 10; i++) {
            mockMvc.perform(post("/api/auth/login")
                .contentType("application/json")
                .content("{\"email\":\"test@example.com\",\"password\":\"password\"}")
                .header("X-Forwarded-For", "192.168.1.1"));
        }
        
        // 11th request should be rate limited
        mockMvc.perform(post("/api/auth/login")
            .contentType("application/json")
            .content("{\"email\":\"test@example.com\",\"password\":\"password\"}")
            .header("X-Forwarded-For", "192.168.1.1"))
            .andExpect(status().isTooManyRequests()); // 429
    }
}
