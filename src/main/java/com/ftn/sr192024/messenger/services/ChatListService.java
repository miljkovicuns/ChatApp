package com.ftn.sr192024.messenger.services;

import com.ftn.sr192024.messenger.models.Chat;
import com.ftn.sr192024.messenger.models.dto.ChatResponseDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatListService {
    private final ChatService chatService;
    private final MessageService messageService;

    public List<ChatResponseDto> getUsersChatsWithUnread(UUID userId) {
        List<Chat> chats = chatService.getUsersChats(userId);
        Map<UUID, Integer> unreadCounts = messageService.getUnreadCountsForUser(userId);

        return chats.stream()
                .map(chat -> {
                    Integer count = unreadCounts.getOrDefault(chat.getId(), 0);
                    return ChatResponseDto.fromEntity(chat, count);
                })
                .collect(Collectors.toList());
    }
}
