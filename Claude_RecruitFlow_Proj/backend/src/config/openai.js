const OpenAI = require('openai');
const logger = require('../utils/logger');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Validate API key on startup
const validateApiKey = async () => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      logger.warn('OpenAI API key not configured. Embedding features will not work.');
      return false;
    }

    // Test the API key with a simple request
    await openai.models.list();
    logger.info('✓ OpenAI API key validated successfully');
    return true;
  } catch (error) {
    logger.error('OpenAI API key validation failed:', error.message);
    return false;
  }
};

// Configuration
const config = {
  embeddingModel: 'text-embedding-3-small',
  embeddingDimensions: 1536,
  maxTokens: 8191,
  timeout: 30000, // 30 seconds
};

// Validate on module load
if (process.env.NODE_ENV !== 'test') {
  validateApiKey();
}

module.exports = {
  openai,
  config,
  validateApiKey
};