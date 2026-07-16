const mongoose = require('mongoose');
const { getNextSequenceValue } = require('./Counter');

const userSchema = new mongoose.Schema({
  id: {
    type: Number,
    unique: true
  },
  fullName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  registerNumber: {
    type: String,
    sparse: true,
    unique: true
  },
  employeeId: {
    type: String,
    sparse: true,
    unique: true
  },
  phone: {
    type: String
  },
  role: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role',
    required: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

userSchema.pre('save', async function (next) {
  if (!this.id) {
    this.id = await getNextSequenceValue('userId');
  }
  next();
});

module.exports = mongoose.model('User', userSchema);
