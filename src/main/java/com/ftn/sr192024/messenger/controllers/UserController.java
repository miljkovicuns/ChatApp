package com.ftn.sr192024.messenger.controllers;

import com.ftn.sr192024.messenger.models.User;
import com.ftn.sr192024.messenger.models.dto.FilterUserRequest;
import com.ftn.sr192024.messenger.models.dto.UserResponseDTO;
import com.ftn.sr192024.messenger.security.CustomUserDetails;
import com.ftn.sr192024.messenger.security.SecurityUtils;
import com.ftn.sr192024.messenger.services.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
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

    @GetMapping("/filter")
    public ResponseEntity<List<UserResponseDTO>> getFilteredUsers(
            @RequestParam(required = false) String searchQuery,
            @RequestParam(defaultValue = "all") String lastSeen,
            @RequestParam(defaultValue = "all") String hasImage,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "asc") String sortOrder
    ) {
        User currentUser = SecurityUtils.getCurrentUser();
        FilterUserRequest filter = new FilterUserRequest();
        filter.setSearchQuery(searchQuery);
        filter.setLastSeen(lastSeen);
        filter.setHasImage(hasImage);
        filter.setSortBy(sortBy);
        filter.setSortOrder(sortOrder);
        filter.setPage(0);
        filter.setSize(Integer.MAX_VALUE); // Get all users

        Page<UserResponseDTO> page = userService.getFilteredUsers(filter, currentUser.getId());
        return ResponseEntity.ok(page.getContent()); // Return just the list
    }

    // Update user's last seen
    @PostMapping("/heartbeat")
    public ResponseEntity<Void> updateLastSeen(Authentication authentication) {
        User currentUser = SecurityUtils.getCurrentUser();

        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        currentUser.setLastOnline(LocalDateTime.now());
        userService.save(currentUser);
        return ResponseEntity.ok().build();
    }
}
