package com.ftn.sr192024.messenger.controllers;

import com.ftn.sr192024.messenger.models.dto.RegisterDto;
import com.ftn.sr192024.messenger.services.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Controller
@RequestMapping("/api/auth")
public class LoginController{

    private AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<?> register(
            @RequestPart("user")RegisterDto registerDto,
            @RequestPart("image")MultipartFile image) throws IOException {
        authService.register(registerDto, image);

        return ResponseEntity.ok().build();
    }
}
