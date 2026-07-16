const mongoose = require('mongoose');
const { getNextSequenceValue } = require('./Counter');

const grievanceCommentSchema = new mongoose.Schema({
  id: {
    type: Number,
    unique: true
  },
  commentText: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  grievance: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Grievance',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});

grievanceCommentSchema.pre('save', async function (next) {
  if (!this.id) {
    this.id = await getNextSequenceValue('commentId');
  }
  next();
});

module.exports = mongoose.model('GrievanceComment', grievanceCommentSchema);
