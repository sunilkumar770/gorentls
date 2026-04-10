package com.rentit.dto;

import lombok.Data;

@Data
public class UpdateProfileRequest {
    private String fullName;
    private String phone;
    private String city;
    private String address;
    private String state;
    private String pincode;
    private String dateOfBirth;   // ISO date string e.g. "1995-06-15"
    private String profilePicture;
}
