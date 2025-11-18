const axios = require('axios');
const pool = require('../config/database');

class EmbeddingService {
  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY;
    this.openaiBaseUrl = 'https://api.openai.com/v1';
  }

  async generateEmbedding(text) {
    if (!this.openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const response = await axios.post(
        `${this.openaiBaseUrl}/embeddings`,
        {
          input: text,
          model: 'text-embedding-ada-002'
        },
        {
          headers: {
            'Authorization': `Bearer ${this.openaiApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.data[0].embedding;
    } catch (error) {
      console.error('Error generating embedding:', error.response?.data || error.message);
      throw new Error('Failed to generate embedding');
    }
  }

  async generateEmbeddingForCV(cvText) {
    // Clean and prepare text for embedding
    const cleanText = this.preprocessText(cvText);
    return await this.generateEmbedding(cleanText);
  }

  async generateEmbeddingForJob(jobData) {
    const { title, description, requirements, skills } = jobData;
    const jobText = `${title}. ${description}. ${requirements}. ${skills}`;
    const cleanText = this.preprocessText(jobText);
    return await this.generateEmbedding(cleanText);
  }

  preprocessText(text) {
    return text
      .replace(/[^\w\s.]/gi, ' ') // Remove special characters except periods
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
      .substring(0, 8000); // Limit length for API
  }

  async findSimilarCVs(embedding, limit = 50, similarityThreshold = 0.7) {
    const query = `
      SELECT 
        id,
        filename,
        original_name,
        processed_data,
        1 - (embedding <=> $1) as similarity_score,
        created_at
      FROM cvs 
      WHERE 1 - (embedding <=> $1) > $2
        AND status = 'processed'
      ORDER BY similarity_score DESC
      LIMIT $3
    `;

    const result = await pool.query(query, [embedding, similarityThreshold, limit]);
    return result.rows;
  }

  async findSimilarJobs(embedding, limit = 10) {
    const query = `
      SELECT 
        id,
        title,
        description,
        skills,
        1 - (embedding <=> $1) as similarity_score,
        created_at
      FROM jobs 
      WHERE status = 'active'
      ORDER BY similarity_score DESC
      LIMIT $2
    `;

    const result = await pool.query(query, [embedding, limit]);
    return result.rows;
  }
}

module.exports = new EmbeddingService();