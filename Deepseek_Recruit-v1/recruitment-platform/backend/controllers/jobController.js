import Job from '../models/Job.js';
import CV from '../models/CV.js';
import EmbeddingService from '../services/embeddingService.js';

export const createJob = async (req, res) => {
  try {
    const { title, description, requirements, location, salaryRange } = req.body;

    const job = new Job({
      title,
      description,
      requirements,
      location,
      salaryRange,
      employer: req.employer.id,
      status: 'active'
    });

    await job.save();

    // Generate embedding for job description
    const embeddingText = `${title} ${description} ${requirements}`;
    const embedding = await EmbeddingService.generateEmbedding(embeddingText);
    
    job.embedding = embedding;
    await job.save();

    res.status(201).json({
      message: 'Job created successfully',
      job: {
        id: job._id,
        title: job.title,
        description: job.description,
        status: job.status
      }
    });
  } catch (error) {
    console.error('Job creation error:', error);
    res.status(500).json({ error: 'Failed to create job' });
  }
};

export const getJobMatches = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { showFullDetails = false } = req.body;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Check if employer owns the job
    if (job.employer.toString() !== req.employer.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Find matching CVs
    const similarCVs = await EmbeddingService.findSimilarCVs(job.embedding, 50, 0.5);

    const cvIds = similarCVs.map(cv => cv.cv_id);
    const cvs = await CV.find({ 
      _id: { $in: cvIds },
      status: 'processed'
    });

    const matches = similarCVs.map(similarCV => {
      const cvData = cvs.find(cv => cv._id.toString() === similarCV.cv_id);
      if (!cvData) return null;

      const matchData = {
        id: cvData._id,
        matchScore: Math.round(similarCV.similarity * 100),
        skills: cvData.skills,
        experience: cvData.experience,
        education: cvData.education,
        isUnlocked: cvData.isPublic || showFullDetails
      };

      // Only show candidate name if unlocked or public
      if (cvData.isPublic || showFullDetails) {
        matchData.candidateName = cvData.candidateName;
        matchData.candidateEmail = cvData.candidateEmail;
        matchData.candidatePhone = cvData.candidatePhone;
      } else {
        matchData.candidateName = `Candidate #${cvData._id.toString().slice(-4)}`;
      }

      return matchData;
    }).filter(match => match !== null);

    res.json({
      jobId: job._id,
      totalMatches: matches.length,
      matches: matches.sort((a, b) => b.matchScore - a.matchScore)
    });

  } catch (error) {
    console.error('Job matches error:', error);
    res.status(500).json({ error: 'Failed to get job matches' });
  }
};

export const unlockCandidate = async (req, res) => {
  try {
    const { jobId, candidateId } = req.params;

    const cv = await CV.findById(candidateId);
    if (!cv) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    // Check if employer has enough credits
    const employer = await Employer.findById(req.employer.id);
    if (employer.credits < cv.unlockPrice) {
      return res.status(402).json({ error: 'Insufficient credits' });
    }

    // Deduct credits
    employer.credits -= cv.unlockPrice;
    await employer.save();

    // Record the unlock
    const unlockRecord = new UnlockRecord({
      employer: req.employer.id,
      cv: candidateId,
      job: jobId,
      amount: cv.unlockPrice
    });
    await unlockRecord.save();

    res.json({
      message: 'Candidate unlocked successfully',
      candidate: {
        id: cv._id,
        candidateName: cv.candidateName,
        candidateEmail: cv.candidateEmail,
        candidatePhone: cv.candidatePhone,
        skills: cv.skills,
        experience: cv.experience,
        education: cv.education,
        previousRoles: cv.previousRoles
      },
      remainingCredits: employer.credits
    });

  } catch (error) {
    console.error('Unlock candidate error:', error);
    res.status(500).json({ error: 'Failed to unlock candidate' });
  }
};