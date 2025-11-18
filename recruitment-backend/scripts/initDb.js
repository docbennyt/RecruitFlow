const { Client } = require('pg');
require('dotenv').config();

const initSQL = `
-- Enable vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    phone VARCHAR(50),
    role VARCHAR(50) DEFAULT 'employer',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP
);

-- CVs table with vector storage
CREATE TABLE IF NOT EXISTS cvs (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500),
    file_size INTEGER,
    file_type VARCHAR(50),
    extracted_text TEXT,
    processed_data JSONB,
    embedding VECTOR(1536),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP
);

-- Jobs table with vector storage
CREATE TABLE IF NOT EXISTS jobs (
    id SERIAL PRIMARY KEY,
    employer_id INTEGER REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    requirements TEXT,
    skills TEXT[],
    experience_level INTEGER DEFAULT 0,
    location VARCHAR(255),
    salary_range VARCHAR(100),
    employment_type VARCHAR(100),
    embedding VECTOR(1536),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP
);

-- Applications table
CREATE TABLE IF NOT EXISTS applications (
    id SERIAL PRIMARY KEY,
    job_id INTEGER REFERENCES jobs(id),
    cv_id INTEGER REFERENCES cvs(id),
    match_score INTEGER,
    status VARCHAR(50) DEFAULT 'matched',
    employer_notes TEXT,
    hiring_status VARCHAR(50) DEFAULT 'new',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP,
    UNIQUE(job_id, cv_id)
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    employer_id INTEGER REFERENCES users(id),
    job_id INTEGER REFERENCES jobs(id),
    amount DECIMAL(10,2),
    currency VARCHAR(10) DEFAULT 'USD',
    payment_method VARCHAR(50),
    payment_reference VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending',
    payment_data JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_cvs_embedding ON cvs USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_jobs_embedding ON jobs USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_cvs_status ON cvs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_employer ON jobs(employer_id);
CREATE INDEX IF NOT EXISTS idx_applications_job ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);

-- Insert sample admin user
INSERT INTO users (email, password, name, company, role) 
VALUES (
    'admin@recruitment.com', 
    '$2a$12$LQv3c1yqBNWC4kRYH8gRxuG1ZNeOV6cY9K6pQd5Uq7U7V5b2JKLK', -- password: admin123
    'System Administrator',
    'Recruitment Platform',
    'admin'
) ON CONFLICT (email) DO NOTHING;
`;

async function initializeDatabase() {
  const client = new Client({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'postgres', // Connect to default database first
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL database');

    // Create database if it doesn't exist
    const dbName = process.env.DB_NAME || 'recruitment_platform';
    const dbCheck = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`, 
      [dbName]
    );

    if (dbCheck.rows.length === 0) {
      console.log(`Creating database: ${dbName}`);
      await client.query(`CREATE DATABASE ${dbName}`);
      console.log('Database created successfully');
    } else {
      console.log('Database already exists');
    }

    // Connect to the target database
    await client.end();
    
    const targetClient = new Client({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: dbName,
      password: process.env.DB_PASSWORD || 'password',
      port: process.env.DB_PORT || 5432,
    });

    await targetClient.connect();
    
    // Execute initialization SQL
    console.log('Creating tables and indexes...');
    await targetClient.query(initSQL);
    console.log('Database initialized successfully!');
    
    await targetClient.end();
    console.log('Database setup completed!');
    
  } catch (error) {
    console.error('Database initialization error:', error);
    process.exit(1);
  }
}

initializeDatabase();