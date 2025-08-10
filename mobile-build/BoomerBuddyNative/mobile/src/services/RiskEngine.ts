/**
 * On-Device Risk Engine
 * Combines ML model with rule-based checks for scam detection
 */

import { PiiScrubber } from './PiiScrubber';

export interface RiskScore {
  score: number; // 0-100
  confidence: 'low' | 'medium' | 'high';
  label: 'safe' | 'caution' | 'danger';
  reasons: string[];
  signals: string[];
  brandSuspects: string[];
  modelScore: number;
  rulesScore: number;
}

export interface ModelMetadata {
  version: string;
  checksum: string;
  createdAt: string;
  requiredRulesVersion: string;
}

export interface RulesConfig {
  version: string;
  agencyHours: { [agency: string]: { start: number; end: number; timezone: string } };
  phoneFormats: { [country: string]: RegExp[] };
  suspiciousDomains: string[];
  trustedDomains: string[];
  scamKeywords: { [category: string]: { keywords: string[]; weight: number } };
}

export class RiskEngine {
  private static instance: RiskEngine;
  private modelLoaded = false;
  private rulesLoaded = false;
  private modelMetadata: ModelMetadata | null = null;
  private rulesConfig: RulesConfig | null = null;

  private constructor() {
    this.initializeEngine();
  }

  static getInstance(): RiskEngine {
    if (!RiskEngine.instance) {
      RiskEngine.instance = new RiskEngine();
    }
    return RiskEngine.instance;
  }

  /**
   * Initialize the risk engine with model and rules
   */
  private async initializeEngine(): Promise<void> {
    try {
      await Promise.all([
        this.loadModel(),
        this.loadRules()
      ]);
      console.log('Risk engine initialized successfully');
    } catch (error) {
      console.error('Failed to initialize risk engine:', error);
    }
  }

  /**
   * Score content for scam risk
   */
  async scoreContent(content: string, metadata: {
    channel: 'sms' | 'call' | 'voicemail' | 'email' | 'web' | 'letter';
    phoneNumber?: string;
    timestamp?: number;
    state?: string;
  }): Promise<RiskScore> {
    // First scrub PII
    const scrubResult = PiiScrubber.scrubText(content);
    
    if (scrubResult.hasHardBlocks) {
      return {
        score: 0,
        confidence: 'high',
        label: 'safe',
        reasons: ['Content analysis blocked due to sensitive information detection'],
        signals: [],
        brandSuspects: [],
        modelScore: 0,
        rulesScore: 0
      };
    }

    // Run model prediction
    const modelScore = await this.runModelPrediction(scrubResult.scrubbedText);
    
    // Run rules-based checks
    const rulesResult = this.runRulesCheck(scrubResult.scrubbedText, metadata);
    
    // Combine scores
    const finalScore = this.combineScores(modelScore, rulesResult.score);
    
    return {
      score: finalScore,
      confidence: this.calculateConfidence(modelScore, rulesResult.score),
      label: this.getLabel(finalScore),
      reasons: rulesResult.reasons,
      signals: rulesResult.signals,
      brandSuspects: rulesResult.brandSuspects,
      modelScore,
      rulesScore: rulesResult.score
    };
  }

  /**
   * Score phone number for incoming call/SMS
   */
  async scoreNumber(phoneNumber: string, context: {
    timeOfDay?: number;
    isIncomingCall?: boolean;
    isKnownContact?: boolean;
  }): Promise<RiskScore> {
    const reasons: string[] = [];
    const signals: string[] = [];
    let score = 0;

    // Check if number is in known scam list
    if (this.isKnownScamNumber(phoneNumber)) {
      score += 80;
      reasons.push('Number appears on known scam database');
      signals.push('known_scammer');
    }

    // Check phone number format
    if (!this.isValidPhoneFormat(phoneNumber)) {
      score += 20;
      reasons.push('Invalid or suspicious phone number format');
      signals.push('invalid_format');
    }

    // Check calling hours for government agencies
    if (this.isGovernmentClaim(phoneNumber) && !this.isValidAgencyHours()) {
      score += 30;
      reasons.push('Government agencies don\'t typically call outside business hours');
      signals.push('after_hours_government');
    }

    // Check for robocall patterns
    if (context.isIncomingCall && this.isLikelyRobocall(phoneNumber)) {
      score += 25;
      reasons.push('Call pattern suggests automated/robocall');
      signals.push('robocall_pattern');
    }

    const finalScore = Math.min(score, 100);

    return {
      score: finalScore,
      confidence: finalScore > 60 ? 'high' : finalScore > 30 ? 'medium' : 'low',
      label: this.getLabel(finalScore),
      reasons,
      signals,
      brandSuspects: [],
      modelScore: 0,
      rulesScore: finalScore
    };
  }

  /**
   * Load ML model (TensorFlow Lite / Core ML)
   */
  private async loadModel(): Promise<void> {
    try {
      // In a real implementation, this would load the actual model
      // For React Native:
      // - Android: TensorFlow Lite
      // - iOS: Core ML
      
      this.modelMetadata = {
        version: '1.0.0',
        checksum: 'sha256:mock_checksum',
        createdAt: '2025-08-01T00:00:00Z',
        requiredRulesVersion: '1.0.0'
      };
      
      this.modelLoaded = true;
      console.log('Model loaded successfully');
    } catch (error) {
      console.error('Failed to load model:', error);
      this.modelLoaded = false;
    }
  }

  /**
   * Load rules configuration
   */
  private async loadRules(): Promise<void> {
    try {
      this.rulesConfig = {
        version: '1.0.0',
        agencyHours: {
          'irs': { start: 8, end: 17, timezone: 'America/New_York' },
          'ssa': { start: 8, end: 17, timezone: 'America/New_York' },
          'medicare': { start: 8, end: 17, timezone: 'America/New_York' }
        },
        phoneFormats: {
          'US': [
            /^\+?1?[2-9]\d{2}[2-9]\d{2}\d{4}$/, // Standard US format
          ]
        },
        suspiciousDomains: [
          'bit.ly', 'tinyurl.com', 'short.link', 't.co'
        ],
        trustedDomains: [
          'irs.gov', 'ssa.gov', 'medicare.gov', 'ftc.gov', 'fbi.gov'
        ],
        scamKeywords: {
          urgency: {
            keywords: ['urgent', 'immediately', 'asap', 'expires today', 'limited time'],
            weight: 0.8
          },
          payment: {
            keywords: ['gift card', 'prepaid card', 'bitcoin', 'wire transfer', 'google play', 'apple pay'],
            weight: 0.9
          },
          threat: {
            keywords: ['arrest', 'lawsuit', 'legal action', 'warrant', 'suspended', 'frozen account'],
            weight: 0.85
          },
          impersonation: {
            keywords: ['irs', 'social security', 'medicare', 'amazon', 'apple', 'microsoft'],
            weight: 0.7
          }
        }
      };
      
      this.rulesLoaded = true;
      console.log('Rules loaded successfully');
    } catch (error) {
      console.error('Failed to load rules:', error);
      this.rulesLoaded = false;
    }
  }

  /**
   * Run ML model prediction
   */
  private async runModelPrediction(text: string): Promise<number> {
    if (!this.modelLoaded) {
      console.warn('Model not loaded, using rules-only scoring');
      return 0;
    }

    try {
      // In a real implementation, this would:
      // 1. Tokenize the text
      // 2. Run inference on the model
      // 3. Return prediction score
      
      // Simulate model prediction based on text characteristics
      const suspiciousPatterns = [
        /gift\s*card/i,
        /urgent/i,
        /suspended/i,
        /verify.*account/i,
        /click.*link/i,
        /call.*back/i
      ];
      
      let modelScore = 0;
      suspiciousPatterns.forEach(pattern => {
        if (pattern.test(text)) {
          modelScore += 15;
        }
      });
      
      // Add randomness to simulate model uncertainty
      modelScore += Math.random() * 10;
      
      return Math.min(modelScore, 100);
    } catch (error) {
      console.error('Model prediction failed:', error);
      return 0;
    }
  }

  /**
   * Run rules-based checks
   */
  private runRulesCheck(text: string, metadata: any): {
    score: number;
    reasons: string[];
    signals: string[];
    brandSuspects: string[];
  } {
    const reasons: string[] = [];
    const signals: string[] = [];
    const brandSuspects: string[] = [];
    let score = 0;

    if (!this.rulesConfig) {
      return { score: 0, reasons: ['Rules not loaded'], signals: [], brandSuspects: [] };
    }

    const lowerText = text.toLowerCase();

    // Check scam keywords
    Object.entries(this.rulesConfig.scamKeywords).forEach(([category, config]) => {
      const foundKeywords = config.keywords.filter(keyword => 
        lowerText.includes(keyword.toLowerCase())
      );
      
      if (foundKeywords.length > 0) {
        const categoryScore = foundKeywords.length * config.weight * 20;
        score += categoryScore;
        signals.push(category);
        reasons.push(`Detected ${category} indicators: ${foundKeywords.join(', ')}`);
      }
    });

    // Check for suspicious domains
    this.rulesConfig.suspiciousDomains.forEach(domain => {
      if (lowerText.includes(domain)) {
        score += 25;
        signals.push('suspicious_domain');
        reasons.push(`Contains suspicious shortened URL: ${domain}`);
      }
    });

    // Check for brand impersonation
    const brandPatterns = {
      'irs': /\b(irs|internal revenue|tax refund)\b/i,
      'ssa': /\b(social security|ssa|benefits)\b/i,
      'medicare': /\b(medicare|medicaid)\b/i,
      'amazon': /\b(amazon|prime)\b/i,
      'apple': /\b(apple|icloud|itunes)\b/i,
      'microsoft': /\b(microsoft|windows)\b/i
    };

    Object.entries(brandPatterns).forEach(([brand, pattern]) => {
      if (pattern.test(text)) {
        brandSuspects.push(brand);
        score += 15;
        reasons.push(`Possible ${brand.toUpperCase()} impersonation`);
      }
    });

    // Check for callback number mismatches
    if (metadata.phoneNumber && /call.*back.*(\d{3}[-.\s]\d{3}[-.\s]\d{4})/.test(text)) {
      const callbackMatch = text.match(/(\d{3}[-.\s]\d{3}[-.\s]\d{4})/);
      if (callbackMatch && !callbackMatch[0].includes(metadata.phoneNumber)) {
        score += 30;
        signals.push('callback_mismatch');
        reasons.push('Callback number differs from sender');
      }
    }

    // Check timing for government claims
    if (brandSuspects.includes('irs') || brandSuspects.includes('ssa')) {
      if (!this.isValidAgencyHours()) {
        score += 25;
        signals.push('after_hours_government');
        reasons.push('Government agencies typically don\'t contact outside business hours');
      }
    }

    return {
      score: Math.min(score, 100),
      reasons,
      signals,
      brandSuspects
    };
  }

  /**
   * Combine model and rules scores
   */
  private combineScores(modelScore: number, rulesScore: number): number {
    // Weight rules higher for scam detection (more reliable)
    const weightedScore = (rulesScore * 0.7) + (modelScore * 0.3);
    return Math.round(Math.min(weightedScore, 100));
  }

  /**
   * Calculate confidence based on score agreement
   */
  private calculateConfidence(modelScore: number, rulesScore: number): 'low' | 'medium' | 'high' {
    const agreement = Math.abs(modelScore - rulesScore);
    const maxScore = Math.max(modelScore, rulesScore);

    if (agreement < 20 && maxScore > 60) return 'high';
    if (agreement < 30 && maxScore > 40) return 'medium';
    return 'low';
  }

  /**
   * Get risk label from score
   */
  private getLabel(score: number): 'safe' | 'caution' | 'danger' {
    if (score >= 70) return 'danger';
    if (score >= 40) return 'caution';
    return 'safe';
  }

  /**
   * Check if phone number is in known scam database
   */
  private isKnownScamNumber(phoneNumber: string): boolean {
    // In a real implementation, this would check against a local database
    const knownScamNumbers = [
      '8882345678', '8005551234', '8779876543', '8887654321', '8556789012'
    ];
    
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    return knownScamNumbers.includes(cleanNumber);
  }

  /**
   * Validate phone number format
   */
  private isValidPhoneFormat(phoneNumber: string): boolean {
    if (!this.rulesConfig) return true;
    
    const patterns = this.rulesConfig.phoneFormats['US'] || [];
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    
    return patterns.some(pattern => pattern.test(cleanNumber));
  }

  /**
   * Check if current time is valid for government agency contact
   */
  private isValidAgencyHours(): boolean {
    const now = new Date();
    const hour = now.getHours();
    
    // Government agencies typically work 8 AM - 5 PM EST/EST
    return hour >= 8 && hour <= 17;
  }

  /**
   * Check if call pattern suggests robocall
   */
  private isLikelyRobocall(phoneNumber: string): boolean {
    // Simple heuristics - in real implementation would be more sophisticated
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    
    // Sequential numbers often indicate robocalls
    const isSequential = /(\d)\1{3,}/.test(cleanNumber);
    
    // Common robocall area codes
    const robocallAreaCodes = ['800', '888', '877', '866', '855', '844', '833', '822'];
    const areaCode = cleanNumber.substring(0, 3);
    
    return isSequential || robocallAreaCodes.includes(areaCode);
  }

  /**
   * Check if text claims to be from government
   */
  private isGovernmentClaim(phoneNumber: string): boolean {
    // This would be called with text content in real implementation
    // For phone number only, we'll check if it claims to be from government
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    
    // Government numbers typically don't use toll-free prefixes for official contact
    const tollFreePrefixes = ['800', '888', '877', '866', '855', '844', '833', '822'];
    const prefix = cleanNumber.substring(0, 3);
    
    return tollFreePrefixes.includes(prefix);
  }

  /**
   * Update model from CDN
   */
  async updateModel(modelUrl: string, checksum: string): Promise<boolean> {
    try {
      console.log('Updating model from CDN...');
      
      // In a real implementation:
      // 1. Download model from CDN
      // 2. Verify checksum
      // 3. Replace current model
      // 4. Update metadata
      
      // Simulate update
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      this.modelMetadata = {
        version: '1.0.1',
        checksum,
        createdAt: new Date().toISOString(),
        requiredRulesVersion: '1.0.0'
      };
      
      console.log('Model updated successfully');
      return true;
    } catch (error) {
      console.error('Model update failed:', error);
      return false;
    }
  }

  /**
   * Get current model metadata
   */
  getModelMetadata(): ModelMetadata | null {
    return this.modelMetadata;
  }

  /**
   * Check if engine is ready
   */
  isReady(): boolean {
    return this.modelLoaded && this.rulesLoaded;
  }

  /**
   * Get engine status
   */
  getStatus(): {
    modelLoaded: boolean;
    rulesLoaded: boolean;
    modelVersion: string | null;
    rulesVersion: string | null;
  } {
    return {
      modelLoaded: this.modelLoaded,
      rulesLoaded: this.rulesLoaded,
      modelVersion: this.modelMetadata?.version || null,
      rulesVersion: this.rulesConfig?.version || null
    };
  }
}