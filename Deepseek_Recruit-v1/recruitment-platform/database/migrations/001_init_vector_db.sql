-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create CV embeddings table
CREATE TABLE IF NOT EXISTS cv_embeddings (
    id SERIAL PRIMARY KEY,
    cv_id VARCHAR(255) NOT NULL,
    embedding vector(1536), -- OpenAI ada-002 dimension
    candidate_name VARCHAR(255),
    skills TEXT[],
    experience INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for similarity search
CREATE INDEX IF NOT EXISTS cv_embeddings_embedding_idx 
ON cv_embeddings 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create jobs table for vector storage
CREATE TABLE IF NOT EXISTS job_embeddings (
    id SERIAL PRIMARY KEY,
    job_id VARCHAR(255) NOT NULL,
    embedding vector(1536),
    title VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS job_embeddings_embedding_idx 
ON job_embeddings 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);