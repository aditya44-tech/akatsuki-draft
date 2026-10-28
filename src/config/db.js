import mongoose from 'mongoose';
import dns from 'dns';

let memoryServerInstance = null;

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/akatsuki_draft';

  try {
    // If using MongoDB Atlas SRV connection string, ensure reliable DNS resolution
    if (uri.startsWith('mongodb+srv://')) {
      try {
        dns.setServers(['8.8.8.8', '1.1.1.1']);
      } catch (dnsErr) {
        // Continue if dns servers cannot be set
      }
    }

    mongoose.set('strictQuery', false);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
    });
    console.log(`[Database] MongoDB connected successfully to: ${uri.replace(/:([^:@]+)@/, ':****@')}`);
  } catch (error) {
    console.warn(`[Database] Standard MongoDB connection failed (${error.message}).`);
    console.log('[Database] Starting in-memory MongoDB fallback (mongodb-memory-server)...');

    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      memoryServerInstance = await MongoMemoryServer.create();
      const memoryUri = memoryServerInstance.getUri();
      await mongoose.connect(memoryUri);
      console.log(`[Database] In-memory MongoDB connected successfully at: ${memoryUri}`);
    } catch (memErr) {
      console.error('[Database] Failed to initialize in-memory MongoDB fallback:', memErr);
      throw memErr;
    }
  }
};

export const closeDB = async () => {
  try {
    await mongoose.disconnect();
    if (memoryServerInstance) {
      await memoryServerInstance.stop();
    }
  } catch (err) {
    console.error('[Database] Error closing DB connection:', err);
  }
};
