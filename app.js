// app.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const expressLayouts = require('express-ejs-layouts');
const User = require('./src/models/User');

const app = express();
const RENDER_EXTERNAL_URL = 'https://tpf-base.onrender.com';

// Database connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('src/public'));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', './src/views');
app.use(expressLayouts);

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    ttl: 60 * 60 * 24 * 7,
    autoRemove: 'native'
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7,
    secure: true,
    sameSite: 'none',
    domain: '.onrender.com'
  },
  proxy: true
}));

// Passport configuration
app.use(passport.initialize());
app.use(passport.session());

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${RENDER_EXTERNAL_URL}/auth/google/callback`,
    passReqToCallback: true
  },
  async function(req, accessToken, refreshToken, profile, cb) {
    try {
      console.log('Google Strategy callback:', {
        profileId: profile.id,
        email: profile.emails?.[0]?.value
      });
      
      let user = await User.findOne({ googleId: profile.id });
      if (!user) {
        console.log('Creating new user...');
        user = await User.create({
          googleId: profile.id,
          email: profile.emails[0].value,
          username: profile.emails[0].value.split('@')[0]
        });
        console.log('New user created:', user.username);
      } else {
        console.log('Existing user found:', user.username);
      }
      return cb(null, user);
    } catch (err) {
      console.error('Google Strategy error:', err);
      return cb(err);
    }
  }
));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// Trust proxy
app.set('trust proxy', 1);

// Basic routes
app.get('/', (req, res) => {
  res.render('index', { user: req.user });
});

app.get('/dashboard', (req, res) => {
  if (!req.user) return res.redirect('/auth/google');
  res.render('dashboard', { user: req.user });
});

// Auth routes
app.use('/auth', require('./src/routes/auth'));

// API routes for creating/updating pages
app.use('/api', require('./src/routes/api'));

// User page routes (must be last)
app.use('/', require('./src/routes/userPages'));

const startServer = async () => {
  try {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.clear();
      console.log(`
====================================
🚀 Server is running on port ${PORT}
📁 View the app at ${RENDER_EXTERNAL_URL}
====================================
      `);
    }).on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use.`);
        process.exit(1);
      } else {
        console.error('Server error:', err);
        process.exit(1);
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();