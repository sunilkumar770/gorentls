package com.rentit.model;

import lombok.*;
import jakarta.persistence.*;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "user_settings")
public class UserSettings {

    @Id
    private UUID userId;

    @OneToOne
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;

    @Builder.Default
    @Column(name = "email_notifications")
    private Boolean emailNotifications = true;

    @Builder.Default
    @Column(name = "sms_notifications")
    private Boolean smsNotifications = false;

    @Builder.Default
    @Column(name = "marketing_emails")
    private Boolean marketingEmails = false;

    @Builder.Default
    @Column(name = "dark_mode")
    private Boolean darkMode = false;

    @Builder.Default
    private String currency = "INR";

    @Builder.Default
    @Column(name = "auto_approve_bookings")
    private Boolean autoApproveBookings = false;
}
