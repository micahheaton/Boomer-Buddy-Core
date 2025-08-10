import { db } from './db';
import { users, vulnerabilityProfiles } from '../shared/schema';
import { eq, and, gte } from 'drizzle-orm';
import { mobileNotificationService } from './mobileNotificationService';

interface VulnerabilityProfile {
  id: string;
  userId: string;
  primaryVulnerabilities: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  lastAssessment: Date;
  preferredContacts: string[];
  reminderFrequency: 'weekly' | 'biweekly' | 'monthly';
}

interface PersonalizedReminder {
  type: 'vulnerability_check' | 'scam_awareness' | 'contact_reminder' | 'mini_game';
  title: string;
  message: string;
  actionRequired: boolean;
  urgency: 'low' | 'medium' | 'high';
  customData?: any;
}

// Weekly mini-games and questionnaires by vulnerability type
const MINI_GAMES_BY_VULNERABILITY = {
  'tech-support': {
    title: 'Tech Support Reality Check',
    questions: [
      {
        question: 'A caller says Microsoft detected viruses on your computer. What do you do?',
        options: ['Let them help fix it', 'Hang up immediately', 'Ask for their badge number', 'Give them remote access'],
        correct: 1,
        explanation: 'Microsoft never calls customers about computer problems. This is always a scam.'
      },
      {
        question: 'Real tech support will:',
        options: ['Ask for passwords over phone', 'Demand immediate payment', 'Never call you unsolicited', 'Require remote access'],
        correct: 2,
        explanation: 'Legitimate tech companies do not make unsolicited calls about computer problems.'
      }
    ]
  },
  'social-security': {
    title: 'Social Security Safety Quiz',
    questions: [
      {
        question: 'The Social Security Administration calls to say your benefits are suspended. You should:',
        options: ['Provide your SSN to verify', 'Pay the fee they request', 'Hang up and call SSA directly', 'Give them your bank info'],
        correct: 2,
        explanation: 'SSA will never call to threaten suspension. Always hang up and call the official number: 1-800-772-1213.'
      },
      {
        question: 'Your Social Security number can be suspended:',
        options: ['For suspicious activity', 'For unpaid taxes', 'Never - this is impossible', 'If you don\'t verify it'],
        correct: 2,
        explanation: 'Social Security numbers cannot be suspended, blocked, or frozen. This claim is always a scam.'
      }
    ]
  },
  'romance': {
    title: 'Online Romance Red Flags',
    questions: [
      {
        question: 'Someone you met online asks for money for an emergency. You should:',
        options: ['Send money to help', 'Ask for proof first', 'Never send money to online contacts', 'Send a small amount'],
        correct: 2,
        explanation: 'Never send money, gifts, or personal information to someone you have not met in person.'
      },
      {
        question: 'Red flags in online relationships include:',
        options: ['Asking to meet quickly', 'Sharing many photos', 'Professing love very quickly', 'Living nearby'],
        correct: 2,
        explanation: 'Scammers often profess love quickly to create emotional attachment before asking for money.'
      }
    ]
  },
  'investment': {
    title: 'Investment Scam Spotter',
    questions: [
      {
        question: 'An investment opportunity promises "guaranteed" returns of 20% monthly. This is:',
        options: ['A great opportunity', 'Too good to be true - likely a scam', 'Worth investigating', 'Normal for crypto'],
        correct: 1,
        explanation: 'No legitimate investment can guarantee high returns. This is a classic Ponzi scheme red flag.'
      },
      {
        question: 'Before investing, you should always:',
        options: ['Act quickly before the offer expires', 'Research the company and verify licenses', 'Trust celebrity endorsements', 'Invest a small amount first'],
        correct: 1,
        explanation: 'Always verify investment advisors are licensed through FINRA BrokerCheck or SEC databases.'
      }
    ]
  }
};

export class PersonalizedNotificationService {
  
  // Send personalized notifications based on user vulnerability profile
  async sendPersonalizedAlert(userId: string, scamType: string, alertData: any): Promise<void> {
    const profile = await this.getUserVulnerabilityProfile(userId);
    if (!profile) return;

    // Check if this scam type matches user's vulnerabilities
    const isRelevant = profile.primaryVulnerabilities.some(vuln => 
      scamType.toLowerCase().includes(vuln.toLowerCase()) ||
      vuln.toLowerCase().includes(scamType.toLowerCase())
    );

    if (isRelevant) {
      const personalizedMessage = this.createPersonalizedMessage(scamType, alertData, profile);
      
      await mobileNotificationService.sendNotification(userId, {
        title: `🚨 ${scamType.toUpperCase()} Alert - High Risk for You`,
        body: personalizedMessage.message,
        data: {
          type: 'personalized_scam_alert',
          scamType,
          riskLevel: profile.riskLevel,
          customAction: personalizedMessage.actionRequired,
          contacts: profile.preferredContacts
        }
      });

      // Log the personalized alert
      console.log(`Sent personalized ${scamType} alert to user ${userId} (risk: ${profile.riskLevel})`);
    }
  }

  // Send weekly mini-game/questionnaire
  async sendWeeklyMiniGame(userId: string): Promise<void> {
    const profile = await this.getUserVulnerabilityProfile(userId);
    if (!profile || profile.primaryVulnerabilities.length === 0) return;

    // Select mini-game based on primary vulnerability
    const primaryVuln = profile.primaryVulnerabilities[0];
    const miniGame = MINI_GAMES_BY_VULNERABILITY[primaryVuln as keyof typeof MINI_GAMES_BY_VULNERABILITY];
    
    if (!miniGame) return;

    await mobileNotificationService.sendNotification(userId, {
      title: '🎯 Weekly Scam Prevention Challenge',
      body: `Time for your ${miniGame.title}! Stay sharp and stay safe.`,
      data: {
        type: 'mini_game',
        gameData: miniGame,
        vulnerabilityType: primaryVuln,
        contacts: profile.preferredContacts
      }
    });

    console.log(`Sent weekly mini-game to user ${userId}: ${miniGame.title}`);
  }

  // Send reminders based on assessment results
  async sendVulnerabilityReminders(): Promise<void> {
    const profiles = await this.getAllActiveProfiles();
    
    for (const profile of profiles) {
      const daysSinceAssessment = Math.floor(
        (Date.now() - profile.lastAssessment.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Send reminder based on frequency preference and risk level
      let shouldSendReminder = false;
      
      switch (profile.reminderFrequency) {
        case 'weekly':
          shouldSendReminder = daysSinceAssessment >= 7;
          break;
        case 'biweekly':
          shouldSendReminder = daysSinceAssessment >= 14;
          break;
        case 'monthly':
          shouldSendReminder = daysSinceAssessment >= 30;
          break;
      }

      // High risk users get more frequent reminders
      if (profile.riskLevel === 'high' || profile.riskLevel === 'critical') {
        shouldSendReminder = shouldSendReminder || daysSinceAssessment >= 5;
      }

      if (shouldSendReminder) {
        await this.sendReminderNotification(profile);
      }
    }
  }

  private async sendReminderNotification(profile: VulnerabilityProfile): Promise<void> {
    const reminder = this.createVulnerabilityReminder(profile);
    
    await mobileNotificationService.sendNotification(profile.userId, {
      title: reminder.title,
      body: reminder.message,
      data: {
        type: reminder.type,
        urgency: reminder.urgency,
        vulnerabilities: profile.primaryVulnerabilities,
        contacts: profile.preferredContacts,
        riskLevel: profile.riskLevel
      }
    });
  }

  private createVulnerabilityReminder(profile: VulnerabilityProfile): PersonalizedReminder {
    const vulnTypes = profile.primaryVulnerabilities.join(', ');
    
    return {
      type: 'vulnerability_check',
      title: '🛡️ Scam Prevention Check-In',
      message: `Stay vigilant against ${vulnTypes} scams. Review your safety plan and remember to verify before you trust.`,
      actionRequired: true,
      urgency: profile.riskLevel === 'critical' ? 'high' : 'medium',
      customData: {
        recommendedActions: this.getRecommendedActions(profile.primaryVulnerabilities),
        emergencyContacts: profile.preferredContacts
      }
    };
  }

  private getRecommendedActions(vulnerabilities: string[]): string[] {
    const actions: string[] = [];
    
    if (vulnerabilities.includes('tech-support')) {
      actions.push('Never give remote access to strangers');
      actions.push('Microsoft/Apple will never call you about viruses');
    }
    
    if (vulnerabilities.includes('social-security')) {
      actions.push('SSA will never threaten to suspend your number');
      actions.push('Call 1-800-772-1213 for real SSA concerns');
    }
    
    if (vulnerabilities.includes('romance')) {
      actions.push('Never send money to someone you haven\'t met');
      actions.push('Video chat before trusting online relationships');
    }
    
    if (vulnerabilities.includes('investment')) {
      actions.push('Verify advisors through FINRA BrokerCheck');
      actions.push('Be skeptical of guaranteed high returns');
    }

    return actions;
  }

  private createPersonalizedMessage(scamType: string, alertData: any, profile: VulnerabilityProfile): PersonalizedReminder {
    return {
      type: 'scam_awareness',
      title: `${scamType} Alert - Personal Risk Warning`,
      message: `Based on your assessment, you're at ${profile.riskLevel} risk for ${scamType} scams. ${alertData.summary}`,
      actionRequired: true,
      urgency: profile.riskLevel === 'critical' ? 'high' : 'medium'
    };
  }

  private async getUserVulnerabilityProfile(userId: string): Promise<VulnerabilityProfile | null> {
    try {
      const [profile] = await db
        .select()
        .from(vulnerabilityProfiles)
        .where(eq(vulnerabilityProfiles.userId, userId))
        .orderBy(vulnerabilityProfiles.createdAt)
        .limit(1);

      if (!profile) return null;

      // Convert attack types and concern areas to vulnerability strings
      const attackTypes = profile.attackTypes as string[] || [];
      const concernAreas = profile.concernAreas as string[] || [];
      const vulnerabilities = [...attackTypes, ...concernAreas];

      // Map risk score to risk level
      let riskLevel: 'low' | 'medium' | 'high' | 'critical';
      if (profile.riskScore >= 80) riskLevel = 'critical';
      else if (profile.riskScore >= 60) riskLevel = 'high';
      else if (profile.riskScore >= 40) riskLevel = 'medium';
      else riskLevel = 'low';

      return {
        id: profile.id,
        userId,
        primaryVulnerabilities: vulnerabilities,
        riskLevel,
        lastAssessment: new Date(profile.createdAt),
        preferredContacts: [], // Could be added to schema later
        reminderFrequency: 'weekly' // Default, could be user preference
      };
    } catch (error) {
      console.error('Error fetching vulnerability profile:', error);
      return null;
    }
  }

  private async getAllActiveProfiles(): Promise<VulnerabilityProfile[]> {
    try {
      const profiles = await db
        .select()
        .from(vulnerabilityProfiles)
        .where(gte(vulnerabilityProfiles.createdAt, new Date(Date.now() - 90 * 24 * 60 * 60 * 1000))); // Last 90 days

      return profiles.map(profile => {
        const attackTypes = profile.attackTypes as string[] || [];
        const concernAreas = profile.concernAreas as string[] || [];
        const vulnerabilities = [...attackTypes, ...concernAreas];

        let riskLevel: 'low' | 'medium' | 'high' | 'critical';
        if (profile.riskScore >= 80) riskLevel = 'critical';
        else if (profile.riskScore >= 60) riskLevel = 'high';
        else if (profile.riskScore >= 40) riskLevel = 'medium';
        else riskLevel = 'low';

        return {
          id: profile.id,
          userId: profile.userId,
          primaryVulnerabilities: vulnerabilities,
          riskLevel,
          lastAssessment: new Date(profile.createdAt),
          preferredContacts: [],
          reminderFrequency: 'weekly'
        };
      });
    } catch (error) {
      console.error('Error fetching active profiles:', error);
      return [];
    }
  }
}

export const personalizedNotificationService = new PersonalizedNotificationService();