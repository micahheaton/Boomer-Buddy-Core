import axios from 'axios';

// Use your actual Replit app URL
const API_BASE = 'https://your-replit-app.replit.app';

export interface ScamAnalysisResult {
  overallRisk: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  threats: string[];
  recommendations: string[];
  scamType?: string;
}

export interface ThreatAlert {
  id: string;
  type: 'call' | 'sms' | 'email' | 'general';
  source: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
  threats: string[];
  blocked: boolean;
}

export interface GovernmentFeed {
  id: string;
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  source: string;
  category: string;
}

class ApiService {
  private client = axios.create({
    baseURL: API_BASE,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  async analyzeText(text: string): Promise<ScamAnalysisResult> {
    try {
      const response = await this.client.post('/v1/analyze', {
        text,
        type: 'text',
      });
      return response.data;
    } catch (error) {
      console.error('Text analysis failed:', error);
      throw new Error('Analysis service unavailable');
    }
  }

  async analyzeCall(phoneNumber: string, metadata?: any): Promise<ScamAnalysisResult> {
    try {
      const response = await this.client.post('/v1/assess-call', {
        phoneNumber,
        metadata,
      });
      return response.data;
    } catch (error) {
      console.error('Call analysis failed:', error);
      throw new Error('Call analysis service unavailable');
    }
  }

  async getThreatAlerts(): Promise<ThreatAlert[]> {
    try {
      const response = await this.client.get('/v1/threats');
      return response.data;
    } catch (error) {
      console.error('Failed to get threat alerts:', error);
      // Return empty array for offline mode
      return [];
    }
  }

  async getGovernmentFeeds(): Promise<GovernmentFeed[]> {
    try {
      const response = await this.client.get('/v1/feeds');
      return response.data;
    } catch (error) {
      console.error('Failed to get government feeds:', error);
      return [];
    }
  }

  async reportScam(report: {
    type: 'call' | 'sms' | 'email' | 'other';
    source: string;
    description: string;
    evidence?: string;
  }): Promise<{ success: boolean; reportId?: string }> {
    try {
      const response = await this.client.post('/v1/report', report);
      return response.data;
    } catch (error) {
      console.error('Failed to report scam:', error);
      throw new Error('Report submission failed');
    }
  }

  async getUserStats(): Promise<{
    scamsBlocked: number;
    reportsSubmitted: number;
    streakDays: number;
    xp: number;
    level: number;
  }> {
    try {
      const response = await this.client.get('/v1/user/stats');
      return response.data;
    } catch (error) {
      console.error('Failed to get user stats:', error);
      // Return default stats for offline mode
      return {
        scamsBlocked: 0,
        reportsSubmitted: 0,
        streakDays: 0,
        xp: 0,
        level: 1,
      };
    }
  }

  async getTrainingData(): Promise<Array<{
    id: string;
    type: 'quiz' | 'scenario' | 'example';
    title: string;
    content: any;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
  }>> {
    try {
      const response = await this.client.get('/v1/training');
      return response.data;
    } catch (error) {
      console.error('Failed to get training data:', error);
      return [];
    }
  }

  // Health check for service availability
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}

export const apiService = new ApiService();