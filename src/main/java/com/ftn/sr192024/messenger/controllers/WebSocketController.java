package com.ftn.sr192024.messenger.controllers;

import com.ftn.sr192024.messenger.models.Message;
import com.ftn.sr192024.messenger.models.dto.MessageResponseDto;
import com.ftn.sr192024.messenger.models.dto.SendMessageDto;
import com.ftn.sr192024.messenger.services.MessageService;
import com.ftn.sr192024.messenger.services.UserService;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.UUID;

@RequiredArgsConstructor
@Controller
public class WebSocketController {
    private final MessageService messageService;
    private final UserService userService;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/chat.sendMessage")
    public void sendMessage(@Payload SendMessageDto sendMessageDto, Principal principal) {
        // ✅ Save message to database
        Message savedMessage = messageService.sendMessage(sendMessageDto);

        // ✅ Convert to DTO for response
        MessageResponseDto response = MessageResponseDto.fromEntity(
                savedMessage,
                sendMessageDto.getSenderId()
        );

        // ✅ Send to all subscribers of this chat
        messagingTemplate.convertAndSend(
                "/topic/chat/" + sendMessageDto.getChatId(),
                response
        );

        // ✅ Send to specific user for private notification
        // This is useful for unread count updates
        messagingTemplate.convertAndSendToUser(
                sendMessageDto.getSenderId().toString(),
                "/queue/notifications",
                "Message sent successfully"
        );
    }

    @MessageMapping("/chat.markRead")
    public void markMessagesAsRead(@Payload MarkReadRequest request, Principal principal) {
        UUID userId = UUID.fromString(principal.getName());
        messageService.markMessagesAsRead(request.getChatId(), userId);

        // ✅ Update unread count for all users in the chat
        long unreadCount = messageService.getUnreadCountForChat(
                request.getChatId(),
                userId
        );

        messagingTemplate.convertAndSend(
                "/topic/chat/" + request.getChatId() + "/unread",
                new UnreadUpdateResponse(request.getChatId(), userId, unreadCount)
        );
    }

    @Getter
    @Setter
    class MarkReadRequest {
        private UUID chatId;
        // getters and setters
    }

    @Getter
    @Setter
    class TypingRequest {
        private UUID chatId;
        private boolean typing;
        // getters and setters
    }

    @Getter
    @Setter
    @AllArgsConstructor
    class UnreadUpdateResponse {
        private UUID chatId;
        private UUID userId;
        private long unreadCount;
        // constructor, getters and setters
    }

    @Getter
    @Setter
    @AllArgsConstructor
    class TypingResponse {
        private UUID userId;
        private UUID chatId;
        private boolean typing;
        // constructor, getters and setters
    }
}
