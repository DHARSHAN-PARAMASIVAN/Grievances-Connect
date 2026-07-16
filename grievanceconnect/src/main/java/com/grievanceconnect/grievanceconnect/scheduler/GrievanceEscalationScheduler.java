package com.grievanceconnect.grievanceconnect.scheduler;

import com.grievanceconnect.grievanceconnect.entity.*;
import com.grievanceconnect.grievanceconnect.enums.GrievanceStatus;
import com.grievanceconnect.grievanceconnect.repository.GrievanceHistoryRepository;
import com.grievanceconnect.grievanceconnect.repository.GrievanceRepository;
import com.grievanceconnect.grievanceconnect.repository.NotificationRepository;
import com.grievanceconnect.grievanceconnect.repository.UserRepository;
import com.grievanceconnect.grievanceconnect.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class GrievanceEscalationScheduler {

    private final GrievanceRepository grievanceRepository;
    private final UserRepository userRepository;
    private final GrievanceHistoryRepository grievanceHistoryRepository;
    private final NotificationRepository notificationRepository;
    private final EmailService emailService;

    // Run every 30 seconds
    @Scheduled(fixedRate = 30000)
    @Transactional
    public void processAutoEscalations() {
        // Check if test mode is enabled via system property: -Descalation.test.mode=true
        boolean testMode = Boolean.getBoolean("escalation.test.mode") || "true".equalsIgnoreCase(System.getProperty("escalation.test.mode"));

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime reminderLimit = testMode ? now.minusMinutes(2) : now.minusDays(2);
        LocalDateTime hodLimit = testMode ? now.minusMinutes(4) : now.minusDays(4);
        LocalDateTime principalLimit = testMode ? now.minusMinutes(7) : now.minusDays(7);

        // 1. 2 Days - Staff Reminder: If status is OPEN and created before reminderLimit, and reminder not sent yet
        List<Grievance> openGrievancesForReminder = grievanceRepository.findByStatusAndCreatedAtBeforeAndStaffReminderSentFalse(
                GrievanceStatus.OPEN, reminderLimit
        );
        for (Grievance g : openGrievancesForReminder) {
            if (g.getAssignedStaff() != null) {
                System.out.println("Auto-escalation Scheduler: Sending reminder email to Staff " + g.getAssignedStaff().getEmail() + " for Grievance #" + g.getId());
                emailService.sendStaffNotification(
                        g.getAssignedStaff().getEmail(),
                        g.getAssignedStaff().getFullName(),
                        "[REMINDER] " + g.getTitle(),
                        "This grievance has been pending for over 2 days and requires your attention:\n\n" + g.getDescription()
                );
                createNotification(g.getAssignedStaff(), g, "Reminder: Student grievance '" + g.getTitle() + "' is pending your action.");
            }
            g.setStaffReminderSent(true);
            grievanceRepository.save(g);
        }

        // 2. 4 Days - Escalate to HOD: If status is OPEN or IN_PROGRESS and created before HOD limit
        List<Grievance> pendingGrievancesForHod = grievanceRepository.findByStatusInAndCreatedAtBefore(
                List.of(GrievanceStatus.OPEN, GrievanceStatus.IN_PROGRESS), hodLimit
        );
        for (Grievance g : pendingGrievancesForHod) {
            System.out.println("Auto-escalation Scheduler: Escalating Grievance #" + g.getId() + " to HOD");
            String oldStatus = g.getStatus().name();
            g.setStatus(GrievanceStatus.ESCALATED_TO_HOD);
            Grievance saved = grievanceRepository.save(g);

            // Log history (System Escalation)
            saveHistory(saved, null, oldStatus, GrievanceStatus.ESCALATED_TO_HOD.name(), "Auto-escalated to HOD due to inactivity");

            // Find HOD of the department
            User hod = userRepository.findAll().stream()
                    .filter(u -> u.getRole().getRoleName().name().equals("HOD")
                            && u.getDepartment() != null
                            && u.getDepartment().getId().equals(saved.getDepartment().getId()))
                    .findFirst()
                    .orElse(null);

            // Create Notifications
            createNotification(saved.getCreatedBy(), saved, "Your grievance '" + saved.getTitle() + "' has been automatically escalated to the HOD.");
            if (hod != null) {
                createNotification(hod, saved, "Escalated Grievance: '" + saved.getTitle() + "' has been escalated due to inactivity.");
                emailService.sendHodNotification(hod.getEmail(), hod.getFullName(), "[AUTO-ESCALATED] " + saved.getTitle(), saved.getDescription());
            }
            
            // Email Student
            emailService.sendGrievanceEscalatedEmail(
                    saved.getCreatedBy().getEmail(),
                    saved.getCreatedBy().getFullName(),
                    saved.getTitle()
            );

            if (saved.getAssignedStaff() != null) {
                emailService.sendStatusUpdateEmail(
                        saved.getAssignedStaff().getEmail(),
                        saved.getAssignedStaff().getFullName(),
                        saved.getTitle(),
                        "ESCALATED_TO_HOD",
                        "The grievance assigned to you has been automatically escalated to the HOD due to inactivity."
                );
            }

            User principal = userRepository.findAll().stream()
                    .filter(u -> u.getRole().getRoleName().name().equals("PRINCIPAL"))
                    .findFirst()
                    .orElse(null);
            if (principal != null) {
                emailService.sendStatusUpdateEmail(
                        principal.getEmail(),
                        principal.getFullName(),
                        saved.getTitle(),
                        "ESCALATED_TO_HOD",
                        "A grievance has been automatically escalated to HOD level due to inactivity."
                );
            }
        }

        // 3. 7 Days - Escalate to Principal: If status is ESCALATED_TO_HOD and created before Principal limit
        List<Grievance> pendingGrievancesForPrincipal = grievanceRepository.findByStatusAndCreatedAtBefore(
                GrievanceStatus.ESCALATED_TO_HOD, principalLimit
        );
        for (Grievance g : pendingGrievancesForPrincipal) {
            System.out.println("Auto-escalation Scheduler: Escalating Grievance #" + g.getId() + " to Principal");
            String oldStatus = g.getStatus().name();
            g.setStatus(GrievanceStatus.ESCALATED_TO_PRINCIPAL);
            Grievance saved = grievanceRepository.save(g);

            // Log history
            saveHistory(saved, null, oldStatus, GrievanceStatus.ESCALATED_TO_PRINCIPAL.name(), "Auto-escalated to Principal due to inactivity");

            // Find Principal
            User principal = userRepository.findAll().stream()
                    .filter(u -> u.getRole().getRoleName().name().equals("PRINCIPAL"))
                    .findFirst()
                    .orElse(null);

            // Create Notifications
            createNotification(saved.getCreatedBy(), saved, "Your grievance '" + saved.getTitle() + "' has been automatically escalated to the Principal.");
            if (principal != null) {
                createNotification(principal, saved, "Escalated Grievance: '" + saved.getTitle() + "' has been escalated to Principal level.");
                emailService.sendPrincipalNotification(principal.getEmail(), principal.getFullName(), "[AUTO-ESCALATED] " + saved.getTitle(), saved.getDescription());
            }

            // Email Student
            emailService.sendGrievanceEscalatedEmail(
                    saved.getCreatedBy().getEmail(),
                    saved.getCreatedBy().getFullName(),
                    saved.getTitle()
            );

            // Find HOD of the department
            User hodOfDept = userRepository.findAll().stream()
                    .filter(u -> u.getRole().getRoleName().name().equals("HOD")
                            && u.getDepartment() != null
                            && u.getDepartment().getId().equals(saved.getDepartment().getId()))
                    .findFirst()
                    .orElse(null);
            if (hodOfDept != null) {
                emailService.sendStatusUpdateEmail(
                        hodOfDept.getEmail(),
                        hodOfDept.getFullName(),
                        saved.getTitle(),
                        "ESCALATED_TO_PRINCIPAL",
                        "The grievance in your department has been automatically escalated to the Principal due to inactivity."
                );
            }

            if (saved.getAssignedStaff() != null) {
                emailService.sendStatusUpdateEmail(
                        saved.getAssignedStaff().getEmail(),
                        saved.getAssignedStaff().getFullName(),
                        saved.getTitle(),
                        "ESCALATED_TO_PRINCIPAL",
                        "The grievance assigned to you has been automatically escalated to the Principal due to inactivity."
                );
            }
        }
    }

    private void saveHistory(Grievance grievance, User changedBy, String oldStatus, String newStatus, String remarks) {
        grievanceHistoryRepository.save(
                GrievanceHistory.builder()
                        .grievance(grievance)
                        .changedBy(changedBy) // null indicates System Auto-escalation
                        .oldStatus(oldStatus)
                        .newStatus(newStatus)
                        .remarks(remarks)
                        .build()
        );
    }

    private void createNotification(User user, Grievance grievance, String message) {
        notificationRepository.save(
                Notification.builder()
                        .user(user)
                        .grievance(grievance)
                        .message(message)
                        .isRead(false)
                        .build()
        );
    }
}
