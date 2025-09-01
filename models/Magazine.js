const mongoose = require('mongoose');

const magazineSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    topic: {
        type: String,
        required: true,
        trim: true
    },
    date: {
        type: Date,
        required: true
    },
    pages: {
        type: Number,
        required: true
    },
    pdfUrl: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Magazine', magazineSchema);
