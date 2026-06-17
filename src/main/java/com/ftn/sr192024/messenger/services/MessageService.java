package com.ftn.sr192024.messenger.services;

import com.ftn.sr192024.messenger.models.Chat;
import com.ftn.sr192024.messenger.models.Message;
import com.ftn.sr192024.messenger.models.MessageReadStatus;
import com.ftn.sr192024.messenger.models.User;
import com.ftn.sr192024.messenger.models.dto.SendMessageDto;
import com.ftn.sr192024.messenger.repository.MessageReadStatusRepository;
import com.ftn.sr192024.messenger.repository.MessageRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MessageService {
    private final MessageRepository messageRepository;
    private final MessageReadStatusRepository readStatusRepository;
    @Lazy
    private final ChatService chatService;
    private final UserService userService;
    private final ChatUpdateService chatUpdateService;

    public List<Message> findByChatId(UUID chatID) {
        return messageRepository.findByChatIdOrderByDateOfSendingAsc(chatID).orElse(null);
    }

    @Transactional
    public Message sendMessage(SendMessageDto sendMessageDto) {
        if (sendMessageDto.getContent() == null || sendMessageDto.getContent().trim().isEmpty()) {
            throw new IllegalArgumentException("Message content cannot be null or empty");
        }

        Message message = new Message();
        Chat chat = chatService.findById(sendMessageDto.getChatId());

        chatUpdateService.updateLastMessageAt(chat.getId(), LocalDateTime.now());

        message.setChat(chat);
        message.setSender(userService.findById(sendMessageDto.getSenderId()));
        message.setContent(sendMessageDto.getContent().trim());
        message.setDateOfSending(LocalDateTime.now());

        Message saved = messageRepository.save(message);

        // Mark message as read by sender
        User sender = userService.findById(sendMessageDto.getSenderId());
        MessageReadStatus senderReadStatus = new MessageReadStatus(saved, sender);
        readStatusRepository.save(senderReadStatus);

        return saved;
    }

    @Transactional
    public void markMessagesAsRead(UUID chatId, UUID userId) {
        User user = userService.findById(userId);
        readStatusRepository.markAllMessagesAsRead(chatId, user);
    }

    public long getUnreadCountForChat(UUID chatId, UUID userId) {
        return readStatusRepository.countUnreadMessagesByChatAndUser(chatId, userId);
    }

    public Map<UUID, Long> getUnreadCountsForUser(UUID userId) {
        List<Object[]> results = readStatusRepository.findUnreadMessageIdsAndChatIds(userId);
        Map<UUID, Long> unreadCounts = new HashMap<>();

        for (Object[] result : results) {
            UUID chatId = (UUID) result[1];
            unreadCounts.merge(chatId, 1L, Long::sum);
        }

        return unreadCounts;
    }

    @Transactional
    public void markMessageAsRead(UUID messageId, UUID userId) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));
        User user = userService.findById(userId);

        // Check if already marked as read
        if (!readStatusRepository.existsByMessageIdAndUserId(messageId, userId)) {
            MessageReadStatus readStatus = new MessageReadStatus(message, user);
            readStatusRepository.save(readStatus);
        }
    }
}
