package com.grievanceconnect.grievanceconnect.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class GrievanceCommentResponse {
    private Long id;
    private String commentText;
    private String senderName;
    private String senderRole;
    private LocalDateTime createdAt;
}
