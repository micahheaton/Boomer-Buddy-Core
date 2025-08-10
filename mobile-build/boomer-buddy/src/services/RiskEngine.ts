// On-Device Risk Assessment Engine
// Processes scam indicators without sending data to external servers

export interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  scamIndicators: ScamIndicator[];
  recommendations: string[];
  immediateAction: boolean;
}

export interface ScamIndicator {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  found: boolean;
}

class RiskEngine {
  private scamPatterns = {
    // Urgency indicators
    urgency: {
      patterns: [
        /urgent/i, /immediate/i, /expires today/i, /limited time/i,
        /act now/i, /expires soon/i, /last chance/i, /hurry/i,
        /within 24 hours/i, /deadline/i
      ],
      severity: 'medium' as const,
      description: 'Creates false sense of urgency'
    },

    // Authority impersonation
    authority: {
      patterns: [
        /irs/i, /social security/i, /medicare/i, /government/i,
        /federal/i, /agent/i, /officer/i, /department/i,
        /official/i, /investigation/i, /lawsuit/i, /arrest/i
      ],
      severity: 'high' as const,
      description: 'Impersonates government authority'
    },

    // Financial threats
    financial: {
      patterns: [
        /suspended/i, /frozen/i, /closed/i, /blocked/i,
        /unauthorized/i, /fraud/i, /verify account/i,
        /update payment/i, /billing problem/i, /overdue/i
      ],
      severity: 'high' as const,
      description: 'Threatens financial consequences'
    },

    // Request for sensitive info
    sensitiveInfo: {
      patterns: [
        /social security number/i, /ssn/i, /credit card/i,
        /bank account/i, /routing number/i, /password/i,
        /pin number/i, /security code/i, /verification code/i,
        /login/i, /confirm identity/i
      ],
      severity: 'critical' as const,
      description: 'Requests sensitive personal information'
    },

    // Tech support scams
    techSupport: {
      patterns: [
        /computer virus/i, /infected/i, /hacked/i, /security alert/i,
        /microsoft/i, /apple/i, /windows/i, /mac/i,
        /remote access/i, /tech support/i, /computer problem/i,
        /malware/i, /error/i, /warning/i
      ],
      severity: 'high' as const,
      description: 'Tech support scam indicators'
    },

    // Romance/relationship scams
    romance: {
      patterns: [
        /love/i, /marriage/i, /relationship/i, /lonely/i,
        /military/i, /deployed/i, /overseas/i, /widow/i,
        /inheritance/i, /emergency/i, /hospital/i, /money/i
      ],
      severity: 'medium' as const,
      description: 'Romance scam patterns detected'
    },

    // Prize/lottery scams
    prize: {
      patterns: [
        /won/i, /winner/i, /lottery/i, /prize/i, /jackpot/i,
        /congratulations/i, /selected/i, /claim/i, /reward/i,
        /million dollars/i, /cash prize/i, /sweepstakes/i
      ],
      severity: 'medium' as const,
      description: 'Prize or lottery scam indicators'
    },

    // Investment scams
    investment: {
      patterns: [
        /investment/i, /cryptocurrency/i, /bitcoin/i, /trading/i,
        /guaranteed return/i, /risk-free/i, /high yield/i,
        /double your money/i, /insider information/i, /profit/i
      ],
      severity: 'high' as const,
      description: 'Investment scam patterns'
    }
  };

  private commonScamPhones = [
    '+1-800-', '+1-888-', '+1-877-', '+1-866-',
    '800-', '888-', '877-', '866-'
  ];

  analyzeText(text: string): RiskAssessment {
    const indicators: ScamIndicator[] = [];
    let highestSeverity: 'low' | 'medium' | 'high' | 'critical' = 'low';

    // Check each pattern category
    Object.entries(this.scamPatterns).forEach(([type, config]) => {
      const found = config.patterns.some(pattern => pattern.test(text));
      
      indicators.push({
        type,
        severity: config.severity,
        description: config.description,
        found
      });

      if (found && this.getSeverityLevel(config.severity) > this.getSeverityLevel(highestSeverity)) {
        highestSeverity = config.severity;
      }
    });

    // Additional risk factors
    const hasPhoneNumber = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/.test(text);
    const hasURL = /https?:\/\/[^\s]+/.test(text);
    const hasSuspiciousURL = /bit\.ly|tinyurl|t\.co|short\.link/.test(text);
    
    if (hasSuspiciousURL) {
      indicators.push({
        type: 'suspicious_url',
        severity: 'high',
        description: 'Contains shortened or suspicious URLs',
        found: true
      });
      if (this.getSeverityLevel('high') > this.getSeverityLevel(highestSeverity)) {
        highestSeverity = 'high';
      }
    }

    // Calculate confidence based on number of indicators
    const foundIndicators = indicators.filter(i => i.found);
    const confidence = Math.min(95, foundIndicators.length * 20 + 30);

    // Generate recommendations
    const recommendations = this.generateRecommendations(foundIndicators, highestSeverity);

    return {
      overallRisk: highestSeverity,
      confidence,
      scamIndicators: indicators,
      recommendations,
      immediateAction: highestSeverity === 'critical' || foundIndicators.length >= 3
    };
  }

  analyzePhoneCall(transcript: string, callerNumber?: string): RiskAssessment {
    const textAssessment = this.analyzeText(transcript);
    
    // Additional phone-specific checks
    if (callerNumber) {
      const isSuspiciousNumber = this.commonScamPhones.some(prefix => 
        callerNumber.startsWith(prefix)
      );
      
      if (isSuspiciousNumber) {
        textAssessment.scamIndicators.push({
          type: 'suspicious_caller',
          severity: 'medium',
          description: 'Called from commonly spoofed number',
          found: true
        });
      }
    }

    return textAssessment;
  }

  private getSeverityLevel(severity: string): number {
    const levels = { low: 1, medium: 2, high: 3, critical: 4 };
    return levels[severity as keyof typeof levels] || 0;
  }

  private generateRecommendations(indicators: ScamIndicator[], severity: string): string[] {
    const recommendations: string[] = [];

    if (severity === 'critical' || severity === 'high') {
      recommendations.push('🚨 STOP - Do not provide any information');
      recommendations.push('Hang up immediately if on a call');
      recommendations.push('Do not click any links');
    }

    if (indicators.some(i => i.found && i.type === 'sensitiveInfo')) {
      recommendations.push('Never share SSN, passwords, or financial info');
      recommendations.push('Legitimate companies won\'t ask for this via text/email');
    }

    if (indicators.some(i => i.found && i.type === 'authority')) {
      recommendations.push('Government agencies don\'t contact via text/email');
      recommendations.push('Call the official number to verify');
    }

    if (indicators.some(i => i.found && i.type === 'urgency')) {
      recommendations.push('Scammers create false urgency');
      recommendations.push('Take time to verify with trusted sources');
    }

    if (indicators.some(i => i.found && i.type === 'techSupport')) {
      recommendations.push('Never give remote access to your computer');
      recommendations.push('Tech companies don\'t cold-call customers');
    }

    // General recommendations
    recommendations.push('When in doubt, ask a trusted friend or family member');
    recommendations.push('Report suspicious activity to authorities');

    return recommendations;
  }

  // Quick assessment for emergency situations
  quickRiskCheck(text: string): 'safe' | 'suspicious' | 'dangerous' {
    const criticalPatterns = [
      /social security number/i, /ssn/i, /verify account/i,
      /suspended/i, /frozen/i, /immediate/i, /urgent/i,
      /government/i, /irs/i, /arrest/i, /lawsuit/i
    ];

    const criticalCount = criticalPatterns.filter(pattern => pattern.test(text)).length;

    if (criticalCount >= 2) return 'dangerous';
    if (criticalCount === 1) return 'suspicious';
    return 'safe';
  }
}

export const riskEngine = new RiskEngine();