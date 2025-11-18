const express = require('express');
const Job = require('../models/Job');
const Application = require('../models/Application');
const embeddingService = require('../services/embeddingService');
const auth = require('../middleware/auth');

const router = express.Router();

// Create a new job posting
router.post('/', auth, async (req, res) => {
  try {
    const {
      title,
      description,
      requirements,
      skills,
      experience_level,
      location,
      salary_range,
      employment_type
    } = req.body;

    // Generate embedding for the job description
    const embedding = await embeddingService.generateEmbeddingForJob({
      title,
      description,
      requirements,
      skills: Array.isArray(skills) ? skills.join(', ') : skills
    });

    const jobData = {
      employer_id: req.user.userId,
      title,
      description,
      requirements,
      skills: Array.isArray(skills) ? skills : (skills || '').split(',').map(s => s.trim()),
      experience_level: parseInt(experience_level) || 0,
      location,
      salary_range,
      employment_type,
      embedding
    };

    const job = await Job.create(jobData);

    res.status(201).json({
      message: 'Job created successfully',
      job
    });
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({ error: 'Failed to create job posting' });
  }
});

// Get employer's jobs
router.get('/my-jobs', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const jobs = await Job.findByEmployer(req.user.userId, page, limit);

    // Get match counts for each job
    const jobsWithCounts = await Promise.all(
      jobs.map(async (job) => {
        const matchCount = await Job.getMatchCount(job.id);
        return {
          ...job,
          match_count: matchCount
        };
      })
    );

    res.json({
      jobs: jobsWithCounts,
      pagination: {
        page,
        limit,
        total: jobs.length
      }
    });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// Get job by ID
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // For non-authenticated users, only return basic info
    if (!req.user || req.user.userId !== job.employer_id) {
      const basicInfo = {
        id: job.id,
        title: job.title,
        location: job.location,
        employment_type: job.employment_type,
        created_at: job.created_at
      };
      return res.json({ job: basicInfo });
    }

    res.json({ job });
  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({ error: 'Failed to fetch job' });
  }
});

// Update job status
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const jobId = req.params.id;

    // Verify job ownership
    const job = await Job.findById(jobId);
    if (!job || job.employer_id !== req.user.userId) {
      return res.status(404).json({ error: 'Job not found or access denied' });
    }

    const updatedJob = await Job.updateStatus(jobId, status);

    res.json({
      message: 'Job status updated successfully',
      job: updatedJob
    });
  } catch (error) {
    console.error('Update job status error:', error);
    res.status(500).json({ error: 'Failed to update job status' });
  }
});

// Get applications for a job
router.get('/:id/applications', auth, async (req, res) => {
  try {
    const jobId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    // Verify job ownership
    const job = await Job.findById(jobId);
    if (!job || job.employer_id !== req.user.userId) {
      return res.status(404).json({ error: 'Job not found or access denied' });
    }

    const applications = await Application.findByJobId(jobId, page, limit);

    res.json({
      applications,
      pagination: {
        page,
        limit,
        total: applications.length
      }
    });
  } catch (error) {
    console.error('Get job applications error:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

module.exports = router;