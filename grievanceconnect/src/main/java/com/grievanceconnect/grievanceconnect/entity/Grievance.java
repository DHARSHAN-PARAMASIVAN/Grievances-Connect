package com.grievanceconnect.grievanceconnect.entity;

import com.grievanceconnect.grievanceconnect.enums.*;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "grievances")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Grievance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, length = 3000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private GrievanceCategory category;
    private String studentName;

    private String proofFileName;

    private String proofFilePath;
    @Column(nullable = false)
    private Boolean anonymous;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private GrievanceStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private GrievancePriority priority;

    @Builder.Default
    @Column(nullable = false)
    private Boolean staffReminderSent = false;

    // Student who submitted the grievance
    @ManyToOne
    @JoinColumn(name = "created_by")
    private User createdBy;

    // Current person handling the grievance
    @ManyToOne
    @JoinColumn(name = "current_handler")
    private User currentHandler;

    // Department to which grievance belongs
    @ManyToOne
    @JoinColumn(name = "department_id")
    private Department department;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    @ManyToOne
    @JoinColumn(name = "assigned_staff_id")
    private User assignedStaff;
    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}