package com.rentit.config;

import com.rentit.model.AdminUser;
import com.rentit.model.User;
import com.rentit.model.UserProfile;
import com.rentit.repository.AdminUserRepository;
import com.rentit.repository.UserProfileRepository;
import com.rentit.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository        userRepository;
    private final UserProfileRepository userProfileRepository;
    private final AdminUserRepository   adminUserRepository;
    private final PasswordEncoder       passwordEncoder;

    @Value("${app.admin.email:admin@gorentals.com}")
    private String adminEmail;

    @Value("${app.admin.password:Admin@GoRentals2025!}")
    private String adminPassword;

    @Value("${app.admin.name:GoRentals Admin}")
    private String adminName;

    public DataInitializer(
            UserRepository userRepository,
            UserProfileRepository userProfileRepository,
            AdminUserRepository adminUserRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository        = userRepository;
        this.userProfileRepository = userProfileRepository;
        this.adminUserRepository   = adminUserRepository;
        this.passwordEncoder       = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        seedAdmin();
    }

    private void seedAdmin() {
        userRepository.findByEmail(adminEmail).ifPresentOrElse(
            existingUser -> promoteExistingUserIfNeeded(existingUser),
            () -> createFreshAdmin()
        );
    }

    /**
     * Case 1 — User already exists (e.g. registered via signup as RENTER).
     * Promote them to ADMIN and create admin_users row if missing.
     */
    private void promoteExistingUserIfNeeded(User user) {
        boolean alreadyAdmin = adminUserRepository.findByUser(user).isPresent();

        if (alreadyAdmin && user.getUserType() == User.UserType.ADMIN) {
            log.info("✅ Admin user already configured correctly: {}", adminEmail);
            return;
        }

        // Fix user_type if wrong
        if (user.getUserType() != User.UserType.ADMIN) {
            user.setUserType(User.UserType.ADMIN);
            userRepository.save(user);
            log.info("🔧 Promoted {} from {} to ADMIN", adminEmail, user.getUserType());
        }

        // Create admin_users row if missing
        if (!alreadyAdmin) {
            AdminUser adminUser = new AdminUser();
            adminUser.setUser(user);
            adminUser.setRole("SUPER_ADMIN");
            adminUserRepository.save(adminUser);
            log.info("🔧 Created admin_users row for {}", adminEmail);
        }

        log.info("✅ Admin account configured: {}", adminEmail);
    }

    /**
     * Case 2 — Clean install, no admin user exists yet.
     */
    private void createFreshAdmin() {
        log.info("🌱 Seeding fresh admin: {}", adminEmail);

        User admin = new User();
        admin.setEmail(adminEmail);
        admin.setPasswordHash(passwordEncoder.encode(adminPassword));
        admin.setFullName(adminName);
        admin.setPhone("0000000000");
        admin.setUserType(User.UserType.ADMIN);
        admin.setIsActive(true);
        User saved = userRepository.save(admin);

        UserProfile profile = new UserProfile();
        profile.setUser(saved);
        userProfileRepository.save(profile);

        AdminUser adminUser = new AdminUser();
        adminUser.setUser(saved);
        adminUser.setRole("SUPER_ADMIN");
        adminUserRepository.save(adminUser);

        log.info("✅ Admin created successfully with SUPER_ADMIN role");
    }
}
