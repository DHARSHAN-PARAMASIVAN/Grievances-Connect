package com.grievanceconnect.grievanceconnect.controller;

import com.grievanceconnect.grievanceconnect.dto.response.GrievanceResponse;
import com.grievanceconnect.grievanceconnect.service.GrievanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/principal")
@RequiredArgsConstructor
public class PrincipalController {

    private final GrievanceService grievanceService;

    @GetMapping("/dashboard")
    public String dashboard() {
        return "Welcome to Principal Dashboard";
    }

    @GetMapping("/grievances")
    public List<GrievanceResponse> getPrincipalGrievances(
            Authentication authentication) {

        return grievanceService.getPrincipalGrievances(
                authentication.getName()
        );
    }

    @PutMapping("/grievances/{id}/resolve")
    public GrievanceResponse resolveByPrincipal(
            @PathVariable Long id,
            Authentication authentication) {

        return grievanceService.resolveByPrincipal(
                id,
                authentication.getName()
        );
    }

    @PutMapping("/grievances/{id}/close")
    public GrievanceResponse closeByPrincipal(
            @PathVariable Long id,
            Authentication authentication) {

        return grievanceService.closeByPrincipal(
                id,
                authentication.getName()
        );
    }
}