const Grievance = require('../models/Grievance');
const User = require('../models/User');
const Role = require('../models/Role');
const GrievanceHistory = require('../models/GrievanceHistory');
const Notification = require('../models/Notification');
const emailService = require('../services/emailService');

const saveHistory = async (grievanceId, oldStatus, newStatus, remarks) => {
  await GrievanceHistory.create({
    grievance: grievanceId,
    changedBy: null, // null indicates System Auto-escalation
    oldStatus,
    newStatus,
    remarks
  });
};

const createNotification = async (userId, grievanceId, message) => {
  await Notification.create({
    user: userId,
    grievance: grievanceId,
    message,
    isRead: false
  });
};

const processAutoEscalations = async () => {
  const testMode = process.env.ESCALATION_TEST_MODE === 'true';
  const now = new Date();

  // Helper to subtract time
  const subtractTime = (date, value, unit) => {
    const d = new Date(date);
    if (unit === 'minutes') {
      d.setMinutes(d.getMinutes() - value);
    } else {
      d.setDate(d.getDate() - value);
    }
    return d;
  };

  const reminderLimit = subtractTime(now, 2, testMode ? 'minutes' : 'days');
  const hodLimit = subtractTime(now, 4, testMode ? 'minutes' : 'days');
  const principalLimit = subtractTime(now, 7, testMode ? 'minutes' : 'days');

  try {
    const HODRole = await Role.findOne({ roleName: 'HOD' });
    const PrincipalRole = await Role.findOne({ roleName: 'PRINCIPAL' });
    if (!HODRole || !PrincipalRole) return; // DB not seeded yet

    const principal = await User.findOne({ role: PrincipalRole._id });

    // 1. 2 Days - Staff Reminder: If status is OPEN and created before reminderLimit, and reminder not sent yet
    const openGrievancesForReminder = await Grievance.find({
      status: 'OPEN',
      createdAt: { $lt: reminderLimit },
      staffReminderSent: false
    }).populate('assignedStaff');

    for (const g of openGrievancesForReminder) {
      if (g.assignedStaff) {
        console.log(`Auto-escalation Scheduler: Sending reminder email to Staff ${g.assignedStaff.email} for Grievance #${g.id}`);
        await emailService.sendStaffNotification(
          g.assignedStaff.email,
          g.assignedStaff.fullName,
          `[REMINDER] ${g.title}`,
          `This grievance has been pending for over 2 days and requires your attention:\n\n${g.description}`
        );
        await createNotification(g.assignedStaff._id, g._id, `Reminder: Student grievance '${g.title}' is pending your action.`);
      }
      g.staffReminderSent = true;
      await g.save();
    }

    // 2. 4 Days - Escalate to HOD: If status is OPEN or IN_PROGRESS and created before HOD limit
    const pendingGrievancesForHod = await Grievance.find({
      status: { $in: ['OPEN', 'IN_PROGRESS'] },
      createdAt: { $lt: hodLimit }
    }).populate('createdBy department assignedStaff');

    for (const g of pendingGrievancesForHod) {
      console.log(`Auto-escalation Scheduler: Escalating Grievance #${g.id} to HOD`);
      const oldStatus = g.status;
      g.status = 'ESCALATED_TO_HOD';
      const saved = await g.save();

      // Log history
      await saveHistory(saved._id, oldStatus, 'ESCALATED_TO_HOD', 'Auto-escalated to HOD due to inactivity');

      // Find HOD of the department
      let hod = null;
      if (saved.department) {
        hod = await User.findOne({
          role: HODRole._id,
          department: saved.department._id
        });
      }

      // Create Notifications
      await createNotification(saved.createdBy._id, saved._id, `Your grievance '${saved.title}' has been automatically escalated to the HOD.`);
      if (hod) {
        await createNotification(hod._id, saved._id, `Escalated Grievance: '${saved.title}' has been escalated due to inactivity.`);
        await emailService.sendHodNotification(
          hod.email,
          hod.fullName,
          `[AUTO-ESCALATED] ${saved.title}`,
          saved.description
        );
      }

      // Email Student
      await emailService.sendGrievanceEscalatedEmail(
        saved.createdBy.email,
        saved.createdBy.fullName,
        saved.title
      );

      // Email Staff
      if (saved.assignedStaff) {
        await emailService.sendStatusUpdateEmail(
          saved.assignedStaff.email,
          saved.assignedStaff.fullName,
          saved.title,
          'ESCALATED_TO_HOD',
          'The grievance assigned to you has been automatically escalated to the HOD due to inactivity.'
        );
      }

      // Email Principal
      if (principal) {
        await emailService.sendStatusUpdateEmail(
          principal.email,
          principal.fullName,
          saved.title,
          'ESCALATED_TO_HOD',
          'A grievance has been automatically escalated to HOD level due to inactivity.'
        );
      }
    }

    // 3. 7 Days - Escalate to Principal: If status is ESCALATED_TO_HOD and created before Principal limit
    const pendingGrievancesForPrincipal = await Grievance.find({
      status: 'ESCALATED_TO_HOD',
      createdAt: { $lt: principalLimit }
    }).populate('createdBy department assignedStaff');

    for (const g of pendingGrievancesForPrincipal) {
      console.log(`Auto-escalation Scheduler: Escalating Grievance #${g.id} to Principal`);
      const oldStatus = g.status;
      g.status = 'ESCALATED_TO_PRINCIPAL';
      const saved = await g.save();

      // Log history
      await saveHistory(saved._id, oldStatus, 'ESCALATED_TO_PRINCIPAL', 'Auto-escalated to Principal due to inactivity');

      // Create Notifications
      await createNotification(saved.createdBy._id, saved._id, `Your grievance '${saved.title}' has been automatically escalated to the Principal.`);
      if (principal) {
        await createNotification(principal._id, saved._id, `Escalated Grievance: '${saved.title}' has been escalated to Principal level.`);
        await emailService.sendPrincipalNotification(
          principal.email,
          principal.fullName,
          `[AUTO-ESCALATED] ${saved.title}`,
          saved.description
        );
      }

      // Email Student
      await emailService.sendGrievanceEscalatedEmail(
        saved.createdBy.email,
        saved.createdBy.fullName,
        saved.title
      );

      // Find HOD of the department
      if (saved.department) {
        const hodOfDept = await User.findOne({
          role: HODRole._id,
          department: saved.department._id
        });
        if (hodOfDept) {
          await emailService.sendStatusUpdateEmail(
            hodOfDept.email,
            hodOfDept.fullName,
            saved.title,
            'ESCALATED_TO_PRINCIPAL',
            'The grievance in your department has been automatically escalated to the Principal due to inactivity.'
          );
        }
      }

      // Email Staff
      if (saved.assignedStaff) {
        await emailService.sendStatusUpdateEmail(
          saved.assignedStaff.email,
          saved.assignedStaff.fullName,
          saved.title,
          'ESCALATED_TO_PRINCIPAL',
          'The grievance assigned to you has been automatically escalated to the Principal due to inactivity.'
        );
      }
    }
  } catch (error) {
    console.error('Error processing auto escalations:', error.message);
  }
};

const startScheduler = () => {
  setInterval(processAutoEscalations, 30000);
  console.log('Auto-escalation scheduler started running every 30 seconds.');
};

module.exports = {
  startScheduler
};
