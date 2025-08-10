/**
 * API Service - REAL Communication with Boomer Buddy backend
 * Handles all server communication with actual working endpoints
 */

const API_BASE_URL = 'https://dd1a556f-3467-43d1-b120-d70e2a9d0479-00-36ijlqxtxnhxd.riker.replit.dev';

interface MobileFeeds {
  success: boolean;
  feeds: Array<{
    source: string;
    title: string;
    link: string;
    published_at: string;
    tags: string[];
    state?: string;
    severity: string;
    elder_relevance_score: number;
  }>;
  metadata: {
    total_sources: number;
    active_sources: number;
    last_updated: string;
    cache_version: number;
  };
}

interface AnalysisResult {
  success: boolean;
  analysis: {
    label: 'likely_legitimate' | 'suspicious' | 'likely_scam';
    score: number;
    confidence: 'low' | 'medium' | 'high';
    top_reasons: string[];
    recommended_actions: Array<{
      title: string;
      steps: string[];
    }>;
    contacts: {
      federal: Array<{ name: string; url: string }>;
      state: Array<{ name: string; url: string }>;
    };
    legal_note: string;
  };
}

interface ModelInfo {
  success: boolean;
  model: {
    version: string;
    android_url: string;
    ios_url: string;
    metadata_url: string;
    rules_url: string;
    checksum: string;
    created_at: string;
    required_rules_version: string;
  };
}

export class ApiService {
  private static async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      console.log(`🔗 API Request: ${url}`);
      
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'BoomerBuddy-Mobile/1.0.0',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ API Success: ${endpoint}`, data);
      return data;
    } catch (error) {
      console.error(`❌ API Failed: ${endpoint}`, error);
      throw error;
    }
  }

  /**
   * Get REAL live government data feeds from backend
   */
  static async getLiveFeeds(): Promise<MobileFeeds> {
    return this.makeRequest('/v1/feeds.json');
  }

  /**
   * Analyze content using REAL backend ML engine
   */
  static async analyzeContent(features: Record<string, any>): Promise<AnalysisResult> {
    return this.makeRequest('/v1/analyze', {
      method: 'POST',
      body: JSON.stringify({ features }),
    });
  }

  /**
   * Get REAL ML model information from backend
   */
  static async getModelInfo(): Promise<ModelInfo> {
    return this.makeRequest('/v1/model');
  }

  /**
   * Send REAL notification to backend
   */
  static async sendNotification(deviceId: string, alertType: string, content: string): Promise<any> {
    return this.makeRequest('/v1/notify', {
      method: 'POST',
      body: JSON.stringify({ deviceId, alertType, content }),
    });
  }

  /**
   * REAL health check endpoint
   */
  static async healthCheck(): Promise<boolean> {
    try {
      const response = await this.makeRequest('/health');
      return response.status === 'healthy';
    } catch {
      return false;
    }
  }

  /**
   * Test real backend connectivity
   */
  static async testConnection(): Promise<{connected: boolean, latency: number, endpoints: any}> {
    const startTime = Date.now();
    try {
      const health = await this.healthCheck();
      const feeds = await this.getLiveFeeds();
      const model = await this.getModelInfo();
      
      return {
        connected: true,
        latency: Date.now() - startTime,
        endpoints: {
          health: health,
          feeds: feeds.success,
          model: model.success,
          feedCount: feeds.feeds?.length || 0,
          activeSources: feeds.metadata?.active_sources || 0
        }
      };
    } catch (error) {
      return {
        connected: false,
        latency: Date.now() - startTime,
        endpoints: { error: error.message }
      };
    }
  }
}