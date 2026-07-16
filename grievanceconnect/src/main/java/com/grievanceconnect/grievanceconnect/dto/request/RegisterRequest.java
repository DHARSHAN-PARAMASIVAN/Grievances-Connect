package com.grievanceconnect.grievanceconnect.dto.request;

import lombok.Data;

@Data
public class RegisterRequest {

    private String name;

    private String email;

    private String password;

    private String role;

    private Long departmentId;
}