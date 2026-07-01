package com.ftn.sr192024.messenger.services;

import com.ftn.sr192024.messenger.models.RegistrationRequest;
import com.ftn.sr192024.messenger.models.RegistrationStatus;
import com.ftn.sr192024.messenger.models.User;
import com.ftn.sr192024.messenger.models.dto.RegisterDto;
import com.ftn.sr192024.messenger.repository.LocalImageRepo;
import com.ftn.sr192024.messenger.repository.RegisterRequestRepository;
import com.ftn.sr192024.messenger.repository.UserRepository;
import lombok.AllArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@AllArgsConstructor
@Service
public class AuthService {
    private UserRepository userRepository;
    private PasswordEncoder passwordEncoder;
    private LocalImageRepo localImageRepo;
    private RegisterRequestRepository requestRepository;

    public void  register(RegisterDto registerDto, MultipartFile image) throws IOException {
        User user = new User();

        user.setFirstName(registerDto.getFirstName());
        user.setLastName(registerDto.getLastName());
        user.setUsername(registerDto.getUsername());
        user.setPhoneNumber(registerDto.getPhoneNumber());
        user.setEmail(registerDto.getEmail());
        user.setRegistered(false);

        user.setPasswordHash(passwordEncoder.encode(registerDto.getPassword()));

        if(image != null && !image.isEmpty()){
            localImageRepo.saveImage(image.getBytes(),user.getId());
        }

        User savedUser = userRepository.save(user);
        RegistrationRequest request = new RegistrationRequest();
        request.setUser(savedUser);
        request.setStatus(RegistrationStatus.PENDING);
        requestRepository.save(request);
    }
}
