// src/routes/auth.js
const express = require('express');
const passport = require('passport');
const router = express.Router();

router.get('/google', (req, res, next) => {
  console.log('Starting Google authentication...');
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    accessType: 'offline',
    prompt: 'select_account'
  })(req, res, next);
});

router.get('/google/callback', (req, res, next) => {
  console.log('Google callback received');
  passport.authenticate('google', {
    failureRedirect: '/',
    failureMessage: true,
    successRedirect: '/dashboard'
  })(req, res, next);
});

router.get('/logout', (req, res, next) => {
  console.log('Logging out user:', req.user?.username);
  req.logout(function(err) {
    if (err) {
      console.error('Logout error:', err);
      return next(err);
    }
    res.redirect('/');
  });
});

// Debug route to check session
router.get('/session', (req, res) => {
  res.json({
    sessionExists: !!req.session,
    sessionID: req.sessionID,
    isAuthenticated: req.isAuthenticated(),
    user: req.user ? {
      id: req.user.id,
      username: req.user.username,
      email: req.user.email
    } : null
  });
});

module.exports = router;