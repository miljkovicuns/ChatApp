package com.ftn.sr192024.messenger.models.dto;

import com.ftn.sr192024.messenger.models.Chat;
import lombok.Getter;
import lombok.Setter;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Getter
@Setter
public class ChatResponseDto {
    private UUID id;
    private boolean groupChat;
    private String name;
    private String description;
    private String lastMessageAt;  // Formatted date string
    private String dateCreated;    // Formatted date string
    private long unreadCount;      // Computed field
    private List<UserResponseDTO> participants;  // Limited user data

    public static ChatResponseDto fromEntity(Chat chat) {
        if (chat == null) return null;  // ✅ Null safety

        ChatResponseDto dto = new ChatResponseDto();
        dto.setId(chat.getId());
        dto.setName(chat.getName());
        dto.setGroupChat(chat.isGroupChat());
        dto.setDescription(chat.getDescription());

        // ✅ Check for null and use 24-hour format
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy.MM.dd HH:mm:ss");

        if (chat.getLastMessageAt() != null) {
            dto.setLastMessageAt(chat.getLastMessageAt().format(formatter));
        }

        if (chat.getDateCreated() != null) {
            dto.setDateCreated(chat.getDateCreated().format(formatter));
        }

        // ✅ Convert participants correctly
        if (chat.getParticipants() != null) {
            List<UserResponseDTO> participantDtos = chat.getParticipants().stream()
                    .map(UserResponseDTO::fromEntity)
                    .collect(Collectors.toList());
            dto.setParticipants(participantDtos);
        }

        return dto;
    }

    public static ChatResponseDto fromEntity(Chat chat, Integer unreadCount) {
        ChatResponseDto dto = fromEntity(chat);
        dto.setUnreadCount(unreadCount != null ? unreadCount : 0);
        return dto;
    }
}
