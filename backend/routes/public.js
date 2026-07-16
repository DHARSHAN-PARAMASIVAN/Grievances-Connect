const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Role = require('../models/Role');

router.get('/staff', async (req, res) => {
  try {
    const staffRole = await Role.findOne({ roleName: 'STAFF' });
    if (!staffRole) return res.json([]);

    const staffList = await User.find({ role: staffRole._id })
      .populate('role department');
    return res.json(staffList);
  } catch (error) {
    console.error('Public staff list error:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/test', (req, res) => {
  return res.send('Public API Working');
});

module.exports = router;
