// src/models/Page.js
const mongoose = require('mongoose');
const crypto = require('crypto');

const generateUniqueId = () => crypto.randomBytes(4).toString('hex');

const pageSchema = new mongoose.Schema({
  urlId: {
    type: String,
    required: true,
    unique: true,
    default: generateUniqueId
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient lookups
pageSchema.index({ urlId: 1 });
pageSchema.index({ author: 1 });

module.exports = mongoose.model('Page', pageSchema);