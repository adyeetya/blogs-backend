// models/Role.js
const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      enum: ['USER', 'AUTHOR', 'ADMIN', 'SUPER_ADMIN'],
      unique: true,
      uppercase: true,
      trim: true
    },

    description: {
      type: String,
      trim: true,
      maxlength: 150
    },

    permissions: {
      type: [String],           // e.g. ['read_blogs', 'write_blogs']
      default: []
    }
  },
  {
    timestamps: true            // adds createdAt and updatedAt
  }
);

// Faster exact-name look-ups and enforces uniqueness at Mongo level
roleSchema.index({ name: 1 }, { unique: true });

module.exports = mongoose.model('Role', roleSchema);
