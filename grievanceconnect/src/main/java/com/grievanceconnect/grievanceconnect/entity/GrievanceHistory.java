package com.grievanceconnect.grievanceconnect.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "grievance_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GrievanceHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String oldStatus;

    private String newStatus;

    private String remarks;

    private LocalDateTime changedAt;

    @ManyToOne
    @JoinColumn(name = "grievance_id")
    private Grievance grievance;

    @ManyToOne
    @JoinColumn(name = "changed_by")
    private User changedBy;

    @PrePersist
    public void prePersist() {
        changedAt = LocalDateTime.now();
    }
}