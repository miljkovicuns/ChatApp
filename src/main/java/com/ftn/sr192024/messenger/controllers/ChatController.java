package com.ftn.sr192024.messenger.controllers;

import com.ftn.sr192024.messenger.models.Chat;
import com.ftn.sr192024.messenger.models.Message;
import com.ftn.sr192024.messenger.models.ReactionType;
import com.ftn.sr192024.messenger.models.dto.*;
import com.ftn.sr192024.messenger.services.ChatService;
import com.ftn.sr192024.messenger.services.MessageService;
import com.ftn.sr192024.messenger.services.ReactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import static com.ftn.sr192024.messenger.security.SecurityUtils.getCurrentUserId;

@Controller
@RequestMapping("/chats")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    private final MessageService messageService;

    private final ReactionService reactionService;

    @GetMapping("/my-chats")
    public ResponseEntity<List<Chat>> getMyChats() {
        UUID id = getCurrentUserId();
        List<Chat> myChats = chatService.getUsersChats(id);
        return ResponseEntity.ok(myChats);
    }

    @PostMapping("/direct")
    public ResponseEntity<Chat> createDirectChat(@RequestBody Map<String, List<UUID>> request) throws IOException {
        List<UUID> participantIds = request.get("participantIds");
        Chat chat = chatService.createDirectChat(participantIds);
        return ResponseEntity.ok(chat);
    }

    @PostMapping("/group")
    public ResponseEntity<Chat> createGroupChat(@RequestBody GroupChatRequest request) throws IOException {
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

    @GetMapping("/messages/search")
    public ResponseEntity<Page<MessageSearchResponseDto>> searchMessages(
            @ModelAttribute SearchMessageDto searchDto // or @RequestBody if you send JSON
    ) {
        Page<MessageSearchResponseDto> messages = messageService.searchMessagesInChat(searchDto);
        return ResponseEntity.ok(messages);
    }

    @GetMapping("/messages/{chatId}")
    public ResponseEntity<List<MessageResponseDto>> getChatMessages(@PathVariable UUID chatId) {
        UUID currentUserId = getCurrentUserId();
        List<Message> messages = messageService.findByChatId(chatId);

        // Convert each message to DTO with status for current user
        List<MessageResponseDto> messageDtos = messages.stream()
                .map(msg -> MessageResponseDto.fromEntity(msg, currentUserId))
                .collect(Collectors.toList());

        return ResponseEntity.ok(messageDtos);
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
    public ResponseEntity<Map<UUID, Integer>> getAllUnreadCounts() {
        UUID userId = getCurrentUserId();
        Map<UUID, Integer> unreadCounts = messageService.getUnreadCountsForUser(userId);
        return ResponseEntity.ok(unreadCounts);
    }

    @PostMapping("/messages/{messageId}/reactions")
    public ResponseEntity<List<ReactionResponseDto>> toggleReaction(
            @PathVariable UUID messageId,
            @RequestBody Map<String, String> request) {
        UUID userId = getCurrentUserId();
        ReactionType reactionType = ReactionType.valueOf(request.get("reactionType"));
        List<ReactionResponseDto> reactions = reactionService.toggleReaction(messageId, userId, reactionType);
        return ResponseEntity.ok(reactions);
    }
}
