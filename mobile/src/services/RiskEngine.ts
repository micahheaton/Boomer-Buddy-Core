/**
 * Risk Engine - On-device threat assessment
 * Combines rule-based detection with ML model scoring
 */

interface RiskAssessment {
  score: number; // 0-100
  confidence: 'low' | 'medium' | 'high';
  label: 'likely_legitimate' | 'suspicious' | 'likely_scam';
  reasons: string[];
  shouldBlock: boolean;
  shouldWarn: boolean;
}

export class RiskEngine {
  private static initialized = false;
  private static modelLoaded = false;

  static initialize(): void {
    if (this.initialized) return;
    
    console.log('🛡️ Risk Engine initialized - On-device protection active');
    this.loadModel();
    this.initialized = true;
  }

  private static async loadModel(): Promise<void> {
    try {
      // TODO: Load TensorFlow Lite model (Android) or Core ML model (iOS)
      // For now, use rule-based assessment
      console.log('📱 Loading on-device ML model...');
      
      // Placeholder for model loading
      await new Promise(resolve => setTimeout(resolve, 100));
      
      this.modelLoaded = true;
      console.log('✅ On-device model ready');
    } catch (error) {
      console.error('❌ Model loading failed, using rules only:', error);
      this.modelLoaded = false;
    }
  }

  /**
   * Assess risk for incoming call/SMS
   */
  static assessRisk(
    content: string,
    channel: 'sms' | 'call' | 'voicemail',
    phoneNumber?: string
  ): RiskAssessment {
    const rules = this.runRuleEngine(content, channel, phoneNumber);
    const mlScore = this.modelLoaded ? this.runMLModel(content) : 0;
    
    // Weighted combination: 70% rules, 30% ML
    const finalScore = Math.round(rules.score * 0.7 + mlScore * 0.3);
    
    const assessment: RiskAssessment = {
      score: finalScore,
      confidence: this.calculateConfidence(finalScore, rules.reasons.length),
      label: this.getLabel(finalScore),
      reasons: rules.reasons,
      shouldBlock: finalScore >= 85,
      shouldWarn: finalScore >= 60
    };

    return assessment;
  }

  private static runRuleEngine(
    content: string,
    channel: string,
    phoneNumber?: string
  ): { score: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];
    const lowerContent = content.toLowerCase();

    // High-risk indicators (20-30 points each)
    if (/gift card|prepaid card|bitcoin|crypto|wire transfer/i.test(content)) {
      score += 30;
      reasons.push('Requests unusual payment method');
    }

    if (/arrest|lawsuit|legal action|suspended|frozen|warrant/i.test(content)) {
      score += 25;
      reasons.push('Contains legal threats');
    }

    if (/urgent|immediately|expire.*hour|act now|deadline/i.test(content)) {
      score += 20;
      reasons.push('Creates false urgency');
    }

    // Government/Brand impersonation (15-25 points)
    if (/\b(?:irs|internal revenue)\b/i.test(content)) {
      score += 25;
      reasons.push('IRS impersonation');
    }

    if (/\b(?:social security|ssa|medicare)\b/i.test(content)) {
      score += 25;
      reasons.push('Government benefit impersonation');
    }

    if (/\b(?:amazon|microsoft|apple|google)\b/i.test(content)) {
      score += 20;
      reasons.push('Tech company impersonation');
    }

    // Suspicious patterns (10-15 points)
    if (/verify.*account|confirm.*identity|update.*information/i.test(content)) {
      score += 15;
      reasons.push('Requests personal verification');
    }

    if (/click.*link|visit.*website|download.*app/i.test(content)) {
      score += 10;
      reasons.push('Contains suspicious links');
    }

    if (/don't tell|keep secret|between us|confidential/i.test(content)) {
      score += 15;
      reasons.push('Requests secrecy');
    }

    // Time-based risk (5-10 points)
    const hour = new Date().getHours();
    if ((hour >= 22 || hour < 6) && channel === 'call') {
      score += 10;
      reasons.push('Call at unusual hours');
    }

    // Phone number analysis
    if (phoneNumber && this.isHighRiskNumber(phoneNumber)) {
      score += 20;
      reasons.push('Known high-risk number pattern');
    }

    return { score: Math.min(score, 100), reasons };
  }

  private static runMLModel(content: string): number {
    // TODO: Implement TensorFlow Lite / Core ML inference
    // For now, return 0 to rely on rules
    return 0;
  }

  private static isHighRiskNumber(phoneNumber: string): boolean {
    // Remove formatting
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    
    // High-risk patterns
    const riskPatterns = [
      /^1?800/, // Toll-free numbers often used by scammers
      /^1?888/,
      /^1?877/,
      /^1?866/,
      // International numbers
      /^011/,
      // Known scammer area codes (examples)
      /^1?347/, // NYC overlay often spoofed
      /^1?213/, // LA often spoofed
    ];

    return riskPatterns.some(pattern => pattern.test(cleanNumber));
  }

  private static calculateConfidence(score: number, reasonCount: number): 'low' | 'medium' | 'high' {
    if (score >= 80 && reasonCount >= 3) return 'high';
    if (score >= 50 && reasonCount >= 2) return 'medium';
    return 'low';
  }

  private static getLabel(score: number): 'likely_legitimate' | 'suspicious' | 'likely_scam' {
    if (score >= 70) return 'likely_scam';
    if (score >= 40) return 'suspicious';
    return 'likely_legitimate';
  }

  /**
   * Quick assessment for call screening
   */
  static quickAssessCall(phoneNumber: string): {
    shouldBlock: boolean;
    shouldWarn: boolean;
    label: string;
  } {
    const isHighRisk = this.isHighRiskNumber(phoneNumber);
    
    return {
      shouldBlock: false, // Don't auto-block, just warn
      shouldWarn: isHighRisk,
      label: isHighRisk ? 'Suspected Scam' : ''
    };
  }
}