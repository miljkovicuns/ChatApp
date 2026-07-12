package com.ftn.sr192024.messenger.models.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProfileUpdateRequest {
    String username;
    String email;
    String firstName;
    String lastName;
    String phoneNumber;
    String image;
    String bio;
}
