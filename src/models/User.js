// src/models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  googleId: String,
  username: { 
    type: String, 
    required: true, 
    unique: true,
    minlength: 3,
    maxlength: 30,
    match: /^[a-zA-Z0-9_-]+$/
  },
  email: String,
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Update the updatedAt timestamp before saving
userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('User', userSchema);