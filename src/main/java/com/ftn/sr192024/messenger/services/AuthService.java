package com.ftn.sr192024.messenger.services;

import com.ftn.sr192024.messenger.models.User;
import com.ftn.sr192024.messenger.models.dto.RegisterDto;
import com.ftn.sr192024.messenger.repository.UserRepository;
import lombok.AllArgsConstructor;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@AllArgsConstructor
@Service
public class AuthService {
    private UserRepository userRepository;
    private PasswordEncoder passwordEncoder;

    public void  register(RegisterDto registerDto, MultipartFile image) throws IOException {
        User user = new User();

        user.setFirstName(registerDto.getFirstName());
        user.setLastName(registerDto.getLastName());
        user.setUsername(registerDto.getUsername());
        user.setPhoneNumber(registerDto.getPhoneNumber());
        user.setEmail(registerDto.getEmail());

        user.setPasswordHash(passwordEncoder.encode(registerDto.getPassword()));

        if(image != null && !image.isEmpty()){
            user.setImage(image.getBytes());
        }

        userRepository.save(user);
    }
}
