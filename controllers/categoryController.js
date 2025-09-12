const Joi = require('joi');
// POST /api/categories - admin only
const createCategory = async (req, res) => {
    // Simple admin check (replace with real auth in production)
    //   if (!req.user || req.user.role !== 'ADMIN') {
    //     return res.status(403).json({ success: false, error: 'Forbidden' });
    //   }

    console.log(req.body)
    // Preprocess: remove empty description/color before validation
    const cleanBody = { ...req.body };
    if (cleanBody.description === "") delete cleanBody.description;
    if (cleanBody.color === "") delete cleanBody.color;
    // Validate input
    const schema = Joi.object({
        name: Joi.string().min(2).max(50).required(),
        description: Joi.string().max(200).optional(),
        color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).optional(),
    });
    const { error, value } = schema.validate(cleanBody, { abortEarly: false });
    if (error) {
        return res.status(400).json({
            success: false,
            error: 'Validation error',
            details: error.details.map(d => d.message)
        });
    }
    try {
        // Remove empty description
        if (!value.description || value.description.trim() === "") {
            delete value.description;
        }
        // Assign a random color if not provided or empty
        if (!value.color || value.color.trim() === "") {
            const colorList = [
                '#FF5733', '#33B5FF', '#FF33A8', '#33FF57', '#FFC300',
                '#8E44AD', '#16A085', '#E67E22', '#2ECC71', '#E74C3C',
                '#2980B9', '#F39C12', '#27AE60', '#D35400', '#C0392B'
            ];
            value.color = colorList[Math.floor(Math.random() * colorList.length)];
        }
        const category = new Category(value);
        await category.save();
        res.status(201).json({ success: true, data: category });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};
const Category = require('../models/Category');

// GET /api/categories - public
const getAllCategories = async (req, res) => {
    try {
        const categories = await Category.find().sort({ name: 1 });
        res.json({ success: true, data: categories });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = {
    getAllCategories,
    createCategory,
};
