// AnalyticsTimeSeriesDto.java
package com.ftn.sr192024.messenger.models.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class AnalyticsTimeSeriesDto {
    private String period;            // date for the group
    private long totalUsers;             // cumulative users up to that point (or new registrations)
    private long activeUsers;            // active users in that period
    private long totalMessages;          // messages sent in that period
    private long groupsCreated;          // groups created in that period
}