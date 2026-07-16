package com.grievanceconnect.grievanceconnect.controller;

import com.grievanceconnect.grievanceconnect.dto.request.LoginRequest;
import com.grievanceconnect.grievanceconnect.dto.response.LoginResponse;
import com.grievanceconnect.grievanceconnect.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;

    @PostMapping("/login")
    public LoginResponse login(@RequestBody LoginRequest request) {
        System.out.println("Login API Hit");
        return authService.login(request);
    }
}