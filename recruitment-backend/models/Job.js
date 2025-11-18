const pool = require('../config/database');

class Job {
  static async create(jobData) {
    const {
      employer_id,
      title,
      description,
      requirements,
      skills,
      experience_level,
      location,
      salary_range,
      employment_type,
      embedding
    } = jobData;

    const query = `
      INSERT INTO jobs (
        employer_id, title, description, requirements, skills, 
        experience_level, location, salary_range, employment_type, 
        embedding, status, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'active', NOW())
      RETURNING *
    `;

    const result = await pool.query(query, [
      employer_id, title, description, requirements, skills,
      experience_level, location, salary_range, employment_type, embedding
    ]);

    return result.rows[0];
  }

  static async findByEmployer(employerId, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const query = `
      SELECT * FROM jobs 
      WHERE employer_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2 OFFSET $3
    `;

    const result = await pool.query(query, [employerId, limit, offset]);
    return result.rows;
  }

  static async findById(id) {
    const query = 'SELECT * FROM jobs WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async updateStatus(jobId, status) {
    const query = `
      UPDATE jobs 
      SET status = $1, updated_at = NOW() 
      WHERE id = $2 
      RETURNING *
    `;
    
    const result = await pool.query(query, [status, jobId]);
    return result.rows[0];
  }

  static async getMatchCount(jobId) {
    const query = `
      SELECT COUNT(*) as match_count
      FROM applications 
      WHERE job_id = $1 AND status = 'matched'
    `;

    const result = await pool.query(query, [jobId]);
    return result.rows[0].match_count;
  }
}

module.exports = Job;