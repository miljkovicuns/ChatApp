package com.ftn.sr192024.messenger.models.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class SendMessageDto {
    UUID chatId;
    String content;
    UUID senderId;
    UUID replyToId;
    UUID forwardedFromId;
}
