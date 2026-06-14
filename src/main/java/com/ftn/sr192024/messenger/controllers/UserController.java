package com.ftn.sr192024.messenger.controllers;

import com.ftn.sr192024.messenger.models.User;
import com.ftn.sr192024.messenger.security.CustomUserDetails;
import com.ftn.sr192024.messenger.security.SecurityUtils;
import com.ftn.sr192024.messenger.services.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RequiredArgsConstructor
@RestController
@RequestMapping("/users")
public class UserController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<?> getAll(){
        List<User> users = userService.findAll();
        return ResponseEntity.ok(users);
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Authentication authentication){
        User user = SecurityUtils.getCurrentUser();

        return ResponseEntity.ok(user);
    }
}
