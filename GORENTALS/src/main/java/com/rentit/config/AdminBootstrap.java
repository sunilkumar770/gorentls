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

@Component
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
            System.out.println("AdminBootstrap: Creating initial user account for " + adminEmail + "...");
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
            System.out.println("AdminBootstrap: User account " + adminEmail + " already exists. Ensuring ADMIN type.");
            if (adminUser.getUserType() != User.UserType.ADMIN) {
                adminUser.setUserType(User.UserType.ADMIN);
                adminUser = userRepository.save(adminUser);
            }
        }

        if (adminUserRepository.findByUser(adminUser).isEmpty()) {
            System.out.println("AdminBootstrap: Linking user " + adminEmail + " to admin_users table...");
            AdminUser roleUser = new AdminUser();
            roleUser.setUser(adminUser);
            roleUser.setRole("SUPER_ADMIN");
            roleUser.setCreatedAt(LocalDateTime.now());
            roleUser.setUpdatedAt(LocalDateTime.now());
            adminUserRepository.save(roleUser);
            System.out.println("AdminBootstrap ✅: Successfully linked " + adminEmail + " with role SUPER_ADMIN");
        } else {
            System.out.println("AdminBootstrap: Admin record for " + adminEmail + " already exists. Skipping.");
        }
    }
}
