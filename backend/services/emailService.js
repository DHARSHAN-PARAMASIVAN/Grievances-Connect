const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // 587 uses STARTTLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const sendEmail = async (to, subject, html) => {
  try {
    const mailOptions = {
      from: process.env.SMTP_USER,
      to,
      subject,
      html
    };
    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to: ${to}`);
  } catch (error) {
    console.error(`Email sending failed to ${to}:`, error.message);
  }
};

const buildEmailTemplate = (recipientName, title, status, statusColor, bodyHeader, bodyContent) => {
  return `
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
                background: linear-gradient(135deg, #050c1e 0%, #09132d 100%);
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
                width: 100%;
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
                width: 30%;
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
                <h2 style="color: #ffffff;">${bodyHeader}</h2>
                <p style="color: #94a3b8;">Hello <b>${recipientName}</b>,</p>
                <p style="color: #94a3b8;">${bodyContent}</p>
                <table class="details-table">
                    <tr>
                        <td class="label">Grievance Title</td>
                        <td class="value"><b>${title}</b></td>
                    </tr>
                    <tr>
                        <td class="label">Current Status</td>
                        <td class="value">
                            <span class="badge" style="background-color: ${statusColor}; color: #ffffff;">${status}</span>
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
  `;
};

const sendGrievanceSubmittedEmail = async (studentEmail, studentName, title, description) => {
  const bodyHeader = 'Grievance Submitted Successfully ✅';
  const bodyContent = 'Your grievance has been submitted successfully and is now under review. We will notify you automatically when the status changes.';
  const html = buildEmailTemplate(studentName, title, 'OPEN', '#3b82f6', bodyHeader, bodyContent);
  await sendEmail(studentEmail, `Grievance Submitted: ${title}`, html);
};

const sendGrievanceEscalatedEmail = async (receiverEmail, receiverName, title) => {
  const bodyHeader = 'Grievance Escalated 📌';
  const bodyContent = 'A grievance has been escalated to a higher level. Please log into the portal to review and take necessary action.';
  const html = buildEmailTemplate(receiverName, title, 'ESCALATED', '#ef4444', bodyHeader, bodyContent);
  await sendEmail(receiverEmail, `Grievance Escalated: ${title}`, html);
};

const sendGrievanceResolvedEmail = async (studentEmail, studentName, title) => {
  const bodyHeader = 'Grievance Resolved 🎉';
  const bodyContent = 'Your grievance has been resolved successfully. Thank you for your patience and for using GrievanceConnect.';
  const html = buildEmailTemplate(studentName, title, 'RESOLVED', '#10b981', bodyHeader, bodyContent);
  await sendEmail(studentEmail, `Your Grievance Has Been Resolved: ${title}`, html);
};

const sendGrievanceInProgressEmail = async (studentEmail, studentName, title) => {
  const bodyHeader = 'Grievance In Progress ⚙️';
  const bodyContent = 'A staff member has started working on your grievance. We will continue to update you as we resolve this matter.';
  const html = buildEmailTemplate(studentName, title, 'IN PROGRESS', '#f59e0b', bodyHeader, bodyContent);
  await sendEmail(studentEmail, `Your Grievance is Now In Progress: ${title}`, html);
};

const sendGrievanceClosedEmail = async (studentEmail, studentName, title) => {
  const bodyHeader = 'Grievance Closed 🔒';
  const bodyContent = 'Your grievance has been closed by the Principal. If you have any further concerns, you may file a new grievance.';
  const html = buildEmailTemplate(studentName, title, 'CLOSED', '#64748b', bodyHeader, bodyContent);
  await sendEmail(studentEmail, `Your Grievance Has Been Closed: ${title}`, html);
};

const sendStaffNotification = async (staffEmail, staffName, title, description) => {
  const bodyHeader = 'New Grievance Assigned 📩';
  const bodyContent = `A new grievance has been assigned to you. Please login to GrievanceConnect to review details and take necessary action.<br><br><b>Description:</b><br>${description}`;
  const html = buildEmailTemplate(staffName, title, 'OPEN', '#3b82f6', bodyHeader, bodyContent);
  await sendEmail(staffEmail, 'New Grievance Assigned', html);
};

const sendHodNotification = async (hodEmail, hodName, title, description) => {
  const bodyHeader = 'Grievance Escalated to HOD 📌';
  const bodyContent = `A grievance has been escalated to you for further action. Please login to GrievanceConnect to review details.<br><br><b>Description:</b><br>${description}`;
  const html = buildEmailTemplate(hodName, title, 'ESCALATED TO HOD', '#f59e0b', bodyHeader, bodyContent);
  await sendEmail(hodEmail, 'Grievance Escalated to HOD', html);
};

const sendPrincipalNotification = async (principalEmail, principalName, title, description) => {
  const bodyHeader = 'Grievance Escalated to Principal 🚨';
  const bodyContent = `A grievance has been escalated to principal level. Please login to GrievanceConnect to review details.<br><br><b>Description:</b><br>${description}`;
  const html = buildEmailTemplate(principalName, title, 'ESCALATED TO PRINCIPAL', '#dc2626', bodyHeader, bodyContent);
  await sendEmail(principalEmail, 'Grievance Escalated to Principal', html);
};

const sendStatusUpdateEmail = async (email, recipientName, title, status, message) => {
  const bodyHeader = 'Grievance Status Update 📢';
  const bodyContent = message;

  let statusColor = '#3b82f6';
  if (status === 'RESOLVED') statusColor = '#10b981';
  else if (status === 'IN_PROGRESS') statusColor = '#f59e0b';
  else if (status === 'CLOSED') statusColor = '#64748b';
  else if (status && status.includes('ESCALATED')) statusColor = '#ef4444';

  const html = buildEmailTemplate(recipientName, title, status, statusColor, bodyHeader, bodyContent);
  await sendEmail(email, `Grievance Status Update: ${status}`, html);
};

module.exports = {
  sendGrievanceSubmittedEmail,
  sendGrievanceEscalatedEmail,
  sendGrievanceResolvedEmail,
  sendGrievanceInProgressEmail,
  sendGrievanceClosedEmail,
  sendStaffNotification,
  sendHodNotification,
  sendPrincipalNotification,
  sendStatusUpdateEmail
};
