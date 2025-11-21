const db = require('../config/database');
const embeddingService = require('../services/embeddingService');
const matchingService = require('../services/matchingService');
const logger = require('../utils/logger');

/**
 * Create job posting
 */
exports.createJob = async (req, res, next) => {
  try {
    const {
      title,
      description,
      required_skills,
      experience_required,
      location,
      salary_range,
      job_type
    } = req.body;

    const employerId = req.user.id;

    // Validate required fields
    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Title and description are required'
      });
    }

    // Generate embedding for job description
    const embedding = await embeddingService.generateJobEmbedding({
      title,
      description,
      required_skills,
      experience_required,
      location,
      job_type
    });

    // Insert job
    const result = await db.query(`
      INSERT INTO jobs (
        employer_id, title, description, required_skills,
        experience_required, location, salary_range, job_type,
        embedding, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active')
      RETURNING *
    `, [
      employerId,
      title,
      description,
      required_skills,
      experience_required,
      location,
      salary_range,
      job_type,
      JSON.stringify(embedding)
    ]);

    const job = result.rows[0];

    logger.info(`Job created: ${job.id} by employer ${employerId}`);

    res.status(201).json({
      success: true,
      message: 'Job created successfully',
      data: job
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Instant matching (anonymous, no login required)
 */
exports.instantMatch = async (req, res, next) => {
  try {
    const { description, title, required_skills, experience_required } = req.body;

    if (!description) {
      return res.status(400).json({
        success: false,
        message: 'Job description is required'
      });
    }

    logger.info('Processing instant match request');

    // Create temporary job entry
    const embedding = await embeddingService.generateJobEmbedding({
      title: title || 'Untitled Position',
      description,
      required_skills: required_skills || [],
      experience_required: experience_required || 0
    });

    const jobResult = await db.query(`
      INSERT INTO jobs (
        title, description, required_skills, experience_required,
        embedding, status
      ) VALUES ($1, $2, $3, $4, $5, 'active')
      RETURNING id
    `, [
      title || 'Instant Match Job',
      description,
      required_skills || [],
      experience_required || 0,
      JSON.stringify(embedding)
    ]);

    const jobId = jobResult.rows[0].id;

    // Find matches
    const matches = await matchingService.findMatches(jobId, {
      limit: 50,
      minScore: 0.6,
      includeDetails: false // Anonymous results
    });

    // Return count and anonymous candidate info
    res.json({
      success: true,
      data: {
        job_id: jobId,
        total_matches: matches.total_matches,
        message: `Found ${matches.total_matches} matching candidates. Sign up to view full details.`,
        preview_matches: matches.matches.slice(0, 6).map(m => ({
          candidate_id: `#${m.cv_id}`,
          current_role: m.current_role,
          experience_years: m.experience_years,
          skills: m.skills,
          match_percentage: m.match_percentage
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get job matches (requires authentication)
 */
exports.getJobMatches = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    // Verify job belongs to user (unless admin)
    if (req.user.role !== 'admin') {
      const jobCheck = await db.query(
        'SELECT employer_id FROM jobs WHERE id = $1',
        [id]
      );

      if (jobCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Job not found'
        });
      }

      if (jobCheck.rows[0].employer_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view these matches'
        });
      }
    }

    // Get matches with limited details
    const matches = await matchingService.findMatches(id, {
      limit: 100,
      minScore: 0.6,
      includeDetails: false
    });

    // Check which CVs are unlocked by this employer
    const unlockedResult = await db.query(
      'SELECT cv_id FROM unlocked_cvs WHERE employer_id = $1',
      [userId]
    );
    const unlockedCVIds = new Set(unlockedResult.rows.map(r => r.cv_id));

    // Enrich matches with unlock status
    const enrichedMatches = matches.matches.map(match => ({
      ...match,
      is_unlocked: unlockedCVIds.has(match.cv_id),
      candidate_name: unlockedCVIds.has(match.cv_id) 
        ? match.candidate_name 
        : `Candidate #${match.cv_id}`
    }));

    res.json({
      success: true,
      data: {
        ...matches,
        matches: enrichedMatches
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all jobs for employer
 */
exports.getEmployerJobs = async (req, res, next) => {
  try {
    const employerId = req.user.id;
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM jobs WHERE employer_id = $1';
    let params = [employerId];

    if (status) {
      query += ' AND status = $2';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const result = await db.query(query, params);

    // Get match counts for each job
    const jobsWithCounts = await Promise.all(
      result.rows.map(async (job) => {
        const countResult = await db.query(
          'SELECT COUNT(*) FROM job_matches WHERE job_id = $1',
          [job.id]
        );
        return {
          ...job,
          match_count: parseInt(countResult.rows[0].count)
        };
      })
    );

    res.json({
      success: true,
      data: jobsWithCounts
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single job details
 */
exports.getJobById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query('SELECT * FROM jobs WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update job
 */
exports.updateJob = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const employerId = req.user.id;

    // Verify ownership
    const jobCheck = await db.query(
      'SELECT employer_id FROM jobs WHERE id = $1',
      [id]
    );

    if (jobCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    if (jobCheck.rows[0].employer_id !== employerId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Build update query
    const allowedFields = [
      'title', 'description', 'required_skills', 'experience_required',
      'location', 'salary_range', 'job_type', 'status'
    ];

    const updateFields = [];
    const values = [];
    let paramCount = 1;

    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        updateFields.push(`${field} = $${paramCount}`);
        values.push(updates[field]);
        paramCount++;
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    values.push(id);
    const query = `
      UPDATE jobs SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await db.query(query, values);

    // Regenerate embedding if description or requirements changed
    if (updates.description || updates.required_skills) {
      const job = result.rows[0];
      const embedding = await embeddingService.generateJobEmbedding(job);
      await db.query(
        'UPDATE jobs SET embedding = $1 WHERE id = $2',
        [JSON.stringify(embedding), id]
      );
    }

    res.json({
      success: true,
      message: 'Job updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete job
 */
exports.deleteJob = async (req, res, next) => {
  try {
    const { id } = req.params;
    const employerId = req.user.id;

    // Verify ownership
    const jobCheck = await db.query(
      'SELECT employer_id FROM jobs WHERE id = $1',
      [id]
    );

    if (jobCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    if (jobCheck.rows[0].employer_id !== employerId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    await db.query('DELETE FROM jobs WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Job deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};