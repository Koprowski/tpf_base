// src/routes/users.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Page = require('../models/Page');

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/auth/google');
};

// Get profile page
router.get('/profile', isAuthenticated, async (req, res) => {
  try {
    const pageCount = await Page.countDocuments({ author: req.user._id });
    res.render('profile', { 
      user: req.user, 
      pageCount,
      title: 'My Profile',
      message: req.flash('message'),
      error: req.flash('error')
    });
  } catch (error) {
    console.error('Error loading profile:', error);
    res.status(500).render('error', { 
      message: 'Error loading profile', 
      error: error 
    });
  }
});

// Update username
router.post('/profile/update', isAuthenticated, async (req, res) => {
  try {
    const { username } = req.body;
    
    // Validate username
    if (!username || username.length < 3) {
      req.flash('error', 'Username must be at least 3 characters long');
      return res.redirect('/profile');
    }

    // Check if username is different from current
    if (username === req.user.username) {
      req.flash('error', 'New username must be different from current username');
      return res.redirect('/profile');
    }

    // Check if username is already taken
    const existingUser = await User.findOne({ 
      username: username,
      _id: { $ne: req.user._id } // Exclude current user
    });

    if (existingUser) {
      req.flash('error', 'Username is already taken');
      return res.redirect('/profile');
    }

    // Update username
    await User.findByIdAndUpdate(req.user._id, { username });
    
    // Update session
    req.user.username = username;
    
    req.flash('message', 'Username updated successfully');
    res.redirect('/profile');
  } catch (error) {
    console.error('Error updating profile:', error);
    req.flash('error', 'Error updating profile');
    res.redirect('/profile');
  }
});

// Get public profile page
router.get('/user/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    
    if (!user) {
      return res.status(404).render('404', { message: 'User not found' });
    }
    
    const pages = await Page.find({ author: user._id })
      .sort({ createdAt: -1 });
    
    res.render('public-profile', {
      profileUser: user,
      pages,
      currentUser: req.user,
      title: `${user.username}'s Profile`
    });
  } catch (error) {
    console.error('Error loading public profile:', error);
    res.status(500).render('error', { 
      message: 'Error loading profile', 
      error: error 
    });
  }
});

module.exports = router;