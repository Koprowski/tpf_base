// src/routes/pages.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/auth/google');
};

// Create new page
router.post('/pages/create', isAuthenticated, async (req, res) => {
  try {
    console.log('Creating new page:', req.body);
    const { pageName, content } = req.body;
    const user = await User.findById(req.user._id);
    
    // Check if page already exists
    const pageExists = user.pages.some(p => p.pageName === pageName);
    if (pageExists) {
      return res.status(400).render('error', {
        message: 'A page with this name already exists',
        error: { message: 'Please choose a different page name' }
      });
    }

    // Add the new page
    user.pages.push({ pageName, content });
    await user.save();
    
    // Redirect to the new page
    res.redirect(`/${user.username}/${encodeURIComponent(pageName)}`);
  } catch (error) {
    console.error('Error creating page:', error);
    res.status(500).render('error', { 
      message: 'Error creating page', 
      error: error 
    });
  }
});

// Update existing page
router.post('/pages/update/:pagename', isAuthenticated, async (req, res) => {
  try {
    console.log('Updating page:', req.params.pagename);
    const { content } = req.body;
    const user = await User.findById(req.user._id);
    const page = user.pages.find(p => p.pageName === decodeURIComponent(req.params.pagename));
    
    if (!page) {
      return res.status(404).render('404', { message: 'Page not found' });
    }
    
    page.content = content;
    await user.save();
    res.redirect(`/${user.username}/${encodeURIComponent(req.params.pagename)}`);
  } catch (error) {
    console.error('Error updating page:', error);
    res.status(500).render('error', { 
      message: 'Error updating page', 
      error: error 
    });
  }
});

module.exports = router;