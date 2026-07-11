package com.ftn.sr192024.messenger.models.dto;

import com.ftn.sr192024.messenger.models.RoleEnum;
import com.ftn.sr192024.messenger.models.User;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Data
@Getter
@Setter
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
    private RoleEnum role;
    private boolean active;

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

    private static final DateTimeFormatter FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    // ✅ The fromEntity method for User
    public static UserResponseDTO fromEntity(User user) {
        if (user == null) return null;

        UserResponseDTO dto = new UserResponseDTO();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setFirstName(user.getFirstName());
        dto.setLastName(user.getLastName());
        dto.setEmail(user.getEmail());
        dto.setPhoneNumber(user.getPhoneNumber());
        dto.setImage(user.getImage());

        // Calculate online status (online if last seen within 5 minutes)
        if (user.getLastOnline() != null) {
            dto.setOnline(user.getLastOnline()
                    .isAfter(LocalDateTime.now().minusMinutes(5)));
            dto.setLastSeen(user.getLastOnline());
        }

        return dto;
    }
}
