const express = require('express');
const CV = require('../models/CV');
const Job = require('../models/Job');
const Application = require('../models/Application');
const embeddingService = require('../services/embeddingService');
const nlpService = require('../services/nlpService');
const auth = require('../middleware/auth');

const router = express.Router();

// Get matching candidates for a job (free - count only)
router.get('/jobs/:jobId/candidates/count', async (req, res) => {
  try {
    const jobId = req.params.jobId;
    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Use job embedding to find similar CVs
    const similarCVs = await embeddingService.findSimilarCVs(job.embedding, 100, 0.6);
    
    // Filter and score candidates
    const scoredCandidates = similarCVs.map(cv => {
      const matchScore = nlpService.calculateMatchScore(
        {
          skills: job.skills,
          experience_level: job.experience_level,
          education: [], // Add education requirements if needed
          certifications: [] // Add certification requirements if needed
        },
        cv.processed_data
      );

      return {
        cv_id: cv.id,
        similarity_score: cv.similarity_score,
        match_score: matchScore
      };
    }).filter(candidate => candidate.match_score >= 50); // Only candidates with at least 50% match

    res.json({
      job_id: jobId,
      total_matching_candidates: scoredCandidates.length,
      match_breakdown: {
        excellent: scoredCandidates.filter(c => c.match_score >= 80).length,
        good: scoredCandidates.filter(c => c.match_score >= 60 && c.match_score < 80).length,
        fair: scoredCandidates.filter(c => c.match_score >= 50 && c.match_score < 60).length
      }
    });
  } catch (error) {
    console.error('Get candidate count error:', error);
    res.status(500).json({ error: 'Failed to get candidate count' });
  }
});

// Get detailed matching candidates (paid feature)
router.get('/jobs/:jobId/candidates/detailed', auth, async (req, res) => {
  try {
    const jobId = req.params.jobId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    // Verify job ownership and payment status
    const job = await Job.findById(jobId);
    if (!job || job.employer_id !== req.user.userId) {
      return res.status(404).json({ error: 'Job not found or access denied' });
    }

    // TODO: Check if employer has paid for this job's candidate access

    // Use job embedding to find similar CVs
    const similarCVs = await embeddingService.findSimilarCVs(job.embedding, 100, 0.6);
    
    // Score and rank candidates
    const scoredCandidates = similarCVs.map(cv => {
      const matchScore = nlpService.calculateMatchScore(
        {
          skills: job.skills,
          experience_level: job.experience_level
        },
        cv.processed_data
      );

      return {
        cv_id: cv.id,
        filename: cv.filename,
        original_name: cv.original_name,
        processed_data: cv.processed_data,
        similarity_score: cv.similarity_score,
        match_score: matchScore,
        match_breakdown: {
          skills: cv.processed_data.skills?.filter(skill => 
            job.skills?.some(js => 
              js.toLowerCase().includes(skill.toLowerCase()) ||
              skill.toLowerCase().includes(js.toLowerCase())
            )
          ).length || 0,
          experience: cv.processed_data.experience_years >= job.experience_level ? 1 : 0,
          education: 1, // Basic education match
          certifications: 1 // Basic certification match
        }
      };
    })
    .filter(candidate => candidate.match_score >= 50)
    .sort((a, b) => b.match_score - a.match_score);

    // Paginate results
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedCandidates = scoredCandidates.slice(startIndex, endIndex);

    // Create application records
    await Promise.all(
      paginatedCandidates.map(candidate =>
        Application.createOrUpdate({
          job_id: jobId,
          cv_id: candidate.cv_id,
          match_score: candidate.match_score,
          status: 'matched'
        })
      )
    );

    res.json({
      job_id: jobId,
      candidates: paginatedCandidates,
      pagination: {
        page,
        limit,
        total: scoredCandidates.length,
        total_pages: Math.ceil(scoredCandidates.length / limit)
      },
      summary: {
        total_candidates: scoredCandidates.length,
        average_match_score: Math.round(
          scoredCandidates.reduce((sum, c) => sum + c.match_score, 0) / scoredCandidates.length
        ) || 0,
        top_skills: this.extractTopSkills(scoredCandidates)
      }
    });
  } catch (error) {
    console.error('Get detailed candidates error:', error);
    res.status(500).json({ error: 'Failed to get candidate details' });
  }
});

// Quick match - find jobs for a CV
router.post('/quick-match', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.length < 50) {
      return res.status(400).json({ error: 'Text too short for meaningful matching' });
    }

    // Generate embedding for the text
    const embedding = await embeddingService.generateEmbedding(text);

    // Find similar jobs
    const similarJobs = await embeddingService.findSimilarJobs(embedding, 10);

    // Process CV text to get structured data
    const cvData = nlpService.processCVText(text);

    // Score matches
    const scoredJobs = similarJobs.map(job => {
      const matchScore = nlpService.calculateMatchScore(
        {
          skills: job.skills,
          experience_level: job.experience_level
        },
        cvData
      );

      return {
        job_id: job.id,
        title: job.title,
        company: 'Confidential', // Would come from employer data
        location: job.location,
        match_score: matchScore,
        skills_match: cvData.skills?.filter(skill => 
          job.skills?.some(js => 
            js.toLowerCase().includes(skill.toLowerCase()) ||
            skill.toLowerCase().includes(js.toLowerCase())
          )
        ).length || 0
      };
    }).filter(job => job.match_score >= 40)
      .sort((a, b) => b.match_score - a.match_score);

    res.json({
      total_matches: scoredJobs.length,
      matches: scoredJobs,
      cv_analysis: {
        skills_found: cvData.skills,
        experience_years: cvData.experience_years,
        education: cvData.education
      }
    });
  } catch (error) {
    console.error('Quick match error:', error);
    res.status(500).json({ error: 'Failed to perform quick match' });
  }
});

// Helper function to extract top skills from candidates
function extractTopSkills(candidates) {
  const skillCounts = {};
  
  candidates.forEach(candidate => {
    candidate.processed_data.skills?.forEach(skill => {
      skillCounts[skill] = (skillCounts[skill] || 0) + 1;
    });
  });

  return Object.entries(skillCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([skill, count]) => ({ skill, count }));
}

module.exports = router;