/**
 * API Service - Communication with Boomer Buddy backend
 * Handles all server communication following zero-PII principles
 */

const API_BASE_URL = __DEV__ 
  ? 'http://localhost:5000' // Development - Updated to match backend port
  : 'https://api.boomerbuddy.app'; // Production

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

      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Get mobile-optimized government feeds
   */
  static async getFeeds(): Promise<MobileFeeds> {
    return this.makeRequest('/api/mobile/v1/feeds');
  }

  /**
   * Analyze feature vector (no PII)
   */
  static async analyzeFeatureVector(featureVector: any): Promise<AnalysisResult> {
    return this.makeRequest('/api/mobile/v1/analyze', {
      method: 'POST',
      body: JSON.stringify(featureVector),
    });
  }

  /**
   * Get latest ML model information
   */
  static async getModelInfo(): Promise<ModelInfo> {
    return this.makeRequest('/api/mobile/v1/model');
  }

  /**
   * Download model file (for ML updates)
   */
  static async downloadModelFile(url: string): Promise<ArrayBuffer> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to download model: ${response.statusText}`);
      }
      return await response.arrayBuffer();
    } catch (error) {
      console.error('Model download failed:', error);
      throw error;
    }
  }

  /**
   * Health check - verify backend connectivity
   */
  static async healthCheck(): Promise<boolean> {
    try {
      await this.makeRequest('/api/mobile/v1/model');
      return true;
    } catch (error) {
      console.error('Backend health check failed:', error);
      return false;
    }
  }

  /**
   * Get connection status and metadata
   */
  static async getConnectionStatus(): Promise<{
    connected: boolean;
    latency?: number;
    sources?: number;
    lastUpdate?: string;
  }> {
    try {
      const startTime = Date.now();
      const feeds = await this.getFeeds();
      const latency = Date.now() - startTime;

      return {
        connected: true,
        latency,
        sources: feeds.metadata.total_sources,
        lastUpdate: feeds.metadata.last_updated,
      };
    } catch (error) {
      return {
        connected: false,
      };
    }
  }
}