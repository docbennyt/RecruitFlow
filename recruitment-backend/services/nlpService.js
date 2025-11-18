class NLPService {
  extractSkills(text) {
    const skills = [
      // Programming Languages
      'javascript', 'python', 'java', 'c++', 'c#', 'php', 'ruby', 'go', 'rust', 'swift',
      'typescript', 'kotlin', 'scala', 'r', 'matlab', 'perl', 'haskell', 'dart',
      
      // Web Technologies
      'html', 'css', 'react', 'angular', 'vue', 'node.js', 'express', 'django', 'flask',
      'spring', 'laravel', 'ruby on rails', 'asp.net', 'jquery', 'bootstrap',
      
      // Databases
      'mysql', 'postgresql', 'mongodb', 'redis', 'sqlite', 'oracle', 'sql server',
      'cassandra', 'elasticsearch', 'dynamodb',
      
      // Cloud & DevOps
      'aws', 'azure', 'google cloud', 'docker', 'kubernetes', 'terraform', 'ansible',
      'jenkins', 'git', 'ci/cd', 'linux', 'nginx', 'apache',
      
      // Mobile
      'react native', 'flutter', 'android', 'ios', 'xcode', 'android studio',
      
      // Data Science
      'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'pandas', 'numpy',
      'scikit-learn', 'data analysis', 'data visualization', 'tableau', 'power bi',
      
      // Soft Skills
      'communication', 'leadership', 'teamwork', 'problem solving', 'critical thinking',
      'time management', 'adaptability', 'creativity', 'collaboration'
    ];

    const foundSkills = new Set();
    const lowerText = text.toLowerCase();

    skills.forEach(skill => {
      if (lowerText.includes(skill.toLowerCase())) {
        foundSkills.add(skill);
      }
    });

    return Array.from(foundSkills);
  }

  extractExperience(text) {
    const experiencePatterns = [
      /(\d+)\s*(?:year|yr)s?(?:\s*and\s*\d+\s*months?)?\s*experience/gi,
      /(\d+)\s*\+?\s*years?(?:\s*of)?\s*(?:experience|exp)/gi,
      /experience:\s*(\d+)\s*years?/gi
    ];

    let maxExperience = 0;

    experiencePatterns.forEach(pattern => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const years = parseInt(match[1]);
        if (years > maxExperience) {
          maxExperience = years;
        }
      }
    });

    return maxExperience;
  }

  extractEducation(text) {
    const degrees = [
      'phd', 'doctorate', 'masters', 'bachelor', 'bs', 'ba', 'ms', 'mba',
      'associate', 'diploma', 'certificate'
    ];

    const foundDegrees = [];
    const lowerText = text.toLowerCase();

    degrees.forEach(degree => {
      if (lowerText.includes(degree)) {
        foundDegrees.push(degree);
      }
    });

    return foundDegrees;
  }

  extractCertifications(text) {
    const certifications = [
      'pmp', 'aws certified', 'microsoft certified', 'google cloud certified',
      'cisco certified', 'comptia', 'scrum master', 'project management',
      'six sigma', 'itil', 'ceh', 'security+'
    ];

    const foundCerts = [];
    const lowerText = text.toLowerCase();

    certifications.forEach(cert => {
      if (lowerText.includes(cert.toLowerCase())) {
        foundCerts.push(cert);
      }
    });

    return foundCerts;
  }

  processCVText(text) {
    const skills = this.extractSkills(text);
    const experience = this.extractExperience(text);
    const education = this.extractEducation(text);
    const certifications = this.extractCertifications(text);

    return {
      skills,
      experience_years: experience,
      education,
      certifications,
      text_length: text.length,
      processed_at: new Date().toISOString()
    };
  }

  calculateMatchScore(jobRequirements, cvData) {
    let score = 0;
    const maxScore = 100;

    // Skills match (40%)
    const jobSkills = jobRequirements.skills || [];
    const cvSkills = cvData.skills || [];
    const commonSkills = jobSkills.filter(skill => 
      cvSkills.some(cvSkill => 
        cvSkill.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(cvSkill.toLowerCase())
      )
    );
    
    const skillMatchRatio = jobSkills.length > 0 ? commonSkills.length / jobSkills.length : 0;
    score += skillMatchRatio * 40;

    // Experience match (30%)
    const requiredExperience = jobRequirements.experience_level || 0;
    const actualExperience = cvData.experience_years || 0;
    if (actualExperience >= requiredExperience) {
      score += 30;
    } else if (requiredExperience > 0) {
      score += (actualExperience / requiredExperience) * 30;
    }

    // Education match (15%)
    const requiredEducation = jobRequirements.education_level || [];
    const actualEducation = cvData.education || [];
    if (requiredEducation.length === 0 || 
        requiredEducation.some(edu => actualEducation.includes(edu))) {
      score += 15;
    }

    // Certifications match (15%)
    const requiredCerts = jobRequirements.certifications || [];
    const actualCerts = cvData.certifications || [];
    const certMatchRatio = requiredCerts.length > 0 ? 
      actualCerts.filter(cert => requiredCerts.includes(cert)).length / requiredCerts.length : 1;
    score += certMatchRatio * 15;

    return Math.min(Math.round(score), maxScore);
  }
}

module.exports = new NLPService();