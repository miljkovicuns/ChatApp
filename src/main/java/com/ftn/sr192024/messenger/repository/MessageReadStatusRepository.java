package com.ftn.sr192024.messenger.repository;

import com.ftn.sr192024.messenger.models.MessageReadStatus;
import com.ftn.sr192024.messenger.models.User;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;


public interface MessageReadStatusRepository extends JpaRepository<MessageReadStatus, UUID> {
    // Check if a user has read a specific message
    boolean existsByMessageIdAndUserId(UUID messageId, UUID userId);

    // Get all read statuses for a chat
    List<MessageReadStatus> findByMessageChatIdAndUserId(UUID chatId, UUID userId);

    // Count unread messages in a chat for a user
    @Query("SELECT COUNT(m) FROM Message m " +
            "WHERE m.chat.id = :chatId " +
            "AND NOT EXISTS (SELECT 1 FROM MessageReadStatus rs " +
            "                WHERE rs.message = m AND rs.user.id = :userId)")
    long countUnreadMessagesByChatAndUser(@Param("chatId") UUID chatId,
                                          @Param("userId") UUID userId);

    // Mark all messages in a chat as read for a user
    @Modifying
    @Transactional
    @Query("INSERT INTO MessageReadStatus(message, user, readAt) " +
            "SELECT m, :user, CURRENT_TIMESTAMP " +
            "FROM Message m " +
            "WHERE m.chat.id = :chatId " +
            "AND m.id NOT IN (SELECT rs.message.id FROM MessageReadStatus rs " +
            "                 WHERE rs.user.id = :userId)")
    void markAllMessagesAsRead(@Param("chatId") UUID chatId,
                               @Param("user") User user);

    // Get all unread message IDs for a user across all chats
    @Query("SELECT m.id, m.chat.id FROM Message m " +
            "WHERE NOT EXISTS (SELECT 1 FROM MessageReadStatus rs " +
            "                WHERE rs.message = m AND rs.user.id = :userId)")
    List<Object[]> findUnreadMessageIdsAndChatIds(@Param("userId") UUID userId);
}
