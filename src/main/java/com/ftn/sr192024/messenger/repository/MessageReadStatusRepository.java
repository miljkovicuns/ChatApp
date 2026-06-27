package com.ftn.sr192024.messenger.repository;

import com.ftn.sr192024.messenger.models.MessageReadStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;


public interface MessageReadStatusRepository extends JpaRepository<MessageReadStatus, UUID> {
    // Check if a user has read a specific message
    boolean existsByMessageIdAndUserId(UUID messageId, UUID userId);

    // Get all read statuses for a chat
    List<MessageReadStatus> findByMessageChatIdAndUserId(UUID chatId, UUID userId);

    // Count unread messages in a chat for a user
    @Query("SELECT COUNT(m) FROM Message m " +
            "WHERE m.chat.id = :chatId " +
            "AND m.sender.id != :userId " +
            "AND NOT EXISTS (SELECT 1 FROM MessageReadStatus rs " +
            "                WHERE rs.message = m AND rs.user.id = :userId AND rs.status = ReadEnum.READ)")
    int countUnreadMessagesByChatAndUser(@Param("chatId") UUID chatId,
                                          @Param("userId") UUID userId);

    // Get all unread message IDs for a user across all chats
    @Query("SELECT m.id, m.chat.id FROM Message m " +
            "WHERE EXISTS (SELECT 1 FROM MessageReadStatus rs " +
            "                  WHERE rs.message = m AND rs.user.id = :userId AND rs.status != 'READ')")
    List<Object[]> findUnreadMessageIdsAndChatIds(@Param("userId") UUID userId);

    Optional<List<MessageReadStatus>> findByMessageId(UUID messageId);

    @Query("SELECT m.id, m.chat.id FROM Message m " +
            "WHERE m.sender.id != :userId " +
            "AND EXISTS (SELECT 1 FROM MessageReadStatus rs " +
            "               WHERE rs.message = m AND rs.user.id = :userId " +
            "               AND rs.status = 'DELIVERED')")
    List<Object[]> findDeliveredMessageIdsAndChatIds(@Param("userId") UUID userId);
}
