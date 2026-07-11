package com.ftn.sr192024.messenger.repository;

import com.ftn.sr192024.messenger.models.SavedMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface SavedMessageRepository extends JpaRepository<SavedMessage, UUID> {

    Page<SavedMessage> findByUserIdOrderBySavedAtDesc(UUID userId, Pageable pageable);

    Optional<SavedMessage> findByUserIdAndMessageId(UUID userId, UUID messageId);

    @Query("SELECT CASE WHEN COUNT(s) > 0 THEN true ELSE false END " +
            "FROM SavedMessage s WHERE s.user.id = :userId AND s.message.id = :messageId")
    boolean existsByUserIdAndMessageId(@Param("userId") UUID userId,
                                       @Param("messageId") UUID messageId);

    void deleteByUserIdAndMessageId(UUID userId, UUID messageId);
}