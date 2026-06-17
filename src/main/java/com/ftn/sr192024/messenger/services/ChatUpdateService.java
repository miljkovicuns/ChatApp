package com.ftn.sr192024.messenger.services;

import com.ftn.sr192024.messenger.models.Chat;
import com.ftn.sr192024.messenger.repository.ChatRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ChatUpdateService {
    private final ChatRepository chatRepository;

    public void updateLastMessageAt(UUID chatId, LocalDateTime now) {
        Chat chat = chatRepository.findById(chatId).orElse(null);
        assert chat != null;
        chat.setLastMessageAt(now);
        chatRepository.save(chat);
    }

    public Chat findChatById(UUID chatId) {
        return chatRepository.findById(chatId).orElse(null);
    }
}
