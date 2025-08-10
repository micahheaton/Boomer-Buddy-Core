/**
 * Storage Service - Encrypted local storage
 * All sensitive data stays on device
 */

import EncryptedStorage from 'react-native-encrypted-storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CaseHistory {
  id: string;
  timestamp: string;
  channel: 'sms' | 'call' | 'voicemail' | 'email' | 'web' | 'letter';
  content?: string; // Scrubbed content
  analysis: any;
  phoneNumber?: string;
  riskScore: number;
  userAction?: 'blocked' | 'reported' | 'ignored';
}

interface UserProfile {
  vulnerabilities: string[];
  riskFactors: string[];
  preferredLanguage: string;
  notificationSettings: {
    enabled: boolean;
    frequency: 'realtime' | 'hourly' | 'daily';
    quietHours: { start: string; end: string };
  };
  trainingProgress: {
    completedPacks: string[];
    streakDays: number;
    lastTrainingDate: string;
  };
}

interface TrainingProgress {
  packId: string;
  completedCards: number[];
  lastReviewDate: string;
  difficulty: number;
  streakCount: number;
}

export class StorageService {
  private static initialized = false;

  static async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      // Test encrypted storage
      await EncryptedStorage.setItem('test', 'value');
      await EncryptedStorage.removeItem('test');
      
      console.log('🔐 Encrypted storage initialized');
      this.initialized = true;
    } catch (error) {
      console.error('❌ Storage initialization failed:', error);
      throw error;
    }
  }

  // Case History Management
  static async saveCaseHistory(caseData: Omit<CaseHistory, 'id' | 'timestamp'>): Promise<string> {
    const caseId = `case_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const caseHistory: CaseHistory = {
      id: caseId,
      timestamp: new Date().toISOString(),
      ...caseData
    };

    try {
      const existingHistory = await this.getCaseHistory();
      const updatedHistory = [...existingHistory, caseHistory];
      
      // Keep only last 100 cases for performance
      const limitedHistory = updatedHistory.slice(-100);
      
      await EncryptedStorage.setItem('case_history', JSON.stringify(limitedHistory));
      console.log(`💾 Case ${caseId} saved to encrypted storage`);
      
      return caseId;
    } catch (error) {
      console.error('Failed to save case:', error);
      throw error;
    }
  }

  static async getCaseHistory(): Promise<CaseHistory[]> {
    try {
      const historyData = await EncryptedStorage.getItem('case_history');
      return historyData ? JSON.parse(historyData) : [];
    } catch (error) {
      console.error('Failed to get case history:', error);
      return [];
    }
  }

  static async getCaseById(caseId: string): Promise<CaseHistory | null> {
    const history = await this.getCaseHistory();
    return history.find(c => c.id === caseId) || null;
  }

  static async clearCaseHistory(): Promise<void> {
    try {
      await EncryptedStorage.removeItem('case_history');
      console.log('🗑️ Case history cleared');
    } catch (error) {
      console.error('Failed to clear case history:', error);
      throw error;
    }
  }

  // User Profile Management
  static async saveUserProfile(profile: UserProfile): Promise<void> {
    try {
      await EncryptedStorage.setItem('user_profile', JSON.stringify(profile));
      console.log('👤 User profile saved');
    } catch (error) {
      console.error('Failed to save user profile:', error);
      throw error;
    }
  }

  static async getUserProfile(): Promise<UserProfile | null> {
    try {
      const profileData = await EncryptedStorage.getItem('user_profile');
      return profileData ? JSON.parse(profileData) : null;
    } catch (error) {
      console.error('Failed to get user profile:', error);
      return null;
    }
  }

  static async getDefaultProfile(): Promise<UserProfile> {
    return {
      vulnerabilities: [],
      riskFactors: [],
      preferredLanguage: 'en',
      notificationSettings: {
        enabled: true,
        frequency: 'realtime',
        quietHours: { start: '22:00', end: '08:00' }
      },
      trainingProgress: {
        completedPacks: [],
        streakDays: 0,
        lastTrainingDate: ''
      }
    };
  }

  // Training Progress Management
  static async saveTrainingProgress(packId: string, progress: TrainingProgress): Promise<void> {
    try {
      const existingProgress = await this.getTrainingProgress();
      existingProgress[packId] = progress;
      
      await EncryptedStorage.setItem('training_progress', JSON.stringify(existingProgress));
      console.log(`📚 Training progress saved for pack ${packId}`);
    } catch (error) {
      console.error('Failed to save training progress:', error);
      throw error;
    }
  }

  static async getTrainingProgress(): Promise<Record<string, TrainingProgress>> {
    try {
      const progressData = await EncryptedStorage.getItem('training_progress');
      return progressData ? JSON.parse(progressData) : {};
    } catch (error) {
      console.error('Failed to get training progress:', error);
      return {};
    }
  }

  // Settings Management
  static async saveSetting(key: string, value: any): Promise<void> {
    try {
      await AsyncStorage.setItem(`setting_${key}`, JSON.stringify(value));
    } catch (error) {
      console.error(`Failed to save setting ${key}:`, error);
      throw error;
    }
  }

  static async getSetting(key: string, defaultValue: any = null): Promise<any> {
    try {
      const value = await AsyncStorage.getItem(`setting_${key}`);
      return value ? JSON.parse(value) : defaultValue;
    } catch (error) {
      console.error(`Failed to get setting ${key}:`, error);
      return defaultValue;
    }
  }

  // Data Export for authorities
  static async exportCaseData(caseIds: string[]): Promise<string> {
    try {
      const history = await this.getCaseHistory();
      const exportData = history.filter(c => caseIds.includes(c.id));
      
      return JSON.stringify({
        exportDate: new Date().toISOString(),
        cases: exportData,
        totalCases: exportData.length,
        disclaimer: 'This data is exported for official reporting purposes only.'
      }, null, 2);
    } catch (error) {
      console.error('Failed to export case data:', error);
      throw error;
    }
  }

  // Clear all local data (privacy control)
  static async clearAllData(): Promise<void> {
    try {
      await EncryptedStorage.clear();
      await AsyncStorage.clear();
      console.log('🧹 All local data cleared');
    } catch (error) {
      console.error('Failed to clear all data:', error);
      throw error;
    }
  }
}