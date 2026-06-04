package com.ftn.sr192024.messenger.repository;

import com.ftn.sr192024.messenger.models.Chat;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ChatRepository extends JpaRepository<Optional<Chat>, UUID> {
}
