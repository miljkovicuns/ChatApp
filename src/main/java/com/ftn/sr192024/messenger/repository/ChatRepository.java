package com.ftn.sr192024.messenger.repository;

import com.ftn.sr192024.messenger.models.Chat;
import com.ftn.sr192024.messenger.models.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ChatRepository extends JpaRepository<Chat, UUID> {
    Optional<ArrayList<Chat>> findChatByUser(UUID id);
    @Query(value = "SELECT c.* FROM chat c " +
            "WHERE c.group_chat = false " +
            "AND EXISTS (SELECT 1 FROM chat_participants cp1 WHERE cp1.chat_id = c.id AND cp1.user_id = :userId1) " +
            "AND EXISTS (SELECT 1 FROM chat_participants cp2 WHERE cp2.chat_id = c.id AND cp2.user_id = :userId2) " +
            "AND (SELECT COUNT(*) FROM chat_participants cp3 WHERE cp3.chat_id = c.id) = 2",
            nativeQuery = true)
    Optional<Chat> findDirectChatBetweenUsers(@Param("userId1") UUID userId1, @Param("userId2") UUID userId2);
}
