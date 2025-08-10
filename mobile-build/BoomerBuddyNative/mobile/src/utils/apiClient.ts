import Constants from 'expo-constants';
import { ScamAnalysisRequest, ScamAnalysisResult } from '../types';

const API_BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl || 'http://localhost:5000';

class ApiClient {
  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }

  async analyzeText(request: ScamAnalysisRequest): Promise<{ result: ScamAnalysisResult; id: string }> {
    return this.makeRequest('/api/analyze', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async analyzeImage(imageUri: string, additionalData?: Partial<ScamAnalysisRequest>): Promise<{ result: ScamAnalysisResult; id: string }> {
    const formData = new FormData();
    
    // Convert image URI to blob for upload
    const response = await fetch(imageUri);
    const blob = await response.blob();
    
    formData.append('image', blob as any, 'image.jpg');
    
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        if (value !== undefined) {
          formData.append(key, String(value));
        }
      });
    }

    return this.makeRequest('/api/analyze', {
      method: 'POST',
      headers: {},
      body: formData,
    });
  }

  async getAnalysis(id: string): Promise<ScamAnalysisResult> {
    return this.makeRequest(`/api/analysis/${id}`);
  }

  async getAnalysisHistory(userId: string): Promise<ScamAnalysisResult[]> {
    return this.makeRequest(`/api/user/${userId}/analyses`);
  }
}

export const apiClient = new ApiClient();