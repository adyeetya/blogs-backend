
const Joi = require('joi');
const Blog = require('../models/Blog');
const Category = require('../models/Category');
const User = require('../models/User');




const getLatestBlogs = async (req, res) => {
  try {
    const limit = 3; // Get only 3 latest blogs for the featured section
    
    const blogs = await Blog.find({ status: 'published' })
      // .populate('author', 'firstName lastName email profileImage')
      // .populate('category', 'name slug color')
      .select('-plainTextContent -content') // Exclude large content for list view
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(limit);
      console.log('latest blogs', blogs);

    // Format the response to match your frontend expectations
    const formattedBlogs = blogs.map(blog => ({
      id: blog._id,
      title: blog.title,
      description: blog.excerpt,
      image: blog.featuredImage,
      category: blog.category?.name || 'Uncategorized',
      author: blog.author ? `${blog.author.firstName} ${blog.author.lastName}` : blog.author,
      date: new Date(blog.publishedAt || blog.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      slug: blog.slug,
      views: blog.views,
      readingTime: blog.readingTime
    }));

    res.json({
      success: true,
      blogs: formattedBlogs
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const getOlderBlogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 9; // 9 blogs per page for grid layout
    const skip = (page - 1) * limit;

    // Get the 3 latest blog IDs to exclude them from older blogs
    const latestBlogs = await Blog.find({ status: 'published' })
      .select('_id')
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(3);
    
    const latestBlogIds = latestBlogs.map(blog => blog._id);

    const filter = {
      status: 'published',
      _id: { $nin: latestBlogIds } // Exclude the 3 latest blogs
    };

    // Apply additional filters if provided
    if (req.query.category) {
      const category = await Category.findOne({ slug: req.query.category });
      if (category) filter.category = category._id;
    }

    if (req.query.author) {
      filter.author = req.query.author;
    }

    if (req.query.tag) {
      filter.tags = { $in: [req.query.tag] };
    }

    const blogs = await Blog.find(filter)
      .populate('author', 'firstName lastName email profileImage')
      .populate('category', 'name slug color')
      .select('-plainTextContent -content') // Exclude large content for list view
      .sort({ publishedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Blog.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    // Format the response to match your frontend expectations
    const formattedBlogs = blogs.map(blog => ({
      id: blog._id,
      title: blog.title,
      description: blog.excerpt,
      image: blog.featuredImage,
      category: blog.category?.name || 'Uncategorized',
      author: blog.author ? `${blog.author.firstName} ${blog.author.lastName}` : blog.author,
      date: new Date(blog.publishedAt || blog.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      slug: blog.slug,
      views: blog.views,
      readingTime: blog.readingTime
    }));

    res.json({
      success: true,
      blogs: formattedBlogs,
      currentPage: page,
      totalPages,
      totalBlogs: total,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      nextPage: page < totalPages ? page + 1 : null,
      previousPage: page > 1 ? page - 1 : null
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};





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

// Joi schema for blog creation
const blogCreateSchema = Joi.object({
  title: Joi.string().max(100).required(),
  content: Joi.string().min(50).required(),
  featuredImage: Joi.string().uri().optional(), // Changed to optional since it has a default
  excerpt: Joi.string().max(300).optional(),
  author: Joi.string().required(), // Added - required in Mongoose schema
  tags: Joi.array().items(Joi.string().trim().lowercase()).optional(),
  category: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional(), // ObjectId validation
  status: Joi.string().valid('draft', 'published', 'archived').optional(),
  publishedAt: Joi.date().optional(),
  contentType: Joi.string().valid('html', 'markdown').optional(),
  
  // Optional fields that might be provided but have defaults
  views: Joi.number().integer().min(0).optional(),
  likesCount: Joi.number().integer().min(0).optional(),
  savesCount: Joi.number().integer().min(0).optional()
});

const createBlog = async (req, res) => {
  // Validate request body
  const { error, value } = blogCreateSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: error.details.map(d => d.message)
    });
  }
  try {
    const blogData = {
      ...value,
      author: req.admin.id
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
  getMyBlogs,
  getLatestBlogs,  
  getOlderBlogs    
};
