const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Role = require('../models/Role');
const Department = require('../models/Department');
const Grievance = require('../models/Grievance');
const GrievanceComment = require('../models/GrievanceComment');
const GrievanceHistory = require('../models/GrievanceHistory');
const Notification = require('../models/Notification');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { mapGrievanceToResponse } = require('../utils/helpers');

// Protect all admin endpoints
router.use(authenticateToken);
router.use(requireRole(['ADMIN']));

// GET /api/admin/dashboard
router.get('/dashboard', (req, res) => {
  return res.send('Updated Admin Dashboard');
});

// GET /api/admin/roles
router.get('/roles', async (req, res) => {
  try {
    const roles = await Role.find();
    return res.json(roles);
  } catch (error) {
    console.error('Fetch roles error:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/admin/departments (originally in DepartmentController)
router.get('/departments', async (req, res) => {
  try {
    const departments = await Department.find();
    return res.json(departments);
  } catch (error) {
    console.error('Fetch departments error:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/admin/all-users
router.get('/all-users', async (req, res) => {
  try {
    const users = await User.find().populate('role department');
    return res.json(users);
  } catch (error) {
    console.error('Fetch all users error:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/admin/users (Create User)
router.post('/users', async (req, res) => {
  console.log('CREATE USER API HIT');
  const { fullName, email, password, role, departmentId } = req.body;

  try {
    if (!fullName || !email || !password || !role) {
      return res.status(400).json({ message: 'Required fields are missing' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const roleDoc = await Role.findOne({ roleName: role.toUpperCase() });
    if (!roleDoc) {
      return res.status(400).json({ message: 'Role not found' });
    }

    let deptDoc = null;
    if (departmentId) {
      deptDoc = await Department.findOne({ id: departmentId });
      if (!deptDoc) {
        return res.status(400).json({ message: 'Department not found' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      fullName,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: roleDoc._id,
      department: deptDoc ? deptDoc._id : null,
      active: true
    });

    await newUser.save();
    return res.send('User created successfully');
  } catch (error) {
    console.error('Create user error:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// PUT /api/admin/users/:id (Update User)
router.put('/users/:id', async (req, res) => {
  const { fullName, email, password, role, departmentId, registerNumber, employeeId, phone } = req.body;

  try {
    const user = await User.findOne({ id: Number(req.params.id) });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (email && email.toLowerCase() !== user.email) {
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already exists' });
      }
      user.email = email.toLowerCase();
    }

    const roleDoc = await Role.findOne({ roleName: role.toUpperCase() });
    if (!roleDoc) {
      return res.status(400).json({ message: 'Role not found' });
    }

    let deptDoc = null;
    if (departmentId) {
      deptDoc = await Department.findOne({ id: departmentId });
      if (!deptDoc) {
        return res.status(400).json({ message: 'Department not found' });
      }
    }

    user.fullName = fullName || user.fullName;
    user.role = roleDoc._id;
    user.department = deptDoc ? deptDoc._id : null;
    user.registerNumber = registerNumber || null;
    user.employeeId = employeeId || null;
    user.phone = phone || null;

    if (password && password.trim() !== '') {
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();
    return res.send('User updated successfully');
  } catch (error) {
    console.error('Update user error:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE /api/admin/users/:id (Delete User)
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findOne({ id: Number(req.params.id) });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 1. Delete notifications for this user
    await Notification.deleteMany({ user: user._id });

    // 2. Delete comments sent by this user
    await GrievanceComment.deleteMany({ sender: user._id });

    // 3. Delete comments and history on grievances created by this user, then delete those grievances
    const createdGrievances = await Grievance.find({ createdBy: user._id });
    for (const g of createdGrievances) {
      await GrievanceComment.deleteMany({ grievance: g._id });
      await GrievanceHistory.deleteMany({ grievance: g._id });
      await Grievance.deleteOne({ _id: g._id });
    }

    // 4. Null out handler references on other grievances
    await Grievance.updateMany({ currentHandler: user._id }, { currentHandler: null });
    await Grievance.updateMany({ assignedStaff: user._id }, { assignedStaff: null });

    // 5. Delete history entries changed by this user
    await GrievanceHistory.deleteMany({ changedBy: user._id });

    // 6. Delete the user
    await User.deleteOne({ _id: user._id });

    return res.send('User deleted successfully');
  } catch (error) {
    console.error('Delete user error:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/admin/grievances
router.get('/grievances', async (req, res) => {
  try {
    const grievances = await Grievance.find()
      .populate('createdBy')
      .populate('department')
      .populate('assignedStaff')
      .populate('currentHandler');
    
    const responseList = grievances.map(g => mapGrievanceToResponse(g));
    return res.json(responseList);
  } catch (error) {
    console.error('Fetch grievances error:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/admin/analytics
router.get('/analytics', async (req, res) => {
  try {
    const grievances = await Grievance.find().populate('department');

    const deptWise = {};
    const monthly = {};
    const categoryWise = {};
    let resolvedOrClosed = 0;
    let resolvedItems = [];

    const monthNames = [
      'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
      'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
    ];

    grievances.forEach(g => {
      // Department-wise
      if (g.department && g.department.departmentName) {
        const dName = g.department.departmentName;
        deptWise[dName] = (deptWise[dName] || 0) + 1;
      }

      // Monthly
      if (g.createdAt) {
        const d = new Date(g.createdAt);
        const monthYear = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
        monthly[monthYear] = (monthly[monthYear] || 0) + 1;
      } else {
        monthly['UNKNOWN'] = (monthly['UNKNOWN'] || 0) + 1;
      }

      // Category-wise
      const cat = g.category || 'OTHER';
      categoryWise[cat] = (categoryWise[cat] || 0) + 1;

      // Resolved / Closed count
      if (g.status === 'RESOLVED' || g.status === 'CLOSED') {
        resolvedOrClosed++;
        if (g.createdAt && g.updatedAt) {
          resolvedItems.push(g);
        }
      }
    });

    const total = grievances.length;
    const resolutionPct = total > 0 ? (resolvedOrClosed / total) * 100 : 0;

    let avgResponseTime = 0;
    if (resolvedItems.length > 0) {
      let totalHours = 0;
      resolvedItems.forEach(g => {
        const diffMs = new Date(g.updatedAt) - new Date(g.createdAt);
        const diffHours = diffMs / (1000 * 60 * 60);
        totalHours += diffHours;
      });
      avgResponseTime = totalHours / resolvedItems.length;
    }

    return res.json({
      departmentWiseComplaints: deptWise,
      monthlyComplaints: monthly,
      categoryWiseComplaints: categoryWise,
      resolutionPercentage: resolutionPct,
      averageResponseTimeHours: avgResponseTime
    });
  } catch (error) {
    console.error('Analytics computation error:', error.message);
    return res.json({
      departmentWiseComplaints: {},
      monthlyComplaints: {},
      categoryWiseComplaints: {},
      resolutionPercentage: 0.0,
      averageResponseTimeHours: 0.0
    });
  }
});

// GET /api/admin/test
router.get('/test', (req, res) => {
  return res.send('Admin test working');
});

module.exports = router;
