// TopGroupDto.java
package com.ftn.sr192024.messenger.models.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class TopGroupDto {
    private UUID groupId;
    private String groupName;
    private long messageCount;
}