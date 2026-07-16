package com.grievanceconnect.grievanceconnect.dto.request;

import lombok.Data;

@Data
public class CreateGrievanceRequest {

    private String title;
    private String description;
    private String category;
    private Boolean anonymous;
    private Long staffId;
    private String priority;

}