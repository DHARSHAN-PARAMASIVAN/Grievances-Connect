package com.grievanceconnect.grievanceconnect.controller;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/debug")
public class DebugController {

    @GetMapping("/me")
    public String me(Authentication authentication) {
        if (authentication == null) {
            return "Authentication is NULL";
        }

        return "User: " + authentication.getName()
                + " | Authorities: "
                + authentication.getAuthorities();
    }
}