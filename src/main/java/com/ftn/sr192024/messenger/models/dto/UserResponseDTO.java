package com.ftn.sr192024.messenger.models.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class UserResponseDTO {
    private UUID id;
    private String username;
    private String email;
    private String firstName;
    private String lastName;
    private String phoneNumber;
    private byte[] image;
    private LocalDateTime lastSeen;
    private boolean online;

    // For pagination metadata
    private boolean hasImage;

    // Computed property
    public boolean isHasImage() {
        return image != null && !(image.length ==0);
    }

    // Get formatted last seen text for frontend display
    public String getFormattedLastSeen() {
        if (lastSeen == null) {
            return "Never seen";
        }

        LocalDateTime now = LocalDateTime.now();
        java.time.Duration duration = java.time.Duration.between(lastSeen, now);

        long minutes = duration.toMinutes();
        long hours = duration.toHours();
        long days = duration.toDays();

        if (minutes < 1) {
            return "Online now";
        } else if (minutes < 60) {
            return String.format("Last seen %d minute%s ago", minutes, minutes > 1 ? "s" : "");
        } else if (hours < 24) {
            return String.format("Last seen %d hour%s ago", hours, hours > 1 ? "s" : "");
        } else if (days < 7) {
            return String.format("Last seen %d day%s ago", days, days > 1 ? "s" : "");
        } else {
            return String.format("Last seen %s", lastSeen.toLocalDate().toString());
        }
    }
}
