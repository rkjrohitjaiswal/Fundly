import mongoose from 'mongoose';

let isConnected = false;
let hasLoggedMode = false;

// Register Mongoose connection event listeners
mongoose.connection.on('connected', () => {
  isConnected = true;
  console.log('[Fundly DB] Mongoose event: connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('[Fundly DB] Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  console.warn('[Fundly DB] Mongoose event: disconnected from MongoDB');
});

export async function connectDB(): Promise<boolean> {
  if (isConnected && mongoose.connection.readyState === 1) {
    return true;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    if (!hasLoggedMode) {
      console.log('[Fundly DB] No MONGODB_URI provided. Running in high-performance Demo In-Memory mode.');
      hasLoggedMode = true;
    }
    isConnected = false;
    return false;
  }

  try {
    mongoose.set('strictQuery', false);
    
    // Connect with Mongoose configuration
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000,
      autoIndex: true,
    });
    
    isConnected = mongoose.connection.readyState === 1;
    console.log('[Fundly DB] Connected to MongoDB database successfully at', uri);
    return true;
  } catch (err: any) {
    console.warn('[Fundly DB] Notice: Live MongoDB daemon not reachable (' + err.message + ').');
    console.log('[Fundly DB] Activating resilient in-memory document engine for Fundly sandbox.');
    isConnected = false;
    return false;
  }
}

export function isDbConnected(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
}

export async function disconnectDB(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    isConnected = false;
    console.log('[Fundly DB] Disconnected from MongoDB');
  }
}
