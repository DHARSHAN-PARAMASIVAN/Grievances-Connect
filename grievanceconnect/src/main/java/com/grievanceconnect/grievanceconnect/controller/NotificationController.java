package com.grievanceconnect.grievanceconnect.controller;

import com.grievanceconnect.grievanceconnect.dto.response.NotificationResponse;
import com.grievanceconnect.grievanceconnect.service.GrievanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final GrievanceService grievanceService;

    @GetMapping
    public List<NotificationResponse> getMyNotifications(Authentication authentication) {
        return grievanceService.getNotifications(authentication.getName());
    }

    @PutMapping("/{id}/read")
    public String markAsRead(@PathVariable Long id, Authentication authentication) {
        grievanceService.markNotificationAsRead(id, authentication.getName());
        return "Notification marked as read";
    }
}
