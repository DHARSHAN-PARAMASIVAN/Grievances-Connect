package com.grievanceconnect.grievanceconnect.controller;

import com.grievanceconnect.grievanceconnect.entity.User;
import com.grievanceconnect.grievanceconnect.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
public class PublicController {

    private final UserRepository userRepository;

    @GetMapping("/staff")
    public List<User> getAllStaff() {
        return userRepository.findAll()
                .stream()
                .filter(user -> user.getRole().getRoleName().name().equals("STAFF"))
                .toList();
    }

    @GetMapping("/test")
    public String test() {
        return "Public API Working";
    }
}