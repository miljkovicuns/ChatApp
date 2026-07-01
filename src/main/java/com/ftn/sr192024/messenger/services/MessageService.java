package com.ftn.sr192024.messenger.services;

import com.ftn.sr192024.messenger.models.*;
import com.ftn.sr192024.messenger.models.dto.SendMessageDto;
import com.ftn.sr192024.messenger.repository.MessageReadStatusRepository;
import com.ftn.sr192024.messenger.repository.MessageRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

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
        User sender = userService.findById(sendMessageDto.getSenderId()).orElse(null);
        Chat chat = chatUpdateService.findChatById(sendMessageDto.getChatId());
        message.setChat(chat);
        message.setSender(sender);
        message.setContent(sendMessageDto.getContent().trim());
        message.setDateOfSending(LocalDateTime.now());
        List<MessageReadStatus> statuses = new ArrayList<>();
        if(chat.isGroupChat()) {
            List<User> participants = chat.getParticipants().stream().filter(user -> {
                assert sender != null;
                return user.getId() != sender.getId();
            }).toList();
            for(User participant : participants) {

                MessageReadStatus status = new MessageReadStatus();
                status.setUser(participant);
                status.setMessage(message);
                status.setStatus(ReadEnum.SENT);

            }
        }else{
            User participant = chat.getParticipants().stream().filter(user -> {
                assert sender != null;
                return user.getId() != sender.getId();
            }).toList().get(0);
            MessageReadStatus status = new MessageReadStatus();
            status.setUser(participant);
            status.setMessage(message);
            status.setStatus(ReadEnum.SENT);
            statuses.add(status);
        }
        message.setReadStatuses(statuses);

        Message saved = messageRepository.save(message);

        markMessageAsDelivered(message.getId());

        return saved;
    }

    @Transactional
    public void markMessageAsDelivered(UUID messageId) {
        List<MessageReadStatus> statuses = readStatusRepository.findByMessageId(messageId).orElse(null);
        if (statuses != null && !statuses.isEmpty()) {
            for (MessageReadStatus status : statuses) {
                status.setStatus(ReadEnum.DELIVERED);
                status.setDeliveredAt(LocalDateTime.now());
                readStatusRepository.save(status);
            }
        }
    }

    @Transactional
    public void markMessagesAsRead(UUID chatId, UUID userId) {
        List<Message> messages = messageRepository.findByChatIdOrderByDateOfSendingAsc(chatId).orElse(null);
        assert messages != null;
        for(Message message : messages) {
            if(readStatusRepository.existsByMessageIdAndUserId(message.getId(),userId) && !message.getSender().getId().equals(userId)) {
                List<MessageReadStatus> statuses = readStatusRepository.findByMessageChatIdAndUserId(chatId,userId);
                for (MessageReadStatus status : statuses) {
                    status.setReadAt(LocalDateTime.now());
                    status.setStatus(ReadEnum.READ);
                    readStatusRepository.save(status);
                }
            }
        }
    }

    public long getUnreadCountForChat(UUID chatId, UUID userId) {
        return readStatusRepository.countUnreadMessagesByChatAndUser(chatId, userId);
    }

    public Map<UUID, Integer> getUnreadCountsForUser(UUID userId) {
        List<Object[]> results = readStatusRepository.findUnreadMessageIdsAndChatIds(userId);
        Map<UUID, Integer> unreadCounts = new HashMap<>();

        for (Object[] result : results) {
            UUID chatId = (UUID) result[1];
            unreadCounts.put(chatId,readStatusRepository.countUnreadMessagesByChatAndUser(chatId,userId));
        }

        return unreadCounts;
    }
}
