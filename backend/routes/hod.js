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

// Protect all HOD endpoints
router.use(authenticateToken);
router.use(requireRole(['HOD']));

// GET /api/hod/dashboard
router.get('/dashboard', (req, res) => {
  return res.send('Welcome to HOD Dashboard');
});

// GET /api/hod/grievances
router.get('/grievances', async (req, res) => {
  try {
    const hod = req.user;
    if (!hod.department) {
      return res.json([]);
    }

    const grievances = await Grievance.find({
      department: hod.department._id,
      status: 'ESCALATED_TO_HOD'
    }).populate('createdBy department assignedStaff');

    return res.json(grievances.map(g => mapGrievanceToResponse(g)));
  } catch (error) {
    console.error('Fetch HOD grievances error:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// PUT /api/hod/grievances/:id/resolve
router.put('/grievances/:id/resolve', async (req, res) => {
  try {
    const hod = req.user;
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
      remarks: 'Resolved by HOD',
      grievance: saved._id,
      changedBy: hod._id
    });

    // Notify student
    await Notification.create({
      user: saved.createdBy._id,
      grievance: saved._id,
      message: `Your grievance '${saved.title}' has been resolved by HOD.`
    });

    // Send emails
    await emailService.sendGrievanceResolvedEmail(
      saved.createdBy.email,
      saved.createdBy.fullName,
      saved.title
    );

    await emailService.sendStatusUpdateEmail(
      hod.email,
      hod.fullName,
      saved.title,
      'RESOLVED',
      'You have successfully marked this grievance as RESOLVED.'
    );

    if (saved.assignedStaff) {
      const staff = await User.findById(saved.assignedStaff).populate('role');
      if (staff) {
        await emailService.sendStatusUpdateEmail(
          staff.email,
          staff.fullName,
          saved.title,
          'RESOLVED',
          `The grievance assigned to you has been resolved by HOD ${hod.fullName}.`
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
        `Grievance resolved by HOD ${hod.fullName}.`
      );
    }

    return res.json(mapGrievanceToResponse(saved));
  } catch (error) {
    console.error('HOD resolve error:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// PUT /api/hod/grievances/:id/escalate
router.put('/grievances/:id/escalate', async (req, res) => {
  try {
    const hod = req.user;
    const grievance = await Grievance.findOne({ id: Number(req.params.id) })
      .populate('createdBy department assignedStaff');

    if (!grievance) {
      return res.status(404).json({ message: 'Grievance not found' });
    }

    const oldStatus = grievance.status;
    grievance.status = 'ESCALATED_TO_PRINCIPAL';
    const saved = await grievance.save();

    // Log history
    await GrievanceHistory.create({
      oldStatus,
      newStatus: 'ESCALATED_TO_PRINCIPAL',
      remarks: 'Escalated to Principal',
      grievance: saved._id,
      changedBy: hod._id
    });

    // Notify Principal
    const PrincipalRole = await Role.findOne({ roleName: 'PRINCIPAL' });
    const principal = await User.findOne({ role: PrincipalRole._id });
    if (principal) {
      await Notification.create({
        user: principal._id,
        grievance: saved._id,
        message: `Escalated Grievance: '${saved.title}' has been escalated to Principal level.`
      });

      await emailService.sendPrincipalNotification(
        principal.email,
        principal.fullName,
        saved.title,
        saved.description
      );
    }

    // Notify student
    await Notification.create({
      user: saved.createdBy._id,
      grievance: saved._id,
      message: `Your grievance '${saved.title}' has been escalated to the Principal.`
    });

    // Emails
    await emailService.sendGrievanceEscalatedEmail(
      saved.createdBy.email,
      saved.createdBy.fullName,
      saved.title
    );

    await emailService.sendStatusUpdateEmail(
      hod.email,
      hod.fullName,
      saved.title,
      'ESCALATED_TO_PRINCIPAL',
      'You have successfully escalated this grievance to the Principal.'
    );

    if (saved.assignedStaff) {
      const staff = await User.findById(saved.assignedStaff);
      if (staff) {
        await emailService.sendStatusUpdateEmail(
          staff.email,
          staff.fullName,
          saved.title,
          'ESCALATED_TO_PRINCIPAL',
          `The grievance assigned to you has been escalated to the Principal by HOD ${hod.fullName}.`
        );
      }
    }

    return res.json(mapGrievanceToResponse(saved));
  } catch (error) {
    console.error('HOD escalate error:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
