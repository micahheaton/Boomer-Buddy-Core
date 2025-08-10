import { PiiScrubber } from './PiiScrubber';
import { RiskEngine } from './RiskEngine';
import { StorageService } from './StorageService';

export interface ThreatVisualizationData {
  level: 'safe' | 'warning' | 'danger';
  score: number;
  threats: string[];
  timestamp: number;
  confidence: number;
  analysisSteps: AnalysisStep[];
}

export interface AnalysisStep {
  step: string;
  status: 'pending' | 'processing' | 'complete';
  result?: string;
  timestamp: number;
}

export interface GamificationUpdate {
  xpGained: number;
  levelUp: boolean;
  newBadges: string[];
  streakMaintained: boolean;
  challengeCompleted?: string;
}

export interface PersonalizedTip {
  id: string;
  category: 'phone' | 'email' | 'financial' | 'romance' | 'general' | 'online';
  title: string;
  content: string;
  actionable: string;
  priority: 'high' | 'medium' | 'low';
  personalizedReason: string;
}

export class AdvancedAnalysisEngine {
  private piiScrubber: PiiScrubber;
  private riskEngine: RiskEngine;
  private storageService: StorageService;

  constructor() {
    this.piiScrubber = new PiiScrubber();
    this.riskEngine = new RiskEngine();
    this.storageService = new StorageService();
  }

  /**
   * Comprehensive analysis with real-time visualization updates
   */
  async analyzeWithVisualization(
    content: string,
    type: 'text' | 'call' | 'email',
    onStepUpdate: (step: AnalysisStep) => void,
    onVisualizationUpdate: (data: ThreatVisualizationData) => void
  ): Promise<{
    analysis: any;
    gamification: GamificationUpdate;
    personalizedTips: PersonalizedTip[];
  }> {
    const analysisId = `analysis_${Date.now()}`;
    
    // Step 1: Content sanitization
    const step1: AnalysisStep = {
      step: 'Sanitizing content',
      status: 'processing',
      timestamp: Date.now()
    };
    onStepUpdate(step1);
    
    const scrubbed = await this.piiScrubber.scrubContent(content);
    
    step1.status = 'complete';
    step1.result = 'Personal information protected';
    onStepUpdate(step1);

    // Step 2: Feature extraction
    const step2: AnalysisStep = {
      step: 'Extracting threat patterns',
      status: 'processing',
      timestamp: Date.now()
    };
    onStepUpdate(step2);

    const features = await this.extractAdvancedFeatures(scrubbed, type);
    
    step2.status = 'complete';
    step2.result = `${features.length} patterns identified`;
    onStepUpdate(step2);

    // Step 3: Multi-layer risk assessment
    const step3: AnalysisStep = {
      step: 'Multi-layer risk assessment',
      status: 'processing',
      timestamp: Date.now()
    };
    onStepUpdate(step3);

    const riskAssessment = await this.riskEngine.assessRisk(features);
    
    // Update visualization during processing
    const initialVisualization: ThreatVisualizationData = {
      level: 'warning',
      score: 50,
      threats: ['Analysis in progress...'],
      timestamp: Date.now(),
      confidence: 0.3,
      analysisSteps: [step1, step2, step3]
    };
    onVisualizationUpdate(initialVisualization);

    step3.status = 'complete';
    step3.result = `Risk level: ${riskAssessment.level}`;
    onStepUpdate(step3);

    // Step 4: Server validation (if connected)
    const step4: AnalysisStep = {
      step: 'Government data validation',
      status: 'processing',
      timestamp: Date.now()
    };
    onStepUpdate(step4);

    const serverValidation = await this.validateWithServer(features);
    
    step4.status = 'complete';
    step4.result = serverValidation ? 'Validated against latest threats' : 'Using offline protection';
    onStepUpdate(step4);

    // Final analysis result
    const finalAnalysis = {
      ...riskAssessment,
      serverValidated: !!serverValidation,
      analysisId,
      timestamp: Date.now()
    };

    // Final visualization
    const finalVisualization: ThreatVisualizationData = {
      level: finalAnalysis.level,
      score: finalAnalysis.safetyScore,
      threats: finalAnalysis.threats || [],
      timestamp: Date.now(),
      confidence: finalAnalysis.confidence,
      analysisSteps: [step1, step2, step3, step4]
    };
    onVisualizationUpdate(finalVisualization);

    // Calculate gamification updates
    const gamification = await this.calculateGamificationUpdate(finalAnalysis, type);

    // Generate personalized tips
    const personalizedTips = await this.generatePersonalizedTips(finalAnalysis);

    // Store analysis for learning
    await this.storageService.storeAnalysis({
      id: analysisId,
      type,
      result: finalAnalysis,
      gamification,
      timestamp: Date.now()
    });

    return {
      analysis: finalAnalysis,
      gamification,
      personalizedTips
    };
  }

  /**
   * Extract advanced threat patterns and features
   */
  private async extractAdvancedFeatures(content: string, type: string): Promise<number[]> {
    const features: number[] = [];

    // Urgency indicators
    const urgencyWords = ['urgent', 'immediate', 'expires', 'deadline', 'now', 'today'];
    const urgencyScore = urgencyWords.reduce((score, word) => 
      score + (content.toLowerCase().includes(word) ? 1 : 0), 0) / urgencyWords.length;
    features.push(urgencyScore);

    // Authority impersonation
    const authorities = ['irs', 'social security', 'medicare', 'fbi', 'microsoft', 'apple', 'amazon'];
    const authorityScore = authorities.reduce((score, auth) => 
      score + (content.toLowerCase().includes(auth) ? 1 : 0), 0) / authorities.length;
    features.push(authorityScore);

    // Payment method red flags
    const suspiciousPayments = ['gift card', 'wire transfer', 'bitcoin', 'cryptocurrency', 'prepaid card'];
    const paymentScore = suspiciousPayments.reduce((score, payment) => 
      score + (content.toLowerCase().includes(payment) ? 1 : 0), 0) / suspiciousPayments.length;
    features.push(paymentScore);

    // Emotional manipulation
    const emotionalWords = ['love', 'emergency', 'help', 'crisis', 'family', 'grandchild'];
    const emotionalScore = emotionalWords.reduce((score, word) => 
      score + (content.toLowerCase().includes(word) ? 1 : 0), 0) / emotionalWords.length;
    features.push(emotionalScore);

    // Grammar and spelling anomalies
    const grammarScore = this.calculateGrammarScore(content);
    features.push(grammarScore);

    // Type-specific features
    switch (type) {
      case 'call':
        features.push(this.analyzeCallPatterns(content));
        break;
      case 'email':
        features.push(this.analyzeEmailPatterns(content));
        break;
      case 'text':
        features.push(this.analyzeTextPatterns(content));
        break;
    }

    return features;
  }

  private calculateGrammarScore(content: string): number {
    // Simple grammar scoring - in production would use NLP
    const sentences = content.split(/[.!?]+/);
    let issues = 0;
    let totalSentences = sentences.length;

    sentences.forEach(sentence => {
      const words = sentence.trim().split(/\s+/);
      if (words.length > 0) {
        // Check for basic capitalization
        if (words[0] && words[0][0] !== words[0][0].toUpperCase()) {
          issues++;
        }
        // Check for excessive capitals
        const capsWords = words.filter(word => word === word.toUpperCase() && word.length > 1);
        if (capsWords.length / words.length > 0.3) {
          issues++;
        }
      }
    });

    return totalSentences > 0 ? issues / totalSentences : 0;
  }

  private analyzeCallPatterns(content: string): number {
    let suspicionScore = 0;
    
    // Background noise inconsistencies
    if (content.includes('background') || content.includes('noise')) {
      suspicionScore += 0.3;
    }
    
    // Pressure tactics
    const pressureWords = ['must', 'have to', 'required', 'mandatory'];
    const pressureCount = pressureWords.reduce((count, word) => 
      count + (content.toLowerCase().includes(word) ? 1 : 0), 0);
    suspicionScore += Math.min(pressureCount * 0.2, 0.5);

    return Math.min(suspicionScore, 1.0);
  }

  private analyzeEmailPatterns(content: string): number {
    let suspicionScore = 0;
    
    // Generic greetings
    if (content.includes('Dear Customer') || content.includes('Dear User')) {
      suspicionScore += 0.4;
    }
    
    // Link analysis patterns
    if (content.includes('click here') || content.includes('verify now')) {
      suspicionScore += 0.3;
    }

    return Math.min(suspicionScore, 1.0);
  }

  private analyzeTextPatterns(content: string): number {
    let suspicionScore = 0;
    
    // Short, urgent messages
    if (content.length < 50 && (content.includes('!') || content.includes('urgent'))) {
      suspicionScore += 0.5;
    }
    
    // Prize/money notifications
    if (content.includes('won') || content.includes('$') || content.includes('prize')) {
      suspicionScore += 0.4;
    }

    return Math.min(suspicionScore, 1.0);
  }

  /**
   * Validate against server threat database
   */
  private async validateWithServer(features: number[]): Promise<boolean> {
    try {
      const response = await fetch('/api/mobile/v1/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ features })
      });
      
      if (response.ok) {
        const result = await response.json();
        return result.success;
      }
    } catch (error) {
      console.log('Server validation unavailable, using offline protection');
    }
    
    return false;
  }

  /**
   * Calculate gamification rewards based on analysis
   */
  private async calculateGamificationUpdate(analysis: any, type: string): Promise<GamificationUpdate> {
    const currentProgress = await this.storageService.getUserProgress();
    
    let xpGained = 0;
    const newBadges: string[] = [];
    
    // Base XP for analysis
    xpGained += 10;
    
    // Bonus XP for identifying threats
    if (analysis.level === 'danger') {
      xpGained += 25;
    } else if (analysis.level === 'warning') {
      xpGained += 15;
    }
    
    // Type-specific bonuses
    switch (type) {
      case 'call':
        xpGained += 5;
        break;
      case 'email':
        xpGained += 3;
        break;
    }
    
    // Check for new badges
    const totalAnalyses = currentProgress.totalAnalyses + 1;
    if (totalAnalyses === 1) newBadges.push('First Analysis');
    if (totalAnalyses === 10) newBadges.push('Detection Novice');
    if (totalAnalyses === 50) newBadges.push('Scam Spotter');
    if (totalAnalyses === 100) newBadges.push('Protection Expert');
    
    // Level up check
    const newXP = currentProgress.xp + xpGained;
    const currentLevel = Math.floor(currentProgress.xp / 100);
    const newLevel = Math.floor(newXP / 100);
    const levelUp = newLevel > currentLevel;
    
    // Streak maintenance
    const streakMaintained = this.checkStreakMaintenance(currentProgress);
    
    return {
      xpGained,
      levelUp,
      newBadges,
      streakMaintained,
      challengeCompleted: this.checkChallengeCompletion(analysis, currentProgress)
    };
  }

  private checkStreakMaintenance(progress: any): boolean {
    const lastActivity = progress.lastActivity || 0;
    const now = Date.now();
    const daysSinceLastActivity = (now - lastActivity) / (24 * 60 * 60 * 1000);
    
    return daysSinceLastActivity <= 1.5; // Allow some grace period
  }

  private checkChallengeCompletion(analysis: any, progress: any): string | undefined {
    // Check daily challenges
    const activeChallenges = progress.activeChallenges || [];
    
    for (const challenge of activeChallenges) {
      if (challenge.type === 'identify_threats' && analysis.level === 'danger') {
        challenge.progress++;
        if (challenge.progress >= challenge.target) {
          return challenge.name;
        }
      }
    }
    
    return undefined;
  }

  /**
   * Generate personalized safety tips based on analysis patterns
   */
  private async generatePersonalizedTips(analysis: any): Promise<PersonalizedTip[]> {
    const userHistory = await this.storageService.getUserAnalysisHistory();
    const vulnerabilityPattern = this.analyzeVulnerabilityPattern(userHistory, analysis);
    
    const tips: PersonalizedTip[] = [];
    
    // Generate tips based on detected vulnerabilities
    if (vulnerabilityPattern.phoneScams) {
      tips.push({
        id: 'phone_tip_1',
        category: 'phone',
        title: 'Caller ID Verification',
        content: 'You\'ve encountered phone-based threats. Remember: legitimate organizations will let you hang up and call them back using their official number.',
        actionable: 'Always verify caller identity by hanging up and calling the official number yourself.',
        priority: 'high',
        personalizedReason: 'Based on your recent phone scam encounters'
      });
    }
    
    if (vulnerabilityPattern.emailThreats) {
      tips.push({
        id: 'email_tip_1',
        category: 'email',
        title: 'Link Safety Check',
        content: 'Your email analysis shows link-based risks. Hover over links to see the real destination before clicking.',
        actionable: 'Type website addresses directly instead of clicking suspicious links.',
        priority: 'high',
        personalizedReason: 'You\'ve analyzed several suspicious emails recently'
      });
    }
    
    if (vulnerabilityPattern.urgencyPressure) {
      tips.push({
        id: 'general_tip_1',
        category: 'general',
        title: 'Urgency Red Flag',
        content: 'Scammers create fake urgency to prevent you from thinking clearly. Legitimate issues rarely require immediate action.',
        actionable: 'Take time to think and verify before responding to urgent requests.',
        priority: 'medium',
        personalizedReason: 'You\'ve encountered multiple urgency-based scam tactics'
      });
    }
    
    return tips.slice(0, 3); // Return top 3 most relevant tips
  }

  private analyzeVulnerabilityPattern(history: any[], currentAnalysis: any): any {
    const recentAnalyses = history.slice(-10); // Last 10 analyses
    
    return {
      phoneScams: recentAnalyses.filter(a => a.type === 'call' && a.result.level !== 'safe').length >= 2,
      emailThreats: recentAnalyses.filter(a => a.type === 'email' && a.result.level !== 'safe').length >= 2,
      urgencyPressure: recentAnalyses.filter(a => a.result.threats?.some((t: string) => 
        t.toLowerCase().includes('urgent') || t.toLowerCase().includes('immediate')
      )).length >= 3
    };
  }
}