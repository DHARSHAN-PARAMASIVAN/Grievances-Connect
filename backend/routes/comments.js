const express = require('express');
const router = express.Router();

const Grievance = require('../models/Grievance');
const GrievanceComment = require('../models/GrievanceComment');
const Notification = require('../models/Notification');
const { authenticateToken } = require('../middleware/auth');
const { mapCommentToResponse } = require('../utils/helpers');
const aiService = require('../services/aiService');

// Protect all comments endpoints
router.use(authenticateToken);

// GET /api/grievances/:id/ai-suggest
router.get('/:id/ai-suggest', async (req, res) => {
  try {
    if (req.user.role.roleName === 'STUDENT') {
      return res.status(403).json({ message: 'Access denied: students cannot generate AI suggestions' });
    }

    const grievance = await Grievance.findOne({ id: Number(req.params.id) });
    if (!grievance) {
      return res.status(404).json({ message: 'Grievance not found' });
    }

    const aiDraft = await aiService.generateResolutionDraft(
      grievance.title,
      grievance.description,
      grievance.category
    );

    return res.json({ aiDraft });
  } catch (error) {
    console.error('AI draft generation error:', error.message);
    return res.status(500).json({ message: 'Failed to generate AI suggestion' });
  }
});

// GET /api/grievances/:id/comments
router.get('/:id/comments', async (req, res) => {
  try {
    const grievance = await Grievance.findOne({ id: Number(req.params.id) });
    if (!grievance) {
      return res.status(404).json({ message: 'Grievance not found' });
    }

    const comments = await GrievanceComment.find({ grievance: grievance._id })
      .populate({
        path: 'sender',
        populate: { path: 'role' }
      })
      .sort({ createdAt: 1 });

    return res.json(comments.map(c => mapCommentToResponse(c)));
  } catch (error) {
    console.error('Fetch comments error:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/grievances/:id/comments
router.post('/:id/comments', async (req, res) => {
  try {
    const sender = req.user;
    const { commentText } = req.body;

    if (!commentText) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const grievance = await Grievance.findOne({ id: Number(req.params.id) })
      .populate('createdBy assignedStaff');

    if (!grievance) {
      return res.status(404).json({ message: 'Grievance not found' });
    }

    const comment = new GrievanceComment({
      grievance: grievance._id,
      sender: sender._id,
      commentText
    });

    const saved = await comment.save();

    // Trigger Notification
    const student = grievance.createdBy;
    const staff = grievance.assignedStaff;

    if (sender._id.toString() === student._id.toString()) {
      if (staff) {
        await Notification.create({
          user: staff._id,
          grievance: grievance._id,
          message: `New comment from student on grievance '${grievance.title}'.`
        });
      }
    } else {
      await Notification.create({
        user: student._id,
        grievance: grievance._id,
        message: `New comment from support staff on your grievance '${grievance.title}'.`
      });
    }

    const populated = await GrievanceComment.findById(saved._id)
      .populate({
        path: 'sender',
        populate: { path: 'role' }
      });

    return res.json(mapCommentToResponse(populated));
  } catch (error) {
    console.error('Add comment error:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
