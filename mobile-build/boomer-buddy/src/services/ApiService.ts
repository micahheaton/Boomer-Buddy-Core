import { Alert } from 'react-native';

const API_BASE_URL = 'https://workspace--3000.repl.co'; // Replit workspace URL

export interface ScamAnalysisResult {
  isScam: boolean;
  confidence: number;
  scamType: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  analysis: string;
  recommendations: string[];
  urgency: 'none' | 'low' | 'medium' | 'high' | 'immediate';
}

export interface ThreatAlert {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  dateCreated: string;
  url?: string;
}

export interface TrainingModule {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  completed: boolean;
  scenarios: TrainingScenario[];
}

export interface TrainingScenario {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

class ApiService {
  private async fetchApi(endpoint: string, options: RequestInit = {}): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // Scam Analysis Functionality
  async analyzeText(text: string): Promise<ScamAnalysisResult> {
    return this.fetchApi('/api/analyze', {
      method: 'POST',
      body: JSON.stringify({
        type: 'text',
        content: text,
      }),
    });
  }

  async analyzeImage(imageUri: string): Promise<ScamAnalysisResult> {
    const formData = new FormData();
    formData.append('file', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'screenshot.jpg',
    } as any);
    formData.append('type', 'image');

    return this.fetchApi('/api/analyze', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  // Live Threat Alerts
  async getLiveThreatAlerts(): Promise<ThreatAlert[]> {
    return this.fetchApi('/api/live-alerts');
  }

  async getScamTrends(): Promise<any[]> {
    return this.fetchApi('/api/scam-trends');
  }

  // Training Modules
  async getTrainingModules(): Promise<TrainingModule[]> {
    return this.fetchApi('/api/training/modules');
  }

  async submitTrainingAnswer(moduleId: string, scenarioId: string, answer: number): Promise<boolean> {
    const result = await this.fetchApi('/api/training/submit', {
      method: 'POST',
      body: JSON.stringify({
        moduleId,
        scenarioId,
        answer,
      }),
    });
    return result.correct;
  }

  // Emergency Services
  async triggerEmergencyMode(location?: { latitude: number; longitude: number }): Promise<void> {
    return this.fetchApi('/api/emergency/trigger', {
      method: 'POST',
      body: JSON.stringify({
        location,
        timestamp: new Date().toISOString(),
      }),
    });
  }

  async getEmergencyContacts(): Promise<any[]> {
    return this.fetchApi('/api/emergency/contacts');
  }

  // User Statistics and Progress
  async getUserStats(): Promise<any> {
    return this.fetchApi('/api/user/stats');
  }

  async reportScam(details: {
    type: string;
    description: string;
    evidence?: string;
    contactInfo?: string;
  }): Promise<void> {
    return this.fetchApi('/api/scam/report', {
      method: 'POST',
      body: JSON.stringify(details),
    });
  }
}

export const apiService = new ApiService();