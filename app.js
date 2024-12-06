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
const path = require('path');
const User = require('./src/models/User');
const Page = require('./src/models/Page');
const userRoutes = require('./src/routes/users.js');
const authRoutes = require('./src/routes/auth');
const apiRoutes = require('./src/routes/api');
const pageRoutes = require('./src/routes/pages');
const userPageRoutes = require('./src/routes/userPages');
const dotsApiRoutes = require('./src/routes/dotsApi');

const app = express();
const isDevelopment = process.env.NODE_ENV !== 'production';
const BASE_URL = isDevelopment ? 'http://localhost:3000' : 'https://tpf-base.onrender.com';

// Database connection with retry logic
const connectDB = async (retries = 5) => {
  for (let i = 0; i < retries; i++) {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('Connected to MongoDB');
      return;
    } catch (err) {
      if (i === retries - 1) {
        console.error('MongoDB connection failed after retries:', err);
        process.exit(1);
      }
      console.log(`MongoDB connection attempt ${i + 1} failed, retrying...`);
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds before retrying
    }
  }
};

// Trust proxy - must be first
app.set('trust proxy', 1);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static file serving - Updated with absolute paths
app.use('/public', express.static(path.join(__dirname, 'src', 'public')));
app.use('/js', express.static(path.join(__dirname, 'src', 'public', 'js')));
app.use('/css', express.static(path.join(__dirname, 'src', 'public', 'css')));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', './src/views');
app.use(expressLayouts);
app.set('layout', './layout');

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
    secure: !isDevelopment,
    httpOnly: true,
    sameSite: isDevelopment ? 'lax' : 'none',
    maxAge: 1000 * 60 * 60 * 24 * 7
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
    callbackURL: `${BASE_URL}/auth/google/callback`
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

// Add middleware to make static file paths available to all views
app.use((req, res, next) => {
  res.locals.publicPath = '/public';
  next();
});

// Basic routes
app.get('/', (req, res) => {
  res.render('index', { 
    user: req.user,
    title: 'Welcome to TPF Base',
    layout: './layout'
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
      title: 'Dashboard',
      layout: './layout'
    });
  } catch (error) {
    console.error('Error fetching pages:', error);
    res.status(500).render('error', { 
      message: 'Error loading dashboard', 
      error: error,
      layout: './layout'
    });
  }
});

// Routes
app.use('/auth', authRoutes);
app.use('/api', apiRoutes);
app.use('/api', dotsApiRoutes);
app.use('/', userRoutes);
app.use('/', pageRoutes);
app.use('/', userPageRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { 
    message: 'Something broke!',
    error: err,
    title: 'Error',
    layout: './layout'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('404', { 
    message: "The page you're looking for doesn't exist.",
    title: 'Page Not Found',
    layout: './layout'
  });
});

// Function to find an available port
const findAvailablePort = async (startPort, maxPort = startPort + 10) => {
  for (let port = startPort; port <= maxPort; port++) {
    try {
      await new Promise((resolve, reject) => {
        const server = require('net').createServer()
          .listen(port)
          .on('listening', () => {
            server.close();
            resolve(port);
          })
          .on('error', reject);
      });
      return port;
    } catch (err) {
      if (port === maxPort) throw new Error('No available ports found');
    }
  }
  throw new Error('No available ports found');
};

// Improved server start function with graceful shutdown
const startServer = async () => {
  try {
    await connectDB();
    
    const desiredPort = process.env.PORT || 3000;
    const port = await findAvailablePort(desiredPort);
    
    const server = app.listen(port, () => {
      console.log(`
====================================
🚀 Server is running on port ${port}
📁 View the app at ${BASE_URL}
====================================
      `);
    });

    // Graceful shutdown handlers
    const shutdown = async () => {
      console.log('\nShutting down gracefully...');
      server.close(async () => {
        console.log('Closed remaining connections.');
        await mongoose.connection.close();
        console.log('Database connections closed.');
        process.exit(0);
      });

      // Force close after 10 seconds
      setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      shutdown();
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      shutdown();
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();