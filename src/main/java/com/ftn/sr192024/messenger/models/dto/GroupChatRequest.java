package com.ftn.sr192024.messenger.models.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
public class GroupChatRequest {
    private String name;
    private String description;
    private List<UUID> participantIds;
}
