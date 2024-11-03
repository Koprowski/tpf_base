// src/routes/userPages.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.get('/:username/:pagename', async (req, res) => {
  try {
    console.log('Accessing page:', req.params);
    const user = await User.findOne({ username: req.params.username });
    
    if (!user) {
      console.log('User not found:', req.params.username);
      return res.status(404).render('404', { message: 'User not found' });
    }
    
    const page = user.pages.find(p => p.pageName === decodeURIComponent(req.params.pagename));
    
    if (!page) {
      console.log('Page not found:', req.params.pagename);
      return res.status(404).render('404', { message: 'Page not found' });
    }
    
    res.render('page', { 
      page, 
      user, 
      currentUser: req.user,
      title: page.pageName 
    });
  } catch (error) {
    console.error('Error accessing page:', error);
    res.status(500).render('error', { 
      message: 'Error accessing page', 
      error: error 
    });
  }
});

module.exports = router;