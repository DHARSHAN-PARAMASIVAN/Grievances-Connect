const mongoose = require('mongoose');
const { getNextSequenceValue } = require('./Counter');

const grievanceHistorySchema = new mongoose.Schema({
  id: {
    type: Number,
    unique: true
  },
  oldStatus: {
    type: String
  },
  newStatus: {
    type: String,
    required: true
  },
  remarks: {
    type: String
  },
  changedAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  grievance: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Grievance',
    required: true
  },
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

grievanceHistorySchema.pre('save', async function (next) {
  if (!this.id) {
    this.id = await getNextSequenceValue('historyId');
  }
  next();
});

module.exports = mongoose.model('GrievanceHistory', grievanceHistorySchema);
