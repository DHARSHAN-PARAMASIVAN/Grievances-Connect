package com.grievanceconnect.grievanceconnect.controller;

import com.grievanceconnect.grievanceconnect.dto.response.GrievanceResponse;
import com.grievanceconnect.grievanceconnect.service.GrievanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/hod")
@RequiredArgsConstructor
public class HodController {

    private final GrievanceService grievanceService;

    @GetMapping("/dashboard")
    public String dashboard() {
        return "Welcome to HOD Dashboard";
    }

    @GetMapping("/grievances")
    public List<GrievanceResponse> getHodGrievances(Authentication authentication) {
        return grievanceService.getHodGrievances(authentication.getName());
    }

    @PutMapping("/grievances/{id}/resolve")
    public GrievanceResponse resolveByHod(
            @PathVariable Long id,
            Authentication authentication) {
        return grievanceService.resolveByHod(id, authentication.getName());
    }

    @PutMapping("/grievances/{id}/escalate")
    public GrievanceResponse escalateToPrincipal(
            @PathVariable Long id,
            Authentication authentication) {
        return grievanceService.escalateToPrincipal(id, authentication.getName());
    }
}