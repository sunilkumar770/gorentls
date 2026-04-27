package com.rentit.config;

import com.rentit.model.Listing;
import com.rentit.model.User;
import com.rentit.repository.ListingRepository;
import com.rentit.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;

@Slf4j
@Component
@Order(2)
public class InventorySeeder implements CommandLineRunner {

    @Autowired
    private ListingRepository listingRepository;

    @Autowired
    private UserRepository userRepository;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        if (listingRepository.count() > 0) {
            log.info("InventorySeeder: Listings already exist. Skipping seed.");
            return;
        }

        log.info("InventorySeeder: Empty marketplace detected. Seeding inventory...");

        // Ensure we have an admin user to attach these listings to
        User owner = userRepository.findByEmail("admin@gorentals.com").orElse(null);
        if (owner == null) {
            log.warn("InventorySeeder: Admin user not found. Cannot seed listings.");
            return;
        }

        // Listing 1: Camera
        Listing l1 = new Listing();
        l1.setOwner(owner);
        l1.setTitle("Sony A7IV Mirrorless Camera");
        l1.setDescription("Pristine condition Sony A7IV. Includes 1 battery, charger, and 64GB SD card. Perfect for weddings and events.");
        l1.setCategory("cameras");
        l1.setType("cameras");
        l1.setPricePerDay(new BigDecimal("2500"));
        l1.setSecurityDeposit(new BigDecimal("15000"));
        l1.setLocation("Hi-Tech City, Hyderabad");
        l1.setCity("Hyderabad");
        l1.setState("Telangana");
        l1.setImages(Arrays.asList("https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80"));
        l1.setIsAvailable(true);
        l1.setIsPublished(true);
        l1.setCreatedAt(LocalDateTime.now());
        l1.setUpdatedAt(LocalDateTime.now());

        // Listing 2: Drone
        Listing l2 = new Listing();
        l2.setOwner(owner);
        l2.setTitle("DJI Mavic 3 Pro");
        l2.setDescription("DJI Mavic 3 Pro with Fly More Combo. Requires valid drone license for operational use. Please handle with care.");
        l2.setCategory("drones");
        l2.setType("drones");
        l2.setPricePerDay(new BigDecimal("4000"));
        l2.setSecurityDeposit(new BigDecimal("25000"));
        l2.setLocation("Jubilee Hills, Hyderabad");
        l2.setCity("Hyderabad");
        l2.setState("Telangana");
        l2.setImages(Arrays.asList("https://images.unsplash.com/photo-1579829366248-204fe8413f31?auto=format&fit=crop&q=80"));
        l2.setIsAvailable(true);
        l2.setIsPublished(true);
        l2.setCreatedAt(LocalDateTime.now());
        l2.setUpdatedAt(LocalDateTime.now());

        // Listing 3: Laptop
        Listing l3 = new Listing();
        l3.setOwner(owner);
        l3.setTitle("MacBook Pro M3 Max (64GB RAM)");
        l3.setDescription("Top spec M3 Max for heavy rendering and video editing. Strictly no eating/drinking near the machine.");
        l3.setCategory("laptops");
        l3.setType("laptops");
        l3.setPricePerDay(new BigDecimal("3500"));
        l3.setSecurityDeposit(new BigDecimal("50000"));
        l3.setLocation("Madhapur, Hyderabad");
        l3.setCity("Hyderabad");
        l3.setState("Telangana");
        l3.setImages(Arrays.asList("https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80"));
        l3.setIsAvailable(true);
        l3.setIsPublished(true);
        l3.setCreatedAt(LocalDateTime.now());
        l3.setUpdatedAt(LocalDateTime.now());

        // Listing 4: Audio
        Listing l4 = new Listing();
        l4.setOwner(owner);
        l4.setTitle("Rode Wireless GO II Microphone System");
        l4.setDescription("Dual-channel wireless microphone system perfect for interviews and vlogging.");
        l4.setCategory("audio");
        l4.setType("audio");
        l4.setPricePerDay(new BigDecimal("800"));
        l4.setSecurityDeposit(new BigDecimal("5000"));
        l4.setLocation("Banjara Hills, Hyderabad");
        l4.setCity("Hyderabad");
        l4.setState("Telangana");
        l4.setImages(Arrays.asList("https://images.unsplash.com/photo-1598555301826-b8e731ea2806?auto=format&fit=crop&q=80"));
        l4.setIsAvailable(true);
        l4.setIsPublished(true);
        l4.setCreatedAt(LocalDateTime.now());
        l4.setUpdatedAt(LocalDateTime.now());

        // Listing 5: Tools
        Listing l5 = new Listing();
        l5.setOwner(owner);
        l5.setTitle("Bosch Professional Cordless Drill");
        l5.setDescription("High-torque 18V cordless drill with 2 batteries. Perfect for home improvement projects.");
        l5.setCategory("tools");
        l5.setType("tools");
        l5.setPricePerDay(new BigDecimal("500"));
        l5.setSecurityDeposit(new BigDecimal("2000"));
        l5.setLocation("Kukatpally, Hyderabad");
        l5.setCity("Hyderabad");
        l5.setState("Telangana");
        l5.setImages(Arrays.asList("https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&q=80"));
        l5.setIsAvailable(true);
        l5.setIsPublished(true);
        l5.setCreatedAt(LocalDateTime.now());
        l5.setUpdatedAt(LocalDateTime.now());

        // Listing 6: Camping
        Listing l6 = new Listing();
        l6.setOwner(owner);
        l6.setTitle("Quechua 4-Person Waterproof Tent");
        l6.setDescription("Spacious and easy-to-pitch tent for weekend getaways. Includes ground sheet and pegs.");
        l6.setCategory("camping");
        l6.setType("camping");
        l6.setPricePerDay(new BigDecimal("1200"));
        l6.setSecurityDeposit(new BigDecimal("4000"));
        l6.setLocation("Gachibowli, Hyderabad");
        l6.setCity("Hyderabad");
        l6.setState("Telangana");
        l6.setImages(Arrays.asList("https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&q=80"));
        l6.setIsAvailable(true);
        l6.setIsPublished(true);
        l6.setCreatedAt(LocalDateTime.now());
        l6.setUpdatedAt(LocalDateTime.now());

        // Listing 7: Gaming
        Listing l7 = new Listing();
        l7.setOwner(owner);
        l7.setTitle("PlayStation 5 Console (Disc Edition)");
        l7.setDescription("PS5 with 2 DualSense controllers and 3 popular games (Spider-Man, God of War, FIFA).");
        l7.setCategory("gaming");
        l7.setType("gaming");
        l7.setPricePerDay(new BigDecimal("1500"));
        l7.setSecurityDeposit(new BigDecimal("10000"));
        l7.setLocation("Secunderabad, Hyderabad");
        l7.setCity("Hyderabad");
        l7.setState("Telangana");
        l7.setImages(Arrays.asList("https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&q=80"));
        l7.setIsAvailable(true);
        l7.setIsPublished(true);
        l7.setCreatedAt(LocalDateTime.now());
        l7.setUpdatedAt(LocalDateTime.now());

        listingRepository.saveAll(Arrays.asList(l1, l2, l3, l4, l5, l6, l7));
        log.info("InventorySeeder ✅: Seeded 7 premium listings into the marketplace.");
    }
}
