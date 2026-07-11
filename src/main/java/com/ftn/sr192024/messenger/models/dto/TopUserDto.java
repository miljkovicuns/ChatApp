// TopUserDto.java
package com.ftn.sr192024.messenger.models.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class TopUserDto {
    private UUID userId;
    private String username;
    private String fullName;
    private long messageCount;
}