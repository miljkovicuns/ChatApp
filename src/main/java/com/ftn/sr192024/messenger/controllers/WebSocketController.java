package com.ftn.sr192024.messenger.controllers;

import com.ftn.sr192024.messenger.models.Message;
import com.ftn.sr192024.messenger.models.ReadEnum;
import com.ftn.sr192024.messenger.models.dto.SendMessageDto;
import com.ftn.sr192024.messenger.models.dto.WebSocketMessage;
import com.ftn.sr192024.messenger.services.MessageService;
import com.ftn.sr192024.messenger.services.UserService;
import lombok.*;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.time.LocalDateTime;
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

        // Get sender ID
        UUID senderId = sendMessageDto.getSenderId();

        // Create WebSocket message with status for each recipient
        // For the sender, status is READ
        WebSocketMessage senderMessage = WebSocketMessage.fromMessage(savedMessage, senderId);

        // ✅ Send to all subscribers of this chat
        messagingTemplate.convertAndSend(
                "/topic/chat/" + sendMessageDto.getChatId(),
                senderMessage
        );

        // ✅ Send to specific user for private notification
        // This is useful for unread count updates
        messagingTemplate.convertAndSendToUser(
                sendMessageDto.getSenderId().toString(),
                "/queue/notifications",
                "Message sent successfully"
        );

        // Send delivery notification to sender
        messagingTemplate.convertAndSendToUser(
                senderId.toString(),
                "/queue/delivery",
                new DeliveryStatus(savedMessage.getId(), ReadEnum.SENT)
        );
    }

    @MessageMapping("/chat.markDelivered")
    public void markDelivered(@Payload MarkDeliveredRequest request) {
        messageService.markMessageAsDelivered(request.getMessageId(), request.getUserId());

        messagingTemplate.convertAndSendToUser(
                request.getSenderId().toString(),
                "/queue/delivery",
                new DeliveryStatus(request.getMessageId(), ReadEnum.DELIVERED)
        );
    }

    @MessageMapping("/chat.markRead")
    public void markMessagesAsRead(@Payload MarkReadRequest request, Principal principal) {
        String username = principal.getName();
        UUID userId = userService.findByUsername(username).getId();
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

        messagingTemplate.convertAndSend(
                "/topic/chat/" + request.getChatId() + "/read",
                new ReadReceipt(request.getChatId(),userId,LocalDateTime.now())
        );
    }

    @MessageMapping("/chat.typing")
    public void handleTyping(@Payload TypingRequest request, Principal principal) {
        String username = principal.getName();
        UUID userId = userService.findByUsername(username).getId();

        messagingTemplate.convertAndSend(
                "/topic/chat/" + request.getChatId() + "/typing",
                new TypingResponse(userId,request.getChatId(),request.isTyping())
        );
    }

    @Getter
    @Setter
    public static
    class MarkReadRequest {
        private UUID chatId;
        // getters and setters
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MarkDeliveredRequest {
        private UUID messageId;
        private UUID userId;
        private UUID senderId;
    }

    @Getter
    @Setter
    public static
    class TypingRequest {
        private UUID chatId;
        private boolean typing;
        // getters and setters
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DeliveryStatus {
        private UUID messageId;
        private ReadEnum status;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    static
    class UnreadUpdateResponse {
        private UUID chatId;
        private UUID userId;
        private long unreadCount;
        // constructor, getters and setters
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static
    class TypingResponse {
        private UUID userId;
        private UUID chatId;
        private boolean typing;
        // constructor, getters and setters
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReadReceipt {
        private UUID chatId;
        private UUID userId;
        private LocalDateTime readAt;
    }
}
