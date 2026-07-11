package com.ftn.sr192024.messenger.models.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SavedMessageDto {
    private UUID id;
    private UUID messageId;
    private String messageContent;
    private LocalDateTime messageDate;
    private UUID senderId;
    private String senderUsername;
    private UUID chatId;
    private String chatName;
    private LocalDateTime savedAt;
}