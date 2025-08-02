const Blog = require('../models/Blog');
const User = require('../models/User');
const Category = require('../models/Category');

const searchBlogs = async (req, res) => {
  try {
    const { 
      q, 
      category, 
      author, 
      tags,
      sortBy = 'relevance',
      page = 1, 
      limit = 10 
    } = req.query;
    
    const skip = (page - 1) * limit;
    let filter = { status: 'published' };
    let sortOptions = {};
    
    // Text search
    if (q) {
      filter.$text = { $search: q };
    }
    
    // Category filter
    if (category) {
      const categoryDoc = await Category.findOne({ slug: category });
      if (categoryDoc) filter.category = categoryDoc._id;
    }
    
    // Author filter
    if (author) {
      const authorDoc = await User.findOne({ 
        $or: [
          { email: author },
          { _id: author }
        ]
      });
      if (authorDoc) filter.author = authorDoc._id;
    }
    
    // Tags filter
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim().toLowerCase());
      filter.tags = { $in: tagArray };
    }
    
    // Sorting
    switch (sortBy) {
      case 'date':
        sortOptions = { publishedAt: -1 };
        break;
      case 'views':
        sortOptions = { views: -1 };
        break;
      case 'likes':
        sortOptions = { likesCount: -1 };
        break;
      case 'relevance':
      default:
        if (q) {
          sortOptions = { score: { $meta: 'textScore' } };
        } else {
          sortOptions = { publishedAt: -1 };
        }
        break;
    }
    
    let query = Blog.find(filter)
      .populate('author', 'firstName lastName email')
      .populate('category', 'name slug color')
      .select('-content -plainTextContent');
    
    // Add text score for relevance sorting
    if (q && sortBy === 'relevance') {
      query = query.select({ score: { $meta: 'textScore' } });
    }
    
    const results = await query
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Blog.countDocuments(filter);
    
    // Get search suggestions if no results
    let suggestions = [];
    if (results.length === 0 && q) {
      suggestions = await getSearchSuggestions(q);
    }
    
    res.json({
      success: true,
      data: {
        results,
        suggestions,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const searchUsers = async (req, res) => {
  try {
    const { q, role, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    
    let filter = { isActive: true };
    
    if (q) {
      filter.$text = { $search: q };
    }
    
    if (role) {
      const roleDoc = await Role.findOne({ name: role.toUpperCase() });
      if (roleDoc) filter.role = roleDoc._id;
    }
    
    const users = await User.find(filter)
      .populate('role', 'name')
      .select('firstName lastName email profileImage bio')
      .sort(q ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await User.countDocuments(filter);
    
    res.json({
      success: true,
      data: {
        results: users,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const getSearchSuggestions = async (query) => {
  try {
    // Get popular tags
    const popularTags = await Blog.aggregate([
      { $match: { status: 'published' } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $match: { _id: { $regex: query, $options: 'i' } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    // Get similar titles
    const similarTitles = await Blog.find({
      title: { $regex: query, $options: 'i' },
      status: 'published'
    })
    .select('title')
    .limit(3);
    
    return {
      tags: popularTags.map(tag => tag._id),
      titles: similarTitles.map(blog => blog.title)
    };
  } catch (error) {
    return [];
  }
};

const getPopularSearches = async (req, res) => {
  try {
    // Get most used tags
    const popularTags = await Blog.aggregate([
      { $match: { status: 'published' } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    // Get most viewed blogs
    const trendingBlogs = await Blog.find({ status: 'published' })
      .populate('author', 'firstName lastName')
      .select('title slug views publishedAt')
      .sort({ views: -1 })
      .limit(5);
    
    res.json({
      success: true,
      data: {
        popularTags: popularTags.map(tag => ({ name: tag._id, count: tag.count })),
        trendingBlogs
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
  searchBlogs,
  searchUsers,
  getPopularSearches
};
