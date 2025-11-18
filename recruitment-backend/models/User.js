const pool = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async create(userData) {
    const { email, password, name, company, phone, role = 'employer' } = userData;
    
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const query = `
      INSERT INTO users (email, password, name, company, phone, role, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING id, email, name, company, phone, role, created_at
    `;
    
    const result = await pool.query(query, [
      email, hashedPassword, name, company, phone, role
    ]);
    
    return result.rows[0];
  }

  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT id, email, name, company, phone, role, created_at FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async comparePassword(candidatePassword, hashedPassword) {
    return await bcrypt.compare(candidatePassword, hashedPassword);
  }

  static async updateProfile(userId, updateData) {
    const { name, company, phone } = updateData;
    const query = `
      UPDATE users 
      SET name = $1, company = $2, phone = $3, updated_at = NOW()
      WHERE id = $4
      RETURNING id, email, name, company, phone, role, updated_at
    `;
    
    const result = await pool.query(query, [name, company, phone, userId]);
    return result.rows[0];
  }
}

module.exports = User;