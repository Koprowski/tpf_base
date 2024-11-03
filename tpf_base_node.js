// Required dependencies in package.json
{
  "name": "tpf-app",
  "version": "1.0.0",
  "dependencies": {
    "express": "^4.17.1",
    "mongoose": "^6.0.0",
    "passport": "^0.4.1",
    "passport-google-oauth20": "^2.0.0",
    "express-session": "^1.17.2",
    "dotenv": "^10.0.0",
    "ejs": "^3.1.6"
  }
}

// app.js - Main application file
const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
require('dotenv').config();

const app = express();

// Database Schema
const userSchema = new mongoose.Schema({
  googleId: String,
  username: { type: String, unique: true },
  email: String,
  pages: [{
    pageName: String,
    content: String,
    createdAt: Date
  }]
});

const User = mongoose.model('User', userSchema);

// Middleware
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// Google OAuth setup
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "https://tpf.ai/auth/google/callback"
  },
  async function(accessToken, refreshToken, profile, cb) {
    try {
      let user = await User.findOne({ googleId: profile.id });
      if (!user) {
        user = await User.create({
          googleId: profile.id,
          email: profile.emails[0].value,
          username: profile.emails[0].value.split('@')[0] // Default username
        });
      }
      return cb(null, user);
    } catch (err) {
      return cb(err);
    }
  }
));

// Routes
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/dashboard');
  }
);

// User page creation and retrieval
app.post('/api/pages', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  
  try {
    const { pageName, content } = req.body;
    const user = await User.findById(req.user._id);
    user.pages.push({ pageName, content, createdAt: new Date() });
    await user.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/:username/:pagename', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).send('User not found');
    
    const page = user.pages.find(p => p.pageName === req.params.pagename);
    if (!page) return res.status(404).send('Page not found');
    
    res.json(page);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
