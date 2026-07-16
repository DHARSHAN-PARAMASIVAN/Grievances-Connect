package com.grievanceconnect.grievanceconnect.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.Map;

@Data
@Builder
public class AdminAnalyticsResponse {
    private Map<String, Long> departmentWiseComplaints;
    private Map<String, Long> monthlyComplaints;
    private Map<String, Long> categoryWiseComplaints;
    private Double resolutionPercentage;
    private Double averageResponseTimeHours;
}
