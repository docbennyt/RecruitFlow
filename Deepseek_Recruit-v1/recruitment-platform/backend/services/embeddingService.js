import OpenAI from 'openai';
import { pgPool } from '../config/database.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

class EmbeddingService {
  async generateEmbedding(text) {
    try {
      const response = await openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: text,
        encoding_format: "float"
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw new Error('Failed to generate embedding');
    }
  }

  async storeEmbedding(vector, metadata) {
    const client = await pgPool.connect();
    try {
      // Convert array to PostgreSQL vector format
      const vectorString = `[${vector.join(',')}]`;
      
      const query = `
        INSERT INTO cv_embeddings (embedding, cv_id, candidate_name, skills, experience)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `;
      
      const result = await client.query(query, [
        vectorString,
        metadata.cvId,
        metadata.candidateName,
        metadata.skills,
        metadata.experience
      ]);

      return result.rows[0].id;
    } finally {
      client.release();
    }
  }

  async findSimilarCVs(embedding, limit = 10, threshold = 0.7) {
    const client = await pgPool.connect();
    try {
      const vectorString = `[${embedding.join(',')}]`;
      
      const query = `
        SELECT 
          cv_id,
          candidate_name,
          skills,
          experience,
          1 - (embedding <=> $1) as similarity
        FROM cv_embeddings
        WHERE 1 - (embedding <=> $1) > $2
        ORDER BY embedding <=> $1
        LIMIT $3
      `;
      
      const result = await client.query(query, [vectorString, threshold, limit]);
      return result.rows;
    } finally {
      client.release();
    }
  }
}

export default new EmbeddingService();