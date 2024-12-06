const mongoose = require('mongoose');
const shortid = require('shortid');

// Define dot schema with all required fields
const dotSchema = new mongoose.Schema({
    x: {
        type: String,
        required: true
    },
    y: {
        type: String,
        required: true
    },
    label: {
        type: String,
        default: ''
    },
    coordinates: {
        type: String,
        required: true
    },
    id: {
        type: String
    },
    // Ensure labelOffset is properly defined
    labelOffset: {
        x: {
            type: Number,
            required: true,
            default: 50
        },
        y: {
            type: Number,
            required: true,
            default: -50
        },
        _id: false // Prevent Mongoose from adding _id to this subdocument
    },
    // Add explicit fields for line properties
    lineLength: {
        type: Number,
        required: true,
        default: 70.71067811865476 // Default calculated from 50,-50 offset
    },
    lineAngle: {
        type: Number,
        required: true,
        default: -45 // Default angle for 50,-50 offset
    }
}, { 
    _id: false, // Prevent Mongoose from adding _id to dots
    minimize: false // Prevent Mongoose from removing empty objects
});

const pageSchema = new mongoose.Schema({
    urlId: {
        type: String,
        default: shortid.generate,
        unique: true
    },
    title: {
        type: String,
        required: true
    },
    content: String,
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    dots: [dotSchema],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Add middleware to log dots before saving
pageSchema.pre('save', function(next) {
    console.log('Pre-save dots:', JSON.stringify(this.dots, null, 2));
    next();
});

// Add middleware to log dots after saving
pageSchema.post('save', function(doc) {
    console.log('Post-save dots:', JSON.stringify(doc.dots, null, 2));
});

module.exports = mongoose.model('Page', pageSchema);