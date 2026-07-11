package com.ftn.sr192024.messenger.services;

import com.ftn.sr192024.messenger.models.dto.AnalyticsSummaryDto;
import com.ftn.sr192024.messenger.models.dto.AnalyticsTimeSeriesDto;
import com.ftn.sr192024.messenger.models.dto.TopGroupDto;
import com.ftn.sr192024.messenger.models.dto.TopUserDto;
import com.ftn.sr192024.messenger.repository.ChatRepository;
import com.ftn.sr192024.messenger.repository.MessageRepository;
import com.ftn.sr192024.messenger.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
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

    public List<AnalyticsTimeSeriesDto> getTimeSeriesAnalytics(LocalDateTime start, LocalDateTime end, String groupBy) {
        String dateFormat = getDateFormat(groupBy);
        List<Object[]> regData = userRepository.countNewUsersGroupedByPeriod(start, end, dateFormat);
        List<Object[]> msgData = messageRepository.countMessagesGroupedByPeriod(start, end, dateFormat);
        List<Object[]> activeData = messageRepository.countActiveUsersGroupedByPeriod(start, end, dateFormat);
        List<Object[]> groupData = chatRepository.countGroupsCreatedGroupedByPeriod(start, end, dateFormat);

        // Build a map: period -> DTO
        Map<String, AnalyticsTimeSeriesDto> map = new LinkedHashMap<>();
        // First, collect all periods from all lists
        Set<String> periods = new TreeSet<>();
        addPeriods(periods, regData);
        addPeriods(periods, msgData);
        addPeriods(periods, activeData);
        addPeriods(periods, groupData);

        // Initialize DTOs for each period
        for (String p : periods) {
            AnalyticsTimeSeriesDto dto = new AnalyticsTimeSeriesDto();
            dto.setPeriod(p);   // just the raw string
            map.put(p, dto);
        }

        // Fill counts
        fillCounts(map, regData, "reg");
        fillCounts(map, msgData, "msg");
        fillCounts(map, activeData, "active");
        fillCounts(map, groupData, "group");

        // Compute cumulative totalUsers (running sum)
        long cumulativeUsers = 0;
        for (AnalyticsTimeSeriesDto dto : map.values()) {
            cumulativeUsers += dto.getTotalUsers(); // if totalUsers is new registrations
            dto.setTotalUsers(cumulativeUsers);
        }

        return new ArrayList<>(map.values());
    }

    private void addPeriods(Set<String> periods, List<Object[]> data) {
        for (Object[] row : data) {
            periods.add((String) row[0]);
        }
    }

    private void fillCounts(Map<String, AnalyticsTimeSeriesDto> map, List<Object[]> data, String type) {
        for (Object[] row : data) {
            String period = (String) row[0];
            long count = (Long) row[1];
            AnalyticsTimeSeriesDto dto = map.get(period);
            if (dto != null) {
                switch (type) {
                    case "reg": dto.setTotalUsers(count); break;
                    case "msg": dto.setTotalMessages(count); break;
                    case "active": dto.setActiveUsers(count); break;
                    case "group": dto.setGroupsCreated(count); break;
                }
            }
        }
    }

    private String getDateFormat(String groupBy) {
        String g = groupBy.toLowerCase();
        if ("day".equals(g) || "daily".equals(g)) {
            return "%Y-%m-%d";
        } else if ("week".equals(g) || "weekly".equals(g)) {
            return "%Y-%u";
        } else if ("month".equals(g) || "monthly".equals(g)) {
            return "%Y-%m";
        } else if ("year".equals(g) || "yearly".equals(g)) {
            return "%Y";
        } else {
            return "%Y-%m-%d";
        }
    }
}