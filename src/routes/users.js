// src/routes/users.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Page = require('../models/Page');
const mongoose = require('mongoose');

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/auth/google');
};

// Validate username
const validateUsername = (username) => {
  const usernameRegex = /^[a-zA-Z0-9_-]+$/;
  return username && 
         username.length >= 3 && 
         username.length <= 30 && 
         usernameRegex.test(username);
};

// Get profile page
router.get('/profile', isAuthenticated, async (req, res) => {
  try {
    const pageCount = await Page.countDocuments({ author: req.user._id });
    const pages = await Page.find({ author: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5); // Get 5 most recent pages
    
    res.render('profile', { 
      user: req.user, 
      pageCount,
      recentPages: pages,
      title: 'My Profile',
      message: req.flash('success'),
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

// Update username with transaction
router.post('/profile/update', isAuthenticated, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { username } = req.body;
    
    // Validate username format
    if (!validateUsername(username)) {
      req.flash('error', 'Username must be 3-30 characters long and can only contain letters, numbers, underscores, and hyphens');
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
      _id: { $ne: req.user._id }
    }).session(session);

    if (existingUser) {
      req.flash('error', 'Username is already taken');
      return res.redirect('/profile');
    }

    // Store old username for logging
    const oldUsername = req.user.username;

    // Update user document
    await User.findByIdAndUpdate(
      req.user._id,
      { 
        username,
        updatedAt: new Date()
      },
      { session }
    );

    // Log username change
    console.log(`Username changed from ${oldUsername} to ${username} for user ID: ${req.user._id}`);

    // Update session
    req.user.username = username;

    await session.commitTransaction();
    
    req.flash('success', 'Username updated successfully');
    res.redirect('/profile');
  } catch (error) {
    await session.abortTransaction();
    console.error('Error updating profile:', error);
    req.flash('error', 'Error updating profile. Please try again.');
    res.redirect('/profile');
  } finally {
    session.endSession();
  }
});

// Get public profile page
router.get('/user/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    
    if (!user) {
      return res.status(404).render('404', { 
        message: 'User not found',
        title: 'User Not Found' 
      });
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