const Blog = require('../models/Blog');
const Like = require('../models/Like');

// Get client fingerprint
const getFingerprint = (req) => {
  return req.ip + '|' + (req.get('User-Agent') || '');
};

const toggleLike = async (req, res) => {
  try {
    const { postId } = req.params;
    const { type = 'like' } = req.body;
    const ipAddress = req.ip;
    const userAgent = req.get('User-Agent');
    const fingerprint = getFingerprint(req);
    
    // Check if blog exists
    const blog = await Blog.findById(postId);
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }
    
    // Check if already liked
    const existingLike = await Like.findOne({ postId, ipAddress });
    
    if (existingLike) {
      // Remove like if same type, otherwise update type
      if (existingLike.likeType === type) {
        await Like.findByIdAndDelete(existingLike._id);
        await Blog.findByIdAndUpdate(postId, { 
          $inc: { likesCount: -1 } 
        });
        
        return res.json({
          success: true,
          message: 'Like removed',
          action: 'removed'
        });
      } else {
        existingLike.likeType = type;
        await existingLike.save();
        
        return res.json({
          success: true,
          message: 'Like updated',
          action: 'updated'
        });
      }
    }
    
    // Create new like
    const newLike = new Like({
      postId,
      ipAddress,
      userAgent,
      fingerprint,
      likeType: type
    });
    
    await newLike.save();
    
    // Update blog likes count
    await Blog.findByIdAndUpdate(postId, { 
      $inc: { likesCount: 1 } 
    });
    
    res.json({
      success: true,
      message: 'Post liked successfully',
      action: 'added'
    });
    
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'You have already interacted with this post'
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const getLikeStatus = async (req, res) => {
  try {
    const { postId } = req.params;
    const ipAddress = req.ip;
    
    const like = await Like.findOne({ postId, ipAddress });
    const blog = await Blog.findById(postId).select('likesCount');
    
    res.json({
      success: true,
      data: {
        hasLiked: !!like,
        likeType: like?.likeType || null,
        totalLikes: blog?.likesCount || 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  toggleLike,
  getLikeStatus
};
