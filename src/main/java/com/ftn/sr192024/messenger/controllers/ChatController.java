package com.ftn.sr192024.messenger.controllers;

import com.ftn.sr192024.messenger.models.Chat;
import com.ftn.sr192024.messenger.models.Message;
import com.ftn.sr192024.messenger.models.dto.ChatResponseDto;
import com.ftn.sr192024.messenger.models.dto.GroupChatRequest;
import com.ftn.sr192024.messenger.models.dto.SendMessageDto;
import com.ftn.sr192024.messenger.services.ChatService;
import com.ftn.sr192024.messenger.services.MessageService;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static com.ftn.sr192024.messenger.security.SecurityUtils.getCurrentUserId;

@Controller
@RequestMapping("/chats")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    private final MessageService messageService;

    @GetMapping("/my-chats")
    public ResponseEntity<List<Chat>> getMyChats() {
        UUID id = getCurrentUserId();
        List<Chat> myChats = chatService.getUsersChats(id);
        return ResponseEntity.ok(myChats);
    }

    @PostMapping("/direct")
    public ResponseEntity<Chat> createDirectChat(@RequestBody Map<String, List<UUID>> request) {
        List<UUID> participantIds = request.get("participantIds");
        Chat chat = chatService.createDirectChat(participantIds);
        return ResponseEntity.ok(chat);
    }

    @PostMapping("/group")
    public ResponseEntity<Chat> createGroupChat(@RequestBody GroupChatRequest request) {
        Chat chat = chatService.createGroupChat(
                request.getName(),
                request.getDescription(),
                request.getParticipantIds()
        );
        return ResponseEntity.ok(chat);
    }

    @PostMapping("/messages/send")
    public ResponseEntity<Message> sendMessage(@RequestBody SendMessageDto messageDto) {
        Message message = messageService.sendMessage(messageDto);
        return ResponseEntity.ok(message);
    }

    @GetMapping("/messages/{chatId}")
    public ResponseEntity<List<Message>> getChatMessages(@PathVariable UUID chatId) {
        List<Message> messages = messageService.findByChatId(chatId);
        return ResponseEntity.ok(messages);
    }

    @PostMapping("/mark-read/{chatId}")
    public ResponseEntity<?> markMessagesAsRead(@PathVariable UUID chatId) {
        UUID userId = getCurrentUserId();
        messageService.markMessagesAsRead(chatId, userId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/unread-count/{chatId}")
    public ResponseEntity<Long> getUnreadCount(@PathVariable UUID chatId) {
        UUID userId = getCurrentUserId();
        long count = messageService.getUnreadCountForChat(chatId, userId);
        return ResponseEntity.ok(count);
    }

    @GetMapping("/unread-counts")
    public ResponseEntity<Map<UUID, Long>> getAllUnreadCounts() {
        UUID userId = getCurrentUserId();
        Map<UUID, Long> unreadCounts = messageService.getUnreadCountsForUser(userId);
        return ResponseEntity.ok(unreadCounts);
    }
}
