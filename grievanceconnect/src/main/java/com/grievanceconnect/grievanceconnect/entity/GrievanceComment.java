package com.grievanceconnect.grievanceconnect.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "grievance_comments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GrievanceComment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 3000)
    private String commentText;

    private LocalDateTime createdAt;

    @ManyToOne
    @JoinColumn(name = "grievance_id", nullable = false)
    private Grievance grievance;

    @ManyToOne
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
    }
}
