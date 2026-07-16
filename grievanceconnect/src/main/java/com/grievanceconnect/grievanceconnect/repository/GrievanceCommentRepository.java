package com.grievanceconnect.grievanceconnect.repository;

import com.grievanceconnect.grievanceconnect.entity.GrievanceComment;
import com.grievanceconnect.grievanceconnect.entity.User;
import com.grievanceconnect.grievanceconnect.entity.Grievance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GrievanceCommentRepository extends JpaRepository<GrievanceComment, Long> {
    List<GrievanceComment> findByGrievanceIdOrderByCreatedAtAsc(Long grievanceId);
    void deleteBySender(User sender);
    void deleteByGrievance(Grievance grievance);
}
