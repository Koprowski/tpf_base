// src/routes/pages.js
const express = require('express');
const router = express.Router();
const Page = require('../models/Page');

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
    const { title, content } = req.body;
    
    const page = await Page.create({
      title,
      content,
      author: req.user._id
    });
    
    console.log('Page created:', page);
    res.redirect(`/${req.user.username}/${page.urlId}`);
  } catch (error) {
    console.error('Error creating page:', error);
    res.status(500).render('error', { 
      message: 'Error creating page', 
      error: error 
    });
  }
});

// Update existing page
router.post('/pages/update/:urlId', isAuthenticated, async (req, res) => {
  try {
    console.log('Updating page:', req.params.urlId);
    const { content, title } = req.body;
    
    const page = await Page.findOneAndUpdate(
      { urlId: req.params.urlId, author: req.user._id },
      { $set: { content, title } },
      { new: true }
    );
    
    if (!page) {
      return res.status(404).render('404', { message: 'Page not found' });
    }
    
    res.redirect(`/${req.user.username}/${page.urlId}`);
  } catch (error) {
    console.error('Error updating page:', error);
    res.status(500).render('error', { 
      message: 'Error updating page', 
      error: error 
    });
  }
});

module.exports = router;