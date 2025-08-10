import { StorageService } from './StorageService';

export interface FamilyMember {
  id: string;
  name: string;
  relationship: 'spouse' | 'child' | 'parent' | 'sibling' | 'other';
  email: string;
  phoneNumber?: string;
  isCaregiver: boolean;
  notificationPreferences: NotificationPreference[];
  accessLevel: 'view_only' | 'alerts_only' | 'full_access';
  lastActive: number;
  connectedAt: number;
}

export interface NotificationPreference {
  type: 'scam_detected' | 'risk_increase' | 'emergency_alert' | 'weekly_summary' | 'location_alert' | 'quiz_completed';
  enabled: boolean;
  method: 'email' | 'sms' | 'push' | 'call';
  frequency: 'immediate' | 'daily' | 'weekly';
  threshold?: number; // For risk-based notifications
}

export interface FamilyDashboard {
  userId: string;
  userName: string;
  overallSafetyScore: number;
  recentActivity: ActivitySummary[];
  riskAlerts: RiskAlert[];
  protectionStats: ProtectionStats;
  lastUpdated: number;
  weeklyReport: WeeklyReport;
}

export interface ActivitySummary {
  id: string;
  type: 'analysis_completed' | 'scam_blocked' | 'quiz_taken' | 'safety_tip_viewed' | 'location_alert' | 'emergency_triggered';
  timestamp: number;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  details?: any;
}

export interface RiskAlert {
  id: string;
  category: string;
  level: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  recommendations: string[];
  timestamp: number;
  acknowledged: boolean;
  familyNotified: boolean;
}

export interface ProtectionStats {
  scamsBlocked: number;
  analysesCompleted: number;
  safetyScore: number;
  streakDays: number;
  improvementTrend: number; // percentage change
  categoryScores: { [category: string]: number };
}

export interface WeeklyReport {
  week: string;
  totalActivities: number;
  scamsBlocked: number;
  riskLevelChange: number;
  newVulnerabilities: string[];
  improvements: string[];
  recommendations: string[];
  nextSteps: string[];
}

export interface FamilyInvitation {
  id: string;
  fromUserId: string;
  fromUserName: string;
  toEmail: string;
  relationship: string;
  accessLevel: string;
  message?: string;
  createdAt: number;
  expiresAt: number;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
}

export interface CaregiverSettings {
  emergencyContactPriority: number;
  canReceiveEmergencyAlerts: boolean;
  canViewDetailedReports: boolean;
  canModifySettings: boolean;
  alertThresholds: {
    riskScoreIncrease: number;
    consecutiveScamAttempts: number;
    inactivityHours: number;
  };
}

export class FamilyMonitoringService {
  private storageService: StorageService;
  private familyMembers: FamilyMember[] = [];
  private currentDashboard: FamilyDashboard | null = null;

  constructor() {
    this.storageService = new StorageService();
    this.initializeService();
  }

  /**
   * Initialize family monitoring service
   */
  private async initializeService(): Promise<void> {
    try {
      await this.loadFamilyMembers();
      await this.loadCurrentDashboard();
      this.startPeriodicUpdates();
    } catch (error) {
      console.error('Failed to initialize family monitoring service:', error);
    }
  }

  /**
   * Send invitation to family member
   */
  async inviteFamilyMember(invitation: Omit<FamilyInvitation, 'id' | 'createdAt' | 'expiresAt' | 'status'>): Promise<string> {
    try {
      const invitationId = `invite_${Date.now()}`;
      const fullInvitation: FamilyInvitation = {
        ...invitation,
        id: invitationId,
        createdAt: Date.now(),
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
        status: 'pending'
      };

      await this.storageService.storeFamilyInvitation(fullInvitation);
      await this.sendInvitationEmail(fullInvitation);

      console.log(`Family invitation sent to ${invitation.toEmail}`);
      return invitationId;
    } catch (error) {
      console.error('Failed to invite family member:', error);
      throw error;
    }
  }

  /**
   * Accept family invitation
   */
  async acceptInvitation(invitationId: string, acceptingUserInfo: { name: string; email: string; phoneNumber?: string }): Promise<FamilyMember> {
    try {
      const invitation = await this.storageService.getFamilyInvitation(invitationId);
      if (!invitation || invitation.status !== 'pending' || invitation.expiresAt < Date.now()) {
        throw new Error('Invalid or expired invitation');
      }

      const familyMember: FamilyMember = {
        id: `member_${Date.now()}`,
        name: acceptingUserInfo.name,
        relationship: invitation.relationship as FamilyMember['relationship'],
        email: acceptingUserInfo.email,
        phoneNumber: acceptingUserInfo.phoneNumber,
        isCaregiver: invitation.accessLevel === 'full_access',
        notificationPreferences: this.getDefaultNotificationPreferences(invitation.accessLevel),
        accessLevel: invitation.accessLevel as FamilyMember['accessLevel'],
        lastActive: Date.now(),
        connectedAt: Date.now()
      };

      this.familyMembers.push(familyMember);
      await this.storageService.storeFamilyMembers(this.familyMembers);

      // Update invitation status
      invitation.status = 'accepted';
      await this.storageService.updateFamilyInvitation(invitation);

      // Notify the inviting user
      await this.notifyFamilyConnection(invitation.fromUserId, familyMember);

      return familyMember;
    } catch (error) {
      console.error('Failed to accept invitation:', error);
      throw error;
    }
  }

  /**
   * Generate family dashboard for caregivers
   */
  async generateFamilyDashboard(userId: string): Promise<FamilyDashboard> {
    try {
      const userProfile = await this.storageService.getUserProgress();
      const recentAnalyses = await this.storageService.getUserAnalysisHistory();
      const riskProfile = await this.storageService.getCurrentRiskProfile();

      // Generate activity summary
      const recentActivity = this.generateActivitySummary(recentAnalyses.slice(-10));

      // Generate risk alerts
      const riskAlerts = await this.generateRiskAlerts(riskProfile, recentAnalyses);

      // Calculate protection stats
      const protectionStats = this.calculateProtectionStats(userProfile, recentAnalyses, riskProfile);

      // Generate weekly report
      const weeklyReport = await this.generateWeeklyReport(recentAnalyses, riskProfile);

      const dashboard: FamilyDashboard = {
        userId,
        userName: userProfile.username || 'User',
        overallSafetyScore: protectionStats.safetyScore,
        recentActivity,
        riskAlerts,
        protectionStats,
        lastUpdated: Date.now(),
        weeklyReport
      };

      this.currentDashboard = dashboard;
      await this.storageService.storeFamilyDashboard(dashboard);

      return dashboard;
    } catch (error) {
      console.error('Failed to generate family dashboard:', error);
      throw error;
    }
  }

  /**
   * Send notification to family members
   */
  async notifyFamilyMembers(alert: RiskAlert): Promise<void> {
    try {
      const relevantMembers = this.familyMembers.filter(member => 
        member.notificationPreferences.some(pref => 
          pref.type === this.mapAlertToNotificationType(alert) && 
          pref.enabled &&
          this.meetsThreshold(alert, pref)
        )
      );

      for (const member of relevantMembers) {
        await this.sendNotificationToMember(member, alert);
      }

      // Mark alert as family notified
      alert.familyNotified = true;
      await this.storageService.updateRiskAlert(alert);
    } catch (error) {
      console.error('Failed to notify family members:', error);
    }
  }

  /**
   * Generate activity summary from recent analyses
   */
  private generateActivitySummary(analyses: any[]): ActivitySummary[] {
    return analyses.map(analysis => ({
      id: `activity_${analysis.id}`,
      type: 'analysis_completed',
      timestamp: analysis.timestamp,
      description: `Analyzed ${analysis.type} content - ${analysis.result.level} risk detected`,
      severity: analysis.result.level === 'danger' ? 'critical' : 
                analysis.result.level === 'warning' ? 'warning' : 'info',
      details: {
        analysisType: analysis.type,
        riskLevel: analysis.result.level,
        confidence: analysis.result.confidence
      }
    }));
  }

  /**
   * Generate risk alerts based on user data
   */
  private async generateRiskAlerts(riskProfile: any, recentAnalyses: any[]): Promise<RiskAlert[]> {
    const alerts: RiskAlert[] = [];

    if (!riskProfile) return alerts;

    // Check for high vulnerability categories
    riskProfile.vulnerabilities?.forEach((vulnerability: any) => {
      if (vulnerability.level === 'high' || vulnerability.level === 'critical') {
        alerts.push({
          id: `risk_${Date.now()}_${vulnerability.category}`,
          category: vulnerability.category,
          level: vulnerability.level,
          title: `High Risk: ${vulnerability.category.replace('_', ' ')}`,
          description: `User shows ${vulnerability.level} vulnerability to ${vulnerability.category.replace('_', ' ')} attacks`,
          recommendations: vulnerability.improvement,
          timestamp: Date.now(),
          acknowledged: false,
          familyNotified: false
        });
      }
    });

    // Check for recent dangerous encounters
    const recentDangers = recentAnalyses.filter(a => 
      a.result.level === 'danger' && 
      Date.now() - a.timestamp < 24 * 60 * 60 * 1000
    );

    if (recentDangers.length >= 2) {
      alerts.push({
        id: `danger_cluster_${Date.now()}`,
        category: 'multiple_threats',
        level: 'high',
        title: 'Multiple Threat Encounters',
        description: `User has encountered ${recentDangers.length} dangerous scam attempts in the last 24 hours`,
        recommendations: [
          'Consider a safety check-in call',
          'Review recent interactions together',
          'Remind about verification procedures'
        ],
        timestamp: Date.now(),
        acknowledged: false,
        familyNotified: false
      });
    }

    return alerts;
  }

  /**
   * Calculate protection statistics
   */
  private calculateProtectionStats(userProgress: any, analyses: any[], riskProfile: any): ProtectionStats {
    const recentAnalyses = analyses.filter(a => 
      Date.now() - a.timestamp < 30 * 24 * 60 * 60 * 1000 // Last 30 days
    );

    const scamsBlocked = recentAnalyses.filter(a => a.result.level === 'danger').length;
    const safetyScore = riskProfile?.overallScore ? (100 - riskProfile.overallScore) : 85;

    // Calculate trend
    const olderAnalyses = analyses.filter(a => {
      const daysDiff = (Date.now() - a.timestamp) / (24 * 60 * 60 * 1000);
      return daysDiff >= 30 && daysDiff < 60;
    });
    const olderScamsBlocked = olderAnalyses.filter(a => a.result.level === 'danger').length;
    const improvementTrend = olderScamsBlocked > 0 ? 
      ((scamsBlocked - olderScamsBlocked) / olderScamsBlocked) * 100 : 0;

    // Category scores
    const categoryScores: { [category: string]: number } = {};
    riskProfile?.vulnerabilities?.forEach((v: any) => {
      categoryScores[v.category] = 100 - v.score;
    });

    return {
      scamsBlocked,
      analysesCompleted: recentAnalyses.length,
      safetyScore,
      streakDays: userProgress?.streak || 0,
      improvementTrend,
      categoryScores
    };
  }

  /**
   * Generate weekly report
   */
  private async generateWeeklyReport(analyses: any[], riskProfile: any): Promise<WeeklyReport> {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    
    const weeklyAnalyses = analyses.filter(a => a.timestamp >= weekStart.getTime());
    const scamsBlocked = weeklyAnalyses.filter(a => a.result.level === 'danger').length;

    // Previous week comparison
    const prevWeekStart = new Date(weekStart);
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);
    const prevWeekAnalyses = analyses.filter(a => 
      a.timestamp >= prevWeekStart.getTime() && a.timestamp < weekStart.getTime()
    );
    const prevScamsBlocked = prevWeekAnalyses.filter(a => a.result.level === 'danger').length;
    const riskLevelChange = scamsBlocked - prevScamsBlocked;

    return {
      week: `${weekStart.toLocaleDateString()} - ${new Date().toLocaleDateString()}`,
      totalActivities: weeklyAnalyses.length,
      scamsBlocked,
      riskLevelChange,
      newVulnerabilities: this.identifyNewVulnerabilities(riskProfile),
      improvements: this.identifyImprovements(riskProfile),
      recommendations: this.generateWeeklyRecommendations(weeklyAnalyses, riskProfile),
      nextSteps: this.generateNextSteps(riskProfile)
    };
  }

  /**
   * Get default notification preferences based on access level
   */
  private getDefaultNotificationPreferences(accessLevel: string): NotificationPreference[] {
    const basePreferences: NotificationPreference[] = [
      {
        type: 'emergency_alert',
        enabled: true,
        method: 'call',
        frequency: 'immediate'
      },
      {
        type: 'scam_detected',
        enabled: true,
        method: 'email',
        frequency: 'immediate',
        threshold: 0.7 // Notify for medium+ risk scams
      }
    ];

    if (accessLevel === 'full_access') {
      basePreferences.push(
        {
          type: 'risk_increase',
          enabled: true,
          method: 'email',
          frequency: 'daily',
          threshold: 10 // 10% increase in risk score
        },
        {
          type: 'weekly_summary',
          enabled: true,
          method: 'email',
          frequency: 'weekly'
        }
      );
    }

    return basePreferences;
  }

  /**
   * Send invitation email
   */
  private async sendInvitationEmail(invitation: FamilyInvitation): Promise<void> {
    // In a real app, this would send an actual email
    console.log(`📧 Invitation email sent to ${invitation.toEmail}`);
    console.log(`Subject: ${invitation.fromUserName} wants to connect with you on Boomer Buddy`);
    console.log(`Message: ${invitation.message || 'Join me on Boomer Buddy to help keep each other safe from scams!'}`);
  }

  /**
   * Notify about family connection
   */
  private async notifyFamilyConnection(userId: string, newMember: FamilyMember): Promise<void> {
    console.log(`🎉 ${newMember.name} has joined your family network on Boomer Buddy`);
  }

  /**
   * Map alert to notification type
   */
  private mapAlertToNotificationType(alert: RiskAlert): NotificationPreference['type'] {
    switch (alert.category) {
      case 'multiple_threats':
      case 'emergency':
        return 'emergency_alert';
      default:
        return 'scam_detected';
    }
  }

  /**
   * Check if alert meets notification threshold
   */
  private meetsThreshold(alert: RiskAlert, preference: NotificationPreference): boolean {
    if (!preference.threshold) return true;
    
    const alertSeverity = { low: 0.25, medium: 0.5, high: 0.75, critical: 1.0 }[alert.level];
    return alertSeverity >= preference.threshold;
  }

  /**
   * Send notification to family member
   */
  private async sendNotificationToMember(member: FamilyMember, alert: RiskAlert): Promise<void> {
    const relevantPref = member.notificationPreferences.find(pref => 
      pref.type === this.mapAlertToNotificationType(alert) && pref.enabled
    );

    if (!relevantPref) return;

    const message = `Safety Alert for your family member: ${alert.title}. ${alert.description}`;

    switch (relevantPref.method) {
      case 'email':
        console.log(`📧 Email to ${member.email}: ${message}`);
        break;
      case 'sms':
        if (member.phoneNumber) {
          console.log(`📱 SMS to ${member.phoneNumber}: ${message}`);
        }
        break;
      case 'push':
        console.log(`🔔 Push notification to ${member.name}: ${alert.title}`);
        break;
      case 'call':
        if (member.phoneNumber) {
          console.log(`📞 Emergency call to ${member.phoneNumber}`);
        }
        break;
    }
  }

  /**
   * Identify new vulnerabilities
   */
  private identifyNewVulnerabilities(riskProfile: any): string[] {
    if (!riskProfile?.vulnerabilities) return [];
    
    return riskProfile.vulnerabilities
      .filter((v: any) => v.level === 'high' || v.level === 'critical')
      .map((v: any) => v.category.replace('_', ' '))
      .slice(0, 3);
  }

  /**
   * Identify improvements
   */
  private identifyImprovements(riskProfile: any): string[] {
    // This would compare with previous assessments
    return ['Better email verification', 'Improved phone scam detection'];
  }

  /**
   * Generate weekly recommendations
   */
  private generateWeeklyRecommendations(analyses: any[], riskProfile: any): string[] {
    const recommendations = [];
    
    if (analyses.length < 3) {
      recommendations.push('Encourage more regular scam checks');
    }
    
    const dangerousEncounters = analyses.filter(a => a.result.level === 'danger').length;
    if (dangerousEncounters > 2) {
      recommendations.push('Schedule a safety conversation');
      recommendations.push('Review verification procedures together');
    }
    
    return recommendations;
  }

  /**
   * Generate next steps
   */
  private generateNextSteps(riskProfile: any): string[] {
    if (!riskProfile) return ['Complete initial risk assessment'];
    
    const highRiskCategories = riskProfile.vulnerabilities?.filter((v: any) => 
      v.level === 'high' || v.level === 'critical'
    ).length || 0;
    
    if (highRiskCategories > 2) {
      return [
        'Schedule comprehensive safety training',
        'Set up additional emergency contacts',
        'Practice scam scenarios together'
      ];
    }
    
    return [
      'Continue regular safety check-ins',
      'Review and update emergency contacts',
      'Complete monthly risk assessment'
    ];
  }

  /**
   * Load family members from storage
   */
  private async loadFamilyMembers(): Promise<void> {
    try {
      this.familyMembers = await this.storageService.getFamilyMembers();
    } catch (error) {
      console.error('Failed to load family members:', error);
      this.familyMembers = [];
    }
  }

  /**
   * Load current dashboard from storage
   */
  private async loadCurrentDashboard(): Promise<void> {
    try {
      this.currentDashboard = await this.storageService.getCurrentFamilyDashboard();
    } catch (error) {
      console.error('Failed to load family dashboard:', error);
      this.currentDashboard = null;
    }
  }

  /**
   * Start periodic updates
   */
  private startPeriodicUpdates(): void {
    // Update dashboard every hour
    setInterval(async () => {
      if (this.familyMembers.length > 0) {
        try {
          await this.generateFamilyDashboard('current_user');
        } catch (error) {
          console.error('Failed to update family dashboard:', error);
        }
      }
    }, 60 * 60 * 1000);
  }

  /**
   * Get current family members
   */
  getFamilyMembers(): FamilyMember[] {
    return [...this.familyMembers];
  }

  /**
   * Get current dashboard
   */
  getCurrentDashboard(): FamilyDashboard | null {
    return this.currentDashboard;
  }

  /**
   * Update notification preferences for family member
   */
  async updateNotificationPreferences(memberId: string, preferences: NotificationPreference[]): Promise<void> {
    const member = this.familyMembers.find(m => m.id === memberId);
    if (member) {
      member.notificationPreferences = preferences;
      await this.storageService.storeFamilyMembers(this.familyMembers);
    }
  }

  /**
   * Remove family member
   */
  async removeFamilyMember(memberId: string): Promise<void> {
    this.familyMembers = this.familyMembers.filter(m => m.id !== memberId);
    await this.storageService.storeFamilyMembers(this.familyMembers);
  }

  /**
   * Cleanup service
   */
  destroy(): void {
    // Cleanup any intervals or listeners
  }
}