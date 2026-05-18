package com.rentit;

import com.rentit.model.User;
import com.rentit.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("dev")
public class OtpRetrieverTest {

    @Autowired
    private UserRepository userRepository;

    @Test
    public void getActiveOtp() {
        userRepository.findByEmail("admin@gorentals.com").ifPresent(user -> {
            System.out.println("==================================================");
            System.out.println("RETRIEVED ACTIVE RESET OTP FROM DATABASE: " + user.getResetToken());
            System.out.println("EXPIRY TIME: " + user.getResetTokenExpiry());
            System.out.println("==================================================");
        });
    }
}
