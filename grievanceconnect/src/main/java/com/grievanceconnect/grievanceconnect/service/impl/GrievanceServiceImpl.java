package com.grievanceconnect.grievanceconnect.service.impl;

import com.grievanceconnect.grievanceconnect.dto.request.*;
import com.grievanceconnect.grievanceconnect.dto.response.*;
import com.grievanceconnect.grievanceconnect.entity.*;
import com.grievanceconnect.grievanceconnect.enums.*;
import com.grievanceconnect.grievanceconnect.repository.*;
import com.grievanceconnect.grievanceconnect.service.EmailService;
import com.grievanceconnect.grievanceconnect.service.GrievanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.*;
import java.util.stream.Collectors;
import java.time.*;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
public class GrievanceServiceImpl implements GrievanceService {
    private final EmailService emailService;
    private final GrievanceRepository grievanceRepository;
    private final UserRepository userRepository;
    private final GrievanceHistoryRepository grievanceHistoryRepository;
    private final NotificationRepository notificationRepository;
    private final GrievanceCommentRepository grievanceCommentRepository;
    @Override
    public GrievanceResponse createGrievance(CreateGrievanceRequest request, String studentEmail) {
        User student = userRepository.findByEmail(studentEmail)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        User assignedStaff = null;
        if (request.getStaffId() != null) {
            assignedStaff = userRepository.findById(request.getStaffId())
                    .orElseThrow(() -> new RuntimeException("Selected staff not found"));

            if (!assignedStaff.getRole().getRoleName().name().equals("STAFF")) {
                throw new RuntimeException("Selected user is not a staff");
            }
        }

        Grievance grievance = Grievance.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .category(GrievanceCategory.valueOf(request.getCategory().toUpperCase()))
                .anonymous(request.getAnonymous())
                .status(GrievanceStatus.OPEN)
                .createdBy(student)
                .department(student.getDepartment())
                .assignedStaff(assignedStaff)
                .priority(request.getPriority() != null ? GrievancePriority.valueOf(request.getPriority().toUpperCase()) : GrievancePriority.MEDIUM)
                .build();

        if (!request.getAnonymous()) {
            grievance.setStudentName(student.getFullName());
        }

        Grievance saved = grievanceRepository.save(grievance);

        emailService.sendGrievanceSubmittedEmail(
                student.getEmail(),
                student.getFullName(),
                saved.getTitle(),
                saved.getDescription()
        );

        if (assignedStaff != null) {
            emailService.sendStaffNotification(
                    assignedStaff.getEmail(),
                    assignedStaff.getFullName(),
                    saved.getTitle(),
                    saved.getDescription()
            );
        }

        User hod = getDepartmentHod(student.getDepartment());
        if (hod != null) {
            emailService.sendHodNotification(
                    hod.getEmail(),
                    hod.getFullName(),
                    "New Department Grievance Submitted",
                    "A new grievance has been submitted by student " + student.getFullName() + ":\n\n" + saved.getDescription()
            );
        }

        User principal = getPrincipal();
        if (principal != null) {
            emailService.sendPrincipalNotification(
                    principal.getEmail(),
                    principal.getFullName(),
                    "New Grievance Submitted (College-Wide)",
                    "A new grievance has been submitted by student " + student.getFullName() + " in department " + (student.getDepartment() != null ? student.getDepartment().getDepartmentName() : "General") + ":\n\n" + saved.getDescription()
            );
        }

        return mapToResponse(saved);
    }
    @Override
    public List<NotificationResponse> getNotifications(String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return notificationRepository.findByUserOrderByCreatedAtDesc(user)
                .stream()
                .map(notification -> NotificationResponse.builder()
                        .id(notification.getId())
                        .message(notification.getMessage())
                        .isRead(notification.getIsRead())
                        .createdAt(notification.getCreatedAt())
                        .grievanceId(notification.getGrievance().getId())
                        .build())
                .toList();
    }

    @Override
    public void markNotificationAsRead(Long notificationId, String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));

        if (!notification.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("You are not allowed to update this notification");
        }

        notification.setIsRead(true);
        notificationRepository.save(notification);
    }
    @Override
    public List<GrievanceHistoryResponse> getGrievanceHistory(Long grievanceId) {

        Grievance grievance = grievanceRepository.findById(grievanceId)
                .orElseThrow(() -> new RuntimeException("Grievance not found"));

        return grievanceHistoryRepository.findByGrievance(grievance)
                .stream()
                .map(history -> GrievanceHistoryResponse.builder()
                        .oldStatus(history.getOldStatus())
                        .newStatus(history.getNewStatus())
                        .remarks(history.getRemarks())
                        .changedBy(history.getChangedBy().getFullName())
                        .changedAt(history.getChangedAt())
                        .build())
                .toList();
    }
    @Override
    public List<GrievanceResponse> getMyGrievances(String studentEmail) {
        User student = userRepository.findByEmail(studentEmail)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        return grievanceRepository.findByCreatedBy(student)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public GrievanceResponse getGrievanceById(Long id, String studentEmail) {
        User student = userRepository.findByEmail(studentEmail)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        Grievance grievance = grievanceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Grievance not found"));

        if (!grievance.getCreatedBy().getId().equals(student.getId())) {
            throw new RuntimeException("You are not allowed to view this grievance");
        }

        return mapToResponse(grievance);
    }

    @Override
    public List<GrievanceResponse> getDepartmentGrievances(String staffEmail) {
        User staff = userRepository.findByEmail(staffEmail)
                .orElseThrow(() -> new RuntimeException("Staff not found"));

        return grievanceRepository.findAll()
                .stream()
                .filter(g -> g.getDepartment().getId().equals(staff.getDepartment().getId()))
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public GrievanceResponse markInProgress(Long grievanceId, String staffEmail) {
        Grievance grievance = grievanceRepository.findById(grievanceId)
                .orElseThrow(() -> new RuntimeException("Grievance not found"));

        User staff = userRepository.findByEmail(staffEmail)
                .orElseThrow(() -> new RuntimeException("Staff not found"));

        String oldStatus = grievance.getStatus().name();

        grievance.setStatus(GrievanceStatus.IN_PROGRESS);
        Grievance saved = grievanceRepository.save(grievance);

        saveHistory(saved, staff, oldStatus, GrievanceStatus.IN_PROGRESS.name(),
                "Marked as In Progress");
        createNotification(
                saved.getCreatedBy(),
                saved,
                "Your grievance '" + saved.getTitle() + "' is now In Progress."
        );
        emailService.sendGrievanceInProgressEmail(
                saved.getCreatedBy().getEmail(),
                saved.getCreatedBy().getFullName(),
                saved.getTitle()
        );

        emailService.sendStatusUpdateEmail(
                staff.getEmail(),
                staff.getFullName(),
                saved.getTitle(),
                "IN_PROGRESS",
                "You have marked this grievance as IN PROGRESS."
        );

        User hod = getDepartmentHod(saved.getDepartment());
        if (hod != null) {
            emailService.sendStatusUpdateEmail(
                    hod.getEmail(),
                    hod.getFullName(),
                    saved.getTitle(),
                    "IN_PROGRESS",
                    "A grievance in your department has been marked as IN PROGRESS by staff " + staff.getFullName() + "."
            );
        }

        User principal = getPrincipal();
        if (principal != null) {
            emailService.sendStatusUpdateEmail(
                    principal.getEmail(),
                    principal.getFullName(),
                    saved.getTitle(),
                    "IN_PROGRESS",
                    "Grievance in department " + (saved.getDepartment() != null ? saved.getDepartment().getDepartmentName() : "General") + " has been marked as IN PROGRESS."
            );
        }

        return mapToResponse(saved);
    }

    @Override
    public GrievanceResponse resolveGrievance(Long grievanceId, String staffEmail) {
        Grievance grievance = grievanceRepository.findById(grievanceId)
                .orElseThrow(() -> new RuntimeException("Grievance not found"));

        User staff = userRepository.findByEmail(staffEmail)
                .orElseThrow(() -> new RuntimeException("Staff not found"));

        String oldStatus = grievance.getStatus().name();

        grievance.setStatus(GrievanceStatus.RESOLVED);
        Grievance saved = grievanceRepository.save(grievance);

        saveHistory(saved, staff, oldStatus, GrievanceStatus.RESOLVED.name(),
                "Resolved by Staff");
        createNotification(
                saved.getCreatedBy(),
                saved,
                "Your grievance '" + saved.getTitle() + "' has been resolved."
        );
        emailService.sendGrievanceResolvedEmail(
                saved.getCreatedBy().getEmail(),
                saved.getCreatedBy().getFullName(),
                saved.getTitle()
        );

        emailService.sendStatusUpdateEmail(
                staff.getEmail(),
                staff.getFullName(),
                saved.getTitle(),
                "RESOLVED",
                "You have successfully marked this grievance as RESOLVED."
        );

        User hod = getDepartmentHod(saved.getDepartment());
        if (hod != null) {
            emailService.sendStatusUpdateEmail(
                    hod.getEmail(),
                    hod.getFullName(),
                    saved.getTitle(),
                    "RESOLVED",
                    "A grievance in your department has been RESOLVED by staff " + staff.getFullName() + "."
            );
        }

        User principal = getPrincipal();
        if (principal != null) {
            emailService.sendStatusUpdateEmail(
                    principal.getEmail(),
                    principal.getFullName(),
                    saved.getTitle(),
                    "RESOLVED",
                    "A grievance has been RESOLVED."
            );
        }

        return mapToResponse(saved);
    }

    @Override
    public GrievanceResponse createGrievanceWithFile(
            String title,
            String description,
            String category,
            Boolean anonymous,
            String studentName,
            MultipartFile proofFile,
            Long staffId,
            String priority,
            String studentEmail
    ) throws IOException {

        User student = userRepository.findByEmail(studentEmail)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        User assignedStaff = userRepository.findById(staffId)
                .orElseThrow(() -> new RuntimeException("Selected staff not found"));

        if (!assignedStaff.getRole().getRoleName().name().equals("STAFF")) {
            throw new RuntimeException("Selected user is not a staff");
        }

        Grievance grievance = new Grievance();

        grievance.setTitle(title);
        grievance.setDescription(description);
        grievance.setCategory(GrievanceCategory.valueOf(category.toUpperCase()));
        grievance.setAnonymous(anonymous);
        grievance.setStatus(GrievanceStatus.OPEN);
        grievance.setCreatedBy(student);
        grievance.setDepartment(student.getDepartment());
        grievance.setAssignedStaff(assignedStaff);
        grievance.setPriority(priority != null ? GrievancePriority.valueOf(priority.toUpperCase()) : GrievancePriority.MEDIUM);

        if (!anonymous) {
            grievance.setStudentName(studentName);
        }

        if (proofFile != null && !proofFile.isEmpty()) {
            String fileName =
                    System.currentTimeMillis() + "_" + proofFile.getOriginalFilename();

            Path uploadPath = Paths.get("uploads");
            Files.createDirectories(uploadPath);

            Path filePath = uploadPath.resolve(fileName);

            Files.copy(
                    proofFile.getInputStream(),
                    filePath,
                    StandardCopyOption.REPLACE_EXISTING
            );

            grievance.setProofFileName(fileName);
            grievance.setProofFilePath(filePath.toString());
        }

        Grievance saved = grievanceRepository.save(grievance);

        emailService.sendGrievanceSubmittedEmail(
                student.getEmail(),
                student.getFullName(),
                saved.getTitle(),
                saved.getDescription()
        );

        emailService.sendStaffNotification(
                assignedStaff.getEmail(),
                assignedStaff.getFullName(),
                saved.getTitle(),
                saved.getDescription()
        );

        User hod = getDepartmentHod(student.getDepartment());
        if (hod != null) {
            emailService.sendHodNotification(
                    hod.getEmail(),
                    hod.getFullName(),
                    "New Department Grievance Submitted",
                    "A new grievance has been submitted by student " + student.getFullName() + ":\n\n" + saved.getDescription()
            );
        }

        User principal = getPrincipal();
        if (principal != null) {
            emailService.sendPrincipalNotification(
                    principal.getEmail(),
                    principal.getFullName(),
                    "New Grievance Submitted (College-Wide)",
                    "A new grievance has been submitted by student " + student.getFullName() + " in department " + (student.getDepartment() != null ? student.getDepartment().getDepartmentName() : "General") + ":\n\n" + saved.getDescription()
            );
        }

        return mapToResponse(saved);
    }
    @Override
    public List<GrievanceResponse> getAllGrievances() {
        try {
            return grievanceRepository.findAll()
                    .stream()
                    .map(this::mapToResponse)
                    .toList();
        } catch (Exception e) {
            System.err.println("CRITICAL ERROR IN getAllGrievances: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
    @Override
    public GrievanceResponse escalateToHod(Long grievanceId, String staffEmail) {
        Grievance grievance = grievanceRepository.findById(grievanceId)
                .orElseThrow(() -> new RuntimeException("Grievance not found"));

        User staff = userRepository.findByEmail(staffEmail)
                .orElseThrow(() -> new RuntimeException("Staff not found"));

        String oldStatus = grievance.getStatus().name();

        grievance.setStatus(GrievanceStatus.ESCALATED_TO_HOD);
        Grievance saved = grievanceRepository.save(grievance);

        saveHistory(saved, staff, oldStatus, GrievanceStatus.ESCALATED_TO_HOD.name(),
                "Escalated to HOD");
        createNotification(
                saved.getCreatedBy(),
                saved,
                "Your grievance '" + saved.getTitle() + "' has been escalated to HOD."
        );
        User hod = userRepository.findAll()
                .stream()
                .filter(u ->
                        u.getRole().getRoleName().name().equals("HOD")
                                && u.getDepartment() != null
                                && u.getDepartment().getId().equals(saved.getDepartment().getId())
                )
                .findFirst()
                .orElse(null);

        if (hod != null) {
            emailService.sendHodNotification(
                    hod.getEmail(),
                    hod.getFullName(),
                    saved.getTitle(),
                    saved.getDescription()
            );
        }
        emailService.sendGrievanceEscalatedEmail(
                saved.getCreatedBy().getEmail(),
                saved.getCreatedBy().getFullName(),
                saved.getTitle()
        );

        emailService.sendStatusUpdateEmail(
                staff.getEmail(),
                staff.getFullName(),
                saved.getTitle(),
                "ESCALATED_TO_HOD",
                "You have successfully escalated this grievance to the HOD."
        );

        User principal = getPrincipal();
        if (principal != null) {
            emailService.sendStatusUpdateEmail(
                    principal.getEmail(),
                    principal.getFullName(),
                    saved.getTitle(),
                    "ESCALATED_TO_HOD",
                    "A grievance has been escalated to HOD level."
            );
        }

        return mapToResponse(saved);
    }

    @Override
    public List<GrievanceResponse> getHodGrievances(String hodEmail) {
        User hod = userRepository.findByEmail(hodEmail)
                .orElseThrow(() -> new RuntimeException("HOD not found"));

        return grievanceRepository.findAll()
                .stream()
                .filter(g -> g.getDepartment().getId().equals(hod.getDepartment().getId()))
                .filter(g -> g.getStatus() == GrievanceStatus.ESCALATED_TO_HOD)
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public GrievanceResponse resolveByHod(Long grievanceId, String hodEmail) {
        Grievance grievance = grievanceRepository.findById(grievanceId)
                .orElseThrow(() -> new RuntimeException("Grievance not found"));

        User hod = userRepository.findByEmail(hodEmail)
                .orElseThrow(() -> new RuntimeException("HOD not found"));

        String oldStatus = grievance.getStatus().name();

        grievance.setStatus(GrievanceStatus.RESOLVED);
        Grievance saved = grievanceRepository.save(grievance);

        saveHistory(saved, hod, oldStatus, GrievanceStatus.RESOLVED.name(),
                "Resolved by HOD");
        emailService.sendGrievanceResolvedEmail(
                saved.getCreatedBy().getEmail(),
                saved.getCreatedBy().getFullName(),
                saved.getTitle()
        );

        emailService.sendStatusUpdateEmail(
                hod.getEmail(),
                hod.getFullName(),
                saved.getTitle(),
                "RESOLVED",
                "You have successfully marked this grievance as RESOLVED."
        );

        if (saved.getAssignedStaff() != null) {
            emailService.sendStatusUpdateEmail(
                    saved.getAssignedStaff().getEmail(),
                    saved.getAssignedStaff().getFullName(),
                    saved.getTitle(),
                    "RESOLVED",
                    "The grievance assigned to you has been resolved by HOD " + hod.getFullName() + "."
            );
        }

        User principal = getPrincipal();
        if (principal != null) {
            emailService.sendStatusUpdateEmail(
                    principal.getEmail(),
                    principal.getFullName(),
                    saved.getTitle(),
                    "RESOLVED",
                    "Grievance resolved by HOD " + hod.getFullName() + "."
            );
        }

        return mapToResponse(saved);
    }

    @Override
    public GrievanceResponse escalateToPrincipal(Long grievanceId, String hodEmail) {
        Grievance grievance = grievanceRepository.findById(grievanceId)
                .orElseThrow(() -> new RuntimeException("Grievance not found"));

        User hod = userRepository.findByEmail(hodEmail)
                .orElseThrow(() -> new RuntimeException("HOD not found"));

        String oldStatus = grievance.getStatus().name();

        grievance.setStatus(GrievanceStatus.ESCALATED_TO_PRINCIPAL);
        Grievance saved = grievanceRepository.save(grievance);

        saveHistory(saved, hod, oldStatus, GrievanceStatus.ESCALATED_TO_PRINCIPAL.name(),
                "Escalated to Principal");
        User principal = userRepository.findAll()
                .stream()
                .filter(u -> u.getRole().getRoleName().name().equals("PRINCIPAL"))
                .findFirst()
                .orElse(null);

        if (principal != null) {
            emailService.sendPrincipalNotification(
                    principal.getEmail(),
                    principal.getFullName(),
                    saved.getTitle(),
                    saved.getDescription()
            );
        }
        createNotification(
                saved.getCreatedBy(),
                saved,
                "Your grievance '" + saved.getTitle() + "' has been escalated to Principal."
        );
        emailService.sendGrievanceEscalatedEmail(
                saved.getCreatedBy().getEmail(),
                saved.getCreatedBy().getFullName(),
                saved.getTitle()
        );

        emailService.sendStatusUpdateEmail(
                hod.getEmail(),
                hod.getFullName(),
                saved.getTitle(),
                "ESCALATED_TO_PRINCIPAL",
                "You have successfully escalated this grievance to the Principal."
        );

        if (saved.getAssignedStaff() != null) {
            emailService.sendStatusUpdateEmail(
                    saved.getAssignedStaff().getEmail(),
                    saved.getAssignedStaff().getFullName(),
                    saved.getTitle(),
                    "ESCALATED_TO_PRINCIPAL",
                    "The grievance assigned to you has been escalated to the Principal by HOD " + hod.getFullName() + "."
            );
        }

        return mapToResponse(saved);
    }

    @Override
    public List<GrievanceResponse> getPrincipalGrievances(String principalEmail) {
        return grievanceRepository.findAll()
                .stream()
                .filter(g -> g.getStatus() == GrievanceStatus.ESCALATED_TO_PRINCIPAL)
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public GrievanceResponse resolveByPrincipal(Long grievanceId, String principalEmail) {
        Grievance grievance = grievanceRepository.findById(grievanceId)
                .orElseThrow(() -> new RuntimeException("Grievance not found"));

        User principal = userRepository.findByEmail(principalEmail)
                .orElseThrow(() -> new RuntimeException("Principal not found"));

        String oldStatus = grievance.getStatus().name();

        grievance.setStatus(GrievanceStatus.RESOLVED);
        Grievance saved = grievanceRepository.save(grievance);

        saveHistory(saved, principal, oldStatus, GrievanceStatus.RESOLVED.name(),
                "Resolved by Principal");
        emailService.sendGrievanceResolvedEmail(
                saved.getCreatedBy().getEmail(),
                saved.getCreatedBy().getFullName(),
                saved.getTitle()
        );

        emailService.sendStatusUpdateEmail(
                principal.getEmail(),
                principal.getFullName(),
                saved.getTitle(),
                "RESOLVED",
                "You have successfully marked this grievance as RESOLVED."
        );

        User hod = getDepartmentHod(saved.getDepartment());
        if (hod != null) {
            emailService.sendStatusUpdateEmail(
                    hod.getEmail(),
                    hod.getFullName(),
                    saved.getTitle(),
                    "RESOLVED",
                    "The grievance in your department has been resolved by Principal " + principal.getFullName() + "."
            );
        }

        if (saved.getAssignedStaff() != null) {
            emailService.sendStatusUpdateEmail(
                    saved.getAssignedStaff().getEmail(),
                    saved.getAssignedStaff().getFullName(),
                    saved.getTitle(),
                    "RESOLVED",
                    "The grievance assigned to you has been resolved by Principal " + principal.getFullName() + "."
            );
        }

        return mapToResponse(saved);
    }

    @Override
    public GrievanceResponse closeByPrincipal(Long grievanceId, String principalEmail) {
        Grievance grievance = grievanceRepository.findById(grievanceId)
                .orElseThrow(() -> new RuntimeException("Grievance not found"));

        User principal = userRepository.findByEmail(principalEmail)
                .orElseThrow(() -> new RuntimeException("Principal not found"));

        String oldStatus = grievance.getStatus().name();

        grievance.setStatus(GrievanceStatus.CLOSED);
        Grievance saved = grievanceRepository.save(grievance);

        saveHistory(saved, principal, oldStatus, GrievanceStatus.CLOSED.name(),
                "Closed by Principal");

        createNotification(
                saved.getCreatedBy(),
                saved,
                "Your grievance '" + saved.getTitle() + "' has been closed by the Principal."
        );
        emailService.sendGrievanceClosedEmail(
                saved.getCreatedBy().getEmail(),
                saved.getCreatedBy().getFullName(),
                saved.getTitle()
        );

        emailService.sendStatusUpdateEmail(
                principal.getEmail(),
                principal.getFullName(),
                saved.getTitle(),
                "CLOSED",
                "You have successfully marked this grievance as CLOSED."
        );

        User hod = getDepartmentHod(saved.getDepartment());
        if (hod != null) {
            emailService.sendStatusUpdateEmail(
                    hod.getEmail(),
                    hod.getFullName(),
                    saved.getTitle(),
                    "CLOSED",
                    "The grievance in your department has been closed by Principal " + principal.getFullName() + "."
            );
        }

        if (saved.getAssignedStaff() != null) {
            emailService.sendStatusUpdateEmail(
                    saved.getAssignedStaff().getEmail(),
                    saved.getAssignedStaff().getFullName(),
                    saved.getTitle(),
                    "CLOSED",
                    "The grievance assigned to you has been closed by Principal " + principal.getFullName() + "."
            );
        }

        return mapToResponse(saved);
    }

    private void saveHistory(
            Grievance grievance,
            User changedBy,
            String oldStatus,
            String newStatus,
            String remarks) {

        grievanceHistoryRepository.save(
                GrievanceHistory.builder()
                        .grievance(grievance)
                        .changedBy(changedBy)
                        .oldStatus(oldStatus)
                        .newStatus(newStatus)
                        .remarks(remarks)
                        .build()
        );
    }

    private GrievanceResponse mapToResponse(Grievance grievance) {
        boolean isAnon = Boolean.TRUE.equals(grievance.getAnonymous());
        return GrievanceResponse.builder()
                .id(grievance.getId())
                .title(grievance.getTitle())
                .description(grievance.getDescription())
                .category(grievance.getCategory() != null ? grievance.getCategory().name() : "OTHER")
                .status(grievance.getStatus() != null ? grievance.getStatus().name() : "OPEN")
                .anonymous(isAnon)

                .submittedBy(
                        isAnon
                                ? "Anonymous"
                                : (grievance.getCreatedBy() != null ? grievance.getCreatedBy().getFullName() : "Unknown")
                )

                .studentName(grievance.getStudentName())
                .proofFileName(grievance.getProofFileName())
                .proofFilePath(grievance.getProofFilePath())

                .departmentName(
                        grievance.getDepartment() != null
                                ? grievance.getDepartment().getDepartmentName()
                                : null
                )
                .priority(grievance.getPriority() != null ? grievance.getPriority().name() : "MEDIUM")

                .createdAt(grievance.getCreatedAt())
                .updatedAt(grievance.getUpdatedAt())
                .build();
    }

    private User getDepartmentHod(Department department) {
        if (department == null) return null;
        return userRepository.findAll()
                .stream()
                .filter(u -> u.getRole().getRoleName().name().equals("HOD")
                        && u.getDepartment() != null
                        && u.getDepartment().getId().equals(department.getId()))
                .findFirst()
                .orElse(null);
    }

    private User getPrincipal() {
        return userRepository.findAll()
                .stream()
                .filter(u -> u.getRole().getRoleName().name().equals("PRINCIPAL"))
                .findFirst()
                .orElse(null);
    }

    private void createNotification(
            User user,
            Grievance grievance,
            String message) {

        notificationRepository.save(
                Notification.builder()
                        .user(user)
                        .grievance(grievance)
                        .message(message)
                        .isRead(false)
                        .build()
        );
    }

    @Override
    public List<GrievanceCommentResponse> getComments(Long grievanceId, String userEmail) {
        userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<GrievanceComment> comments = grievanceCommentRepository.findByGrievanceIdOrderByCreatedAtAsc(grievanceId);
        return comments.stream()
                .map(c -> GrievanceCommentResponse.builder()
                        .id(c.getId())
                        .commentText(c.getCommentText())
                        .senderName(c.getSender().getFullName())
                        .senderRole(c.getSender().getRole().getRoleName().name())
                        .createdAt(c.getCreatedAt())
                        .build())
                .toList();
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public GrievanceCommentResponse addComment(Long grievanceId, String userEmail, GrievanceCommentRequest request) {
        User sender = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Grievance grievance = grievanceRepository.findById(grievanceId)
                .orElseThrow(() -> new RuntimeException("Grievance not found"));

        GrievanceComment comment = GrievanceComment.builder()
                .grievance(grievance)
                .sender(sender)
                .commentText(request.getCommentText())
                .build();

        GrievanceComment savedComment = grievanceCommentRepository.save(comment);

        User student = grievance.getCreatedBy();
        User staff = grievance.getAssignedStaff();

        if (sender.getId().equals(student.getId())) {
            if (staff != null) {
                createNotification(staff, grievance, "New comment from student on grievance '" + grievance.getTitle() + "'.");
            }
        } else {
            createNotification(student, grievance, "New comment from support staff on your grievance '" + grievance.getTitle() + "'.");
        }

        return GrievanceCommentResponse.builder()
                .id(savedComment.getId())
                .commentText(savedComment.getCommentText())
                .senderName(sender.getFullName())
                .senderRole(sender.getRole().getRoleName().name())
                .createdAt(savedComment.getCreatedAt())
                .build();
    }

    @Override
    public AdminAnalyticsResponse getAdminAnalytics() {
        try {
            List<Grievance> grievances = grievanceRepository.findAll();

            Map<String, Long> deptWise = grievances.stream()
                    .filter(g -> g.getDepartment() != null && g.getDepartment().getDepartmentName() != null)
                    .collect(Collectors.groupingBy(
                            g -> g.getDepartment().getDepartmentName(),
                            Collectors.counting()
                    ));

            Map<String, Long> monthly = grievances.stream()
                    .collect(Collectors.groupingBy(
                            g -> {
                                LocalDateTime date = g.getCreatedAt();
                                return date != null ? date.getMonth().name() + " " + date.getYear() : "UNKNOWN";
                            },
                            Collectors.counting()
                    ));

            Map<String, Long> categoryWise = grievances.stream()
                    .collect(Collectors.groupingBy(
                            g -> g.getCategory() != null ? g.getCategory().name() : "OTHER",
                            Collectors.counting()
                    ));

            long total = grievances.size();
            long resolvedOrClosed = grievances.stream()
                    .filter(g -> g.getStatus() != null && (g.getStatus() == GrievanceStatus.RESOLVED || g.getStatus() == GrievanceStatus.CLOSED))
                    .count();
            double resolutionPct = total > 0 ? ((double) resolvedOrClosed / total) * 100.0 : 0.0;

            List<Grievance> resolvedItems = grievances.stream()
                    .filter(g -> g.getStatus() != null && (g.getStatus() == GrievanceStatus.RESOLVED || g.getStatus() == GrievanceStatus.CLOSED))
                    .filter(g -> g.getCreatedAt() != null && g.getUpdatedAt() != null)
                    .toList();

            double avgResponseTime = 0.0;
            if (!resolvedItems.isEmpty()) {
                long totalHours = 0;
                for (Grievance g : resolvedItems) {
                    totalHours += ChronoUnit.HOURS.between(g.getCreatedAt(), g.getUpdatedAt());
                }
                avgResponseTime = (double) totalHours / resolvedItems.size();
            }

            return AdminAnalyticsResponse.builder()
                    .departmentWiseComplaints(deptWise)
                    .monthlyComplaints(monthly)
                    .categoryWiseComplaints(categoryWise)
                    .resolutionPercentage(resolutionPct)
                    .averageResponseTimeHours(avgResponseTime)
                    .build();
        } catch (Exception e) {
            System.err.println("CRITICAL: Error in getAdminAnalytics: " + e.getMessage());
            e.printStackTrace();
            return AdminAnalyticsResponse.builder()
                    .departmentWiseComplaints(new HashMap<>())
                    .monthlyComplaints(new HashMap<>())
                    .categoryWiseComplaints(new HashMap<>())
                    .resolutionPercentage(0.0)
                    .averageResponseTimeHours(0.0)
                    .build();
        }
    }
}