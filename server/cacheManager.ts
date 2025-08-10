import { db } from "./db";
import { scamTrends, newsItems, dataSources } from "@shared/schema";
import { desc, eq, gt, sql, and, gte } from "drizzle-orm";
import { WebSocketServer, WebSocket } from 'ws';

interface CachedData {
  alerts: any[];
  statistics: any;
  metadata: any;
  lastUpdated: Date;
  version: number;
}

export class CacheManager {
  private cache: CachedData | null = null;
  private isUpdating = false;
  private wss: WebSocketServer | null = null;
  private updateInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Initialize cache on startup
    this.refreshCache();
    
    // Set up periodic cache refresh every 6 hours
    this.updateInterval = setInterval(() => {
      this.refreshCache(true);
    }, 6 * 60 * 60 * 1000); // 6 hours
  }

  setWebSocketServer(wss: WebSocketServer) {
    this.wss = wss;
  }

  async getCachedData(): Promise<CachedData> {
    // Return cached data immediately if available
    if (this.cache && !this.isStale()) {
      return this.cache;
    }

    // If cache is stale or missing, refresh it
    if (!this.isUpdating) {
      this.refreshCache();
    }

    // Return existing cache while update happens in background
    return this.cache || await this.buildInitialCache();
  }

  private isStale(): boolean {
    if (!this.cache) return true;
    
    // Cache is stale if it's older than 6 hours
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
    return this.cache.lastUpdated < sixHoursAgo;
  }

  async refreshCache(notifyClients = false): Promise<void> {
    if (this.isUpdating) return;
    
    this.isUpdating = true;
    console.log('🔄 Refreshing cache with latest data...');

    try {
      const lastUpdate = this.cache?.lastUpdated || new Date(0);
      
      // Check for new data since last update
      const newTrends = await db.select()
        .from(scamTrends)
        .where(gt(scamTrends.updatedAt, lastUpdate));

      const newNews = await db.select()
        .from(newsItems)
        .where(gt(newsItems.updatedAt, lastUpdate));

      console.log(`📊 Found ${newTrends.length} new trends, ${newNews.length} new news items`);

      // If we have new data or no cache, rebuild completely
      if (newTrends.length > 0 || newNews.length > 0 || !this.cache) {
        await this.buildCache();
        
        if (notifyClients && this.wss) {
          this.notifyClients();
        }
      }
    } catch (error) {
      console.error('❌ Error refreshing cache:', error);
    } finally {
      this.isUpdating = false;
    }
  }

  private async buildInitialCache(): Promise<CachedData> {
    console.log('🏗️ Building initial cache...');
    await this.buildCache();
    return this.cache!;
  }

  private async buildCache(): Promise<void> {
    // Calculate 3-month cutoff date for alert expiry
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    // Get all active data - only alerts within 3 months
    const trendsData = await db.select()
      .from(scamTrends)
      .where(
        and(
          eq(scamTrends.isActive, true),
          gte(scamTrends.lastReported, threeMonthsAgo)
        )
      )
      .orderBy(desc(scamTrends.lastReported))
      .limit(100);

    const newsItemsData = await db.select()
      .from(newsItems)
      .where(
        and(
          eq(newsItems.isVerified, true),
          gte(newsItems.publishDate, threeMonthsAgo)
        )
      )
      .orderBy(desc(newsItems.publishDate))
      .limit(50);

    // Get data sources stats
    const totalSources = await db.select({ count: sql<number>`count(*)` }).from(dataSources);
    const activeSources = await db.select({ count: sql<number>`count(*)` })
      .from(dataSources)
      .where(eq(dataSources.status, 'active'));

    // Combine all data into unified format
    const alerts = [
      ...trendsData.map(trend => ({
        id: trend.id,
        title: trend.title,
        description: trend.description,
        url: trend.sourceUrl || '#',
        severity: trend.severity || 'medium',
        category: trend.category || 'General',
        timestamp: trend.lastReported || trend.createdAt,
        sourceAgency: trend.sourceAgency || 'Government Source',
        isScamAlert: true,
        type: 'scam-alert' as const,
        scamTypes: trend.affectedRegions || [],
        elderRelevanceScore: 85
      })),
      ...newsItemsData.map(item => ({
        id: item.id,
        title: item.title,
        description: item.summary?.substring(0, 150) + '...' || 'Government News Update',
        url: item.sourceUrl || '#',
        severity: item.category?.includes('alert') ? 'high' : 'medium',
        category: item.category || 'Government News',
        timestamp: item.publishDate || item.createdAt,
        sourceAgency: item.sourceAgency || 'Government Source',
        isScamAlert: false,
        type: 'news' as const,
        elderRelevanceScore: item.elderRelevanceScore || 75
      }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Calculate real-time statistics
    const scamAlerts = alerts.filter(a => a.isScamAlert);
    const newsItemsFiltered = alerts.filter(a => !a.isScamAlert);
    const highSeverity = alerts.filter(a => a.severity === 'high' || a.severity === 'critical');
    const todayAlerts = alerts.filter(a => 
      new Date(a.timestamp).toDateString() === new Date().toDateString()
    );

    const statistics = {
      totalActiveAlerts: alerts.length,
      highSeverityAlerts: highSeverity.length,
      scamAlertsToday: scamAlerts.filter(a => 
        new Date(a.timestamp).toDateString() === new Date().toDateString()
      ).length,
      governmentAdvisories: newsItemsFiltered.length,
      dataSourcesOnline: activeSources[0]?.count || 0,
      lastUpdate: new Date().toISOString(),
      coverage: "All 50 States + Federal Agencies (Comprehensive Collection)"
    };

    const metadata = {
      total: alerts.length,
      scamTrends: scamAlerts.length,
      newsItems: newsItemsFiltered.length,
      lastUpdated: new Date().toISOString()
    };

    this.cache = {
      alerts,
      statistics,
      metadata,
      lastUpdated: new Date(),
      version: (this.cache?.version || 0) + 1
    };

    console.log(`✅ Cache updated with ${alerts.length} alerts (v${this.cache.version})`);
  }

  private notifyClients(): void {
    if (!this.wss || !this.cache) return;

    const updateMessage = JSON.stringify({
      type: 'cache-update',
      version: this.cache.version,
      timestamp: this.cache.lastUpdated.toISOString(),
      summary: {
        totalAlerts: this.cache.alerts.length,
        newTrends: this.cache.metadata.scamTrends,
        newNews: this.cache.metadata.newsItems
      }
    });

    this.wss.clients.forEach((client) => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(updateMessage);
      }
    });

    console.log(`📡 Notified ${this.wss.clients.size} clients of cache update`);
  }

  async forceRefresh(): Promise<void> {
    console.log('🔄 Force refreshing cache...');
    this.cache = null;
    await this.refreshCache(true);
  }

  getCacheStats() {
    return {
      cached: !!this.cache,
      lastUpdated: this.cache?.lastUpdated,
      version: this.cache?.version,
      alertCount: this.cache?.alerts.length,
      isStale: this.isStale(),
      isUpdating: this.isUpdating
    };
  }

  destroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }
}

export const cacheManager = new CacheManager();