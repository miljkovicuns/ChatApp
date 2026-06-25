package com.ftn.sr192024.messenger.models.dto;

import com.ftn.sr192024.messenger.models.Message;
import lombok.Getter;
import lombok.Setter;

import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Getter
@Setter
public class MessageResponseDto {
    private UUID id;
    private String content;
    private String dateOfSending;  // Formatted date string
    private UUID senderId;
    private String senderUsername;
    private String senderFirstName;
    private String senderLastName;
    private UUID chatId;
    private boolean isOwn;  // Whether the message belongs to the current user
    private String status;

    private static final DateTimeFormatter FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    /**
     * Convert Message entity to MessageResponseDto
     * @param message The message entity
     * @param currentUserId The ID of the current user (to determine if message is own)
     * @return MessageResponseDto
     */
    public static MessageResponseDto fromEntity(Message message, UUID currentUserId) {
        if (message == null) return null;

        MessageResponseDto dto = new MessageResponseDto();
        dto.setId(message.getId());
        dto.setContent(message.getContent());

        // Format date
        if (message.getDateOfSending() != null) {
            dto.setDateOfSending(message.getDateOfSending().format(FORMATTER));
        }

        // Set sender info
        if (message.getSender() != null) {
            dto.setSenderId(message.getSender().getId());
            dto.setSenderUsername(message.getSender().getUsername());
            dto.setSenderFirstName(message.getSender().getFirstName());
            dto.setSenderLastName(message.getSender().getLastName());
            dto.setOwn(dto.getSenderId().equals(currentUserId));
        }

        // Set chat info
        if (message.getChat() != null) {
            dto.setChatId(message.getChat().getId());
        }

        if (currentUserId != null && message.getSender() != null) {
            // For own messages, status is always READ (you read your own messages)
            if (message.getSender().getId().equals(currentUserId)) {
                dto.setStatus("READ");
            } else {
                // For other users' messages, check status from read statuses
                if (message.getReadStatuses() != null) {
                    message.getReadStatuses().stream()
                            .filter(rs -> rs.getUser().getId().equals(currentUserId))
                            .findFirst()
                            .ifPresent(rs -> dto.setStatus(rs.getStatus().name()));
                }
                if (dto.getStatus() == null) {
                    dto.setStatus("SENT");
                }
            }
        } else {
            dto.setStatus("SENT");
        }

        return dto;
    }

    /**
     * Convert Message entity to MessageResponseDto without current user context
     * (isOwn will default to false)
     */
    public static MessageResponseDto fromEntity(Message message) {
        return fromEntity(message, null);
    }
}
