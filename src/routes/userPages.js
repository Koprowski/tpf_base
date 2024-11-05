// src/routes/userPages.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Page = require('../models/Page');

router.get('/:username/:urlId', async (req, res) => {
  try {
    console.log('Accessing page:', req.params);
    const user = await User.findOne({ username: req.params.username });
    
    if (!user) {
      console.log('User not found:', req.params.username);
      return res.status(404).render('404', { message: 'User not found' });
    }
    
    const page = await Page.findOne({ 
      urlId: req.params.urlId,
      author: user._id 
    });
    
    if (!page) {
      console.log('Page not found:', req.params.urlId);
      return res.status(404).render('404', { message: 'Page not found' });
    }
    
    res.render('page', { 
      page, 
      user, 
      currentUser: req.user,
      title: page.title 
    });
  } catch (error) {
    console.error('Error accessing page:', error);
    res.status(500).render('error', { 
      message: 'Error accessing page', 
      error: error 
    });
  }
});

// List user's public pages
router.get('/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    
    if (!user) {
      return res.status(404).render('404', { message: 'User not found' });
    }
    
    const pages = await Page.find({ author: user._id })
      .sort({ createdAt: -1 });
    
    res.render('pages/public-list', {
      pages,
      pageOwner: user,
      currentUser: req.user,
      title: `${user.username}'s Pages`
    });
  } catch (error) {
    console.error('Error listing user pages:', error);
    res.status(500).render('error', { 
      message: 'Error listing pages', 
      error: error 
    });
  }
});

module.exports = router;