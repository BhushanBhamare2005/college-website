import 'dotenv/config';
import mongoose from 'mongoose';
import { env } from './env.js';

let connectionPromise = null;

export async function connectDatabase(uri = env.MONGO_URI) {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (mongoose.connection.readyState === 0) connectionPromise = null;
  if (!connectionPromise) {
    connectionPromise = mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 0,
    }).then(() => mongoose.connection).catch((error) => {
      connectionPromise = null;
      throw error;
    });
  }
  return connectionPromise;
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
  connectionPromise = null;
}

export const databaseReady = () => mongoose.connection.readyState === 1;