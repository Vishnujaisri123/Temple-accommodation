import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { MongoMemoryReplSet } from 'mongodb-memory-server';

dotenv.config();

export const connectDB = async () => {
  try {
    let mongoUri = process.env.MONGO_URI;

    // Use in-memory MongoDB if no URI is provided (perfect for local dev testing)
    if (!mongoUri) {
      console.log('No MONGO_URI provided. Starting an in-memory MongoDB Replica Set for transactions...');
      const replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
      mongoUri = replSet.getUri();
    }

    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Optional: Log that it's using a temporary database
    if (!process.env.MONGO_URI) {
      console.log('NOTE: You are using an in-memory database. Data will be cleared when the server restarts.');
    }

  } catch (error) {
    console.error(`Error: ${(error as Error).message}`);
    process.exit(1);
  }
};
