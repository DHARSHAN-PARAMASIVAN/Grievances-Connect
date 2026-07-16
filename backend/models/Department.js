const mongoose = require('mongoose');
const { getNextSequenceValue } = require('./Counter');

const departmentSchema = new mongoose.Schema({
  id: {
    type: Number,
    unique: true
  },
  departmentName: {
    type: String,
    required: true,
    unique: true
  },
  departmentCode: {
    type: String,
    required: true,
    unique: true
  }
});

departmentSchema.pre('save', async function (next) {
  if (!this.id) {
    this.id = await getNextSequenceValue('departmentId');
  }
  next();
});

module.exports = mongoose.model('Department', departmentSchema);
