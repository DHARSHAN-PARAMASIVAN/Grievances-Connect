package com.grievanceconnect.grievanceconnect.controller;

import com.grievanceconnect.grievanceconnect.dto.response.GrievanceResponse;
import com.grievanceconnect.grievanceconnect.service.GrievanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/staff")
@RequiredArgsConstructor
public class StaffController {

    private final GrievanceService grievanceService;

    @GetMapping("/dashboard")
    public String dashboard() {
        return "Welcome to Staff Dashboard";
    }

    @GetMapping("/grievances")
    public List<GrievanceResponse> getDepartmentGrievances(
            Authentication authentication) {

        return grievanceService.getDepartmentGrievances(
                authentication.getName()
        );
    }

    @PutMapping("/grievances/{id}/in-progress")
    public GrievanceResponse markInProgress(
            @PathVariable Long id,
            Authentication authentication) {

        return grievanceService.markInProgress(
                id,
                authentication.getName()
        );
    }

    @PutMapping("/grievances/{id}/resolve")
    public GrievanceResponse resolveGrievance(
            @PathVariable Long id,
            Authentication authentication) {

        return grievanceService.resolveGrievance(
                id,
                authentication.getName()
        );
    }

    @PutMapping("/grievances/{id}/escalate")
    public GrievanceResponse escalateToHod(
            @PathVariable Long id,
            Authentication authentication) {

        return grievanceService.escalateToHod(
                id,
                authentication.getName()
        );
    }
}