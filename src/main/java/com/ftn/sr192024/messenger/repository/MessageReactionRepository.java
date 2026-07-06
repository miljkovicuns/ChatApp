package com.ftn.sr192024.messenger.repository;

import com.ftn.sr192024.messenger.models.MessageReaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MessageReactionRepository extends JpaRepository<MessageReaction, UUID> {
    List<MessageReaction> findByMessageId(UUID messageId);

    Optional<MessageReaction> findByMessageIdAndUserId(UUID messageId, UUID userId);

    void deleteByMessageIdAndUserId(UUID messageId, UUID userId);
}
