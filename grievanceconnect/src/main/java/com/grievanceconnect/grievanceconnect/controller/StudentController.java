package com.grievanceconnect.grievanceconnect.controller;

import com.grievanceconnect.grievanceconnect.dto.request.CreateGrievanceRequest;
import com.grievanceconnect.grievanceconnect.dto.response.GrievanceHistoryResponse;
import com.grievanceconnect.grievanceconnect.dto.response.GrievanceResponse;
import com.grievanceconnect.grievanceconnect.dto.response.NotificationResponse;
import com.grievanceconnect.grievanceconnect.entity.User;
import com.grievanceconnect.grievanceconnect.repository.UserRepository;
import com.grievanceconnect.grievanceconnect.service.GrievanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/student")
@RequiredArgsConstructor
public class StudentController {

    private final UserRepository userRepository;
    private final GrievanceService grievanceService;

    @GetMapping("/dashboard")
    public String dashboard() {
        return "Welcome to Student Dashboard";
    }

    @GetMapping("/staff")
    public List<User> getStaffList(Authentication authentication) {
        User student = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Student not found"));

        return userRepository.findAll()
                .stream()
                .filter(user ->
                        user.getRole().getRoleName().name().equals("STAFF")
                                && user.getDepartment() != null
                                && student.getDepartment() != null
                                && user.getDepartment().getId().equals(student.getDepartment().getId())
                )
                .toList();
    }

    @GetMapping("/grievances")
    public List<GrievanceResponse> getMyGrievances(Authentication authentication) {
        return grievanceService.getMyGrievances(authentication.getName());
    }

    @PostMapping(value = "/grievances", consumes = "multipart/form-data")
    public GrievanceResponse createGrievance(
            @RequestParam String title,
            @RequestParam String description,
            @RequestParam String category,
            @RequestParam Boolean anonymous,
            @RequestParam(required = false) String studentName,
            @RequestParam(required = false) MultipartFile proofFile,
            @RequestParam Long staffId,
            @RequestParam(defaultValue = "MEDIUM") String priority,
            Authentication authentication
    ) throws IOException {
        return grievanceService.createGrievanceWithFile(
                title,
                description,
                category,
                anonymous,
                studentName,
                proofFile,
                staffId,
                priority,
                authentication.getName()
        );
    }

    @PostMapping(value = "/grievances", consumes = "application/json")
    public GrievanceResponse createGrievance(
            @RequestBody CreateGrievanceRequest request,
            Authentication authentication
    ) {
        return grievanceService.createGrievance(request, authentication.getName());
    }

    @GetMapping("/grievances/{id}")
    public GrievanceResponse getGrievanceById(
            @PathVariable Long id,
            Authentication authentication) {
        return grievanceService.getGrievanceById(id, authentication.getName());
    }

    @GetMapping("/grievances/{id}/history")
    public List<GrievanceHistoryResponse> getGrievanceHistory(@PathVariable Long id) {
        return grievanceService.getGrievanceHistory(id);
    }

    @GetMapping("/notifications")
    public List<NotificationResponse> getNotifications(Authentication authentication) {
        return grievanceService.getNotifications(authentication.getName());
    }

    @PutMapping("/notifications/{id}/read")
    public String markNotificationAsRead(
            @PathVariable Long id,
            Authentication authentication) {
        grievanceService.markNotificationAsRead(id, authentication.getName());
        return "Notification marked as read";
    }
}