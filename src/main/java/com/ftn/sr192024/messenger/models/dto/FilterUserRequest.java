package com.ftn.sr192024.messenger.models.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class FilterUserRequest {
    private String searchQuery;
    private String lastSeen; // "today", "week", "month", "offline", "all"
    private String hasImage; // "all", "hasImage", "noImage"
    private String sortBy; // "name", "lastSeen", "recent"
    private String sortOrder; // "asc", "desc"
    private Integer page;
    private Integer size;

    public LocalDateTime getDateFrom() {
        if (lastSeen == null || lastSeen.equals("all") || lastSeen.equals("offline")) {
            return null;
        }

        LocalDateTime now = LocalDateTime.now();
        switch (lastSeen) {
            case "today":
                return now.minusDays(1);
            case "week":
                return now.minusWeeks(1);
            case "month":
                return now.minusMonths(1);
            default:
                return null;
        }
    }

    public boolean isFilterByOffline() {
        return "offline".equals(lastSeen);
    }
}
