// models/dto/UpdateGroupRequest.java
package com.ftn.sr192024.messenger.models.dto;

import lombok.Getter;
import lombok.Setter;
import org.springframework.web.multipart.MultipartFile;

@Getter @Setter
public class UpdateGroupRequest {
    private String name;
    private String description;
    private MultipartFile image;
}