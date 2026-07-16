package com.grievanceconnect.grievanceconnect.controller;

import com.grievanceconnect.grievanceconnect.dto.request.GrievanceCommentRequest;
import com.grievanceconnect.grievanceconnect.dto.response.GrievanceCommentResponse;
import com.grievanceconnect.grievanceconnect.service.GrievanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/grievances")
@RequiredArgsConstructor
public class GrievanceCommentController {

    private final GrievanceService grievanceService;

    @GetMapping("/{id}/comments")
    public List<GrievanceCommentResponse> getComments(
            @PathVariable Long id,
            Authentication authentication) {
        return grievanceService.getComments(id, authentication.getName());
    }

    @PostMapping("/{id}/comments")
    public GrievanceCommentResponse addComment(
            @PathVariable Long id,
            @RequestBody GrievanceCommentRequest request,
            Authentication authentication) {
        return grievanceService.addComment(id, authentication.getName(), request);
    }
}
