const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

router.post('/login', async (req, res) => {
  console.log('Login API Hit');
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).populate('role');
    if (!user) {
      return res.status(401).json({ message: 'Bad credentials' });
    }

    if (!user.active) {
      return res.status(403).json({ message: 'User account is deactivated' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Bad credentials' });
    }

    const roleName = user.role.roleName;

    // Generate JWT token
    const token = jwt.sign(
      { email: user.email, role: roleName },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('FULL NAME =', user.fullName);
    return res.json({
      fullName: user.fullName,
      token: token,
      role: roleName,
      message: 'Login Successful'
    });
  } catch (error) {
    console.error('Login error:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
