package com.rentit.dto;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;

@Data
public class UpdateProfileRequest {
    @NotBlank(message = "Full name cannot be blank")
    private String fullName;
    
    @NotBlank(message = "Phone number cannot be blank")
    private String phone;
    
    private String city;
    private String address;
    private String state;
    private String pincode;
    private String dateOfBirth;   // ISO date string e.g. "1995-06-15"
    private String profilePicture;
}
