package com.ftn.sr192024.messenger.controllers;

import com.ftn.sr192024.messenger.models.dto.AnalyticsSummaryDto;
import com.ftn.sr192024.messenger.models.dto.AnalyticsTimeSeriesDto;
import com.ftn.sr192024.messenger.services.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/admin/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping
    public ResponseEntity<AnalyticsSummaryDto> getAnalytics(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        AnalyticsSummaryDto summary = analyticsService.getAnalytics(startDate, endDate);
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/time-series")
    public ResponseEntity<List<AnalyticsTimeSeriesDto>> getTimeSeriesAnalytics(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(defaultValue = "day") String groupBy) {
        List<AnalyticsTimeSeriesDto> data = analyticsService.getTimeSeriesAnalytics(startDate, endDate, groupBy);
        return ResponseEntity.ok(data);
    }
}