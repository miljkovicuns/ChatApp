package com.ftn.sr192024.messenger.services;

import com.ftn.sr192024.messenger.models.User;
import com.ftn.sr192024.messenger.repository.LocalImageRepo;
import com.ftn.sr192024.messenger.repository.UserRepository;
import com.ftn.sr192024.messenger.security.CustomUserDetails;
import lombok.AllArgsConstructor;
import org.jspecify.annotations.NonNull;
import org.springframework.context.annotation.Primary;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@Primary
@AllArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private UserRepository userRepository;

    private LocalImageRepo localImageRepo;

    @Override
    public UserDetails loadUserByUsername(@NonNull String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsernameAndRegisteredIsTrueAndActiveIsTrue(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with username: " + username));
        user.setImage(localImageRepo.getImage(user.getId()));
        // Return CustomUserDetails instead of Spring's default User
        return new CustomUserDetails(user);
    }

    // Optional: Add method to load by ID (useful for JWT token validation)
    public UserDetails loadUserById(java.util.UUID userId) throws UsernameNotFoundException {
        User user = userRepository.findUserByIdAndRegisteredIsTrue(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with id: " + userId));
        user.setImage(localImageRepo.getImage(user.getId()));
        return new CustomUserDetails(user);
    }
}
