// migrate-pages.js
require('dotenv').config();
const mongoose = require('mongoose');
const crypto = require('crypto');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Define the old User schema
const oldUserSchema = new mongoose.Schema({
  googleId: String,
  username: String,
  email: String,
  pages: [{
    pageName: String,
    content: String,
    createdAt: Date
  }]
});

const OldUser = mongoose.model('User', oldUserSchema);

// Define the new schemas
const newUserSchema = new mongoose.Schema({
  googleId: String,
  username: { type: String, unique: true },
  email: String,
  createdAt: { type: Date, default: Date.now }
});

const pageSchema = new mongoose.Schema({
  urlId: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const NewUser = mongoose.model('NewUser', newUserSchema);
const Page = mongoose.model('Page', pageSchema);

async function generateUniqueUrlId() {
  while (true) {
    const urlId = crypto.randomBytes(4).toString('hex');
    const existingPage = await Page.findOne({ urlId });
    if (!existingPage) {
      return urlId;
    }
    console.log('URL ID collision, generating new one...');
  }
}

async function migrateData() {
  try {
    console.log('Starting migration...');
    
    // Get all users
    const users = await OldUser.find({});
    console.log(`Found ${users.length} users to migrate`);

    // Keep track of migration statistics
    const stats = {
      usersProcessed: 0,
      pagesMigrated: 0,
      errors: []
    };

    // Process each user
    for (const oldUser of users) {
      try {
        console.log(`\nProcessing user: ${oldUser.username}`);
        
        // Create or update user with new schema
        let newUser = await NewUser.findOne({ googleId: oldUser.googleId });
        
        if (!newUser) {
          newUser = await NewUser.create({
            googleId: oldUser.googleId,
            username: oldUser.username,
            email: oldUser.email,
            createdAt: oldUser._id.getTimestamp()
          });
          console.log('Created new user record');
        }

        // Migrate each page
        if (oldUser.pages && oldUser.pages.length > 0) {
          console.log(`Migrating ${oldUser.pages.length} pages for user ${oldUser.username}`);
          
          for (const oldPage of oldUser.pages) {
            try {
              const urlId = await generateUniqueUrlId();
              
              await Page.create({
                urlId,
                title: oldPage.pageName,
                content: oldPage.content,
                author: newUser._id,
                createdAt: oldPage.createdAt || oldUser._id.getTimestamp()
              });

              stats.pagesMigrated++;
              console.log(`Migrated page: ${oldPage.pageName} -> ${urlId}`);
            } catch (pageError) {
              console.error(`Error migrating page ${oldPage.pageName}:`, pageError);
              stats.errors.push({
                type: 'page',
                user: oldUser.username,
                page: oldPage.pageName,
                error: pageError.message
              });
            }
          }
        }

        stats.usersProcessed++;
      } catch (userError) {
        console.error(`Error processing user ${oldUser.username}:`, userError);
        stats.errors.push({
          type: 'user',
          user: oldUser.username,
          error: userError.message
        });
      }
    }

    // Print migration summary
    console.log('\n=== Migration Summary ===');
    console.log(`Users processed: ${stats.usersProcessed}`);
    console.log(`Pages migrated: ${stats.pagesMigrated}`);
    console.log(`Errors encountered: ${stats.errors.length}`);
    
    if (stats.errors.length > 0) {
      console.log('\nErrors:');
      stats.errors.forEach((error, index) => {
        console.log(`\n${index + 1}. ${error.type === 'user' ? 'User' : 'Page'} Error:`);
        console.log(`   User: ${error.user}`);
        if (error.page) console.log(`   Page: ${error.page}`);
        console.log(`   Error: ${error.error}`);
      });
    }

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

// Add error handlers
process.on('unhandledRejection', (error) => {
  console.error('Unhandled Promise Rejection:', error);
  mongoose.connection.close().then(() => process.exit(1));
});

process.on('SIGINT', () => {
  mongoose.connection.close().then(() => {
    console.log('\nDatabase connection closed through app termination');
    process.exit(0);
  });
});

// Run the migration
migrateData().then(() => {
  console.log('Migration complete');
  process.exit(0);
}).catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});