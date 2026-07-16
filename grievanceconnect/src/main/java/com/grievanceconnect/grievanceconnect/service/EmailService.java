package com.grievanceconnect.grievanceconnect.service;

public interface EmailService {
    void sendGrievanceSubmittedEmail(
            String studentEmail,
            String studentName,
            String title,
            String description
    );
    void sendGrievanceEscalatedEmail(String receiverEmail, String receiverName, String title);
    void sendGrievanceResolvedEmail(String studentEmail, String studentName, String title);
    void sendGrievanceInProgressEmail(String studentEmail, String studentName, String title);
    void sendGrievanceClosedEmail(String studentEmail, String studentName, String title);
    void sendStaffNotification(String staffEmail, String staffName, String title, String description);

    void sendHodNotification(String hodEmail, String hodName, String title, String description);

    void sendPrincipalNotification(String principalEmail, String principalName, String title, String description);

    void sendStatusUpdateEmail(
            String email,
            String recipientName,
            String title,
            String status,
            String message
    );
}