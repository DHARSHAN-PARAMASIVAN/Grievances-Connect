package com.grievanceconnect.grievanceconnect.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class GrievanceHistoryResponse {

    private String oldStatus;
    private String newStatus;
    private String remarks;
    private String changedBy;
    private LocalDateTime changedAt;
}