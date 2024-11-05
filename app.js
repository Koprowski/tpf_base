// app.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const expressLayouts = require('express-ejs-layouts');
const flash = require('connect-flash');
const User = require('./src/models/User');
const Page = require('./src/models/Page');

const app = express();
const RENDER_EXTERNAL_URL = 'https://tpf-base.onrender.com';

// Database connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Trust proxy - must be first
app.set('trust proxy', 1);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('src/public'));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', './src/views');
app.use(expressLayouts);

// Session configuration - must be before passport
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  proxy: true,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    ttl: 60 * 60 * 24 * 7
  }),
  cookie: {
    secure: true,
    httpOnly: true,
    sameSite: 'none',
    maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
  }
}));

// Initialize flash messages
app.use(flash());

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// Passport configuration
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${RENDER_EXTERNAL_URL}/auth/google/callback`
  },
  async function(accessToken, refreshToken, profile, cb) {
    try {
      console.log('Processing Google authentication...');
      let user = await User.findOne({ googleId: profile.id });
      
      if (!user) {
        console.log('Creating new user...');
        user = await User.create({
          googleId: profile.id,
          email: profile.emails[0].value,
          username: profile.emails[0].value.split('@')[0],
          createdAt: new Date()
        });
      }
      
      console.log('Authentication successful for user:', user.username);
      return cb(null, user);
    } catch (err) {
      console.error('Authentication error:', err);
      return cb(err);
    }
  }
));

passport.serializeUser((user, done) => {
  console.log('Serializing user:', user.id);
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    console.log('Deserialized user:', user?.username);
    done(null, user);
  } catch (err) {
    console.error('Deserialization error:', err);
    done(err);
  }
});

// Middleware to log session and user status
app.use((req, res, next) => {
  console.log('Session ID:', req.sessionID);
  console.log('User authenticated:', !!req.user);
  next();
});

// Basic routes
app.get('/', (req, res) => {
  res.render('index', { 
    user: req.user,
    title: 'Welcome to TPF Base'
  });
});

app.get('/dashboard', async (req, res) => {
  if (!req.user) {
    console.log('Unauthorized dashboard access attempt');
    return res.redirect('/auth/google');
  }
  try {
    const pages = await Page.find({ author: req.user._id })
      .sort({ createdAt: -1 });
    console.log('Rendering dashboard for user:', req.user.username);
    res.render('dashboard', { 
      user: req.user, 
      pages,
      title: 'Dashboard'
    });
  } catch (error) {
    console.error('Error fetching pages:', error);
    res.status(500).render('error', { 
      message: 'Error loading dashboard', 
      error: error 
    });
  }
});

// Auth routes
app.use('/auth', require('./src/routes/auth'));

// API routes for creating/updating pages
app.use('/api', require('./src/routes/api'));

// User profile routes
app.use('/', require('./src/routes/users'));

// Page routes
app.use('/', require('./src/routes/pages'));

// User page routes (must be last)
app.use('/', require('./src/routes/userPages'));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { 
    message: 'Something broke!',
    error: err,
    title: 'Error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('404', { 
    message: "The page you're looking for doesn't exist.",
    title: 'Page Not Found'
  });
});

const startServer = async () => {
  try {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`
====================================
🚀 Server is running on port ${PORT}
📁 View the app at ${RENDER_EXTERNAL_URL}
====================================
      `);
    }).on('error', (err) => {
      console.error('Server error:', err);
      process.exit(1);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();