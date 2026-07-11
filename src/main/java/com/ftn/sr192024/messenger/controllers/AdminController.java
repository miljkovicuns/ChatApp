package com.ftn.sr192024.messenger.controllers;

import com.ftn.sr192024.messenger.models.RegistrationRequest;
import com.ftn.sr192024.messenger.models.User;
import com.ftn.sr192024.messenger.services.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Controller
@RequiredArgsConstructor
@RequestMapping("/admin")
public class AdminController {
    private final UserService userService;

    @GetMapping("/register/request")
    public ResponseEntity<?> getAllRegRequests() {
        List<RegistrationRequest> requests = userService.findAllRegistrationRequests();
        return ResponseEntity.ok(requests);
    }

    @PostMapping("register/request/accept")
    public ResponseEntity<?> acceptRequest(@RequestBody UUID id) {
        RegistrationRequest savedRequest = userService.acceptRequest(id);
        return ResponseEntity.ok(savedRequest);
    }

    @PostMapping("register/request/reject")
    public ResponseEntity<?> rejectRequest(@RequestBody UUID id) {
        RegistrationRequest savedRequest = userService.rejectRequest(id);
        return ResponseEntity.ok(savedRequest);
    }

    @PutMapping("/users/{userId}/role")
    public ResponseEntity<User> updateUserRole(
            @PathVariable UUID userId,
            @RequestBody Map<String, String> request) {
        String newRole = request.get("role");
        if (newRole == null || newRole.isBlank()) {
            throw new IllegalArgumentException("Role must be provided");
        }
        User updated = userService.updateUserRole(userId, newRole);
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/users/{userId}/toggle-active")
    public ResponseEntity<User> toggleUserActive(@PathVariable UUID userId) {
        User updated = userService.toggleUserActive(userId);
        return ResponseEntity.ok(updated);
    }
}
