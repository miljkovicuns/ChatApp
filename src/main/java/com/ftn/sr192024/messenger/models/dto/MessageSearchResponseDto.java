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
public class MessageSearchResponseDto {
    private UUID id;
    private String content;
    private LocalDateTime dateOfSending;
    private UUID senderId;
    private String senderUsername;
}
