package com.rentit.config;

import com.rentit.model.AdminUser;
import com.rentit.model.User;
import com.rentit.repository.AdminUserRepository;
import com.rentit.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Bootstraps the admin user on first startup.
 * Admin credentials are sourced from environment variables:
 *   APP_ADMIN_EMAIL      – required
 *   APP_ADMIN_PASSWORD  – required, minimum 16 characters
 * Never hardcode these values.
 */
@Component
public class AdminBootstrap implements CommandLineRunner {

    private static final int MIN_ADMIN_PASSWORD_LENGTH = 16;

    @Value("${app.admin.email}")
    private String adminEmail;

    @Value("${app.admin.password}")
    private String adminPassword;

    @Value("${app.admin.name:GoRentals Admin}")
    private String adminName;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AdminUserRepository adminUserRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        // ── Fail-fast validations ──
        if (adminEmail == null || adminEmail.isBlank()) {
            throw new IllegalStateException(
                "[AdminBootstrap] FATAL: APP_ADMIN_EMAIL is not set. " +
                "Set this environment variable before starting the application.");
        }
        if (adminPassword == null || adminPassword.isBlank()) {
            throw new IllegalStateException(
                "[AdminBootstrap] FATAL: APP_ADMIN_PASSWORD is not set. " +
                "Set this environment variable before starting the application.");
        }
        if (adminPassword.length() < MIN_ADMIN_PASSWORD_LENGTH) {
            throw new IllegalStateException(
                "[AdminBootstrap] FATAL: APP_ADMIN_PASSWORD must be at least " +
                MIN_ADMIN_PASSWORD_LENGTH + " characters long. " +
                "Use a strong, randomly generated password.");
        }

        // ── Bootstrap or update admin user ──
        User user = userRepository.findByEmail(adminEmail).orElse(null);
        if (user == null) {
            user = new User();
            user.setEmail(adminEmail);
            user.setFullName(adminName);
            user.setUserType(User.UserType.ADMIN);
            user.setIsActive(true);
        }
        user.setPasswordHash(passwordEncoder.encode(adminPassword));
        userRepository.save(user);

        AdminUser adminUser = adminUserRepository.findByUser(user).orElse(null);
        if (adminUser == null) {
            adminUser = new AdminUser();
            adminUser.setUser(user);
            adminUser.setRole("SUPER_ADMIN");
            adminUser.setPermissions(Map.of("all", true));
        }
        adminUserRepository.save(adminUser);
    }
}
