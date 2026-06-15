package com.ftn.sr192024.messenger.controllers;

import com.ftn.sr192024.messenger.models.User;
import com.ftn.sr192024.messenger.models.dto.LoginRequest;
import com.ftn.sr192024.messenger.models.dto.LoginResponse;
import com.ftn.sr192024.messenger.models.dto.RegisterDto;
import com.ftn.sr192024.messenger.security.CustomUserDetails;
import com.ftn.sr192024.messenger.security.JWTService;
import com.ftn.sr192024.messenger.services.AuthService;
import com.ftn.sr192024.messenger.services.UserService;
import lombok.AllArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@CrossOrigin(origins = "http://localhost:4200")
@RequestMapping("/auth")
@AllArgsConstructor
public class LoginController{

    private AuthenticationManager authenticationManager;

    private JWTService jwtService;

    private AuthService authService;

    private UserService userService;

    @PostMapping("/register")
    public ResponseEntity<?> register(
            @RequestPart("user")RegisterDto registerDto,
            @RequestPart(value = "image", required = false)MultipartFile image) throws IOException {
        authService.register(registerDto, image);

        return ResponseEntity.ok().build();
    }

    @PostMapping("/login")
    public LoginResponse login(@ModelAttribute LoginRequest loginRequest) {
        System.out.println(loginRequest.getUsername() + " " + loginRequest.getPassword());
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getUsername(),
                        loginRequest.getPassword()
                )
        );

        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        assert userDetails != null;
        String token = jwtService.generateToken(userDetails);

        LoginResponse response = new LoginResponse();
        response.setToken(token);
        System.out.println(userService.findById(userDetails.getId()).getImage() != null);
        response.setUser(userDetails.getUser());
        response.setMessage("Login successful");

        return response;
    }
}
