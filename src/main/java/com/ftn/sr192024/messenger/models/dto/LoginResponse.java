package com.ftn.sr192024.messenger.models.dto;

import com.ftn.sr192024.messenger.models.User;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
public class LoginResponse {
    User user;
    String token;
    String message;
}
