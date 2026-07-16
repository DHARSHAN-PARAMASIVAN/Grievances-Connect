const mongoose = require('mongoose');
const { getNextSequenceValue } = require('./Counter');

const roleSchema = new mongoose.Schema({
  id: {
    type: Number,
    unique: true
  },
  roleName: {
    type: String,
    required: true,
    unique: true
  }
});

roleSchema.pre('save', async function (next) {
  if (!this.id) {
    this.id = await getNextSequenceValue('roleId');
  }
  next();
});

module.exports = mongoose.model('Role', roleSchema);
