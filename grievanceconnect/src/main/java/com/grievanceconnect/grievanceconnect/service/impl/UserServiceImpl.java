package com.grievanceconnect.grievanceconnect.service.impl;

import com.grievanceconnect.grievanceconnect.dto.request.CreateUserRequest;
import com.grievanceconnect.grievanceconnect.entity.Department;
import com.grievanceconnect.grievanceconnect.entity.Role;
import com.grievanceconnect.grievanceconnect.entity.User;
import com.grievanceconnect.grievanceconnect.entity.Grievance;
import com.grievanceconnect.grievanceconnect.enums.RoleName;
import com.grievanceconnect.grievanceconnect.repository.DepartmentRepository;
import com.grievanceconnect.grievanceconnect.repository.RoleRepository;
import com.grievanceconnect.grievanceconnect.repository.UserRepository;
import com.grievanceconnect.grievanceconnect.repository.GrievanceRepository;
import com.grievanceconnect.grievanceconnect.repository.GrievanceCommentRepository;
import com.grievanceconnect.grievanceconnect.repository.GrievanceHistoryRepository;
import com.grievanceconnect.grievanceconnect.repository.NotificationRepository;
import com.grievanceconnect.grievanceconnect.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final DepartmentRepository departmentRepository;
    private final PasswordEncoder passwordEncoder;
    private final GrievanceRepository grievanceRepository;
    private final GrievanceCommentRepository grievanceCommentRepository;
    private final GrievanceHistoryRepository grievanceHistoryRepository;
    private final NotificationRepository notificationRepository;

    @Override
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }
    @Override
    public String createUser(CreateUserRequest request) {

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        Role role = roleRepository.findByRoleName(
                RoleName.valueOf(request.getRole().toUpperCase())
        ).orElseThrow(() -> new RuntimeException("Role not found"));

        Department department = null;

        if (request.getDepartmentId() != null) {
            department = departmentRepository.findById(
                    request.getDepartmentId()
            ).orElseThrow(() ->
                    new RuntimeException("Department not found"));
        }

        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .registerNumber(request.getRegisterNumber())
                .employeeId(request.getEmployeeId())
                .role(role)
                .department(department)
                .active(true)
                .build();

        userRepository.save(user);

        return "User created successfully";
    }

    @Override
    public List<com.grievanceconnect.grievanceconnect.entity.Role> getAllRoles() {
        return roleRepository.findAll();
    }

    @Override
    public String updateUser(Long id, CreateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!user.getEmail().equalsIgnoreCase(request.getEmail()) && userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        Role role = roleRepository.findByRoleName(
                RoleName.valueOf(request.getRole().toUpperCase())
        ).orElseThrow(() -> new RuntimeException("Role not found"));

        Department department = null;
        if (request.getDepartmentId() != null) {
            department = departmentRepository.findById(
                    request.getDepartmentId()
            ).orElseThrow(() -> new RuntimeException("Department not found"));
        }

        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        user.setRegisterNumber(request.getRegisterNumber());
        user.setEmployeeId(request.getEmployeeId());
        user.setRole(role);
        user.setDepartment(department);

        if (request.getPassword() != null && !request.getPassword().trim().isEmpty()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        userRepository.save(user);
        return "User updated successfully";
    }

    @Transactional
    @Override
    public String deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // 1. Delete notifications for this user
        notificationRepository.deleteByUser(user);

        // 2. Delete comments sent by this user
        grievanceCommentRepository.deleteBySender(user);

        // 3. Delete comments on grievances created by this user and then delete those grievances
        List<Grievance> createdGrievances = grievanceRepository.findByCreatedBy(user);
        for (Grievance g : createdGrievances) {
            grievanceCommentRepository.deleteByGrievance(g);
            grievanceHistoryRepository.deleteByGrievance(g);
            grievanceRepository.delete(g);
        }

        // 4. Null out handler references on other grievances
        List<Grievance> handledGrievances = grievanceRepository.findByCurrentHandler(user);
        for (Grievance g : handledGrievances) {
            g.setCurrentHandler(null);
            grievanceRepository.save(g);
        }

        List<Grievance> assignedGrievances = grievanceRepository.findByAssignedStaff(user);
        for (Grievance g : assignedGrievances) {
            g.setAssignedStaff(null);
            if (g.getCurrentHandler() == user) {
                g.setCurrentHandler(null);
            }
            grievanceRepository.save(g);
        }

        // 5. Delete history entries changed by this user
        grievanceHistoryRepository.deleteByChangedBy(user);

        // 6. Delete the user
        userRepository.delete(user);

        return "User deleted successfully";
    }
}