package com.ftn.sr192024.messenger.repository;

import com.ftn.sr192024.messenger.models.Chat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ChatRepository extends JpaRepository<Chat, UUID> {
    @Query("SELECT c FROM Chat c JOIN c.participants p WHERE p.id = :userId ORDER BY c.lastMessageAt desc")
    Optional<List<Chat>> findAllChatsByUserId(@Param("userId") UUID userId);
    @Query(value = "SELECT c.* FROM chat c " +
            "WHERE c.group_chat = false " +
            "AND EXISTS (SELECT 1 FROM chat_participants cp1 WHERE cp1.chat_id = c.id AND cp1.user_id = :userId1) " +
            "AND EXISTS (SELECT 1 FROM chat_participants cp2 WHERE cp2.chat_id = c.id AND cp2.user_id = :userId2) " +
            "AND (SELECT COUNT(*) FROM chat_participants cp3 WHERE cp3.chat_id = c.id) = 2",
            nativeQuery = true)
    Optional<Chat> findDirectChatBetweenUsers(@Param("userId1") UUID userId1, @Param("userId2") UUID userId2);

    List<Chat> findByParticipantsId(UUID userId);

    @Modifying
    @Query("UPDATE Chat c SET c.lastMessageAt = :lastMessageAt WHERE c.id = :chatId")
    void updateLastMessageAt(@Param("chatId") UUID chatId,
                             @Param("lastMessageAt") LocalDateTime lastMessageAt);

    @Query("SELECT COUNT(c) > 0 FROM Chat c JOIN c.participants p WHERE c.id = :chatId AND p.id = :userId")
    boolean isUserParticipant(@Param("chatId") UUID chatId, @Param("userId") UUID userId);

    long countByGroupChatTrueAndDateCreatedBetween(LocalDateTime start, LocalDateTime end);
}
