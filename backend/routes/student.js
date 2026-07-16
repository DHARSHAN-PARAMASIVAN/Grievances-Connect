const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const User = require('../models/User');
const Role = require('../models/Role');
const Grievance = require('../models/Grievance');
const GrievanceHistory = require('../models/GrievanceHistory');
const Notification = require('../models/Notification');
const emailService = require('../services/emailService');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { mapGrievanceToResponse, mapNotificationToResponse, mapHistoryToResponse } = require('../utils/helpers');

// Configure multer for file attachments
const uploadDir = path.resolve(__dirname, '../..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${file.originalname}`);
  }
});

const upload = multer({ storage });

// Protect all student endpoints
router.use(authenticateToken);
router.use(requireRole(['STUDENT']));

// GET /api/student/dashboard
router.get('/dashboard', (req, res) => {
  return res.send('Welcome to Student Dashboard');
});

// GET /api/student/staff
router.get('/staff', async (req, res) => {
  try {
    const student = req.user;
    if (!student.department) {
      return res.json([]);
    }

    const staffRole = await Role.findOne({ roleName: 'STAFF' });
    if (!staffRole) return res.json([]);

    const staffList = await User.find({
      role: staffRole._id,
      department: student.department._id
    }).populate('role department');

    return res.json(staffList);
  } catch (error) {
    console.error('Fetch student staff list error:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/student/grievances
router.get('/grievances', async (req, res) => {
  try {
    const student = req.user;
    const grievances = await Grievance.find({ createdBy: student._id })
      .populate('createdBy department assignedStaff');
    
    return res.json(grievances.map(g => mapGrievanceToResponse(g)));
  } catch (error) {
    console.error('Fetch student grievances error:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/student/grievances (Handles both json and multipart/form-data)
router.post('/grievances', upload.single('proofFile'), async (req, res) => {
  const student = req.user;

  try {
    let { title, description, category, anonymous, studentName, staffId, priority } = req.body;
    anonymous = anonymous === 'true' || anonymous === true;

    const parsedStaffId = staffId ? Number(staffId) : null;

    if (!title || !description || !category || !parsedStaffId) {
      return res.status(400).json({ message: 'Required fields are missing' });
    }

    const assignedStaff = await User.findOne({ id: parsedStaffId }).populate('role');
    if (!assignedStaff || assignedStaff.role.roleName !== 'STAFF') {
      return res.status(400).json({ message: 'Selected user is not a staff member' });
    }

    const grievance = new Grievance({
      title,
      description,
      category: category.toUpperCase(),
      anonymous,
      status: 'OPEN',
      createdBy: student._id,
      department: student.department ? student.department._id : null,
      assignedStaff: assignedStaff._id,
      currentHandler: assignedStaff._id,
      priority: priority ? priority.toUpperCase() : 'MEDIUM'
    });

    if (!anonymous) {
      grievance.studentName = studentName || student.fullName;
    } else {
      grievance.studentName = 'Anonymous';
    }

    if (req.file) {
      grievance.proofFileName = req.file.filename;
      grievance.proofFilePath = req.file.path;
    }

    const saved = await grievance.save();
    const populated = await Grievance.findById(saved._id)
      .populate('createdBy department assignedStaff');

    // Send emails
    await emailService.sendGrievanceSubmittedEmail(
      student.email,
      student.fullName,
      populated.title,
      populated.description
    );

    await emailService.sendStaffNotification(
      assignedStaff.email,
      assignedStaff.fullName,
      populated.title,
      populated.description
    );

    if (student.department) {
      const HODRole = await Role.findOne({ roleName: 'HOD' });
      const hod = await User.findOne({
        role: HODRole._id,
        department: student.department._id
      });
      if (hod) {
        await emailService.sendHodNotification(
          hod.email,
          hod.fullName,
          'New Department Grievance Submitted',
          `A new grievance has been submitted by student ${student.fullName}:\n\n${populated.description}`
        );
      }
    }

    const PrincipalRole = await Role.findOne({ roleName: 'PRINCIPAL' });
    const principal = await User.findOne({ role: PrincipalRole._id });
    if (principal) {
      await emailService.sendPrincipalNotification(
        principal.email,
        principal.fullName,
        'New Grievance Submitted (College-Wide)',
        `A new grievance has been submitted by student ${student.fullName} in department ${student.department ? student.department.departmentName : 'General'}:\n\n${populated.description}`
      );
    }

    return res.json(mapGrievanceToResponse(populated));
  } catch (error) {
    console.error('Create grievance error:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/student/grievances/:id
router.get('/grievances/:id', async (req, res) => {
  try {
    const student = req.user;
    const grievance = await Grievance.findOne({ id: Number(req.params.id) })
      .populate('createdBy department assignedStaff');

    if (!grievance) {
      return res.status(404).json({ message: 'Grievance not found' });
    }

    if (grievance.createdBy._id.toString() !== student._id.toString()) {
      return res.status(403).json({ message: 'You are not allowed to view this grievance' });
    }

    return res.json(mapGrievanceToResponse(grievance));
  } catch (error) {
    console.error('Get grievance error:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/student/grievances/:id/history
router.get('/grievances/:id/history', async (req, res) => {
  try {
    const grievance = await Grievance.findOne({ id: Number(req.params.id) });
    if (!grievance) {
      return res.status(404).json({ message: 'Grievance not found' });
    }

    const history = await GrievanceHistory.find({ grievance: grievance._id })
      .populate('changedBy')
      .sort({ changedAt: 1 });

    return res.json(history.map(h => mapHistoryToResponse(h)));
  } catch (error) {
    console.error('Get history error:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/student/notifications
router.get('/notifications', async (req, res) => {
  try {
    const student = req.user;
    const notifications = await Notification.find({ user: student._id })
      .populate('grievance')
      .sort({ createdAt: -1 });

    return res.json(notifications.map(n => mapNotificationToResponse(n)));
  } catch (error) {
    console.error('Fetch student notifications error:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// PUT /api/student/notifications/:id/read
router.put('/notifications/:id/read', async (req, res) => {
  try {
    const student = req.user;
    const notification = await Notification.findOne({ id: Number(req.params.id) }).populate('user');
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (notification.user._id.toString() !== student._id.toString()) {
      return res.status(403).json({ message: 'You are not allowed to update this notification' });
    }

    notification.isRead = true;
    await notification.save();
    return res.send('Notification marked as read');
  } catch (error) {
    console.error('Mark notification as read error:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
