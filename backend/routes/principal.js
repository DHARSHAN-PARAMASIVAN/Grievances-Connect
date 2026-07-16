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

// Protect all Principal endpoints
router.use(authenticateToken);
router.use(requireRole(['PRINCIPAL']));

// GET /api/principal/dashboard
router.get('/dashboard', (req, res) => {
  return res.send('Welcome to Principal Dashboard');
});

// GET /api/principal/grievances
router.get('/grievances', async (req, res) => {
  try {
    const grievances = await Grievance.find({
      status: 'ESCALATED_TO_PRINCIPAL'
    }).populate('createdBy department assignedStaff');

    return res.json(grievances.map(g => mapGrievanceToResponse(g)));
  } catch (error) {
    console.error('Fetch Principal grievances error:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// PUT /api/principal/grievances/:id/resolve
router.put('/grievances/:id/resolve', async (req, res) => {
  try {
    const principal = req.user;
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
      remarks: 'Resolved by Principal',
      grievance: saved._id,
      changedBy: principal._id
    });

    // Notify student
    await Notification.create({
      user: saved.createdBy._id,
      grievance: saved._id,
      message: `Your grievance '${saved.title}' has been resolved by the Principal.`
    });

    // Send emails
    await emailService.sendGrievanceResolvedEmail(
      saved.createdBy.email,
      saved.createdBy.fullName,
      saved.title
    );

    await emailService.sendStatusUpdateEmail(
      principal.email,
      principal.fullName,
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
          `The grievance in your department has been resolved by Principal ${principal.fullName}.`
        );
      }
    }

    if (saved.assignedStaff) {
      const staff = await User.findById(saved.assignedStaff);
      if (staff) {
        await emailService.sendStatusUpdateEmail(
          staff.email,
          staff.fullName,
          saved.title,
          'RESOLVED',
          `The grievance assigned to you has been resolved by Principal ${principal.fullName}.`
        );
      }
    }

    return res.json(mapGrievanceToResponse(saved));
  } catch (error) {
    console.error('Principal resolve error:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// PUT /api/principal/grievances/:id/close
router.put('/grievances/:id/close', async (req, res) => {
  try {
    const principal = req.user;
    const grievance = await Grievance.findOne({ id: Number(req.params.id) })
      .populate('createdBy department assignedStaff');

    if (!grievance) {
      return res.status(404).json({ message: 'Grievance not found' });
    }

    const oldStatus = grievance.status;
    grievance.status = 'CLOSED';
    const saved = await grievance.save();

    // Log history
    await GrievanceHistory.create({
      oldStatus,
      newStatus: 'CLOSED',
      remarks: 'Closed by Principal',
      grievance: saved._id,
      changedBy: principal._id
    });

    // Notify student
    await Notification.create({
      user: saved.createdBy._id,
      grievance: saved._id,
      message: `Your grievance '${saved.title}' has been closed by the Principal.`
    });

    // Send emails
    await emailService.sendGrievanceClosedEmail(
      saved.createdBy.email,
      saved.createdBy.fullName,
      saved.title
    );

    await emailService.sendStatusUpdateEmail(
      principal.email,
      principal.fullName,
      saved.title,
      'CLOSED',
      'You have successfully marked this grievance as CLOSED.'
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
          'CLOSED',
          `The grievance in your department has been closed by Principal ${principal.fullName}.`
        );
      }
    }

    if (saved.assignedStaff) {
      const staff = await User.findById(saved.assignedStaff);
      if (staff) {
        await emailService.sendStatusUpdateEmail(
          staff.email,
          staff.fullName,
          saved.title,
          'CLOSED',
          `The grievance assigned to you has been closed by Principal ${principal.fullName}.`
        );
      }
    }

    return res.json(mapGrievanceToResponse(saved));
  } catch (error) {
    console.error('Principal close error:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
