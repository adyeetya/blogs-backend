const mongoose = require('mongoose');
const DOMPurify = require('isomorphic-dompurify');
const slugify = require('slugify'); // Missing import

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    minlength: [50, 'Content must be at least 50 characters']
  },
  excerpt: {
    type: String,
    maxlength: [300, 'Excerpt cannot exceed 300 characters']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Author is required']
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  featuredImage: String,
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  publishedAt: Date,
  views: { type: Number, default: 0 },
  likesCount: { type: Number, default: 0 },
  savesCount: { type: Number, default: 0 },
  wordCount: { type: Number, default: 0 },
  readingTime: { type: Number, default: 0 },
  plainTextContent: String,
  contentType: {
    type: String,
    enum: ['html', 'markdown'],
    default: 'html'
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Text search index
blogSchema.index({ 
  title: 'text', 
  plainTextContent: 'text', 
  tags: 'text' 
});

// Compound indexes for efficient queries
blogSchema.index({ status: 1, publishedAt: -1 });
blogSchema.index({ author: 1, status: 1 });
blogSchema.index({ slug: 1 });

// COMBINED Pre-save middleware (fixed - only one middleware function)
blogSchema.pre('save', function(next) {
  // Handle title changes - generate slug
  if (this.isModified('title')) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
  
  // Handle content changes
  if (this.isModified('content')) {
    // Sanitize HTML content
    this.content = DOMPurify.sanitize(this.content, {
      ALLOWED_TAGS: ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong', 'b', 'em', 'i', 'u', 'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'br', 'hr', 'code', 'pre', 'table', 'thead', 'tbody', 'tr', 'th', 'td'],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'target', 'rel', 'class']
    });
    
    // Extract plain text for search and excerpt
    this.plainTextContent = this.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    
    // Calculate word count
    this.wordCount = this.plainTextContent.split(' ').filter(word => word.length > 0).length;
    
    // Calculate reading time (average 200 words per minute)
    this.readingTime = Math.ceil(this.wordCount / 200);
    
    // Auto-generate excerpt if not provided
    if (!this.excerpt) {
      this.excerpt = this.plainTextContent.substring(0, 250) + '...';
    }
  }
  
  next();
});

module.exports = mongoose.model('Blog', blogSchema);
