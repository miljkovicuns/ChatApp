// AnalyticsSummaryDto.java
package com.ftn.sr192024.messenger.models.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class AnalyticsSummaryDto {
    private long totalUsers;
    private long activeUsers;              // users who sent at least one message in the period
    private long totalMessages;
    private long totalGroupsCreated;
    private List<TopUserDto> topUsers;
    private List<TopGroupDto> topGroups;
}