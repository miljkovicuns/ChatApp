// models/dto/CreateGroupRequest.java
package com.ftn.sr192024.messenger.models.dto;

import lombok.Getter;
import lombok.Setter;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@Getter @Setter
public class CreateGroupRequest {
    private String name;
    private String description;
    private MultipartFile image;
    private List<UUID> participantIds;
}