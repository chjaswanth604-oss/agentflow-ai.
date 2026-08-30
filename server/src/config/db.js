const mongoose = require('mongoose');
const env = require('./env');
const path = require('path');
const fs = require('fs');

let isInMemory = false;
let mongoMemoryServerInstance = null;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return { connected: true, isInMemory };
  }

  // Disconnect stale connections before reconnecting
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect().catch(() => {});
  }

  const isOfflineRequested = !env.MONGO_URI || env.MONGO_URI.toLowerCase() === 'offline' || env.MONGO_URI.toLowerCase() === 'local';

  if (!isOfflineRequested) {
    try {
      const isAtlas = env.MONGO_URI.includes('mongodb+srv');
      const conn = await mongoose.connect(env.MONGO_URI, {
        serverSelectionTimeoutMS: isAtlas ? 4000 : 3000
      });
      console.log(`[MongoDB Cluster] Connected successfully to: ${conn.connection.host}`);
      return { connected: true, isInMemory: false };
    } catch (err) {
      console.warn(`[MongoDB] Cloud connection skipped (${err.message}). Starting Local Offline Database...`);
    }
  }

  // Local Offline Database Engine (Persisted to server/data/db)
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const dbStorageDir = path.join(__dirname, '../../data/db');
    if (!fs.existsSync(dbStorageDir)) {
      fs.mkdirSync(dbStorageDir, { recursive: true });
    }

    mongoMemoryServerInstance = await MongoMemoryServer.create({
      instance: {
        dbPath: dbStorageDir,
        storageEngine: 'wiredTiger'
      }
    });

    const mongoUri = mongoMemoryServerInstance.getUri();
    await mongoose.connect(mongoUri);
    isInMemory = true;
    console.log(`[Offline Database Engine] Connected successfully (Local Storage: server/data/db)`);
    return { connected: true, isInMemory: true };
  } catch (memErr) {
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongoMemoryServerInstance = await MongoMemoryServer.create();
      const mongoUri = mongoMemoryServerInstance.getUri();
      await mongoose.connect(mongoUri);
      isInMemory = true;
      console.log(`[Offline Database Engine] Connected in-memory fallback at: ${mongoUri}`);
      return { connected: true, isInMemory: true };
    } catch (finalErr) {
      console.error(`[Offline DB] Initialization error (${finalErr.message}).`);
      return { connected: false, isInMemory: true, error: finalErr.message };
    }
  }
};

const getDBStatus = () => {
  return {
    state: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    isInMemory,
    host: mongoose.connection.host || 'offline-local-db'
  };
};

module.exports = { connectDB, getDBStatus };
