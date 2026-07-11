package com.ftn.sr192024.messenger.services;

import com.ftn.sr192024.messenger.models.Chat;
import com.ftn.sr192024.messenger.models.Message;
import com.ftn.sr192024.messenger.models.SavedMessage;
import com.ftn.sr192024.messenger.models.User;
import com.ftn.sr192024.messenger.models.dto.SavedMessageDto;
import com.ftn.sr192024.messenger.repository.SavedMessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SavedMessageService {

    private final SavedMessageRepository savedMessageRepository;
    private final UserService userService;
    private final MessageService messageService;

    @Transactional
    public SavedMessage saveMessage(UUID userId, UUID messageId) {
        if (savedMessageRepository.existsByUserIdAndMessageId(userId, messageId)) {
            throw new RuntimeException("Message already saved");
        }
        User user = userService.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Message message = messageService.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));

        SavedMessage savedMessage = new SavedMessage();
        savedMessage.setUser(user);
        savedMessage.setMessage(message);
        return savedMessageRepository.save(savedMessage);
    }

    @Transactional
    public void unsaveMessage(UUID userId, UUID messageId) {
        savedMessageRepository.deleteByUserIdAndMessageId(userId, messageId);
    }

    public Page<SavedMessage> getSavedMessages(UUID userId, Pageable pageable) {
        return savedMessageRepository.findByUserIdOrderBySavedAtDesc(userId, pageable);
    }

    public boolean isSaved(UUID userId, UUID messageId) {
        return savedMessageRepository.existsByUserIdAndMessageId(userId, messageId);
    }

    public Page<SavedMessageDto> getSavedMessagesDto(UUID userId, Pageable pageable) {
        Page<SavedMessage> savedMessages = savedMessageRepository.findByUserIdOrderBySavedAtDesc(userId, pageable);
        return savedMessages.map(saved -> {
            SavedMessageDto dto = new SavedMessageDto();
            dto.setId(saved.getId());
            dto.setMessageId(saved.getMessage().getId());
            dto.setMessageContent(saved.getMessage().getContent());
            dto.setMessageDate(saved.getMessage().getDateOfSending());
            dto.setSenderId(saved.getMessage().getSender().getId());
            dto.setSenderUsername(saved.getMessage().getSender().getUsername());
            dto.setChatId(saved.getMessage().getChat().getId());

            Chat chat = saved.getMessage().getChat();
            if (chat.isGroupChat()) {
                dto.setChatName(chat.getName());
            } else {
                // Direct chat: find the other participant
                List<User> participants = chat.getParticipants();
                User other = participants.stream()
                        .filter(u -> !u.getId().equals(userId))
                        .findFirst()
                        .orElse(null);
                dto.setChatName(other != null ? other.getUsername() : "Direct Chat");
            }
            dto.setSavedAt(saved.getSavedAt());
            return dto;
        });
    }
}