const Blog = require('../models/Blog');
const Category = require('../models/Category');
const User = require('../models/User');

const getAllBlogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    let filter = {};
    
    // For non-admin users, only show published blogs
    if (!req.user || !['ADMIN', 'SUPER_ADMIN'].includes(req.user.role.name)) {
      filter.status = 'published';
    }
    
    // Category filter
    if (req.query.category) {
      const category = await Category.findOne({ slug: req.query.category });
      if (category) filter.category = category._id;
    }
    
    // Author filter
    if (req.query.author) {
      filter.author = req.query.author;
    }
    
    // Status filter (admin only)
    if (req.query.status && req.user && ['ADMIN', 'SUPER_ADMIN'].includes(req.user.role.name)) {
      filter.status = req.query.status;
    }
    
    // Sort options
    const sortField = req.query.sort || 'publishedAt';
    const sortOrder = req.query.order === 'asc' ? 1 : -1;
    const sortOptions = { [sortField]: sortOrder };
    
    const blogs = await Blog.find(filter)
      .populate('author', 'firstName lastName email')
      .populate('category', 'name slug color')
      .select('-plainTextContent') // Exclude for list view
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);
    
    const total = await Blog.countDocuments(filter);
    
    res.json({
      success: true,
      data: blogs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const getBlogBySlug = async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug })
      .populate('author', 'firstName lastName email bio profileImage')
      .populate('category', 'name slug color');
    
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }
    
    // Check if user can view this blog
    if (blog.status !== 'published') {
      if (!req.user || 
          (req.user.id !== blog.author._id.toString() && 
           !['ADMIN', 'SUPER_ADMIN'].includes(req.user.role.name))) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }
    
    // Increment view count for published blogs
    if (blog.status === 'published') {
      await Blog.findByIdAndUpdate(blog._id, { $inc: { views: 1 } });
    }
    
    res.json({
      success: true,
      data: blog
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const createBlog = async (req, res) => {
  try {
    const blogData = {
      ...req.body,
      author: req.user.id
    };
    
    const blog = new Blog(blogData);
    await blog.save();
    
    await blog.populate('author', 'firstName lastName email');
    await blog.populate('category', 'name slug color');
    
    res.status(201).json({
      success: true,
      data: blog
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

const updateBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }
    
    // Check permissions
    const canEdit = blog.author.toString() === req.user.id || 
                   ['ADMIN', 'SUPER_ADMIN'].includes(req.user.role.name);
    
    if (!canEdit) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    Object.assign(blog, req.body);
    await blog.save();
    
    await blog.populate('author', 'firstName lastName email');
    await blog.populate('category', 'name slug color');
    
    res.json({
      success: true,
      data: blog
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

const deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }
    
    // Check permissions
    const canDelete = blog.author.toString() === req.user.id || 
                     ['ADMIN', 'SUPER_ADMIN'].includes(req.user.role.name);
    
    if (!canDelete) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    await Blog.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Blog post deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const getMyBlogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const filter = { author: req.user.id };
    
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    const blogs = await Blog.find(filter)
      .populate('category', 'name slug color')
      .select('-plainTextContent')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Blog.countDocuments(filter);
    
    res.json({
      success: true,
      data: blogs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
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
  getAllBlogs,
  getBlogBySlug,
  createBlog,
  updateBlog,
  deleteBlog,
  getMyBlogs
};
