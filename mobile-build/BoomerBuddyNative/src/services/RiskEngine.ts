export interface RiskAssessment {
  overallRisk: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  threats: string[];
  recommendations: string[];
  scamType?: string;
  score: number; // 0-100
}

class RiskEngineService {
  private scamKeywords = {
    financial: [
      'wire money', 'western union', 'moneygram', 'gift card', 'bitcoin',
      'cryptocurrency', 'inheritance', 'lottery', 'sweepstakes', 'prize',
      'refund', 'overpayment', 'tax refund', 'stimulus', 'social security number'
    ],
    urgency: [
      'urgent', 'immediate', 'expires today', 'limited time', 'act now',
      'don\'t delay', 'final notice', 'last chance', 'expires soon'
    ],
    authority: [
      'irs', 'fbi', 'police', 'sheriff', 'medicare', 'social security',
      'government', 'federal', 'treasury', 'department'
    ],
    techSupport: [
      'computer infected', 'virus detected', 'microsoft support', 'apple support',
      'windows defender', 'antivirus', 'malware', 'remote access'
    ],
    romance: [
      'deployed overseas', 'military', 'emergency funds', 'travel money',
      'love you', 'soulmate', 'marry me', 'meet in person'
    ],
    phishing: [
      'verify account', 'suspended account', 'click here', 'update payment',
      'confirm identity', 'security alert', 'unusual activity'
    ]
  };

  private riskPatterns = {
    // Phone number patterns
    premiumRate: /\b(900|976|809|829|849|473)\d{7}\b/,
    sequential: /0123456789|9876543210/,
    repeated: /(\d)\1{4,}/,
    
    // URL patterns
    suspicious: /bit\.ly|tinyurl|t\.co|goo\.gl/,
    ipAddress: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/,
    
    // Email patterns
    fakeFrom: /(amazon|paypal|bank|microsoft|apple|google).*@(gmail|yahoo|hotmail)/i,
    
    // Financial patterns
    routing: /\b[0-9]{9}\b/,
    account: /\b[0-9]{8,17}\b/
  };

  analyzeText(text: string): RiskAssessment {
    const analysis = {
      overallRisk: 'safe' as const,
      confidence: 0.8,
      threats: [] as string[],
      recommendations: [] as string[],
      score: 0
    };

    const lowerText = text.toLowerCase();
    let riskScore = 0;

    // Check for scam keywords
    Object.entries(this.scamKeywords).forEach(([category, keywords]) => {
      const foundKeywords = keywords.filter(keyword => 
        lowerText.includes(keyword.toLowerCase())
      );
      
      if (foundKeywords.length > 0) {
        riskScore += foundKeywords.length * 15;
        analysis.threats.push(`${category} scam indicators: ${foundKeywords.join(', ')}`);
      }
    });

    // Check for suspicious patterns
    Object.entries(this.riskPatterns).forEach(([pattern, regex]) => {
      if (regex.test(text)) {
        riskScore += 20;
        analysis.threats.push(`Suspicious ${pattern} pattern detected`);
      }
    });

    // Grammar and spelling check (simple)
    const grammarIssues = this.checkGrammar(text);
    if (grammarIssues > 3) {
      riskScore += 10;
      analysis.threats.push('Poor grammar/spelling (common in scams)');
    }

    // Urgency detection
    const urgencyCount = this.countUrgencyWords(lowerText);
    if (urgencyCount > 2) {
      riskScore += 15;
      analysis.threats.push('High-pressure tactics detected');
    }

    // Personal information requests
    if (this.checksForPersonalInfo(lowerText)) {
      riskScore += 25;
      analysis.threats.push('Requests for personal/financial information');
    }

    // Determine overall risk
    analysis.score = Math.min(riskScore, 100);
    
    if (riskScore >= 70) {
      analysis.overallRisk = 'critical';
      analysis.confidence = 0.95;
    } else if (riskScore >= 50) {
      analysis.overallRisk = 'high';
      analysis.confidence = 0.9;
    } else if (riskScore >= 30) {
      analysis.overallRisk = 'medium';
      analysis.confidence = 0.8;
    } else if (riskScore >= 15) {
      analysis.overallRisk = 'low';
      analysis.confidence = 0.7;
    }

    // Generate recommendations
    analysis.recommendations = this.generateRecommendations(analysis);

    // Detect scam type
    analysis.scamType = this.detectScamType(lowerText);

    return analysis;
  }

  analyzePhoneNumber(phoneNumber: string): RiskAssessment {
    const analysis = {
      overallRisk: 'safe' as const,
      confidence: 0.8,
      threats: [] as string[],
      recommendations: [] as string[],
      score: 0
    };

    let riskScore = 0;
    const digits = phoneNumber.replace(/\D/g, '');

    // Check area code
    const areaCode = digits.slice(0, 3);
    const premiumAreaCodes = ['900', '976', '809', '829', '849', '473'];
    
    if (premiumAreaCodes.includes(areaCode)) {
      riskScore += 40;
      analysis.threats.push('Premium rate area code');
    }

    // Check for suspicious patterns
    if (this.riskPatterns.sequential.test(digits)) {
      riskScore += 30;
      analysis.threats.push('Sequential number pattern');
    }

    if (this.riskPatterns.repeated.test(digits)) {
      riskScore += 25;
      analysis.threats.push('Repeated digit pattern');
    }

    // Invalid length
    if (digits.length !== 10 && digits.length !== 11) {
      riskScore += 20;
      analysis.threats.push('Invalid phone number format');
    }

    analysis.score = riskScore;

    if (riskScore >= 50) {
      analysis.overallRisk = 'high';
    } else if (riskScore >= 30) {
      analysis.overallRisk = 'medium';
    } else if (riskScore >= 15) {
      analysis.overallRisk = 'low';
    }

    analysis.recommendations = this.generateRecommendations(analysis);

    return analysis;
  }

  private checkGrammar(text: string): number {
    let issues = 0;
    
    // Simple grammar checks
    if (!/^[A-Z]/.test(text.trim())) issues++; // Doesn't start with capital
    if (!/[.!?]$/.test(text.trim())) issues++; // Doesn't end with punctuation
    
    // Multiple exclamation marks
    if (/!{2,}/.test(text)) issues++;
    
    // ALL CAPS sections
    if (/[A-Z]{10,}/.test(text)) issues++;
    
    // Poor spacing
    if (/\w{50,}/.test(text)) issues++; // Very long words (likely typos)
    
    return issues;
  }

  private countUrgencyWords(text: string): number {
    return this.scamKeywords.urgency.filter(word => 
      text.includes(word.toLowerCase())
    ).length;
  }

  private checksForPersonalInfo(text: string): boolean {
    const personalInfoRequests = [
      'social security number', 'ssn', 'date of birth', 'mother\'s maiden name',
      'bank account', 'routing number', 'credit card', 'password', 'pin number'
    ];
    
    return personalInfoRequests.some(request => 
      text.includes(request.toLowerCase())
    );
  }

  private generateRecommendations(analysis: RiskAssessment): string[] {
    const recommendations = [];
    
    if (analysis.overallRisk === 'critical' || analysis.overallRisk === 'high') {
      recommendations.push('DO NOT respond to this message');
      recommendations.push('Block the sender immediately');
      recommendations.push('Report this as a scam');
    }
    
    if (analysis.threats.some(t => t.includes('personal'))) {
      recommendations.push('Never share personal information via email/text');
    }
    
    if (analysis.threats.some(t => t.includes('urgency'))) {
      recommendations.push('Legitimate organizations don\'t use high-pressure tactics');
    }
    
    if (analysis.threats.some(t => t.includes('financial'))) {
      recommendations.push('Verify with your bank through official channels');
    }

    if (recommendations.length === 0) {
      recommendations.push('Stay vigilant and verify sender identity');
    }
    
    return recommendations;
  }

  private detectScamType(text: string): string | undefined {
    if (this.scamKeywords.romance.some(w => text.includes(w))) {
      return 'Romance Scam';
    }
    if (this.scamKeywords.techSupport.some(w => text.includes(w))) {
      return 'Tech Support Scam';
    }
    if (this.scamKeywords.financial.some(w => text.includes(w))) {
      return 'Financial Scam';
    }
    if (this.scamKeywords.phishing.some(w => text.includes(w))) {
      return 'Phishing Attempt';
    }
    if (this.scamKeywords.authority.some(w => text.includes(w))) {
      return 'Government Impersonation';
    }
    
    return undefined;
  }
}

export const riskEngine = new RiskEngineService();