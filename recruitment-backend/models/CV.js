const pool = require('../config/database');

class CV {
  static async create(cvData) {
    const {
      filename,
      original_name,
      file_path,
      file_size,
      file_type,
      extracted_text,
      processed_data,
      embedding,
      status = 'processed'
    } = cvData;

    const query = `
      INSERT INTO cvs (
        filename, original_name, file_path, file_size, file_type, 
        extracted_text, processed_data, embedding, status, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      RETURNING *
    `;

    const result = await pool.query(query, [
      filename, original_name, file_path, file_size, file_type,
      extracted_text, processed_data, embedding, status
    ]);

    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT * FROM cvs WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findBySimilarity(embedding, limit = 10, threshold = 0.7) {
    const query = `
      SELECT 
        id,
        filename,
        original_name,
        processed_data,
        1 - (embedding <=> $1) as similarity,
        created_at
      FROM cvs 
      WHERE 1 - (embedding <=> $1) > $2
      ORDER BY similarity DESC
      LIMIT $3
    `;

    const result = await pool.query(query, [embedding, threshold, limit]);
    return result.rows;
  }

  static async updateStatus(cvId, status) {
    const query = `
      UPDATE cvs 
      SET status = $1, updated_at = NOW() 
      WHERE id = $2 
      RETURNING *
    `;
    
    const result = await pool.query(query, [status, cvId]);
    return result.rows[0];
  }

  static async getStats() {
    const query = `
      SELECT 
        COUNT(*) as total_cvs,
        COUNT(CASE WHEN status = 'processed' THEN 1 END) as processed_cvs,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_cvs,
        COUNT(CASE WHEN status = 'error' THEN 1 END) as error_cvs,
        AVG(LENGTH(extracted_text)) as avg_text_length
      FROM cvs
    `;

    const result = await pool.query(query);
    return result.rows[0];
  }

  static async findAll(page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const query = `
      SELECT 
        id, filename, original_name, file_type, status, created_at
      FROM cvs 
      ORDER BY created_at DESC 
      LIMIT $1 OFFSET $2
    `;

    const result = await pool.query(query, [limit, offset]);
    return result.rows;
  }
}

module.exports = CV;