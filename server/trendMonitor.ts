import { openai } from './openai';

export interface ScamTrend {
  id: string;
  title: string;
  description: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  keywords: string[];
  tactics: string[];
  targetDemographics: string[];
  reportedCases: number;
  firstSeen: string;
  lastUpdated: string;
  regions: string[];
  examples: string[];
  preventionTips: string[];
}

export interface TrendAlert {
  id: string;
  trendId: string;
  alertType: 'new_trend' | 'escalation' | 'geographic_spread' | 'tactic_change';
  severity: 'info' | 'warning' | 'urgent' | 'critical';
  title: string;
  message: string;
  actionRequired: boolean;
  timestamp: string;
}

class TrendMonitoringService {
  private trends: Map<string, ScamTrend> = new Map();
  private alerts: TrendAlert[] = [];
  private lastUpdate: string = new Date().toISOString();

  constructor() {
    this.initializeBaseTrends();
    this.startMonitoring();
  }

  private initializeBaseTrends() {
    const baseTrends: ScamTrend[] = [
      {
        id: 'social-security-phone-scam',
        title: 'Social Security Administration Phone Scam',
        description: 'Scammers impersonating SSA officials claiming account suspension or legal action',
        riskLevel: 'high',
        keywords: ['social security', 'SSA', 'suspended', 'arrest warrant', 'federal crime'],
        tactics: ['Caller ID spoofing', 'Urgency creation', 'Fear tactics', 'Official impersonation'],
        targetDemographics: ['Senior citizens', 'Recent immigrants', 'Social Security recipients'],
        reportedCases: 847,
        firstSeen: '2024-01-15T00:00:00Z',
        lastUpdated: new Date().toISOString(),
        regions: ['Nationwide', 'High activity in FL, TX, CA'],
        examples: [
          'Your Social Security number has been suspended due to suspicious activity',
          'There is an arrest warrant issued in your name for federal crimes'
        ],
        preventionTips: [
          'SSA will never call to threaten arrest or demand immediate payment',
          'Hang up and call SSA directly at 1-800-772-1213',
          'Government agencies do not accept gift cards as payment'
        ]
      },
      {
        id: 'ai-voice-cloning-scam',
        title: 'AI Voice Cloning Emergency Scam',
        description: 'Scammers using AI to clone voices of family members in fake emergency calls',
        riskLevel: 'critical',
        keywords: ['emergency', 'accident', 'hospital', 'bail money', 'urgent help'],
        tactics: ['AI voice synthesis', 'Emotional manipulation', 'Time pressure', 'Family impersonation'],
        targetDemographics: ['Parents', 'Grandparents', 'Family members'],
        reportedCases: 234,
        firstSeen: '2024-08-01T00:00:00Z',
        lastUpdated: new Date().toISOString(),
        regions: ['Emerging nationwide', 'High reports in urban areas'],
        examples: [
          'Grandma, I\'ve been in an accident and need bail money right now',
          'Mom, I\'m in the hospital and need you to send money immediately'
        ],
        preventionTips: [
          'Ask specific questions only the real person would know',
          'Hang up and call the person directly on their known number',
          'Establish a family code word for real emergencies'
        ]
      },
      {
        id: 'fake-tech-support',
        title: 'Fake Microsoft/Apple Tech Support',
        description: 'Pop-up warnings and cold calls claiming computer infection or security breach',
        riskLevel: 'high',
        keywords: ['Microsoft', 'Apple', 'virus detected', 'security breach', 'tech support'],
        tactics: ['Pop-up warnings', 'Remote access requests', 'Fake error messages', 'Urgency tactics'],
        targetDemographics: ['Computer users', 'Seniors', 'Less tech-savvy individuals'],
        reportedCases: 1205,
        firstSeen: '2023-06-01T00:00:00Z',
        lastUpdated: new Date().toISOString(),
        regions: ['Nationwide', 'International call centers'],
        examples: [
          'Warning: Your computer has been infected with a virus',
          'Microsoft has detected unusual activity on your account'
        ],
        preventionTips: [
          'Microsoft and Apple never make unsolicited calls',
          'Close pop-up windows without clicking anything',
          'Contact tech support through official websites only'
        ]
      }
    ];

    baseTrends.forEach(trend => this.trends.set(trend.id, trend));
  }

  private startMonitoring() {
    // Simulate periodic trend updates
    setInterval(() => {
      this.updateTrends();
    }, 30000); // Update every 30 seconds for demo purposes
  }

  private async updateTrends() {
    try {
      // In a real implementation, this would fetch from multiple sources:
      // - FTC reports, FBI IC3, state attorney general data
      // - News APIs for scam reports
      // - User submissions and analysis patterns
      
      const trendUpdates = await this.fetchLatestTrendData();
      this.processTrendUpdates(trendUpdates);
      this.generateAlerts();
      
    } catch (error) {
      console.error('Error updating trends:', error);
    }
  }

  private async fetchLatestTrendData(): Promise<any[]> {
    // Simulate fetching trend data - in production this would call real APIs
    const simulatedUpdates = [
      {
        type: 'case_increase',
        trendId: 'ai-voice-cloning-scam',
        newCases: 23,
        regions: ['New York', 'California', 'Florida']
      },
      {
        type: 'new_tactic',
        trendId: 'social-security-phone-scam',
        tactic: 'Text message follow-up after phone call'
      }
    ];
    
    return simulatedUpdates;
  }

  private processTrendUpdates(updates: any[]) {
    updates.forEach(update => {
      const trend = this.trends.get(update.trendId);
      if (!trend) return;

      switch (update.type) {
        case 'case_increase':
          trend.reportedCases += update.newCases;
          if (update.regions) {
            trend.regions = [...new Set([...trend.regions, ...update.regions])];
          }
          break;
          
        case 'new_tactic':
          if (!trend.tactics.includes(update.tactic)) {
            trend.tactics.push(update.tactic);
          }
          break;
      }
      
      trend.lastUpdated = new Date().toISOString();
      this.trends.set(update.trendId, trend);
    });
  }

  private generateAlerts() {
    this.trends.forEach(trend => {
      // Generate alerts based on trend changes
      if (this.shouldGenerateAlert(trend)) {
        const alert = this.createAlert(trend);
        this.alerts.unshift(alert);
        
        // Keep only last 50 alerts
        if (this.alerts.length > 50) {
          this.alerts = this.alerts.slice(0, 50);
        }
      }
    });
  }

  private shouldGenerateAlert(trend: ScamTrend): boolean {
    const hoursSinceUpdate = (Date.now() - new Date(trend.lastUpdated).getTime()) / (1000 * 60 * 60);
    
    // Generate alert if trend is critical and recently updated
    return trend.riskLevel === 'critical' && hoursSinceUpdate < 1;
  }

  private createAlert(trend: ScamTrend): TrendAlert {
    return {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      trendId: trend.id,
      alertType: 'escalation',
      severity: trend.riskLevel === 'critical' ? 'critical' : 'warning',
      title: `Rising Activity: ${trend.title}`,
      message: `Increased reports of ${trend.title.toLowerCase()}. Stay vigilant for: ${trend.keywords.slice(0, 3).join(', ')}.`,
      actionRequired: trend.riskLevel === 'critical',
      timestamp: new Date().toISOString()
    };
  }

  public getCurrentTrends(): ScamTrend[] {
    return Array.from(this.trends.values())
      .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
  }

  public getActiveAlerts(): TrendAlert[] {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    return this.alerts.filter(alert => alert.timestamp > oneDayAgo);
  }

  public getTrendById(id: string): ScamTrend | undefined {
    return this.trends.get(id);
  }

  public searchTrends(query: string): ScamTrend[] {
    const searchTerm = query.toLowerCase();
    return Array.from(this.trends.values()).filter(trend =>
      trend.title.toLowerCase().includes(searchTerm) ||
      trend.description.toLowerCase().includes(searchTerm) ||
      trend.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm)) ||
      trend.tactics.some(tactic => tactic.toLowerCase().includes(searchTerm))
    );
  }

  public async analyzeForTrendMatch(text: string): Promise<ScamTrend[]> {
    const matches: ScamTrend[] = [];
    const textLower = text.toLowerCase();
    
    this.trends.forEach(trend => {
      let matchScore = 0;
      
      // Check keyword matches
      trend.keywords.forEach(keyword => {
        if (textLower.includes(keyword.toLowerCase())) {
          matchScore += 2;
        }
      });
      
      // Check tactic patterns
      trend.tactics.forEach(tactic => {
        if (this.tacticMatches(textLower, tactic)) {
          matchScore += 1;
        }
      });
      
      // If match score is high enough, include this trend
      if (matchScore >= 2) {
        matches.push(trend);
      }
    });
    
    return matches.sort((a, b) => b.reportedCases - a.reportedCases);
  }

  private tacticMatches(text: string, tactic: string): boolean {
    const tacticPatterns: Record<string, string[]> = {
      'urgency creation': ['urgent', 'immediately', 'right now', 'expires', 'limited time'],
      'fear tactics': ['arrest', 'legal action', 'suspended', 'fraud', 'investigation'],
      'official impersonation': ['government', 'irs', 'fbi', 'police', 'court'],
      'emotional manipulation': ['emergency', 'accident', 'hospital', 'help me', 'please']
    };
    
    const patterns = tacticPatterns[tactic.toLowerCase()] || [];
    return patterns.some(pattern => text.includes(pattern));
  }
}

export const trendMonitor = new TrendMonitoringService();