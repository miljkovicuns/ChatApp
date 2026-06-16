package com.ftn.sr192024.messenger.services;

import com.ftn.sr192024.messenger.models.User;
import com.ftn.sr192024.messenger.models.dto.FilterUserRequest;
import com.ftn.sr192024.messenger.models.dto.UserResponseDTO;
import com.ftn.sr192024.messenger.repository.UserRepository;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RequiredArgsConstructor
@Service
public class UserService {

    private final UserRepository userRepository;

    public List<User> findAllByIds(List<UUID> userIds) {
        return userRepository.findAllById(userIds);
    }

    public User findById(UUID id) {
        return userRepository.findById(id).orElse(null);
    }

    public List<User> findAll(){
        return userRepository.findAll();
    }

    public void save(User user) {
        userRepository.save(user);
    }

    public Page<UserResponseDTO> getFilteredUsers(FilterUserRequest filter, UUID currentUserId) {
        LocalDateTime offlineThreshold = LocalDateTime.now().minusMinutes(5);

        // Determine sort direction
        Sort.Direction direction = "desc".equalsIgnoreCase(filter.getSortOrder())
                ? Sort.Direction.DESC : Sort.Direction.ASC;

        // Set sort field
        String sortField = switch (filter.getSortBy() != null ? filter.getSortBy() : "name") {
            case "lastSeen", "recent" -> "lastOnline";
            default -> "firstName";
        };

        // For "recent" sorting, always use DESC
        if ("recent".equals(filter.getSortBy())) {
            direction = Sort.Direction.DESC;
        }

        Pageable pageable = PageRequest.of(
                filter.getPage() != null ? filter.getPage() : 0,
                filter.getSize() != null ? filter.getSize() : 20,
                Sort.by(direction, sortField)
        );

        // Get users with basic search
        Page<User> usersPage = userRepository.searchUsers(
                currentUserId,
                filter.getSearchQuery(),
                pageable
        );

        // Apply filters in memory
        List<User> filteredUsers = usersPage.getContent().stream()
                .filter(user -> {
                    // Filter by image presence
                    if (filter.getHasImage() != null && !filter.getHasImage().equals("all")) {
                        boolean hasImage = user.getImage() != null && user.getImage().length > 0;
                        if (filter.getHasImage().equals("hasImage") && !hasImage) return false;
                        if (filter.getHasImage().equals("noImage") && hasImage) return false;
                    }

                    // Filter by last seen date
                    if (filter.getDateFrom() != null) {
                        if (user.getLastOnline() == null) return false;
                        if (!user.getLastOnline().isAfter(filter.getDateFrom())) return false;
                    }

                    // Filter by offline status
                    if (filter.isFilterByOffline()) {
                        if (user.getLastOnline() != null && user.getLastOnline().isAfter(offlineThreshold)) {
                            return false;
                        }
                    }

                    return true;
                })
                .toList();

        // Create new page with filtered results
        return new PageImpl<>(
                filteredUsers.stream()
                        .map(this::convertToDTO)
                        .collect(Collectors.toList()),
                pageable,
                filteredUsers.size()
        );
    }

    private UserResponseDTO convertToDTO(User user) {
        UserResponseDTO dto = new UserResponseDTO();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setFirstName(user.getFirstName());
        dto.setLastName(user.getLastName());
        dto.setPhoneNumber(user.getPhoneNumber());
        dto.setImage(user.getImage());
        dto.setLastSeen(user.getLastOnline());
        dto.setOnline(isUserOnline(user));
        return dto;
    }

    private boolean isUserOnline(User user) {
        if (user.getLastOnline() == null) return false;
        return user.getLastOnline().isAfter(LocalDateTime.now().minusMinutes(5));
    }


}
