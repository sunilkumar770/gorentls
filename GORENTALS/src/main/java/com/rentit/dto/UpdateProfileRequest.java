package com.rentit.dto;

import lombok.Data;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;

@Data
public class UpdateProfileRequest {
    @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
    private String fullName;

    @Pattern(regexp = "^\\+?[1-9]\\d{1,14}$", message = "Invalid phone number format")
    private String phone;
    private String city;
    private String address;
    private String state;
    private String pincode;
    private String dateOfBirth;   // ISO date string e.g. "1995-06-15"
    private String profilePicture;
}
