package com.grievanceconnect.grievanceconnect.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class GrievanceResponse {

    private Long id;
    private String title;
    private String description;
    private String category;
    private String status;
    private Boolean anonymous;
    private String studentName;
    private String proofFileName;
    private String proofFilePath;
    private String submittedBy;
    private String departmentName;
    private String priority;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}