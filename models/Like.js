const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema({
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Blog',
    required: true
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: String,
  fingerprint: String, // Browser fingerprint
  likeType: {
    type: String,
    enum: ['like', 'dislike'],
    default: 'like'
  }
}, { 
  timestamps: true 
});

// Prevent duplicate likes from same IP for same post
likeSchema.index({ postId: 1, ipAddress: 1 }, { unique: true });

// TTL index - likes expire after 30 days for anonymous users
likeSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

module.exports = mongoose.model('Like', likeSchema);
