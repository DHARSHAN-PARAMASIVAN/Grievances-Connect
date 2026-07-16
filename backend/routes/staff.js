const express = require('express');
const router = express.Router();

const User = require('../models/User');
const Role = require('../models/Role');
const Grievance = require('../models/Grievance');
const GrievanceHistory = require('../models/GrievanceHistory');
const Notification = require('../models/Notification');
const emailService = require('../services/emailService');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { mapGrievanceToResponse } = require('../utils/helpers');

// Protect all staff endpoints
router.use(authenticateToken);
router.use(requireRole(['STAFF']));

// GET /api/staff/dashboard
router.get('/dashboard', (req, res) => {
  return res.send('Welcome to Staff Dashboard');
});

// GET /api/staff/grievances
router.get('/grievances', async (req, res) => {
  try {
    const staff = req.user;
    if (!staff.department) {
      return res.json([]);
    }

    const grievances = await Grievance.find({ department: staff.department._id })
      .populate('createdBy department assignedStaff');

    return res.json(grievances.map(g => mapGrievanceToResponse(g)));
  } catch (error) {
    console.error('Fetch staff grievances error:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// PUT /api/staff/grievances/:id/in-progress
router.put('/grievances/:id/in-progress', async (req, res) => {
  try {
    const staff = req.user;
    const grievance = await Grievance.findOne({ id: Number(req.params.id) })
      .populate('createdBy department assignedStaff');

    if (!grievance) {
      return res.status(404).json({ message: 'Grievance not found' });
    }

    const oldStatus = grievance.status;
    grievance.status = 'IN_PROGRESS';
    const saved = await grievance.save();

    // Log history
    await GrievanceHistory.create({
      oldStatus,
      newStatus: 'IN_PROGRESS',
      remarks: 'Marked as In Progress',
      grievance: saved._id,
      changedBy: staff._id
    });

    // Create Notification for Student
    await Notification.create({
      user: saved.createdBy._id,
      grievance: saved._id,
      message: `Your grievance '${saved.title}' is now In Progress.`
    });

    // Send emails
    await emailService.sendGrievanceInProgressEmail(
      saved.createdBy.email,
      saved.createdBy.fullName,
      saved.title
    );

    await emailService.sendStatusUpdateEmail(
      staff.email,
      staff.fullName,
      saved.title,
      'IN_PROGRESS',
      'You have marked this grievance as IN PROGRESS.'
    );

    if (saved.department) {
      const HODRole = await Role.findOne({ roleName: 'HOD' });
      const hod = await User.findOne({
        role: HODRole._id,
        department: saved.department._id
      });
      if (hod) {
        await emailService.sendStatusUpdateEmail(
          hod.email,
          hod.fullName,
          saved.title,
          'IN_PROGRESS',
          `A grievance in your department has been marked as IN PROGRESS by staff ${staff.fullName}.`
        );
      }
    }

    const PrincipalRole = await Role.findOne({ roleName: 'PRINCIPAL' });
    const principal = await User.findOne({ role: PrincipalRole._id });
    if (principal) {
      await emailService.sendStatusUpdateEmail(
        principal.email,
        principal.fullName,
        saved.title,
        'IN_PROGRESS',
        `Grievance in department ${saved.department ? saved.department.departmentName : 'General'} has been marked as IN PROGRESS.`
      );
    }

    return res.json(mapGrievanceToResponse(saved));
  } catch (error) {
    console.error('Mark in-progress error:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// PUT /api/staff/grievances/:id/resolve
router.put('/grievances/:id/resolve', async (req, res) => {
  try {
    const staff = req.user;
    const grievance = await Grievance.findOne({ id: Number(req.params.id) })
      .populate('createdBy department assignedStaff');

    if (!grievance) {
      return res.status(404).json({ message: 'Grievance not found' });
    }

    const oldStatus = grievance.status;
    grievance.status = 'RESOLVED';
    const saved = await grievance.save();

    // Log history
    await GrievanceHistory.create({
      oldStatus,
      newStatus: 'RESOLVED',
      remarks: 'Resolved by Staff',
      grievance: saved._id,
      changedBy: staff._id
    });

    // Notification for student
    await Notification.create({
      user: saved.createdBy._id,
      grievance: saved._id,
      message: `Your grievance '${saved.title}' has been resolved.`
    });

    // Send emails
    await emailService.sendGrievanceResolvedEmail(
      saved.createdBy.email,
      saved.createdBy.fullName,
      saved.title
    );

    await emailService.sendStatusUpdateEmail(
      staff.email,
      staff.fullName,
      saved.title,
      'RESOLVED',
      'You have successfully marked this grievance as RESOLVED.'
    );

    if (saved.department) {
      const HODRole = await Role.findOne({ roleName: 'HOD' });
      const hod = await User.findOne({
        role: HODRole._id,
        department: saved.department._id
      });
      if (hod) {
        await emailService.sendStatusUpdateEmail(
          hod.email,
          hod.fullName,
          saved.title,
          'RESOLVED',
          `A grievance in your department has been RESOLVED by staff ${staff.fullName}.`
        );
      }
    }

    const PrincipalRole = await Role.findOne({ roleName: 'PRINCIPAL' });
    const principal = await User.findOne({ role: PrincipalRole._id });
    if (principal) {
      await emailService.sendStatusUpdateEmail(
        principal.email,
        principal.fullName,
        saved.title,
        'RESOLVED',
        'A grievance has been RESOLVED.'
      );
    }

    return res.json(mapGrievanceToResponse(saved));
  } catch (error) {
    console.error('Resolve grievance error:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// PUT /api/staff/grievances/:id/escalate (manual escalation to HOD)
router.put('/grievances/:id/escalate', async (req, res) => {
  try {
    const staff = req.user;
    const grievance = await Grievance.findOne({ id: Number(req.params.id) })
      .populate('createdBy department assignedStaff');

    if (!grievance) {
      return res.status(404).json({ message: 'Grievance not found' });
    }

    const oldStatus = grievance.status;
    grievance.status = 'ESCALATED_TO_HOD';
    const saved = await grievance.save();

    // Log history
    await GrievanceHistory.create({
      oldStatus,
      newStatus: 'ESCALATED_TO_HOD',
      remarks: 'Escalated to HOD',
      grievance: saved._id,
      changedBy: staff._id
    });

    // Notification for Student
    await Notification.create({
      user: saved.createdBy._id,
      grievance: saved._id,
      message: `Your grievance '${saved.title}' has been escalated to HOD.`
    });

    // Notify HOD
    let hod = null;
    if (saved.department) {
      const HODRole = await Role.findOne({ roleName: 'HOD' });
      hod = await User.findOne({
        role: HODRole._id,
        department: saved.department._id
      });
      if (hod) {
        await Notification.create({
          user: hod._id,
          grievance: saved._id,
          message: `Escalated Grievance: '${saved.title}' has been escalated to you by staff.`
        });

        await emailService.sendHodNotification(
          hod.email,
          hod.fullName,
          saved.title,
          saved.description
        );
      }
    }

    // Emails
    await emailService.sendGrievanceEscalatedEmail(
      saved.createdBy.email,
      saved.createdBy.fullName,
      saved.title
    );

    await emailService.sendStatusUpdateEmail(
      staff.email,
      staff.fullName,
      saved.title,
      'ESCALATED_TO_HOD',
      'You have successfully escalated this grievance to the HOD.'
    );

    const PrincipalRole = await Role.findOne({ roleName: 'PRINCIPAL' });
    const principal = await User.findOne({ role: PrincipalRole._id });
    if (principal) {
      await emailService.sendStatusUpdateEmail(
        principal.email,
        principal.fullName,
        saved.title,
        'ESCALATED_TO_HOD',
        'A grievance has been escalated to HOD level.'
      );
    }

    return res.json(mapGrievanceToResponse(saved));
  } catch (error) {
    console.error('Escalate to HOD error:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
