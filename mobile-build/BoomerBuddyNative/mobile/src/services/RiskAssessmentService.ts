import { StorageService } from './StorageService';

export interface RiskProfile {
  overallScore: number;
  vulnerabilities: VulnerabilityArea[];
  recommendations: PersonalizedRecommendation[];
  lastAssessed: number;
  completedQuizzes: CompletedQuiz[];
  riskTrends: RiskTrend[];
}

export interface VulnerabilityArea {
  category: 'phone_scams' | 'email_phishing' | 'financial_fraud' | 'romance_scams' | 'tech_support' | 'identity_theft' | 'social_engineering';
  score: number; // 0-100, higher = more vulnerable
  level: 'low' | 'moderate' | 'high' | 'critical';
  factors: VulnerabilityFactor[];
  improvement: string[];
}

export interface VulnerabilityFactor {
  factor: string;
  weight: number;
  description: string;
  mitigation: string;
}

export interface PersonalizedRecommendation {
  id: string;
  category: string;
  priority: 'immediate' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  actionSteps: string[];
  estimatedImpact: number;
  targetVulnerability: string;
}

export interface QuizQuestion {
  id: string;
  category: string;
  question: string;
  type: 'multiple_choice' | 'yes_no' | 'scale' | 'scenario';
  options?: string[];
  scenario?: string;
  correctAnswer?: string | number;
  explanation: string;
  riskWeight: number;
}

export interface CompletedQuiz {
  id: string;
  type: 'comprehensive' | 'category_specific' | 'quick_check';
  completedAt: number;
  score: number;
  timeSpent: number;
  answers: QuizAnswer[];
  resultsSummary: string;
}

export interface QuizAnswer {
  questionId: string;
  answer: string | number;
  correct: boolean;
  timeTaken: number;
  confidence: number;
}

export interface RiskTrend {
  date: number;
  category: string;
  score: number;
  change: number;
  factors: string[];
}

export class RiskAssessmentService {
  private storageService: StorageService;

  constructor() {
    this.storageService = new StorageService();
  }

  /**
   * Generate comprehensive risk assessment quiz
   */
  async generateComprehensiveQuiz(): Promise<QuizQuestion[]> {
    const questions: QuizQuestion[] = [
      // Phone Scam Vulnerability
      {
        id: 'phone_01',
        category: 'phone_scams',
        question: 'Someone calls claiming to be from the IRS saying you owe taxes. What do you do first?',
        type: 'multiple_choice',
        options: [
          'Give them my Social Security number to verify my identity',
          'Ask for their name and hang up to call the IRS directly',
          'Pay immediately with a gift card as they requested',
          'Argue with them about not owing taxes'
        ],
        correctAnswer: 'Ask for their name and hang up to call the IRS directly',
        explanation: 'The IRS never initiates contact by phone about taxes owed. Always hang up and call official numbers directly.',
        riskWeight: 0.9
      },
      {
        id: 'phone_02',
        category: 'phone_scams',
        question: 'You receive a call saying your grandchild is in jail and needs bail money. How do you respond?',
        type: 'multiple_choice',
        options: [
          'Send money immediately to help my grandchild',
          'Ask specific questions only my grandchild would know',
          'Hang up and call my grandchild or their parents directly',
          'Ask the caller for more details about the situation'
        ],
        correctAnswer: 'Hang up and call my grandchild or their parents directly',
        explanation: 'Grandparent scams exploit emotions. Always verify by calling your family member directly at a known number.',
        riskWeight: 0.85
      },

      // Email Phishing Vulnerability
      {
        id: 'email_01',
        category: 'email_phishing',
        question: 'You receive an email saying your bank account will be closed unless you click a link to verify. What do you do?',
        type: 'multiple_choice',
        options: [
          'Click the link immediately to avoid account closure',
          'Reply with my banking information to verify',
          'Delete the email and log into my bank account separately',
          'Forward the email to friends to ask their opinion'
        ],
        correctAnswer: 'Delete the email and log into my bank account separately',
        explanation: 'Banks never ask for verification via email links. Always access your bank account through official websites or apps.',
        riskWeight: 0.88
      },
      {
        id: 'email_02',
        category: 'email_phishing',
        question: 'How can you identify a suspicious email address?',
        type: 'multiple_choice',
        options: [
          'It comes from a company I recognize',
          'It has spelling errors or uses unusual domains',
          'It includes my name in the subject line',
          'It has official-looking logos'
        ],
        correctAnswer: 'It has spelling errors or uses unusual domains',
        explanation: 'Scammers often use domains that look similar to legitimate ones but have small differences or spelling errors.',
        riskWeight: 0.7
      },

      // Financial Fraud Vulnerability
      {
        id: 'financial_01',
        category: 'financial_fraud',
        question: 'Someone offers you a "guaranteed" investment with 20% monthly returns. Your response?',
        type: 'multiple_choice',
        options: [
          'Invest immediately before the opportunity disappears',
          'Invest a small amount to test if it works',
          'Research the company and check with financial advisors',
          'Ask family members to invest too'
        ],
        correctAnswer: 'Research the company and check with financial advisors',
        explanation: 'No legitimate investment guarantees such high returns. Always research and consult professionals before investing.',
        riskWeight: 0.92
      },

      // Tech Support Scams
      {
        id: 'tech_01',
        category: 'tech_support',
        question: 'A pop-up appears saying your computer is infected and to call a number immediately. What do you do?',
        type: 'multiple_choice',
        options: [
          'Call the number to fix the virus',
          'Close the pop-up and run my regular antivirus software',
          'Give the caller remote access to fix the problem',
          'Pay for their virus removal service'
        ],
        correctAnswer: 'Close the pop-up and run my regular antivirus software',
        explanation: 'Legitimate antivirus software never displays pop-ups with phone numbers. These are always scams.',
        riskWeight: 0.8
      },

      // Romance Scams
      {
        id: 'romance_01',
        category: 'romance_scams',
        question: 'Someone you met online professes love quickly and asks for money for an emergency. What do you do?',
        type: 'multiple_choice',
        options: [
          'Send money to help someone I care about',
          'Send a smaller amount to help',
          'Refuse and suggest meeting in person first',
          'Ask them to prove their identity with a video call'
        ],
        correctAnswer: 'Refuse and suggest meeting in person first',
        explanation: 'Romance scammers avoid meeting in person and often create emergencies. Never send money to someone you haven\'t met.',
        riskWeight: 0.95
      },

      // Social Engineering
      {
        id: 'social_01',
        category: 'social_engineering',
        question: 'Someone calls claiming to be from your doctor\'s office asking for your Medicare number to "update records." Your response?',
        type: 'multiple_choice',
        options: [
          'Provide the number since it\'s my doctor\'s office',
          'Ask for their name and call my doctor\'s office directly',
          'Give them my Social Security number instead',
          'Ask them to mail me the forms'
        ],
        correctAnswer: 'Ask for their name and call my doctor\'s office directly',
        explanation: 'Medical offices typically don\'t call asking for Medicare numbers. Always verify by calling the office directly.',
        riskWeight: 0.75
      },

      // Identity Theft Awareness
      {
        id: 'identity_01',
        category: 'identity_theft',
        question: 'What information should you NEVER give over the phone to unsolicited callers?',
        type: 'multiple_choice',
        options: [
          'Your name',
          'Your Social Security number',
          'The weather in your area',
          'Your grocery store preferences'
        ],
        correctAnswer: 'Your Social Security number',
        explanation: 'Your Social Security number is the key to your identity. Never give it to unsolicited callers, regardless of who they claim to be.',
        riskWeight: 0.98
      },

      // Scenario-based Questions
      {
        id: 'scenario_01',
        category: 'social_engineering',
        question: 'You receive a call from someone claiming to be from your utility company saying your power will be shut off today unless you pay immediately with a prepaid card.',
        type: 'scenario',
        scenario: 'The caller has your account number and address. They say the office is closed but you can pay over the phone to avoid disconnection. They want you to buy a prepaid card and give them the numbers.',
        options: [
          'Pay immediately to avoid losing power',
          'Hang up and call the utility company directly',
          'Ask for a supervisor',
          'Request they mail me a bill'
        ],
        correctAnswer: 'Hang up and call the utility company directly',
        explanation: 'Utility companies don\'t demand immediate payment with prepaid cards. Even if they have your info, always verify through official channels.',
        riskWeight: 0.87
      },

      // Confidence and Urgency Assessment
      {
        id: 'urgency_01',
        category: 'social_engineering',
        question: 'How do you typically feel when someone creates urgency in a financial request?',
        type: 'scale',
        options: ['1 - Very calm and skeptical', '2 - Somewhat concerned', '3 - Moderately pressured', '4 - Very anxious', '5 - Panic and rush to act'],
        explanation: 'Feeling pressured by urgency is normal, but it\'s important to recognize this as a common scam tactic and take time to think.',
        riskWeight: 0.6
      }
    ];

    return this.shuffleQuestions(questions);
  }

  /**
   * Generate category-specific quiz
   */
  async generateCategoryQuiz(category: string): Promise<QuizQuestion[]> {
    const allQuestions = await this.generateComprehensiveQuiz();
    return allQuestions.filter(q => q.category === category);
  }

  /**
   * Generate quick vulnerability check (5 questions)
   */
  async generateQuickCheck(): Promise<QuizQuestion[]> {
    const questions = await this.generateComprehensiveQuiz();
    
    // Select high-impact questions from different categories
    const highImpactQuestions = questions
      .filter(q => q.riskWeight >= 0.8)
      .sort((a, b) => b.riskWeight - a.riskWeight)
      .slice(0, 5);

    return this.shuffleQuestions(highImpactQuestions);
  }

  /**
   * Process quiz results and generate risk profile
   */
  async processQuizResults(answers: QuizAnswer[], quizType: string): Promise<RiskProfile> {
    const allQuestions = await this.generateComprehensiveQuiz();
    const questionMap = new Map(allQuestions.map(q => [q.id, q]));

    // Calculate scores by category
    const categoryScores = new Map<string, { correct: number; total: number; weightedScore: number }>();

    answers.forEach(answer => {
      const question = questionMap.get(answer.questionId);
      if (!question) return;

      if (!categoryScores.has(question.category)) {
        categoryScores.set(question.category, { correct: 0, total: 0, weightedScore: 0 });
      }

      const categoryData = categoryScores.get(question.category)!;
      categoryData.total += 1;
      
      if (answer.correct) {
        categoryData.correct += 1;
        categoryData.weightedScore += question.riskWeight;
      } else {
        // Incorrect answers contribute to vulnerability based on question weight
        categoryData.weightedScore += (1 - question.riskWeight) * 0.5;
      }
    });

    // Generate vulnerability areas
    const vulnerabilities: VulnerabilityArea[] = [];
    
    for (const [category, scores] of categoryScores.entries()) {
      const correctPercentage = scores.correct / scores.total;
      const vulnerabilityScore = Math.round((1 - correctPercentage) * 100);
      
      vulnerabilities.push({
        category: category as VulnerabilityArea['category'],
        score: vulnerabilityScore,
        level: this.getVulnerabilityLevel(vulnerabilityScore),
        factors: this.getVulnerabilityFactors(category, vulnerabilityScore),
        improvement: this.getImprovementSuggestions(category, vulnerabilityScore)
      });
    }

    // Calculate overall risk score
    const overallScore = Math.round(
      vulnerabilities.reduce((sum, v) => sum + v.score, 0) / vulnerabilities.length
    );

    // Generate personalized recommendations
    const recommendations = this.generatePersonalizedRecommendations(vulnerabilities);

    // Create risk profile
    const riskProfile: RiskProfile = {
      overallScore,
      vulnerabilities,
      recommendations,
      lastAssessed: Date.now(),
      completedQuizzes: await this.getCompletedQuizzes(),
      riskTrends: await this.calculateRiskTrends()
    };

    // Store completed quiz
    const completedQuiz: CompletedQuiz = {
      id: `quiz_${Date.now()}`,
      type: quizType as CompletedQuiz['type'],
      completedAt: Date.now(),
      score: 100 - overallScore, // Flip score so higher = better
      timeSpent: answers.reduce((sum, a) => sum + a.timeTaken, 0),
      answers,
      resultsSummary: this.generateResultsSummary(riskProfile)
    };

    await this.storageService.storeCompletedQuiz(completedQuiz);
    await this.storageService.storeRiskProfile(riskProfile);

    return riskProfile;
  }

  /**
   * Get vulnerability level based on score
   */
  private getVulnerabilityLevel(score: number): VulnerabilityArea['level'] {
    if (score >= 75) return 'critical';
    if (score >= 50) return 'high';
    if (score >= 25) return 'moderate';
    return 'low';
  }

  /**
   * Get specific vulnerability factors for a category
   */
  private getVulnerabilityFactors(category: string, score: number): VulnerabilityFactor[] {
    const factors: { [key: string]: VulnerabilityFactor[] } = {
      phone_scams: [
        {
          factor: 'Authority Figure Trust',
          weight: 0.9,
          description: 'Tendency to trust callers claiming to be from government or official organizations',
          mitigation: 'Always hang up and call official numbers directly'
        },
        {
          factor: 'Urgency Response',
          weight: 0.8,
          description: 'Susceptibility to high-pressure tactics and urgent demands',
          mitigation: 'Take time to think and consult others before acting'
        }
      ],
      email_phishing: [
        {
          factor: 'Link Trust',
          weight: 0.85,
          description: 'Likelihood to click on suspicious links in emails',
          mitigation: 'Hover over links to check destinations before clicking'
        },
        {
          factor: 'Email Authenticity Recognition',
          weight: 0.8,
          description: 'Difficulty identifying fake emails from real organizations',
          mitigation: 'Check sender addresses carefully and look for spelling errors'
        }
      ],
      financial_fraud: [
        {
          factor: 'Investment Skepticism',
          weight: 0.95,
          description: 'Vulnerability to too-good-to-be-true investment offers',
          mitigation: 'Research all investments and consult financial advisors'
        },
        {
          factor: 'Payment Method Awareness',
          weight: 0.9,
          description: 'Knowledge of legitimate vs. suspicious payment requests',
          mitigation: 'Never pay with gift cards, wire transfers, or cryptocurrency for unexpected requests'
        }
      ],
      romance_scams: [
        {
          factor: 'Emotional Vulnerability',
          weight: 0.95,
          description: 'Susceptibility to emotional manipulation in online relationships',
          mitigation: 'Never send money to someone you haven\'t met in person'
        },
        {
          factor: 'Red Flag Recognition',
          weight: 0.8,
          description: 'Ability to identify romance scam warning signs',
          mitigation: 'Be suspicious of quick declarations of love and requests for money'
        }
      ],
      tech_support: [
        {
          factor: 'Computer Security Understanding',
          weight: 0.8,
          description: 'Knowledge of legitimate vs. fake computer security warnings',
          mitigation: 'Never call numbers from pop-up warnings'
        },
        {
          factor: 'Remote Access Caution',
          weight: 0.9,
          description: 'Awareness of risks in granting remote computer access',
          mitigation: 'Never allow unknown callers to access your computer'
        }
      ],
      identity_theft: [
        {
          factor: 'Information Sharing Caution',
          weight: 0.95,
          description: 'Understanding of what information to protect',
          mitigation: 'Never share SSN, bank details, or passwords with unsolicited contacts'
        }
      ],
      social_engineering: [
        {
          factor: 'Manipulation Recognition',
          weight: 0.85,
          description: 'Ability to recognize psychological manipulation tactics',
          mitigation: 'Learn common manipulation techniques and trust your instincts'
        }
      ]
    };

    return factors[category] || [];
  }

  /**
   * Generate improvement suggestions for a category
   */
  private getImprovementSuggestions(category: string, score: number): string[] {
    const suggestions: { [key: string]: string[] } = {
      phone_scams: [
        'Practice hanging up on suspicious callers',
        'Keep a list of official phone numbers for verification',
        'Use call screening features on your phone',
        'Never give personal information to unsolicited callers'
      ],
      email_phishing: [
        'Learn to identify suspicious email addresses',
        'Never click links in unexpected emails',
        'Type website addresses directly instead of clicking links',
        'Use email filters to block suspicious messages'
      ],
      financial_fraud: [
        'Research any investment opportunity thoroughly',
        'Consult with trusted financial advisors',
        'Be extremely skeptical of guaranteed high returns',
        'Understand legitimate payment methods vs. scam payment requests'
      ],
      romance_scams: [
        'Never send money to online romantic interests',
        'Always meet in person before developing deep relationships',
        'Be suspicious of quick declarations of love',
        'Use reverse image search to verify profile photos'
      ],
      tech_support: [
        'Learn how legitimate antivirus software behaves',
        'Never call numbers from computer pop-ups',
        'Use only trusted tech support services',
        'Understand that real companies don\'t cold-call about computer problems'
      ],
      identity_theft: [
        'Memorize what information to never share',
        'Understand how identity thieves operate',
        'Monitor your accounts regularly',
        'Use strong, unique passwords'
      ],
      social_engineering: [
        'Study common manipulation tactics',
        'Trust your instincts about suspicious requests',
        'Take time to think before responding to urgent requests',
        'Verify requests through independent channels'
      ]
    };

    const baseSuggestions = suggestions[category] || [];
    
    if (score >= 75) {
      return [...baseSuggestions, 'Consider taking a comprehensive scam awareness course'];
    } else if (score >= 50) {
      return baseSuggestions.slice(0, 3);
    } else {
      return baseSuggestions.slice(0, 2);
    }
  }

  /**
   * Generate personalized recommendations based on vulnerabilities
   */
  private generatePersonalizedRecommendations(vulnerabilities: VulnerabilityArea[]): PersonalizedRecommendation[] {
    const recommendations: PersonalizedRecommendation[] = [];

    // Sort vulnerabilities by score (highest first)
    const sortedVulnerabilities = [...vulnerabilities].sort((a, b) => b.score - a.score);

    sortedVulnerabilities.forEach((vulnerability, index) => {
      if (vulnerability.score >= 50) { // Only recommend for moderate+ vulnerabilities
        recommendations.push({
          id: `rec_${Date.now()}_${vulnerability.category}`,
          category: vulnerability.category,
          priority: vulnerability.level === 'critical' ? 'immediate' : 
                   vulnerability.level === 'high' ? 'high' : 'medium',
          title: `Improve ${vulnerability.category.replace('_', ' ')} Protection`,
          description: `Your assessment shows ${vulnerability.level} vulnerability to ${vulnerability.category.replace('_', ' ')} attacks.`,
          actionSteps: vulnerability.improvement,
          estimatedImpact: Math.round((vulnerability.score / 100) * 50), // Max 50% improvement
          targetVulnerability: vulnerability.category
        });
      }
    });

    return recommendations.slice(0, 5); // Top 5 recommendations
  }

  /**
   * Generate results summary
   */
  private generateResultsSummary(profile: RiskProfile): string {
    const level = profile.overallScore >= 75 ? 'High Risk' :
                  profile.overallScore >= 50 ? 'Moderate Risk' :
                  profile.overallScore >= 25 ? 'Low Risk' : 'Minimal Risk';

    const highestVulnerability = profile.vulnerabilities
      .sort((a, b) => b.score - a.score)[0];

    return `Overall Risk Level: ${level} (${profile.overallScore}/100). Primary concern: ${highestVulnerability.category.replace('_', ' ')}. ${profile.recommendations.length} personalized recommendations generated.`;
  }

  /**
   * Shuffle questions for randomization
   */
  private shuffleQuestions(questions: QuizQuestion[]): QuizQuestion[] {
    const shuffled = [...questions];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Get completed quizzes from storage
   */
  private async getCompletedQuizzes(): Promise<CompletedQuiz[]> {
    try {
      return await this.storageService.getCompletedQuizzes();
    } catch (error) {
      console.error('Failed to get completed quizzes:', error);
      return [];
    }
  }

  /**
   * Calculate risk trends over time
   */
  private async calculateRiskTrends(): Promise<RiskTrend[]> {
    try {
      return await this.storageService.getRiskTrends();
    } catch (error) {
      console.error('Failed to calculate risk trends:', error);
      return [];
    }
  }

  /**
   * Get current risk profile
   */
  async getCurrentRiskProfile(): Promise<RiskProfile | null> {
    try {
      return await this.storageService.getCurrentRiskProfile();
    } catch (error) {
      console.error('Failed to get current risk profile:', error);
      return null;
    }
  }

  /**
   * Schedule periodic risk assessments
   */
  async schedulePeriodicAssessment(): Promise<void> {
    // In a real app, this would set up periodic notifications
    console.log('Scheduled monthly risk assessment reminder');
  }
}