const mongoose = require('mongoose');
const crypto = require('crypto');

const saveSchema = new mongoose.Schema({
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Blog',
    required: true
  },
  identifier: {
    type: String,
    required: true
  },
  saveToken: {
    type: String,
    unique: true,
    default: () => crypto.randomBytes(32).toString('hex')
  },
  email: {
    type: String,
    validate: {
      validator: function(v) {
        return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Invalid email format'
    }
  }
}, { 
  timestamps: true 
});

saveSchema.index({ postId: 1, identifier: 1 }, { unique: true });
saveSchema.index({ saveToken: 1 });

module.exports = mongoose.model('Save', saveSchema);
