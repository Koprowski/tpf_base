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

// Show edit form
router.get('/pages/edit/:urlId', isAuthenticated, async (req, res) => {
  try {
    const page = await Page.findOne({
      urlId: req.params.urlId,
      author: req.user._id
    });
    
    if (!page) {
      return res.status(404).render('404', { 
        message: 'Page not found',
        title: 'Page Not Found'
      });
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
      return res.status(404).json({
        success: false,
        error: 'Page not found'
      });
    }
    
    res.json({
      success: true,
      page: {
        title: page.title,
        urlId: page.urlId
      }
    });
  } catch (error) {
    console.error('Error updating page:', error);
    res.status(500).json({
      success: false,
      error: 'Error updating page'
    });
  }
});

// Add this new route for updating page title/URL
router.put('/api/pages/:urlId', isAuthenticated, async (req, res) => {
  try {
      console.log('Updating page details:', req.params.urlId);
      console.log('Request body:', req.body);
      const { url } = req.body;
      
      // Validate new URL exists
      if (!url) {
          return res.status(400).json({ 
              success: false,
              error: 'New URL is required' 
          });
      }

      // Check if URL is already in use
      const existingPage = await Page.findOne({
          urlId: url,
          author: req.user._id,
          _id: { $ne: req.params.urlId }
      });

      if (existingPage) {
          return res.status(400).json({
              success: false,
              error: 'This URL is already in use'
          });
      }

      // Update the page
      const page = await Page.findOneAndUpdate(
          { urlId: req.params.urlId, author: req.user._id },
          { urlId: url },
          { new: true }
      );
      
      if (!page) {
          return res.status(404).json({ 
              success: false,
              error: 'Page not found' 
          });
      }
      
      // Send successful response with all needed data
      res.json({
          success: true,
          page: {
              title: page.title,
              urlId: page.urlId,
              username: req.user.username
          }
      });
  } catch (error) {
      console.error('Error updating page URL:', error);
      res.status(500).json({ 
          success: false,
          error: 'Error updating page URL' 
      });
  }
});

// Delete page endpoint
router.delete('/api/pages/:urlId', isAuthenticated, async (req, res) => {
    try {
        const page = await Page.findOneAndDelete({
            urlId: req.params.urlId,
            author: req.user._id
        });

        if (!page) {
            return res.status(404).json({
                success: false,
                error: 'Page not found'
            });
        }

        res.json({
            success: true,
            message: 'Page deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting page:', error);
        res.status(500).json({
            success: false,
            error: 'Error deleting page'
        });
    }
});

module.exports = router;