const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: 50
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format']
  },
  // Social login fields
  googleId: String,
  appleId: String,
  facebookId: String,
  profileImage: String,
  authProvider: {
    type: String,
    enum: ['google', 'apple', 'facebook'],
    required: true
  },
  isEmailVerified: {
    type: Boolean,
    default: true // Auto-verified for social logins
  },
  bio: {
    type: String,
    maxlength: 500
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
  preferences: {
    newsletter: { type: Boolean, default: false },
    notifications: { type: Boolean, default: true }
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Index for text search
userSchema.index({ firstName: 'text', lastName: 'text', email: 'text' });

// Generate JWT token for users
userSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { 
      id: this._id, 
      email: this.email,
      type: 'user' // Distinguish from admin tokens
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '30d' } // Longer expiry for users
  );
};

module.exports = mongoose.model('User', userSchema);
