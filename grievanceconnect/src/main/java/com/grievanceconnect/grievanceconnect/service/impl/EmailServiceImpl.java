package com.grievanceconnect.grievanceconnect.service.impl;

import com.grievanceconnect.grievanceconnect.service.EmailService;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    private void sendEmail(String to, String subject, String html) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(html, true);

            mailSender.send(message);
            System.out.println("Email sent successfully to: " + to);
        } catch (Exception e) {
            System.err.println("Email sending failed: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private String buildEmailTemplate(String recipientName, String title, String status, String statusColor, String bodyHeader, String bodyContent) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body {
                        font-family: 'Segoe UI', Arial, sans-serif;
                        background-color: #050c1e;
                        margin: 0;
                        padding: 20px;
                        color: #f8fafc;
                    }
                    .email-container {
                        max-width: 600px;
                        background-color: #09132d;
                        border: 1px solid #1a253e;
                        border-radius: 14px;
                        overflow: hidden;
                        margin: 0 auto;
                        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.4);
                    }
                    .header {
                        background: linear-gradient(135deg, #050c1e 0%%, #09132d 100%%);
                        padding: 24px;
                        text-align: center;
                        border-bottom: 2px solid #ffc700;
                    }
                    .header h1 {
                        margin: 0;
                        color: #ffc700;
                        font-size: 22px;
                        letter-spacing: -0.02em;
                        font-weight: 700;
                    }
                    .content {
                        padding: 30px;
                    }
                    .content h2 {
                        color: #ffffff;
                        font-size: 18px;
                        margin-top: 0;
                        margin-bottom: 16px;
                    }
                    .content p {
                        color: #a5b4fc;
                        font-size: 15px;
                        line-height: 1.6;
                        margin: 0 0 20px 0;
                    }
                    .details-table {
                        width: 100%%;
                        border-collapse: collapse;
                        margin: 20px 0;
                        background-color: #030713;
                        border-radius: 8px;
                        overflow: hidden;
                        border: 1px solid #1a253e;
                    }
                    .details-table td {
                        padding: 12px 16px;
                        border-bottom: 1px solid #1a253e;
                        font-size: 14px;
                    }
                    .details-table tr:last-child td {
                        border-bottom: none;
                    }
                    .label {
                        color: #8fa0ca;
                        font-weight: 600;
                        width: 30%%;
                    }
                    .value {
                        color: #f8fafc;
                    }
                    .badge {
                        display: inline-block;
                        padding: 4px 10px;
                        font-size: 12px;
                        font-weight: 700;
                        border-radius: 6px;
                        text-transform: uppercase;
                    }
                    .footer {
                        background-color: #030713;
                        padding: 20px;
                        text-align: center;
                        border-top: 1px solid #1a253e;
                        font-size: 12px;
                        color: #64748b;
                    }
                </style>
            </head>
            <body>
                <div class="email-container">
                    <div class="header">
                        <h1 style="color: #ffc700;">GrievanceConnect Portal</h1>
                    </div>
                    <div class="content">
                        <h2 style="color: #ffffff;">%s</h2>
                        <p style="color: #94a3b8;">Hello <b>%s</b>,</p>
                        <p style="color: #94a3b8;">%s</p>
                        <table class="details-table">
                            <tr>
                                <td class="label">Grievance Title</td>
                                <td class="value"><b>%s</b></td>
                            </tr>
                            <tr>
                                <td class="label">Current Status</td>
                                <td class="value">
                                    <span class="badge" style="background-color: %s; color: #ffffff;">%s</span>
                                </td>
                            </tr>
                        </table>
                    </div>
                    <div class="footer">
                        This is an automated system notification. Please do not reply directly to this mail.<br>
                        &copy; 2026 GrievanceConnect. All rights reserved.
                    </div>
                </div>
            </body>
            </html>
            """.formatted(bodyHeader, recipientName, bodyContent, title, statusColor, status);
    }

    @Override
    public void sendGrievanceSubmittedEmail(
            String studentEmail,
            String studentName,
            String title,
            String description) {

        String bodyHeader = "Grievance Submitted Successfully ✅";
        String bodyContent = "Your grievance has been submitted successfully and is now under review. We will notify you automatically when the status changes.";

        String html = buildEmailTemplate(studentName, title, "OPEN", "#3b82f6", bodyHeader, bodyContent);
        sendEmail(studentEmail, "Grievance Submitted: " + title, html);
    }

    @Override
    public void sendGrievanceEscalatedEmail(
            String receiverEmail,
            String receiverName,
            String title) {

        String bodyHeader = "Grievance Escalated 📌";
        String bodyContent = "A grievance has been escalated to a higher level. Please log into the portal to review and take necessary action.";

        String html = buildEmailTemplate(receiverName, title, "ESCALATED", "#ef4444", bodyHeader, bodyContent);
        sendEmail(receiverEmail, "Grievance Escalated: " + title, html);
    }

    @Override
    public void sendGrievanceResolvedEmail(
            String studentEmail,
            String studentName,
            String title) {

        String bodyHeader = "Grievance Resolved 🎉";
        String bodyContent = "Your grievance has been resolved successfully. Thank you for your patience and for using GrievanceConnect.";

        String html = buildEmailTemplate(studentName, title, "RESOLVED", "#10b981", bodyHeader, bodyContent);
        sendEmail(studentEmail, "Your Grievance Has Been Resolved: " + title, html);
    }

    @Override
    public void sendGrievanceInProgressEmail(
            String studentEmail,
            String studentName,
            String title) {

        String bodyHeader = "Grievance In Progress ⚙️";
        String bodyContent = "A staff member has started working on your grievance. We will continue to update you as we resolve this matter.";

        String html = buildEmailTemplate(studentName, title, "IN PROGRESS", "#f59e0b", bodyHeader, bodyContent);
        sendEmail(studentEmail, "Your Grievance is Now In Progress: " + title, html);
    }

    @Override
    public void sendGrievanceClosedEmail(
            String studentEmail,
            String studentName,
            String title) {

        String bodyHeader = "Grievance Closed 🔒";
        String bodyContent = "Your grievance has been closed by the Principal. If you have any further concerns, you may file a new grievance.";

        String html = buildEmailTemplate(studentName, title, "CLOSED", "#64748b", bodyHeader, bodyContent);
        sendEmail(studentEmail, "Your Grievance Has Been Closed: " + title, html);
    }

    @Override
    public void sendStaffNotification(String staffEmail, String staffName, String title, String description) {
        String bodyHeader = "New Grievance Assigned 📩";
        String bodyContent = "A new grievance has been assigned to you. Please login to GrievanceConnect to review details and take necessary action.<br><br><b>Description:</b><br>" + description;

        String html = buildEmailTemplate(staffName, title, "OPEN", "#3b82f6", bodyHeader, bodyContent);
        sendEmail(staffEmail, "New Grievance Assigned", html);
    }

    @Override
    public void sendHodNotification(String hodEmail, String hodName, String title, String description) {
        String bodyHeader = "Grievance Escalated to HOD 📌";
        String bodyContent = "A grievance has been escalated to you for further action. Please login to GrievanceConnect to review details.<br><br><b>Description:</b><br>" + description;

        String html = buildEmailTemplate(hodName, title, "ESCALATED TO HOD", "#f59e0b", bodyHeader, bodyContent);
        sendEmail(hodEmail, "Grievance Escalated to HOD", html);
    }

    @Override
    public void sendPrincipalNotification(String principalEmail, String principalName, String title, String description) {
        String bodyHeader = "Grievance Escalated to Principal 🚨";
        String bodyContent = "A grievance has been escalated to principal level. Please login to GrievanceConnect to review details.<br><br><b>Description:</b><br>" + description;

        String html = buildEmailTemplate(principalName, title, "ESCALATED TO PRINCIPAL", "#dc2626", bodyHeader, bodyContent);
        sendEmail(principalEmail, "Grievance Escalated to Principal", html);
    }

    @Override
    public void sendStatusUpdateEmail(
            String email,
            String recipientName,
            String title,
            String status,
            String message) {

        String bodyHeader = "Grievance Status Update 📢";
        String bodyContent = message;

        String statusColor = "#3b82f6";
        if ("RESOLVED".equals(status)) statusColor = "#10b981";
        else if ("IN_PROGRESS".equals(status)) statusColor = "#f59e0b";
        else if ("CLOSED".equals(status)) statusColor = "#64748b";
        else if (status != null && status.contains("ESCALATED")) statusColor = "#ef4444";

        String html = buildEmailTemplate(recipientName, title, status, statusColor, bodyHeader, bodyContent);
        sendEmail(email, "Grievance Status Update: " + status, html);
    }
}