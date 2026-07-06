package com.ftn.sr192024.messenger.models.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
public class SearchMessageDto {
    UUID chatId;
    String keyword;
    LocalDateTime startDate;
    LocalDateTime endDate;
    int page;
    int size;
}
