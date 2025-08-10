// Advanced ML Pattern Recognition for Scam Detection

export interface FeatureVector {
  textFeatures: {
    urgencyScore: number;
    fearLanguageScore: number;
    impersonationScore: number;
    financialRequestScore: number;
    grammarQualityScore: number;
    lengthScore: number;
    captialization: number;
    phoneNumberCount: number;
    emailCount: number;
    urlCount: number;
  };
  semanticFeatures: {
    embeddings: number[];
    sentimentScore: number;
    confidenceScore: number;
  };
  contextFeatures: {
    timeOfDay: number;
    dayOfWeek: number;
    channelType: string;
    sourceReputation: number;
  };
}

export interface TrainingExample {
  id: string;
  text: string;
  features: FeatureVector;
  label: 'scam' | 'legitimate';
  confidence: number;
  timestamp: string;
  verified: boolean;
}

export interface ModelPrediction {
  isScam: boolean;
  confidence: number;
  riskScore: number;
  patterns: string[];
  explanationFactors: {
    factor: string;
    weight: number;
    contribution: number;
  }[];
}

class MLPatternRecognizer {
  private trainingData: TrainingExample[] = [];
  private modelWeights: Map<string, number> = new Map();
  private patternRegistry: Map<string, RegExp> = new Map();
  private embeddings: Map<string, number[]> = new Map();

  constructor() {
    this.initializePatterns();
    this.initializeWeights();
    this.loadTrainingData();
  }

  private initializePatterns() {
    // Common scam patterns with regex
    const patterns: [string, RegExp][] = [
      ['urgent_action', /\b(urgent|immediately|expires?|act now|limited time|deadline)\b/gi],
      ['authority_impersonation', /\b(government|irs|fbi|police|court|official|department)\b/gi],
      ['fear_tactics', /\b(arrest|legal action|suspended|investigation|warrant|criminal)\b/gi],
      ['financial_request', /\b(payment|money|credit card|bank account|wire transfer|gift card)\b/gi],
      ['verification_request', /\b(verify|confirm|update|provide|social security|ssn|password)\b/gi],
      ['contact_pressure', /\b(call now|click here|reply immediately|dont delay|contact us)\b/gi],
      ['tech_support', /\b(virus|malware|infected|security alert|microsoft|apple|tech support)\b/gi],
      ['prize_lottery', /\b(won|winner|lottery|prize|congratulations|claim|reward)\b/gi]
    ];

    patterns.forEach(([name, pattern]) => {
      this.patternRegistry.set(name, pattern);
    });
  }

  private initializeWeights() {
    // Initialize model weights based on pattern importance
    const initialWeights: [string, number][] = [
      ['urgency_score', 0.25],
      ['fear_language', 0.30],
      ['impersonation', 0.35],
      ['financial_request', 0.40],
      ['grammar_quality', -0.20], // Poor grammar increases scam likelihood
      ['pattern_urgent_action', 0.15],
      ['pattern_authority_impersonation', 0.25],
      ['pattern_fear_tactics', 0.30],
      ['pattern_financial_request', 0.35],
      ['pattern_verification_request', 0.20],
      ['pattern_contact_pressure', 0.15],
      ['pattern_tech_support', 0.25],
      ['pattern_prize_lottery', 0.30]
    ];

    initialWeights.forEach(([feature, weight]) => {
      this.modelWeights.set(feature, weight);
    });
  }

  private loadTrainingData() {
    // Initialize with curated training examples
    const examples: Omit<TrainingExample, 'features'>[] = [
      {
        id: 'train_001',
        text: 'URGENT: Your Social Security benefits will be suspended immediately unless you call 1-800-555-0123 to verify your account information.',
        label: 'scam',
        confidence: 0.95,
        timestamp: new Date().toISOString(),
        verified: true
      },
      {
        id: 'train_002', 
        text: 'Congratulations! You have won $500,000 in the Microsoft Lottery. To claim your prize, please provide your bank account details.',
        label: 'scam',
        confidence: 0.98,
        timestamp: new Date().toISOString(),
        verified: true
      },
      {
        id: 'train_003',
        text: 'Your monthly bank statement is ready for review. Please log into your account through our secure website.',
        label: 'legitimate',
        confidence: 0.85,
        timestamp: new Date().toISOString(),
        verified: true
      }
    ];

    // Process examples and extract features
    examples.forEach(example => {
      const features = this.extractFeatures(example.text);
      this.trainingData.push({
        ...example,
        features
      });
    });
  }

  public extractFeatures(text: string): FeatureVector {
    const textLower = text.toLowerCase();
    
    // Text-based features
    const textFeatures = {
      urgencyScore: this.calculateUrgencyScore(text),
      fearLanguageScore: this.calculateFearScore(text),
      impersonationScore: this.calculateImpersonationScore(text),
      financialRequestScore: this.calculateFinancialScore(text),
      grammarQualityScore: this.calculateGrammarScore(text),
      lengthScore: this.normalizeLengthScore(text.length),
      captialization: this.calculateCapitalizationScore(text),
      phoneNumberCount: (text.match(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g) || []).length,
      emailCount: (text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g) || []).length,
      urlCount: (text.match(/https?:\/\/[^\s]+/g) || []).length
    };

    // Semantic features (simplified - in production would use actual embeddings)
    const semanticFeatures = {
      embeddings: this.generateSimpleEmbedding(text),
      sentimentScore: this.calculateSentimentScore(text),
      confidenceScore: 0.8 // Would be calculated from actual model confidence
    };

    // Context features
    const now = new Date();
    const contextFeatures = {
      timeOfDay: now.getHours() / 24,
      dayOfWeek: now.getDay() / 7,
      channelType: 'unknown', // Would be provided by caller
      sourceReputation: 0.5 // Would be calculated from source analysis
    };

    return {
      textFeatures,
      semanticFeatures,
      contextFeatures
    };
  }

  private calculateUrgencyScore(text: string): number {
    const urgencyWords = ['urgent', 'immediately', 'expires', 'deadline', 'act now', 'limited time'];
    let score = 0;
    const textLower = text.toLowerCase();
    
    urgencyWords.forEach(word => {
      const matches = (textLower.match(new RegExp(word, 'g')) || []).length;
      score += matches * 0.2;
    });

    // Check for ALL CAPS urgency
    const capsMatches = text.match(/\b[A-Z]{3,}\b/g) || [];
    score += capsMatches.length * 0.1;

    return Math.min(score, 1.0);
  }

  private calculateFearScore(text: string): number {
    const fearWords = ['arrest', 'legal action', 'suspended', 'investigation', 'warrant', 'criminal', 'fraud', 'penalty'];
    const textLower = text.toLowerCase();
    
    let score = 0;
    fearWords.forEach(word => {
      if (textLower.includes(word)) {
        score += 0.15;
      }
    });

    return Math.min(score, 1.0);
  }

  private calculateImpersonationScore(text: string): number {
    const authorityWords = ['government', 'irs', 'fbi', 'police', 'court', 'official', 'department', 'agency'];
    const companyWords = ['microsoft', 'apple', 'amazon', 'google', 'bank', 'paypal'];
    
    const textLower = text.toLowerCase();
    let score = 0;

    authorityWords.forEach(word => {
      if (textLower.includes(word)) score += 0.2;
    });

    companyWords.forEach(word => {
      if (textLower.includes(word)) score += 0.15;
    });

    return Math.min(score, 1.0);
  }

  private calculateFinancialScore(text: string): number {
    const financialWords = ['payment', 'money', 'credit card', 'bank account', 'wire transfer', 'gift card', 'bitcoin'];
    const textLower = text.toLowerCase();
    
    let score = 0;
    financialWords.forEach(word => {
      if (textLower.includes(word)) {
        score += 0.2;
      }
    });

    // Check for dollar amounts
    const dollarMatches = text.match(/\$\d+/g) || [];
    score += dollarMatches.length * 0.1;

    return Math.min(score, 1.0);
  }

  private calculateGrammarScore(text: string): number {
    // Simple grammar quality heuristics
    let score = 1.0;

    // Check for basic punctuation
    if (!text.match(/[.!?]$/)) score -= 0.2;
    
    // Check for excessive punctuation
    const exclamationCount = (text.match(/!/g) || []).length;
    if (exclamationCount > 2) score -= 0.3;

    // Check for spelling patterns (simplified)
    const commonMisspellings = ['recieve', 'seperate', 'occured', 'definately'];
    commonMisspellings.forEach(word => {
      if (text.toLowerCase().includes(word)) score -= 0.2;
    });

    return Math.max(score, 0.0);
  }

  private normalizeLengthScore(length: number): number {
    // Normalize text length to 0-1 scale
    // Very short or very long messages can be suspicious
    const optimal = 150; // Optimal message length
    const difference = Math.abs(length - optimal);
    return Math.max(0, 1 - (difference / optimal));
  }

  private calculateCapitalizationScore(text: string): number {
    const totalChars = text.length;
    const capsChars = (text.match(/[A-Z]/g) || []).length;
    
    if (totalChars === 0) return 0;
    
    const ratio = capsChars / totalChars;
    
    // Normal capitalization is around 0.05-0.15
    // High caps ratio suggests shouting/urgency
    if (ratio > 0.3) return 1.0;
    if (ratio > 0.2) return 0.7;
    return ratio * 2; // Normalize to 0-1
  }

  private generateSimpleEmbedding(text: string): number[] {
    // Simplified embedding generation (in production would use actual word embeddings)
    const words = text.toLowerCase().split(/\s+/);
    const embedding = new Array(50).fill(0);
    
    // Hash words to embedding dimensions
    words.forEach((word, index) => {
      const hash = this.simpleHash(word);
      embedding[hash % 50] += 1 / words.length;
    });

    return embedding;
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private calculateSentimentScore(text: string): number {
    // Simplified sentiment analysis
    const positiveWords = ['great', 'excellent', 'good', 'congratulations', 'winner', 'reward'];
    const negativeWords = ['urgent', 'warning', 'suspended', 'fraud', 'arrest', 'problem'];
    
    const textLower = text.toLowerCase();
    let score = 0;

    positiveWords.forEach(word => {
      if (textLower.includes(word)) score += 0.1;
    });

    negativeWords.forEach(word => {
      if (textLower.includes(word)) score -= 0.15;
    });

    return Math.max(-1, Math.min(1, score));
  }

  public predict(text: string): ModelPrediction {
    const features = this.extractFeatures(text);
    
    // Calculate weighted score
    let totalScore = 0;
    let totalWeight = 0;
    const explanationFactors: ModelPrediction['explanationFactors'] = [];

    // Text feature contributions
    Object.entries(features.textFeatures).forEach(([key, value]) => {
      const weight = this.modelWeights.get(`${key.replace(/([A-Z])/g, '_$1').toLowerCase()}`) || 0;
      if (weight !== 0) {
        const contribution = value * weight;
        totalScore += contribution;
        totalWeight += Math.abs(weight);
        
        explanationFactors.push({
          factor: this.formatFactorName(key),
          weight,
          contribution
        });
      }
    });

    // Pattern matching contributions
    const patterns: string[] = [];
    this.patternRegistry.forEach((regex, patternName) => {
      const matches = text.match(regex) || [];
      if (matches.length > 0) {
        patterns.push(patternName);
        const weight = this.modelWeights.get(`pattern_${patternName}`) || 0;
        const contribution = matches.length * weight;
        totalScore += contribution;
        totalWeight += Math.abs(weight);

        explanationFactors.push({
          factor: this.formatFactorName(patternName),
          weight,
          contribution
        });
      }
    });

    // Normalize score
    const normalizedScore = totalWeight > 0 ? totalScore / totalWeight : 0;
    const riskScore = Math.max(0, Math.min(100, (normalizedScore + 1) * 50)); // Convert to 0-100 scale
    
    // Calculate confidence based on feature strength
    const confidence = Math.min(0.95, Math.max(0.5, 
      Math.abs(normalizedScore) * 0.8 + (explanationFactors.length * 0.05)
    ));

    return {
      isScam: riskScore > 50,
      confidence,
      riskScore,
      patterns,
      explanationFactors: explanationFactors
        .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
        .slice(0, 5) // Top 5 factors
    };
  }

  private formatFactorName(name: string): string {
    return name
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .toLowerCase()
      .replace(/^\w/, c => c.toUpperCase())
      .trim();
  }

  public addTrainingExample(text: string, label: 'scam' | 'legitimate', confidence: number = 0.8): void {
    const features = this.extractFeatures(text);
    
    const example: TrainingExample = {
      id: `train_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      text,
      features,
      label,
      confidence,
      timestamp: new Date().toISOString(),
      verified: false
    };

    this.trainingData.push(example);
    
    // Trigger model retraining if we have enough new examples
    if (this.trainingData.filter(e => !e.verified).length >= 10) {
      this.retrainModel();
    }
  }

  private retrainModel(): void {
    console.log('Retraining ML model with new examples...');
    
    // Simple weight adjustment based on prediction accuracy
    const recentExamples = this.trainingData.slice(-50); // Use last 50 examples
    
    recentExamples.forEach(example => {
      const prediction = this.predict(example.text);
      const actual = example.label === 'scam';
      const predicted = prediction.isScam;
      
      // Adjust weights based on prediction accuracy
      if (actual !== predicted) {
        // Adjust feature weights that contributed to the error
        prediction.explanationFactors.forEach(factor => {
          const currentWeight = this.modelWeights.get(factor.factor.toLowerCase().replace(/\s+/g, '_')) || 0;
          const adjustment = actual ? 0.01 : -0.01; // Small adjustment
          this.modelWeights.set(factor.factor.toLowerCase().replace(/\s+/g, '_'), currentWeight + adjustment);
        });
      }
    });

    // Mark examples as processed
    this.trainingData.forEach(example => {
      example.verified = true;
    });

    console.log('Model retraining completed');
  }

  public getModelStats(): {
    trainingExamples: number;
    accuracy: number;
    patterns: number;
    lastRetrained: string;
  } {
    return {
      trainingExamples: this.trainingData.length,
      accuracy: this.calculateAccuracy(),
      patterns: this.patternRegistry.size,
      lastRetrained: new Date().toISOString()
    };
  }

  private calculateAccuracy(): number {
    const testExamples = this.trainingData.filter(e => e.verified);
    if (testExamples.length === 0) return 0;

    let correctPredictions = 0;
    testExamples.forEach(example => {
      const prediction = this.predict(example.text);
      const actual = example.label === 'scam';
      if (prediction.isScam === actual) {
        correctPredictions++;
      }
    });

    return correctPredictions / testExamples.length;
  }
}

export const mlPatternRecognizer = new MLPatternRecognizer();