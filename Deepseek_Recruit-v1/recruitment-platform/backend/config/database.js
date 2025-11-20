import mongoose from 'mongoose';
import pg from 'pg';

const { Pool } = pg;

// MongoDB connection for application data
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// PostgreSQL connection for vector data
const pgPool = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});

// Initialize pgvector extension
const initVectorDB = async () => {
  try {
    const client = await pgPool.connect();
    await client.query('CREATE EXTENSION IF NOT EXISTS vector;');
    console.log('PostgreSQL with pgvector initialized');
    client.release();
  } catch (error) {
    console.error('PostgreSQL initialization error:', error);
  }
};

export { connectDB, pgPool, initVectorDB };
export default connectDB;