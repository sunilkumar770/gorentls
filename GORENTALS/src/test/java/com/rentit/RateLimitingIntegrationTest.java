package com.rentit;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;
import org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import com.rentit.service.*;
import com.rentit.repository.*;
import javax.sql.DataSource;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ActiveProfiles("test")
@SpringBootTest
@AutoConfigureMockMvc
@EnableAutoConfiguration(exclude = {DataSourceAutoConfiguration.class, HibernateJpaAutoConfiguration.class})
public class RateLimitingIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private DataSource dataSource;

    @MockBean
    private AuthService authService;

    @MockBean
    private ListingService listingService;

    @MockBean
    private BookingService bookingService;

    @MockBean
    private BookingEscrowService bookingEscrowService;

    @MockBean
    private RazorpayIntegrationService razorpayIntegrationService;

    @MockBean
    private EmailService emailService;

    @MockBean
    private DisputeService disputeService;

    @MockBean
    private LedgerService ledgerService;

    @MockBean
    private NotificationService notificationService;

    @MockBean
    private OwnerAnalyticsService ownerAnalyticsService;

    @MockBean
    private OwnerOnboardingService ownerOnboardingService;

    @MockBean
    private UserService userService;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private AdminUserRepository adminUserRepository;

    @MockBean
    private AdminAuditLogRepository adminAuditLogRepository;

    @MockBean
    private BlockedDateRepository blockedDateRepository;

    @MockBean
    private BookingRepository bookingRepository;

    @MockBean
    private BusinessOwnerRepository businessOwnerRepository;

    @MockBean
    private ChatMessageRepository chatMessageRepository;

    @MockBean
    private ConversationRepository conversationRepository;

    @MockBean
    private DisputeRepository disputeRepository;

    @MockBean
    private LedgerTransactionRepository ledgerTransactionRepository;

    @MockBean
    private ListingRepository listingRepository;

    @MockBean
    private NotificationRepository notificationRepository;

    @MockBean
    private OwnerPayoutAccountRepository ownerPayoutAccountRepository;

    @MockBean
    private PaymentRepository paymentRepository;

    @MockBean
    private PayoutRepository payoutRepository;

    @MockBean
    private UserProfileRepository userProfileRepository;

    // ── New beans added during Favourites feature ─────────────────────────────

    @MockBean
    private FavoriteRepository favoriteRepository;

    @MockBean
    private FavoriteService favoriteService;

    @Test
    public void testAuthenticationRateLimitingReturns429() throws Exception {
        // Make 5 requests to /api/auth/login (limit is 5 per 15 min)
        for (int i = 0; i < 5; i++) {
            mockMvc.perform(post("/api/auth/login")
                .contentType("application/json")
                .content("{\"email\":\"test@example.com\",\"password\":\"password\"}")
                .header("X-Forwarded-For", "192.168.1.1"))
                .andExpect(status().isOk());
        }
        
        // 6th request should be rate limited
        mockMvc.perform(post("/api/auth/login")
            .contentType("application/json")
            .content("{\"email\":\"test@example.com\",\"password\":\"password\"}")
            .header("X-Forwarded-For", "192.168.1.1"))
            .andExpect(status().isTooManyRequests()); // 429
    }
}
