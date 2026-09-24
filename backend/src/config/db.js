const mongoose = require('mongoose');
const { MONGODB_URI, NODE_ENV } = require('./env');

let memoryServer = null;

const connectDB = async () => {
  try {
    let uri = MONGODB_URI;

    if (!uri) {
      console.log('ℹ️  No MONGODB_URI supplied. Spinning up embedded MongoDB Memory Server for local development/testing...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      memoryServer = await MongoMemoryServer.create();
      uri = memoryServer.getUri();
      console.log(`✅ Embedded MongoDB server running at: ${uri}`);
    }

    mongoose.set('strictQuery', true);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`📦 MongoDB connected successfully to ${mongoose.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    if (memoryServer) {
      await memoryServer.stop();
    }
    console.log('MongoDB connection closed.');
  } catch (err) {
    console.error('Error closing MongoDB connection:', err);
  }
};

module.exports = { connectDB, disconnectDB };
