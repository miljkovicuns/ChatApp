package com.ftn.sr192024.messenger.repository;

import com.ftn.sr192024.messenger.models.RegistrationRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RegisterRequestRepository extends JpaRepository<RegistrationRequest, UUID> {
    Optional<List<RegistrationRequest>> findAllByUserId(UUID userId);
}
