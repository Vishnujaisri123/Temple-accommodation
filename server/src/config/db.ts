import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { MongoMemoryReplSet } from 'mongodb-memory-server';

dotenv.config();

export const connectDB = async () => {
  try {
    let mongoUri = process.env.MONGO_URI;

    if (mongoUri) {
      try {
        console.log('Attempting to connect to MongoDB Atlas...');
        const conn = await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 4000 });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        return;
      } catch (atlasErr) {
        console.warn(`Could not connect to Atlas (${(atlasErr as Error).message}). Falling back to local in-memory database...`);
      }
    }

    console.log('Starting an in-memory MongoDB Replica Set for local development...');
    const replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    mongoUri = replSet.getUri();

    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB Connected (In-Memory): ${conn.connection.host}`);
    console.log('NOTE: You are using an in-memory database for local testing.');

  } catch (error) {
    console.error(`Error: ${(error as Error).message}`);
    process.exit(1);
  }
};
