const User = require('../models/User');

const googleOAuthCallback = async (req, res) => {
  try {
    // This would be called by Passport after successful OAuth
    const token = req.user.generateAuthToken();
    
    // Update last login
    req.user.lastLogin = new Date();
    await req.user.save();
    
    // Redirect to frontend with token
    const redirectURL = process.env.NODE_ENV === 'production' 
      ? `${process.env.CLIENT_URL}/auth/success?token=${token}`
      : `http://localhost:3000/auth/success?token=${token}`;
    
    res.redirect(redirectURL);
  } catch (error) {
    res.redirect(`${process.env.CLIENT_URL}/auth/error`);
  }
};

const getUserProfile = async (req, res) => {
  try {
    res.json({
      success: true,
      data: req.user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const { firstName, lastName, bio, preferences } = req.body;
    const user = req.user;
    
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (bio) user.bio = bio;
    if (preferences) user.preferences = { ...user.preferences, ...preferences };
    
    await user.save();
    
    res.json({
      success: true,
      data: user,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

const deleteUserAccount = async (req, res) => {
  try {
    // Soft delete - deactivate instead of removing
    req.user.isActive = false;
    await req.user.save();
    
    res.json({
      success: true,
      message: 'Account deactivated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  googleOAuthCallback,
  getUserProfile,
  updateUserProfile,
  deleteUserAccount
};
