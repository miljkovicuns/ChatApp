package com.ftn.sr192024.messenger.models.dto;

import com.ftn.sr192024.messenger.models.Message;
import com.ftn.sr192024.messenger.models.MessageReadStatus;
import com.ftn.sr192024.messenger.models.ReadEnum;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WebSocketMessage {
    private UUID id;
    private String content;
    private UUID chatId;
    private UUID senderId;
    private LocalDateTime dateOfSending;
    private String status;
    private String senderName;
    private String senderAvatar;

    public static WebSocketMessage fromMessage(Message message, UUID currentUserId) {
        // Get status for the current user
        ReadEnum status = message.getReadStatuses().stream()
                .filter(rs -> rs.getUser().getId().equals(currentUserId))
                .findFirst()
                .map(MessageReadStatus::getStatus)
                .orElse(ReadEnum.SENT);

        return new WebSocketMessage(
                message.getId(),
                message.getContent(),
                message.getChat().getId(),
                message.getSender().getId(),
                message.getDateOfSending(),
                status.name(),  // Convert enum to string
                message.getSender().getUsername(),
                Arrays.toString(message.getSender().getImage())
        );
    }
}
