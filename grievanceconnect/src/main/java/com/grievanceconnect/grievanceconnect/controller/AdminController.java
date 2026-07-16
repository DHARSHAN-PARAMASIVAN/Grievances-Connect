package com.grievanceconnect.grievanceconnect.controller;
import com.grievanceconnect.grievanceconnect.dto.response.GrievanceResponse;
import com.grievanceconnect.grievanceconnect.entity.User;
import java.util.List;
import com.grievanceconnect.grievanceconnect.dto.request.CreateUserRequest;
import com.grievanceconnect.grievanceconnect.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import com.grievanceconnect.grievanceconnect.service.GrievanceService;
import com.grievanceconnect.grievanceconnect.dto.response.AdminAnalyticsResponse;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserService userService;
    private final GrievanceService grievanceService;
    @GetMapping("/dashboard")
    public String dashboard() {
        return "Updated Admin Dashboard";
    }

    @PostMapping("/users")
    public String createUser(
            @RequestBody CreateUserRequest request) {
        System.out.println("CREATE USER API HIT");
        return userService.createUser(request);
    }

    @PutMapping("/users/{id}")
    public String updateUser(
            @PathVariable Long id,
            @RequestBody CreateUserRequest request) {
        return userService.updateUser(id, request);
    }

    @DeleteMapping("/users/{id}")
    public String deleteUser(
            @PathVariable Long id) {
        return userService.deleteUser(id);
    }
    @GetMapping("/all-users")
    public List<User> getAllUsers() {
        return userService.getAllUsers();
    }

    @GetMapping("/grievances")
    public List<GrievanceResponse> getAllGrievances() {
        return grievanceService.getAllGrievances();
    }

    @GetMapping("/analytics")
    public AdminAnalyticsResponse getAnalytics() {
        return grievanceService.getAdminAnalytics();
    }

    @GetMapping("/roles")
    public List<com.grievanceconnect.grievanceconnect.entity.Role> getAllRoles() {
        return userService.getAllRoles();
    }

    @GetMapping("/test")
    public String test() {
        return "Admin test working";
    }
}