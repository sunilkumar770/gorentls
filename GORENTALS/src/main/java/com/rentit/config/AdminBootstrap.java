package com.rentit.config;

import com.rentit.model.AdminUser;
import com.rentit.model.User;
import com.rentit.repository.AdminUserRepository;
import com.rentit.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Component
@Order(1)
public class AdminBootstrap implements CommandLineRunner {

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
    public void run(String... args) throws Exception {
        User adminUser = userRepository.findByEmail(adminEmail).orElse(null);

        if (adminUser == null) {
            log.info("AdminBootstrap: Creating initial user account for {}...", adminEmail);
            adminUser = new User();
            adminUser.setEmail(adminEmail);
            adminUser.setPasswordHash(passwordEncoder.encode(adminPassword));
            adminUser.setFullName(adminName);
            adminUser.setUserType(User.UserType.ADMIN);
            adminUser.setIsActive(true);
            adminUser.setCreatedAt(LocalDateTime.now());
            adminUser.setUpdatedAt(LocalDateTime.now());
            adminUser = userRepository.save(adminUser);
        } else {
            log.info("AdminBootstrap: User account {} already exists. Ensuring ADMIN type.", adminEmail);
            if (adminUser.getUserType() != User.UserType.ADMIN) {
                adminUser.setUserType(User.UserType.ADMIN);
                adminUser = userRepository.save(adminUser);
            }
        }

        if (adminUserRepository.findByUser(adminUser).isEmpty()) {
            log.info("AdminBootstrap: Linking user {} to admin_users table...", adminEmail);
            AdminUser roleUser = new AdminUser();
            roleUser.setUser(adminUser);
            roleUser.setRole("SUPER_ADMIN");
            roleUser.setCreatedAt(LocalDateTime.now());
            roleUser.setUpdatedAt(LocalDateTime.now());
            adminUserRepository.save(roleUser);
            log.info("AdminBootstrap ✅: Successfully linked {} with role SUPER_ADMIN", adminEmail);
        } else {
            log.info("AdminBootstrap: Admin record for {} already exists. Skipping.", adminEmail);
        }
    }
}
