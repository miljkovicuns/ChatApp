package com.ftn.sr192024.messenger.controllers;

import com.ftn.sr192024.messenger.models.RegistrationRequest;
import com.ftn.sr192024.messenger.services.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;
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
}
