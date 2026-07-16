package com.grievanceconnect.grievanceconnect.config;

import com.grievanceconnect.grievanceconnect.entity.Department;
import com.grievanceconnect.grievanceconnect.entity.Role;
import com.grievanceconnect.grievanceconnect.entity.User;
import com.grievanceconnect.grievanceconnect.enums.RoleName;
import com.grievanceconnect.grievanceconnect.repository.DepartmentRepository;
import com.grievanceconnect.grievanceconnect.repository.RoleRepository;
import com.grievanceconnect.grievanceconnect.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {

        // Insert Roles
        for (RoleName roleName : RoleName.values()) {
            if (roleRepository.findByRoleName(roleName).isEmpty()) {
                roleRepository.save(
                        Role.builder()
                                .roleName(roleName)
                                .build()
                );
            }
        }

        // Insert Departments
        String[][] departments = {
                {"Computer Science", "CSE"},
                {"Information Technology", "IT"},
                {"Artificial Intelligence and Data Science", "AIDS"},
                {"Electronics and Communication", "ECE"},
                {"Electrical and Electronics", "EEE"},
                {"Mechanical", "MECH"},
                {"Civil", "CIVIL"}
        };

        for (String[] dept : departments) {
            if (departmentRepository
                    .findByDepartmentName(dept[0])
                    .isEmpty()) {

                departmentRepository.save(
                        Department.builder()
                                .departmentName(dept[0])
                                .departmentCode(dept[1])
                                .build()
                );
            }
        }

        // Insert Default Admin
        if (!userRepository.existsByEmail("admin@college.com")) {

            Role adminRole = roleRepository
                    .findByRoleName(RoleName.ADMIN)
                    .orElseThrow(() ->
                            new RuntimeException("Admin role not found"));

            User admin = User.builder()
                    .fullName("System Admin")
                    .email("admin@college.com")
                    .password(passwordEncoder.encode("admin123"))
                    .role(adminRole)
                    .active(true)
                    .build();

            userRepository.save(admin);
        }
    }
}