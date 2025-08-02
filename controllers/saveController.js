const Blog = require('../models/Blog');
const Save = require('../models/Save');

const savePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { email } = req.body;
    const identifier = email || req.ip;
    
    // Check if blog exists
    const blog = await Blog.findById(postId);
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }
    
    // Check if already saved
    const existingSave = await Save.findOne({ postId, identifier });
    if (existingSave) {
      return res.status(400).json({
        success: false,
        message: 'Post already saved',
        saveToken: existingSave.saveToken
      });
    }
    
    // Create new save
    const newSave = new Save({
      postId,
      identifier,
      email
    });
    
    await newSave.save();
    
    // Update blog saves count
    await Blog.findByIdAndUpdate(postId, { 
      $inc: { savesCount: 1 } 
    });
    
    res.json({
      success: true,
      message: 'Post saved successfully',
      saveToken: newSave.saveToken
    });
    
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Post already saved'
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const getSavedPosts = async (req, res) => {
  try {
    const saves = await Save.find({ saveToken: req.params.token })
      .populate({
        path: 'postId',
        select: 'title excerpt slug author publishedAt featuredImage',
        match: { status: 'published' },
        populate: {
          path: 'author',
          select: 'firstName lastName'
        }
      })
      .sort({ createdAt: -1 });
    
    // Filter out saves where postId is null (deleted posts)
    const validSaves = saves.filter(save => save.postId);
    
    res.json({
      success: true,
      data: validSaves,
      count: validSaves.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const removeSavedPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const identifier = req.body.email || req.ip;
    
    const save = await Save.findOneAndDelete({ postId, identifier });
    
    if (!save) {
      return res.status(404).json({
        success: false,
        message: 'Saved post not found'
      });
    }
    
    // Update blog saves count
    await Blog.findByIdAndUpdate(postId, { 
      $inc: { savesCount: -1 } 
    });
    
    res.json({
      success: true,
      message: 'Post removed from saved items'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  savePost,
  getSavedPosts,
  removeSavedPost
};
