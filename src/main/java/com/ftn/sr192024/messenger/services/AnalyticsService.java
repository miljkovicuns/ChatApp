package com.ftn.sr192024.messenger.services;

import com.ftn.sr192024.messenger.models.dto.AnalyticsSummaryDto;
import com.ftn.sr192024.messenger.models.dto.TopGroupDto;
import com.ftn.sr192024.messenger.models.dto.TopUserDto;
import com.ftn.sr192024.messenger.repository.ChatRepository;
import com.ftn.sr192024.messenger.repository.MessageRepository;
import com.ftn.sr192024.messenger.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final UserRepository userRepository;
    private final MessageRepository messageRepository;
    private final ChatRepository chatRepository;

    public AnalyticsSummaryDto getAnalytics(LocalDateTime start, LocalDateTime end) {
        // Total users registered before or during the period
        long totalUsers = userRepository.countByCreatedAtBeforeOrEqual(end); // implement

        // Active users: users who sent at least one message in the period
        long activeUsers = messageRepository.countDistinctSendersInPeriod(start, end);

        // Total messages (text + voice) - we assume all messages are text for now; voice later
        long totalMessages = messageRepository.countByDateOfSendingBetween(start, end);

        // Total groups created in the period
        long totalGroupsCreated = chatRepository.countByGroupChatTrueAndDateCreatedBetween(start, end);

        // Top 10 users by message count
        List<TopUserDto> topUsers = messageRepository.findTopUsersByMessageCount(start, end, 10)
                .stream()
                .map(obj -> new TopUserDto(
                        UUID.nameUUIDFromBytes(((byte[]) obj[0])),
                        (String) obj[1],
                        (String) obj[2] + " " + (String) obj[3],
                        (Long) obj[4]
                ))
                .collect(Collectors.toList());

        // Top 10 groups by message count
        List<TopGroupDto> topGroups = messageRepository.findTopGroupsByMessageCount(start, end, 10)
                .stream()
                .map(obj -> new TopGroupDto(
                        UUID.nameUUIDFromBytes(((byte[]) obj[0])),
                        (String) obj[1],
                        (Long) obj[2]
                ))
                .collect(Collectors.toList());

        return new AnalyticsSummaryDto(
                totalUsers,
                activeUsers,
                totalMessages,
                totalGroupsCreated,
                topUsers,
                topGroups
        );
    }
}