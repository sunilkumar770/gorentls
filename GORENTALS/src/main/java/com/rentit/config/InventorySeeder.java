package com.rentit.config;

import com.rentit.model.Listing;
import com.rentit.model.User;
import com.rentit.repository.ListingRepository;
import com.rentit.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;

@Component
@Profile("dev")
public class InventorySeeder implements CommandLineRunner {

    @Autowired
    private ListingRepository listingRepository;

    @Autowired
    private UserRepository userRepository;

    @Value("${app.admin.email}")
    private String adminEmail;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        // Ensure we have an admin user to attach these listings to
        User owner = userRepository.findByEmail(adminEmail).orElse(null);
        if (owner == null) {
            System.err.println("[InventorySeeder] Admin user not found: " + adminEmail);
            return;
        }

        seedListing(owner, "Sony A7IV Mirrorless Camera", "cameras", "cameras", "2500", "15000", "Hi-Tech City, Hyderabad", "Hyderabad", "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80");
        seedListing(owner, "DJI Mavic 3 Pro", "drones", "drones", "4000", "25000", "Jubilee Hills, Hyderabad", "Hyderabad", "https://images.unsplash.com/photo-1579829366248-204fe8413f31?auto=format&fit=crop&q=80");
        seedListing(owner, "MacBook Pro M3 Max (64GB RAM)", "laptops", "laptops", "3500", "50000", "Madhapur, Hyderabad", "Hyderabad", "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80");
        seedListing(owner, "Rode Wireless GO II Microphone System", "audio", "audio", "800", "5000", "Banjara Hills, Hyderabad", "Hyderabad", "https://images.unsplash.com/photo-1598555301826-b8e731ea2806?auto=format&fit=crop&q=80");
        seedListing(owner, "Bosch Professional Cordless Drill", "tools", "tools", "500", "2000", "Kukatpally, Hyderabad", "Hyderabad", "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&q=80");
        seedListing(owner, "Quechua 4-Person Waterproof Tent", "camping", "camping", "1200", "4000", "Gachibowli, Hyderabad", "Hyderabad", "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&q=80");
        seedListing(owner, "PlayStation 5 Console (Disc Edition)", "gaming", "gaming", "1500", "10000", "Secunderabad, Hyderabad", "Hyderabad", "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&q=80");
    }

    private void seedListing(User owner, String title, String category, String type, String price, String deposit, String location, String city, String imageUrl) {
        if (listingRepository.existsByTitle(title)) {
            return;
        }

        Listing l = new Listing();
        l.setOwner(owner);
        l.setTitle(title);
        l.setDescription("Professional grade " + title + " available for rent. Well maintained and reliable.");
        l.setCategory(category);
        l.setType(type);
        l.setPricePerDay(new BigDecimal(price));
        l.setSecurityDeposit(new BigDecimal(deposit));
        l.setLocation(location);
        l.setCity(city);
        l.setState("Telangana");
        l.setImages(Arrays.asList(imageUrl));
        l.setIsAvailable(true);
        l.setIsPublished(true);
        l.setCreatedAt(LocalDateTime.now());
        l.setUpdatedAt(LocalDateTime.now());
        listingRepository.save(l);
    }
}
