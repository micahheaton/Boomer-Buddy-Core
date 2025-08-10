import { StorageService } from './StorageService';
import { RiskEngine } from './RiskEngine';

export interface OfflineModel {
  version: string;
  modelData: any;
  lastUpdated: number;
  size: number;
  accuracy: number;
}

export interface SyncStatus {
  lastSync: number;
  pendingUploads: number;
  syncInProgress: boolean;
  nextScheduledSync: number;
}

export class OfflineCapabilities {
  private storageService: StorageService;
  private riskEngine: RiskEngine;
  private syncTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.storageService = new StorageService();
    this.riskEngine = new RiskEngine();
    this.initializeOfflineMode();
  }

  async initializeOfflineMode(): Promise<void> {
    try {
      // Check if offline model exists
      const offlineModel = await this.getOfflineModel();
      if (!offlineModel || this.isModelOutdated(offlineModel)) {
        await this.downloadOfflineModel();
      }

      // Schedule periodic syncing
      this.scheduleSync();
      
    } catch (error) {
      console.error('Failed to initialize offline mode:', error);
    }
  }

  async getOfflineModel(): Promise<OfflineModel | null> {
    try {
      return await this.storageService.getOfflineModel();
    } catch (error) {
      console.error('Failed to get offline model:', error);
      return null;
    }
  }

  isModelOutdated(model: OfflineModel): boolean {
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    return Date.now() - model.lastUpdated > maxAge;
  }

  async downloadOfflineModel(): Promise<boolean> {
    try {
      console.log('Downloading latest offline model...');
      
      const response = await fetch('/api/mobile/v1/model', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to download model: ${response.status}`);
      }

      const modelData = await response.json();
      
      const offlineModel: OfflineModel = {
        version: modelData.version || '1.0.0',
        modelData: modelData.model,
        lastUpdated: Date.now(),
        size: JSON.stringify(modelData).length,
        accuracy: modelData.accuracy || 0.85
      };

      await this.storageService.storeOfflineModel(offlineModel);
      console.log('Offline model downloaded successfully');
      
      return true;
    } catch (error) {
      console.error('Failed to download offline model:', error);
      return false;
    }
  }

  async analyzeOffline(content: string, type: 'text' | 'call' | 'email'): Promise<any> {
    try {
      const offlineModel = await this.getOfflineModel();
      if (!offlineModel) {
        throw new Error('Offline model not available');
      }

      // Use local risk engine with offline model
      const features = await this.extractFeatures(content, type);
      const riskAssessment = await this.riskEngine.assessRisk(features);

      // Add offline indicator
      return {
        ...riskAssessment,
        offline: true,
        modelVersion: offlineModel.version,
        confidence: Math.max(0.1, riskAssessment.confidence - 0.1) // Slightly lower confidence for offline
      };
    } catch (error) {
      console.error('Offline analysis failed:', error);
      throw error;
    }
  }

  private async extractFeatures(content: string, type: string): Promise<number[]> {
    // Simplified feature extraction for offline use
    const features: number[] = [];

    // Basic text analysis
    const words = content.toLowerCase().split(/\s+/);
    const urgencyWords = ['urgent', 'immediate', 'expires', 'now', 'today'];
    const scamWords = ['lottery', 'winner', 'congratulations', 'verify', 'suspended'];
    const authorityWords = ['irs', 'government', 'social security', 'medicare'];

    features.push(urgencyWords.filter(word => words.includes(word)).length / urgencyWords.length);
    features.push(scamWords.filter(word => words.includes(word)).length / scamWords.length);
    features.push(authorityWords.filter(word => words.includes(word)).length / authorityWords.length);

    // Length and structure analysis
    features.push(Math.min(content.length / 1000, 1)); // Normalized length
    features.push((content.match(/[A-Z]/g) || []).length / content.length); // Caps ratio
    features.push((content.match(/[!?]/g) || []).length / content.length); // Exclamation ratio

    // Type-specific features
    switch (type) {
      case 'email':
        features.push(content.includes('click') ? 1 : 0);
        features.push(content.includes('verify') ? 1 : 0);
        break;
      case 'call':
        features.push(content.includes('callback') ? 1 : 0);
        features.push(content.includes('press') ? 1 : 0);
        break;
      case 'text':
        features.push(content.length < 160 ? 1 : 0);
        features.push(content.includes('$') ? 1 : 0);
        break;
    }

    return features;
  }

  async queueForSync(analysisResult: any): Promise<void> {
    try {
      await this.storageService.addToSyncQueue({
        id: `sync_${Date.now()}`,
        type: 'analysis',
        data: analysisResult,
        timestamp: Date.now(),
        retries: 0
      });
    } catch (error) {
      console.error('Failed to queue for sync:', error);
    }
  }

  async performSync(): Promise<SyncStatus> {
    try {
      const syncQueue = await this.storageService.getSyncQueue();
      if (syncQueue.length === 0) {
        return {
          lastSync: Date.now(),
          pendingUploads: 0,
          syncInProgress: false,
          nextScheduledSync: Date.now() + 60 * 60 * 1000 // Next hour
        };
      }

      let successfulSyncs = 0;
      let failedSyncs = 0;

      for (const item of syncQueue) {
        try {
          const success = await this.syncItem(item);
          if (success) {
            successfulSyncs++;
            await this.storageService.removeFromSyncQueue(item.id);
          } else {
            failedSyncs++;
            // Increment retry count
            item.retries++;
            if (item.retries >= 3) {
              // Remove after 3 failed attempts
              await this.storageService.removeFromSyncQueue(item.id);
            } else {
              await this.storageService.updateSyncQueue(item);
            }
          }
        } catch (error) {
          console.error('Sync item failed:', error);
          failedSyncs++;
        }
      }

      const remainingQueue = await this.storageService.getSyncQueue();
      
      return {
        lastSync: Date.now(),
        pendingUploads: remainingQueue.length,
        syncInProgress: false,
        nextScheduledSync: Date.now() + 60 * 60 * 1000
      };
    } catch (error) {
      console.error('Sync failed:', error);
      return {
        lastSync: 0,
        pendingUploads: 0,
        syncInProgress: false,
        nextScheduledSync: Date.now() + 60 * 60 * 1000
      };
    }
  }

  private async syncItem(item: any): Promise<boolean> {
    try {
      const response = await fetch('/api/mobile/v1/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(item),
        timeout: 10000
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to sync item:', error);
      return false;
    }
  }

  private scheduleSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    // Sync every hour when online
    this.syncTimer = setInterval(async () => {
      if (await this.isOnline()) {
        await this.performSync();
      }
    }, 60 * 60 * 1000);
  }

  async isOnline(): Promise<boolean> {
    try {
      const response = await fetch('/api/mobile/v1/model', {
        method: 'HEAD',
        timeout: 5000
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  async getStorageUsage(): Promise<{
    totalSize: number;
    modelSize: number;
    cacheSize: number;
    analysisSize: number;
    available: number;
  }> {
    try {
      const usage = await this.storageService.getStorageUsage();
      return usage;
    } catch (error) {
      console.error('Failed to get storage usage:', error);
      return {
        totalSize: 0,
        modelSize: 0,
        cacheSize: 0,
        analysisSize: 0,
        available: 1000000000 // 1GB default
      };
    }
  }

  async clearCache(): Promise<void> {
    try {
      await this.storageService.clearCache();
      console.log('Cache cleared successfully');
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  async optimizeStorage(): Promise<void> {
    try {
      // Remove old analysis results (keep last 30 days)
      const cutoffDate = Date.now() - 30 * 24 * 60 * 60 * 1000;
      await this.storageService.cleanOldAnalyses(cutoffDate);

      // Remove failed sync items
      await this.storageService.clearFailedSyncs();

      // Compress cached data
      await this.storageService.compressCache();

      console.log('Storage optimized successfully');
    } catch (error) {
      console.error('Failed to optimize storage:', error);
    }
  }

  destroy(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }
  }
}