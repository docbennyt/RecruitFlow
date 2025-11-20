import CV from '../models/CV.js';
import EmbeddingService from '../services/embeddingService.js';
import { extractTextFromPDF } from '../utils/pdfParser.js';
import { extractTextFromDOCX } from '../utils/docxParser.js';

export const uploadCV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { isPublic = false, unlockPrice = 25.00 } = req.body;

    // Create CV record
    const cv = new CV({
      filename: req.file.filename,
      originalName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      fileType: req.file.mimetype,
      isPublic,
      unlockPrice,
      status: 'uploaded'
    });

    await cv.save();

    // Process CV in background
    processCV(cv._id);

    res.status(201).json({
      message: 'CV uploaded successfully',
      cvId: cv._id,
      status: 'processing'
    });
  } catch (error) {
    console.error('CV upload error:', error);
    res.status(500).json({ error: 'Failed to upload CV' });
  }
};

export const processCV = async (cvId) => {
  try {
    const cv = await CV.findById(cvId);
    if (!cv) throw new Error('CV not found');

    // Update status to processing
    cv.status = 'processing';
    await cv.save();

    let extractedText = '';

    // Extract text based on file type
    if (cv.fileType === 'application/pdf') {
      extractedText = await extractTextFromPDF(cv.filePath);
    } else if (cv.fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      extractedText = await extractTextFromDOCX(cv.filePath);
    } else {
      throw new Error('Unsupported file type');
    }

    cv.extractedText = extractedText;

    // Extract structured data (simplified - in production, use proper NLP)
    const structuredData = extractStructuredData(extractedText);
    Object.assign(cv, structuredData);

    // Generate and store embedding
    const embedding = await EmbeddingService.generateEmbedding(extractedText);
    const embeddingId = await EmbeddingService.storeEmbedding(embedding, {
      cvId: cv._id.toString(),
      candidateName: cv.candidateName,
      skills: cv.skills,
      experience: cv.experience
    });

    cv.embeddingId = embeddingId;
    cv.status = 'processed';
    
    await cv.save();
    
  } catch (error) {
    console.error('CV processing error:', error);
    const cv = await CV.findById(cvId);
    if (cv) {
      cv.status = 'error';
      cv.processingError = error.message;
      await cv.save();
    }
  }
};

const extractStructuredData = (text) => {
  // Simplified extraction - in production, use proper NLP libraries
  const data = {
    skills: [],
    experience: 0,
    candidateName: '',
    candidateEmail: '',
    candidatePhone: ''
  };

  // Extract email
  const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
  if (emailMatch) data.candidateEmail = emailMatch[0];

  // Extract phone (simple pattern)
  const phoneMatch = text.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  if (phoneMatch) data.candidatePhone = phoneMatch[0];

  // Common skills pattern matching
  const commonSkills = ['JavaScript', 'Python', 'Java', 'React', 'Node.js', 'AWS', 'SQL', 'MongoDB'];
  data.skills = commonSkills.filter(skill => 
    text.toLowerCase().includes(skill.toLowerCase())
  );

  // Extract experience (simplified)
  const expMatch = text.match(/(\d+)\s*(?:years?|yrs?)/i);
  if (expMatch) data.experience = parseInt(expMatch[1]);

  return data;
};

export const searchCVs = async (req, res) => {
  try {
    const { jobDescription, minMatchScore = 70, limit = 20 } = req.body;

    if (!jobDescription) {
      return res.status(400).json({ error: 'Job description is required' });
    }

    // Generate embedding for job description
    const jobEmbedding = await EmbeddingService.generateEmbedding(jobDescription);

    // Find similar CVs
    const similarCVs = await EmbeddingService.findSimilarCVs(
      jobEmbedding, 
      limit, 
      minMatchScore / 100
    );

    // Get full CV data for matches
    const cvIds = similarCVs.map(cv => cv.cv_id);
    const cvs = await CV.find({ 
      _id: { $in: cvIds },
      status: 'processed'
    });

    // Combine similarity scores with CV data
    const results = similarCVs.map(similarCV => {
      const cvData = cvs.find(cv => cv._id.toString() === similarCV.cv_id);
      return {
        ...cvData.toObject(),
        matchScore: Math.round(similarCV.similarity * 100),
        similarity: similarCV.similarity
      };
    }).filter(result => result.matchScore >= minMatchScore);

    res.json({
      totalMatches: results.length,
      matches: results.map(cv => ({
        id: cv._id,
        candidateName: cv.isPublic ? cv.candidateName : `Candidate #${cv._id.toString().slice(-4)}`,
        skills: cv.skills,
        experience: cv.experience,
        matchScore: cv.matchScore,
        isPublic: cv.isPublic,
        unlockPrice: cv.unlockPrice
      }))
    });

  } catch (error) {
    console.error('CV search error:', error);
    res.status(500).json({ error: 'Failed to search CVs' });
  }
};