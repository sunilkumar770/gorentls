package com.rentit.model;

import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "business_owners")
public class BusinessOwner {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;
    
    @OneToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column(name = "business_name", nullable = false)
    private String businessName;
    
    @Column(name = "business_type")
    private String businessType;
    
    @Column(name = "business_address")
    private String businessAddress;
    
    @Column(name = "business_city")
    private String businessCity;
    
    @Column(name = "business_state")
    private String businessState;
    
    @Column(name = "business_pincode")
    private String businessPincode;
    
    @Column(name = "business_phone")
    private String businessPhone;
    
    @Column(name = "business_email")
    private String businessEmail;
    
    @Column(name = "gst_number")
    private String gstNumber;
    
    @Column(name = "pan_number")
    private String panNumber;
    
    @Column(name = "registration_number")
    private String registrationNumber;
    
    @Builder.Default
    @Column(name = "is_verified")
    private Boolean isVerified = false;
    
    @Builder.Default
    @Column(name = "commission_rate")
    private BigDecimal commissionRate = new BigDecimal("10.00");
    
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
