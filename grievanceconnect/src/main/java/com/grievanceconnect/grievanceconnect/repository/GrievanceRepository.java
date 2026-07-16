package com.grievanceconnect.grievanceconnect.repository;

import com.grievanceconnect.grievanceconnect.entity.Grievance;
import com.grievanceconnect.grievanceconnect.entity.User;
import com.grievanceconnect.grievanceconnect.enums.GrievanceStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface GrievanceRepository extends JpaRepository<Grievance, Long> {

    List<Grievance> findByCreatedBy(User user);

    List<Grievance> findByCurrentHandler(User user);

    List<Grievance> findByAssignedStaff(User user);

    List<Grievance> findByStatusAndCreatedAtBeforeAndStaffReminderSentFalse(GrievanceStatus status, LocalDateTime dateTime);

    List<Grievance> findByStatusInAndCreatedAtBefore(List<GrievanceStatus> statuses, LocalDateTime dateTime);

    List<Grievance> findByStatusAndCreatedAtBefore(GrievanceStatus status, LocalDateTime dateTime);
}