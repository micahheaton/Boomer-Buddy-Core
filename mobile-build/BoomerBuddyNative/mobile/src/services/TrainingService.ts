/**
 * Training & Personalization Service
 * Implements 30-second micro-drills with spaced repetition
 */

export interface TrainingProfile {
  riskFlags: string[];
  preferences: TrainingPreference[];
  createdAt: number;
  version: string;
}

export interface TrainingPreference {
  frequency: 'multi_daily' | 'daily' | 'weekly';
  preferredHours: number[];
  preferredDays: number[];
  audioEnabled: boolean;
  maxDrillDuration: number; // seconds
}

export interface TrainingCard {
  id: string;
  packId: string;
  type: 'mcq' | 'match_2' | 'spot_red_flag' | 'ordering' | 'audio_mcq';
  question: string;
  options?: string[];
  correctAnswer?: string | number;
  explanation: string;
  audioAsset?: string;
  snippet?: string;
  flags?: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: number; // seconds
}

export interface TrainingPack {
  packId: string;
  title: string;
  description: string;
  locale: string;
  targets: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  region: string;
  createdAt: string;
  checksum: string;
  cards: TrainingCard[];
}

export interface MicroDrill {
  id: string;
  cardId: string;
  scheduledAt: number;
  completedAt?: number;
  userAnswer?: string | number;
  correct?: boolean;
  timeTaken?: number;
  confidence?: number;
  nextReview?: number;
}

export interface SpacedRepetitionData {
  cardId: string;
  interval: number; // days
  repetition: number;
  easeFactor: number;
  nextReview: number;
  lastReview: number;
  correctStreak: number;
  totalAttempts: number;
}

export class TrainingService {
  private static instance: TrainingService;
  private profile: TrainingProfile | null = null;
  private packs: Map<string, TrainingPack> = new Map();
  private spacedRepetition: Map<string, SpacedRepetitionData> = new Map();
  private scheduledDrills: MicroDrill[] = [];

  private constructor() {
    this.initializeTraining();
  }

  static getInstance(): TrainingService {
    if (!TrainingService.instance) {
      TrainingService.instance = new TrainingService();
    }
    return TrainingService.instance;
  }

  /**
   * Initialize training service
   */
  private async initializeTraining(): Promise<void> {
    try {
      await this.loadTrainingProfile();
      await this.loadTrainingPacks();
      await this.loadSpacedRepetitionData();
      await this.scheduleUpcomingDrills();
      console.log('Training service initialized');
    } catch (error) {
      console.error('Failed to initialize training service:', error);
    }
  }

  /**
   * Import training profile from web quiz token
   */
  async importProfileFromToken(token: string): Promise<boolean> {
    try {
      console.log('Importing training profile from token...');
      
      // In a real implementation, this would:
      // 1. Verify JWT/PASETO token signature
      // 2. Extract profile data
      // 3. Validate profile structure
      
      // Simulate token decode
      const decodedProfile = this.simulateTokenDecode(token);
      
      if (!decodedProfile) {
        throw new Error('Invalid token');
      }

      this.profile = decodedProfile;
      await this.saveTrainingProfile();
      
      // Initialize spaced repetition for relevant cards
      await this.initializeSpacedRepetitionForProfile();
      
      console.log('Training profile imported successfully');
      return true;
    } catch (error) {
      console.error('Failed to import profile from token:', error);
      return false;
    }
  }

  /**
   * Import profile from 10-character code
   */
  async importProfileFromCode(code: string): Promise<boolean> {
    try {
      console.log(`Importing training profile from code: ${code}`);
      
      // In a real implementation, this would:
      // 1. Validate code format
      // 2. Fetch profile from server
      // 3. Import profile data
      
      // Simulate code validation and fetch
      if (code.length !== 10) {
        throw new Error('Invalid code format');
      }

      const profile = await this.fetchProfileByCode(code);
      if (!profile) {
        throw new Error('Profile not found');
      }

      this.profile = profile;
      await this.saveTrainingProfile();
      await this.initializeSpacedRepetitionForProfile();
      
      console.log('Training profile imported from code successfully');
      return true;
    } catch (error) {
      console.error('Failed to import profile from code:', error);
      return false;
    }
  }

  /**
   * Schedule next micro-drill
   */
  async scheduleNextDrill(): Promise<MicroDrill | null> {
    try {
      if (!this.profile) {
        console.log('No training profile available');
        return null;
      }

      // Get cards due for review
      const dueCards = this.getDueCards();
      
      if (dueCards.length === 0) {
        console.log('No cards due for review');
        return null;
      }

      // Select card based on spaced repetition algorithm
      const selectedCard = this.selectCardForReview(dueCards);
      
      const drill: MicroDrill = {
        id: `drill_${Date.now()}`,
        cardId: selectedCard.id,
        scheduledAt: Date.now()
      };

      this.scheduledDrills.push(drill);
      console.log(`Scheduled micro-drill: ${selectedCard.question.substring(0, 50)}...`);
      
      return drill;
    } catch (error) {
      console.error('Failed to schedule next drill:', error);
      return null;
    }
  }

  /**
   * Present micro-drill to user
   */
  async presentMicroDrill(drillId: string): Promise<{
    drill: MicroDrill;
    card: TrainingCard;
    pack: TrainingPack;
  } | null> {
    try {
      const drill = this.scheduledDrills.find(d => d.id === drillId);
      if (!drill) {
        throw new Error('Drill not found');
      }

      const card = this.findCardById(drill.cardId);
      if (!card) {
        throw new Error('Card not found');
      }

      const pack = this.packs.get(card.packId);
      if (!pack) {
        throw new Error('Pack not found');
      }

      console.log(`Presenting micro-drill: ${card.type} - ${card.question}`);
      
      return { drill, card, pack };
    } catch (error) {
      console.error('Failed to present micro-drill:', error);
      return null;
    }
  }

  /**
   * Submit drill answer and update spaced repetition
   */
  async submitDrillAnswer(
    drillId: string, 
    answer: string | number, 
    timeTaken: number,
    confidence: number = 1
  ): Promise<boolean> {
    try {
      const drill = this.scheduledDrills.find(d => d.id === drillId);
      if (!drill) {
        throw new Error('Drill not found');
      }

      const card = this.findCardById(drill.cardId);
      if (!card) {
        throw new Error('Card not found');
      }

      // Check if answer is correct
      const isCorrect = this.checkAnswer(card, answer);
      
      // Update drill
      drill.completedAt = Date.now();
      drill.userAnswer = answer;
      drill.correct = isCorrect;
      drill.timeTaken = timeTaken;
      drill.confidence = confidence;

      // Update spaced repetition
      await this.updateSpacedRepetition(card.id, isCorrect, confidence);

      // Schedule next review
      const srData = this.spacedRepetition.get(card.id);
      if (srData) {
        drill.nextReview = srData.nextReview;
      }

      console.log(`Drill completed: ${isCorrect ? 'Correct' : 'Incorrect'} in ${timeTaken}ms`);
      
      return true;
    } catch (error) {
      console.error('Failed to submit drill answer:', error);
      return false;
    }
  }

  /**
   * Get cards due for review
   */
  private getDueCards(): TrainingCard[] {
    const now = Date.now();
    const dueCards: TrainingCard[] = [];

    for (const [cardId, srData] of this.spacedRepetition.entries()) {
      if (srData.nextReview <= now) {
        const card = this.findCardById(cardId);
        if (card) {
          dueCards.push(card);
        }
      }
    }

    return dueCards;
  }

  /**
   * Select card for review based on spaced repetition
   */
  private selectCardForReview(dueCards: TrainingCard[]): TrainingCard {
    // Prioritize cards with lower ease factor (more difficult)
    const sortedCards = dueCards.sort((a, b) => {
      const aData = this.spacedRepetition.get(a.id);
      const bData = this.spacedRepetition.get(b.id);
      
      if (!aData || !bData) return 0;
      
      return aData.easeFactor - bData.easeFactor;
    });

    return sortedCards[0];
  }

  /**
   * Check if answer is correct
   */
  private checkAnswer(card: TrainingCard, answer: string | number): boolean {
    switch (card.type) {
      case 'mcq':
      case 'audio_mcq':
        return answer === card.correctAnswer;
      case 'match_2':
        // For match questions, would need more complex logic
        return true; // Simplified
      case 'spot_red_flag':
        // For red flag questions, check if spotted correctly
        return Array.isArray(answer) && answer.length > 0;
      case 'ordering':
        // For ordering questions, check sequence
        return Array.isArray(answer);
      default:
        return false;
    }
  }

  /**
   * Update spaced repetition data using SM-2 algorithm
   */
  private async updateSpacedRepetition(
    cardId: string, 
    correct: boolean, 
    confidence: number
  ): Promise<void> {
    let srData = this.spacedRepetition.get(cardId);
    
    if (!srData) {
      srData = {
        cardId,
        interval: 1,
        repetition: 0,
        easeFactor: 2.5,
        nextReview: Date.now(),
        lastReview: Date.now(),
        correctStreak: 0,
        totalAttempts: 0
      };
    }

    srData.totalAttempts++;
    srData.lastReview = Date.now();

    if (correct) {
      srData.correctStreak++;
      srData.repetition++;

      // SM-2 algorithm
      if (srData.repetition === 1) {
        srData.interval = 1;
      } else if (srData.repetition === 2) {
        srData.interval = 6;
      } else {
        srData.interval = Math.round(srData.interval * srData.easeFactor);
      }

      // Adjust ease factor based on confidence
      const quality = Math.max(0, Math.min(5, Math.round(confidence * 5)));
      srData.easeFactor = srData.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
      srData.easeFactor = Math.max(1.3, srData.easeFactor);
    } else {
      srData.correctStreak = 0;
      srData.repetition = 0;
      srData.interval = 1;
    }

    // Calculate next review time
    srData.nextReview = Date.now() + (srData.interval * 24 * 60 * 60 * 1000);

    this.spacedRepetition.set(cardId, srData);
    await this.saveSpacedRepetitionData();
  }

  /**
   * Load default training packs
   */
  private async loadTrainingPacks(): Promise<void> {
    try {
      // Load SMS Essentials pack
      const smsEssentials = this.createSMSEssentialsPack();
      this.packs.set(smsEssentials.packId, smsEssentials);

      // Load Gift Card Basics pack
      const giftCardBasics = this.createGiftCardBasicsPack();
      this.packs.set(giftCardBasics.packId, giftCardBasics);

      // Load Medicare pack
      const medicare = this.createMedicarePack();
      this.packs.set(medicare.packId, medicare);

      console.log(`Loaded ${this.packs.size} training packs`);
    } catch (error) {
      console.error('Failed to load training packs:', error);
    }
  }

  /**
   * Create SMS Essentials training pack
   */
  private createSMSEssentialsPack(): TrainingPack {
    return {
      packId: 'sms_essentials_v1',
      title: 'SMS Essentials',
      description: 'Learn to identify and avoid SMS scams',
      locale: 'en-US',
      targets: ['sms'],
      difficulty: 'easy',
      region: 'US',
      createdAt: '2025-08-01',
      checksum: 'sha256:sms_essentials_checksum',
      cards: [
        {
          id: 'sms_001',
          packId: 'sms_essentials_v1',
          type: 'mcq',
          question: 'You receive this text: "URGENT: Your bank account will be closed. Click here to verify." What should you do?',
          options: [
            'Click the link immediately',
            'Delete the message and contact your bank directly',
            'Reply with your account information',
            'Forward it to friends for advice'
          ],
          correctAnswer: 'Delete the message and contact your bank directly',
          explanation: 'Banks never ask for verification via text links. Always contact your bank directly using official phone numbers.',
          difficulty: 'easy',
          estimatedTime: 30
        },
        {
          id: 'sms_002',
          packId: 'sms_essentials_v1',
          type: 'spot_red_flag',
          question: 'Spot the red flags in this message: "Congratulations! You\'ve won $1000. Send $50 processing fee to claim."',
          explanation: 'Red flags: Unexpected prize, upfront fee required, urgency tactics. Legitimate prizes never require fees.',
          difficulty: 'easy',
          estimatedTime: 25
        },
        {
          id: 'sms_003',
          packId: 'sms_essentials_v1',
          type: 'mcq',
          question: 'A text claims to be from Amazon saying your order is delayed. How can you verify?',
          options: [
            'Click the tracking link in the text',
            'Check your Amazon account directly',
            'Call the number in the text',
            'Reply asking for more details'
          ],
          correctAnswer: 'Check your Amazon account directly',
          explanation: 'Always verify suspicious messages by logging into your account directly, not through links in messages.',
          difficulty: 'easy',
          estimatedTime: 30
        }
      ]
    };
  }

  /**
   * Create Gift Card Basics training pack
   */
  private createGiftCardBasicsPack(): TrainingPack {
    return {
      packId: 'giftcard_basics_v1',
      title: 'Gift Card Basics',
      description: 'Understand gift card scam tactics',
      locale: 'en-US',
      targets: ['calls', 'sms'],
      difficulty: 'easy',
      region: 'US',
      createdAt: '2025-08-01',
      checksum: 'sha256:giftcard_basics_checksum',
      cards: [
        {
          id: 'gc_001',
          packId: 'giftcard_basics_v1',
          type: 'mcq',
          question: 'The IRS calls asking for back taxes paid with iTunes gift cards. This is:',
          options: [
            'Normal - the IRS accepts gift cards',
            'A scam - the IRS never accepts gift cards',
            'Suspicious but might be real',
            'A new payment method'
          ],
          correctAnswer: 'A scam - the IRS never accepts gift cards',
          explanation: 'Government agencies NEVER accept gift cards as payment. This is always a scam.',
          difficulty: 'easy',
          estimatedTime: 25
        },
        {
          id: 'gc_002',
          packId: 'giftcard_basics_v1',
          type: 'audio_mcq',
          question: 'Listen to this voicemail and identify the scam tactic:',
          audioAsset: 'audio_gc_002.mp3',
          options: [
            'Urgency and fear tactics',
            'Legitimate government contact',
            'Normal business practice',
            'Helpful customer service'
          ],
          correctAnswer: 'Urgency and fear tactics',
          explanation: 'Scammers use urgency and threats to pressure victims into making quick decisions.',
          difficulty: 'medium',
          estimatedTime: 45
        }
      ]
    };
  }

  /**
   * Create Medicare training pack
   */
  private createMedicarePack(): TrainingPack {
    return {
      packId: 'medicare_v1',
      title: 'Medicare Protection',
      description: 'Protect yourself from Medicare scams',
      locale: 'en-US',
      targets: ['calls', 'letters'],
      difficulty: 'medium',
      region: 'US',
      createdAt: '2025-08-01',
      checksum: 'sha256:medicare_checksum',
      cards: [
        {
          id: 'med_001',
          packId: 'medicare_v1',
          type: 'mcq',
          question: 'Someone calls offering "free" Medicare equipment. They ask for your Medicare number to "verify eligibility." You should:',
          options: [
            'Give them your Medicare number',
            'Hang up and call Medicare directly',
            'Ask for their Medicare provider number first',
            'Schedule an in-person meeting'
          ],
          correctAnswer: 'Hang up and call Medicare directly',
          explanation: 'Never give your Medicare number to unsolicited callers. Verify all Medicare communications directly.',
          difficulty: 'medium',
          estimatedTime: 35
        }
      ]
    };
  }

  /**
   * Schedule upcoming drills based on user preferences
   */
  private async scheduleUpcomingDrills(): Promise<void> {
    if (!this.profile) return;

    const preferences = this.profile.preferences[0];
    if (!preferences) return;

    // Schedule based on frequency and preferred times
    const now = new Date();
    const scheduleTimes: Date[] = [];

    preferences.preferredHours.forEach(hour => {
      const scheduleTime = new Date(now);
      scheduleTime.setHours(hour, 0, 0, 0);
      
      if (scheduleTime > now) {
        scheduleTimes.push(scheduleTime);
      }
    });

    console.log(`Scheduled ${scheduleTimes.length} upcoming drill times`);
  }

  /**
   * Simulate token decode (JWT/PASETO)
   */
  private simulateTokenDecode(token: string): TrainingProfile | null {
    try {
      // In a real implementation, this would verify and decode the token
      return {
        riskFlags: ['phone_scams', 'email_phishing'],
        preferences: [{
          frequency: 'daily',
          preferredHours: [10, 14, 18],
          preferredDays: [1, 2, 3, 4, 5], // Weekdays
          audioEnabled: true,
          maxDrillDuration: 30
        }],
        createdAt: Date.now(),
        version: '1.0.0'
      };
    } catch (error) {
      console.error('Failed to decode token:', error);
      return null;
    }
  }

  /**
   * Fetch profile by code
   */
  private async fetchProfileByCode(code: string): Promise<TrainingProfile | null> {
    // In a real implementation, this would fetch from server
    console.log(`Fetching profile for code: ${code}`);
    
    // Simulate successful fetch
    return {
      riskFlags: ['gift_card_scams', 'government_impersonation'],
      preferences: [{
        frequency: 'daily',
        preferredHours: [9, 15],
        preferredDays: [1, 2, 3, 4, 5, 6, 7], // All days
        audioEnabled: false,
        maxDrillDuration: 25
      }],
      createdAt: Date.now(),
      version: '1.0.0'
    };
  }

  /**
   * Initialize spaced repetition for profile-relevant cards
   */
  private async initializeSpacedRepetitionForProfile(): Promise<void> {
    if (!this.profile) return;

    const relevantCards = this.getCardsForRiskFlags(this.profile.riskFlags);
    
    relevantCards.forEach(card => {
      if (!this.spacedRepetition.has(card.id)) {
        this.spacedRepetition.set(card.id, {
          cardId: card.id,
          interval: 1,
          repetition: 0,
          easeFactor: 2.5,
          nextReview: Date.now(),
          lastReview: 0,
          correctStreak: 0,
          totalAttempts: 0
        });
      }
    });

    await this.saveSpacedRepetitionData();
  }

  /**
   * Get cards relevant to risk flags
   */
  private getCardsForRiskFlags(riskFlags: string[]): TrainingCard[] {
    const relevantCards: TrainingCard[] = [];

    for (const pack of this.packs.values()) {
      pack.cards.forEach(card => {
        if (card.flags && card.flags.some(flag => riskFlags.includes(flag))) {
          relevantCards.push(card);
        } else if (riskFlags.some(flag => pack.targets.includes(flag))) {
          relevantCards.push(card);
        }
      });
    }

    return relevantCards;
  }

  /**
   * Find card by ID
   */
  private findCardById(cardId: string): TrainingCard | null {
    for (const pack of this.packs.values()) {
      const card = pack.cards.find(c => c.id === cardId);
      if (card) return card;
    }
    return null;
  }

  /**
   * Load training profile from storage
   */
  private async loadTrainingProfile(): Promise<void> {
    try {
      // In a real implementation, would load from encrypted storage
      this.profile = null; // No profile by default
    } catch (error) {
      console.error('Failed to load training profile:', error);
    }
  }

  /**
   * Save training profile to storage
   */
  private async saveTrainingProfile(): Promise<void> {
    try {
      // In a real implementation, would save to encrypted storage
      console.log('Training profile saved');
    } catch (error) {
      console.error('Failed to save training profile:', error);
    }
  }

  /**
   * Load spaced repetition data
   */
  private async loadSpacedRepetitionData(): Promise<void> {
    try {
      // In a real implementation, would load from storage
      console.log('Spaced repetition data loaded');
    } catch (error) {
      console.error('Failed to load spaced repetition data:', error);
    }
  }

  /**
   * Save spaced repetition data
   */
  private async saveSpacedRepetitionData(): Promise<void> {
    try {
      // In a real implementation, would save to storage
      console.log('Spaced repetition data saved');
    } catch (error) {
      console.error('Failed to save spaced repetition data:', error);
    }
  }

  /**
   * Get training statistics
   */
  getTrainingStats(): {
    cardsLearned: number;
    correctAnswers: number;
    totalAttempts: number;
    averageConfidence: number;
    streakDays: number;
  } {
    let totalCorrect = 0;
    let totalAttempts = 0;
    let totalConfidence = 0;

    for (const srData of this.spacedRepetition.values()) {
      totalAttempts += srData.totalAttempts;
      totalCorrect += srData.correctStreak;
    }

    return {
      cardsLearned: this.spacedRepetition.size,
      correctAnswers: totalCorrect,
      totalAttempts,
      averageConfidence: totalAttempts > 0 ? totalConfidence / totalAttempts : 0,
      streakDays: 0 // Would calculate based on daily completion
    };
  }

  /**
   * Get current training profile
   */
  getCurrentProfile(): TrainingProfile | null {
    return this.profile;
  }

  /**
   * Get available training packs
   */
  getAvailablePacks(): TrainingPack[] {
    return Array.from(this.packs.values());
  }
}