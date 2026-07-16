package com.grievanceconnect.grievanceconnect.repository;

import com.grievanceconnect.grievanceconnect.entity.Role;
import com.grievanceconnect.grievanceconnect.enums.RoleName;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RoleRepository extends JpaRepository<Role, Long> {

    Optional<Role> findByRoleName(RoleName roleName);

}