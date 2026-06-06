package com.ftn.sr192024.messenger.controllers;

import com.ftn.sr192024.messenger.models.dto.RegisterDto;
import com.ftn.sr192024.messenger.services.AuthService;
import lombok.AllArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@CrossOrigin(origins = "http://localhost:4200")
@RequestMapping("/api/auth")
@AllArgsConstructor
public class LoginController{

    private AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<?> register(
            @RequestPart("user")RegisterDto registerDto,
            @RequestPart(value = "image", required = false)MultipartFile image) throws IOException {
        authService.register(registerDto, image);

        return ResponseEntity.ok().build();
    }
}
