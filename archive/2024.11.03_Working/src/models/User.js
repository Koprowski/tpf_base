// src/models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  googleId: String,
  username: { type: String, unique: true },
  email: String,
  pages: [{
    pageName: { type: String, required: true },
    content: String,
    createdAt: { type: Date, default: Date.now }
  }]
});

module.exports = mongoose.model('User', userSchema);


