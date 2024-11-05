// src/routes/pages.js
const express = require('express');
const router = express.Router();
const Page = require('../models/Page');
const User = require('../models/User');

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/auth/google');
};

// List pages
router.get('/pages', isAuthenticated, async (req, res) => {
  try {
    const pages = await Page.find({ author: req.user._id })
      .sort({ createdAt: -1 });
    
    res.render('pages/list', { 
      user: req.user, 
      pages,
      title: 'My Pages'
    });
  } catch (error) {
    console.error('Error listing pages:', error);
    res.status(500).render('error', { 
      message: 'Error listing pages', 
      error: error 
    });
  }
});

// Create new page
router.post('/pages/create', isAuthenticated, async (req, res) => {
  try {
    console.log('Creating new page:', req.body);
    const { title, content } = req.body;
    
    // Check if title is provided
    if (!title) {
      return res.status(400).render('error', {
        message: 'Title is required',
        error: { message: 'Please provide a title for the page' }
      });
    }

    // Create new page
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

// Show page creation form
router.get('/pages/new', isAuthenticated, (req, res) => {
  res.render('pages/new', { 
    user: req.user,
    title: 'Create New Page'
  });
});

// Edit page form
router.get('/pages/edit/:urlId', isAuthenticated, async (req, res) => {
  try {
    const page = await Page.findOne({
      urlId: req.params.urlId,
      author: req.user._id
    });
    
    if (!page) {
      return res.status(404).render('404', { message: 'Page not found' });
    }
    
    res.render('pages/edit', {
      user: req.user,
      page,
      title: `Edit: ${page.title}`
    });
  } catch (error) {
    console.error('Error loading edit form:', error);
    res.status(500).render('error', { 
      message: 'Error loading edit form', 
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