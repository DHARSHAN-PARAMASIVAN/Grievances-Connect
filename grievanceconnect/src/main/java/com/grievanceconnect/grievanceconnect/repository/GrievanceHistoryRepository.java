package com.grievanceconnect.grievanceconnect.repository;

import com.grievanceconnect.grievanceconnect.entity.Grievance;
import com.grievanceconnect.grievanceconnect.entity.GrievanceHistory;
import com.grievanceconnect.grievanceconnect.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GrievanceHistoryRepository
        extends JpaRepository<GrievanceHistory, Long> {

    List<GrievanceHistory> findByGrievance(Grievance grievance);
    void deleteByChangedBy(User changedBy);
    void deleteByGrievance(Grievance grievance);
}