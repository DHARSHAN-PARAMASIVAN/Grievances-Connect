package com.grievanceconnect.grievanceconnect.dto.request;

import lombok.Data;

@Data
public class CreateUserRequest {

    private String fullName;
    private String email;
    private String password;
    private String role;

    private Long departmentId;

    private String registerNumber;
    private String employeeId;
    private String phone;
}