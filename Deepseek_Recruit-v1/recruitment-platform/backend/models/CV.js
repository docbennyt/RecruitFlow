import mongoose from 'mongoose';

const cvSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  fileType: {
    type: String,
    required: true
  },
  // Extracted fields
  extractedText: {
    type: String,
    required: true
  },
  candidateName: {
    type: String,
    required: false
  },
  candidateEmail: {
    type: String,
    required: false
  },
  candidatePhone: {
    type: String,
    required: false
  },
  skills: [{
    type: String
  }],
  experience: {
    type: Number, // in years
    required: false
  },
  education: [{
    degree: String,
    institution: String,
    year: Number
  }],
  previousRoles: [{
    title: String,
    company: String,
    duration: String,
    description: String
  }],
  // Vector embedding reference
  embeddingId: {
    type: String, // Reference to PostgreSQL vector ID
    required: false
  },
  // Processing status
  status: {
    type: String,
    enum: ['uploaded', 'processing', 'processed', 'error'],
    default: 'uploaded'
  },
  processingError: {
    type: String,
    required: false
  },
  // Access control
  isPublic: {
    type: Boolean,
    default: false
  },
  unlockPrice: {
    type: Number,
    default: 25.00 // Default unlock price
  }
}, {
  timestamps: true
});

// Index for search performance
cvSchema.index({ skills: 1 });
cvSchema.index({ experience: 1 });
cvSchema.index({ status: 1 });

export default mongoose.model('CV', cvSchema);