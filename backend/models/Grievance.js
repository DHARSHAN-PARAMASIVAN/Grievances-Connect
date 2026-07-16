const mongoose = require('mongoose');
const { getNextSequenceValue } = require('./Counter');

const grievanceSchema = new mongoose.Schema({
  id: {
    type: Number,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['ACADEMIC', 'HOSTEL', 'CANTEEN', 'INFRASTRUCTURE', 'OTHER'],
    required: true
  },
  studentName: {
    type: String
  },
  proofFileName: {
    type: String
  },
  proofFilePath: {
    type: String
  },
  anonymous: {
    type: Boolean,
    required: true,
    default: false
  },
  status: {
    type: String,
    enum: ['OPEN', 'IN_PROGRESS', 'ESCALATED_TO_HOD', 'ESCALATED_TO_PRINCIPAL', 'RESOLVED', 'CLOSED'],
    required: true,
    default: 'OPEN'
  },
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH'],
    required: true,
    default: 'MEDIUM'
  },
  staffReminderSent: {
    type: Boolean,
    required: true,
    default: false
  },
  aiSummary: {
    type: String
  },
  aiSentiment: {
    type: String
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedStaff: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  currentHandler: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  }
}, {
  timestamps: true
});

grievanceSchema.pre('save', async function (next) {
  if (!this.id) {
    this.id = await getNextSequenceValue('grievanceId');
  }
  next();
});

module.exports = mongoose.model('Grievance', grievanceSchema);
