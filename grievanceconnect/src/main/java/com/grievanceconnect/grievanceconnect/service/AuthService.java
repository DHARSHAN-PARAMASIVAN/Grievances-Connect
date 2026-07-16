package com.grievanceconnect.grievanceconnect.service;

import com.grievanceconnect.grievanceconnect.dto.request.LoginRequest;
import com.grievanceconnect.grievanceconnect.dto.response.LoginResponse;

public interface AuthService {

    LoginResponse login(LoginRequest request);
}