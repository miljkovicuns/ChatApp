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
    private final UserService userService;
    private final ChatUpdateService chatUpdateService; // Only dependency needed

    public List<Message> findByChatId(UUID chatID) {
        return messageRepository.findByChatIdOrderByDateOfSendingAsc(chatID).orElse(null);
    }

    @Transactional
    public Message sendMessage(SendMessageDto sendMessageDto) {
        if (sendMessageDto.getContent() == null || sendMessageDto.getContent().trim().isEmpty()) {
            throw new IllegalArgumentException("Message content cannot be null or empty");
        }

        // ✅ Update chat's last message time
        chatUpdateService.updateLastMessageAt(
                sendMessageDto.getChatId(),
                LocalDateTime.now()
        );

        // ✅ Create and save message
        Message message = new Message();
        Chat chat = chatUpdateService.findChatById(sendMessageDto.getChatId());
        message.setChat(chat);
        message.setSender(userService.findById(sendMessageDto.getSenderId()));
        message.setContent(sendMessageDto.getContent().trim());
        message.setDateOfSending(LocalDateTime.now());

        Message saved = messageRepository.save(message);

        // ✅ Mark as read by sender
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
}
