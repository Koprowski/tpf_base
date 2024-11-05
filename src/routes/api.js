// src/routes/api.js
const express = require('express');
const router = express.Router();
const Page = require('../models/Page');

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized' });
};

// Get user's pages
router.get('/pages', isAuthenticated, async (req, res) => {
  try {
    const pages = await Page.find({ author: req.user._id })
      .sort({ createdAt: -1 });
    res.json(pages);
  } catch (error) {
    console.error('Error fetching pages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new page
router.post('/pages/create', isAuthenticated, async (req, res) => {
  try {
    const { title, content } = req.body;
    
    const page = await Page.create({
      title,
      content,
      author: req.user._id
    });
    
    res.redirect(`/${req.user.username}/${page.urlId}`);
  } catch (error) {
    console.error('Error creating page:', error);
    res.status(500).render('error', { 
      message: 'Error creating page', 
      error: error 
    });
  }
});

// Update page
router.post('/pages/update/:urlId', isAuthenticated, async (req, res) => {
  try {
    const { content, title } = req.body;
    
    const page = await Page.findOneAndUpdate(
      { urlId: req.params.urlId, author: req.user._id },
      { $set: { content, title } },
      { new: true }
    );
    
    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
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

// Delete page
router.delete('/pages/:urlId', isAuthenticated, async (req, res) => {
  try {
    const page = await Page.findOneAndDelete({
      urlId: req.params.urlId,
      author: req.user._id
    });
    
    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }
    
    res.json({ message: 'Page deleted successfully' });
  } catch (error) {
    console.error('Error deleting page:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;