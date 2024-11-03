// test-config.js
require('dotenv').config();
const mongoose = require('mongoose');

async function testConfig() {
  console.log('\n--- Configuration Test ---\n');
  
  // Check environment variables
  const requiredEnvVars = [
    'MONGODB_URI',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'SESSION_SECRET'
  ];

  let missingVars = false;
  requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      console.error(`❌ Missing ${varName} in .env file`);
      missingVars = true;
    } else {
      console.log(`✅ ${varName} is configured`);
    }
  });

  if (missingVars) {
    console.error('\n⚠️  Please add missing variables to your .env file');
    process.exit(1);
  }

  // Test MongoDB connection
  try {
    console.log('\nTesting MongoDB connection...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB connection successful');
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }

  console.log('\n✨ All configuration tests passed!\n');
}

testConfig();
