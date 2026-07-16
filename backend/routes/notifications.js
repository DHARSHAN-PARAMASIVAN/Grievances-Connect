const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { authenticateToken } = require('../middleware/auth');
const { mapNotificationToResponse } = require('../utils/helpers');

// Protect all notification routes
router.use(authenticateToken);

// GET /api/notifications -> get current user's notifications
router.get('/', async (req, res) => {
  try {
    const user = req.user;
    const notifications = await Notification.find({ user: user._id })
      .populate('grievance')
      .sort({ createdAt: -1 });

    return res.json(notifications.map(n => mapNotificationToResponse(n)));
  } catch (error) {
    console.error('Fetch notifications error:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// PUT /api/notifications/:id/read -> mark notification as read
router.put('/:id/read', async (req, res) => {
  try {
    const user = req.user;
    const notification = await Notification.findOne({ id: Number(req.params.id) }).populate('user');
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (notification.user._id.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
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
