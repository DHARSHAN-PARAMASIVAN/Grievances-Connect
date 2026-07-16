const mongoose = require('mongoose');
const { getNextSequenceValue } = require('./Counter');

const notificationSchema = new mongoose.Schema({
  id: {
    type: Number,
    unique: true
  },
  message: {
    type: String,
    required: true
  },
  isRead: {
    type: Boolean,
    default: false,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  grievance: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Grievance',
    required: true
  }
});

notificationSchema.pre('save', async function (next) {
  if (!this.id) {
    this.id = await getNextSequenceValue('notificationId');
  }
  next();
});

module.exports = mongoose.model('Notification', notificationSchema);
