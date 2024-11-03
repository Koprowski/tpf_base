// src/routes/auth.js
const express = require('express');
const passport = require('passport');
const router = express.Router();

// Add logging middleware
const logRequest = (req, res, next) => {
  console.log('Auth Request:', {
    path: req.path,
    method: req.method,
    session: req.session ? 'exists' : 'none',
    user: req.user ? 'exists' : 'none'
  });
  next();
};

router.use(logRequest);

router.get('/google',
  (req, res, next) => {
    console.log('Starting Google auth...');
    next();
  },
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    prompt: 'select_account',
    accessType: 'offline',
    includeGrantedScopes: true
  })
);

router.get('/google/callback',
  (req, res, next) => {
    console.log('Received Google callback:', {
      query: req.query,
      error: req.query.error
    });
    next();
  },
  passport.authenticate('google', { 
    failureRedirect: '/',
    failureMessage: true,
    successReturnToOrRedirect: '/dashboard'
  }),
  (req, res) => {
    console.log('Authentication successful, redirecting...');
    res.redirect('/dashboard');
  }
);

router.get('/logout', function(req, res, next) {
  req.logout(function(err) {
    if (err) { 
      console.error('Logout error:', err);
      return next(err); 
    }
    res.redirect('/');
  });
});

module.exports = router;