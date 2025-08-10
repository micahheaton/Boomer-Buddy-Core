/**
 * ARCHIVE MANAGER - 3-Month Alert Lifecycle System
 * 
 * Manages automatic archiving of alerts older than 3 months
 * Creates searchable archive for historical scam trend analysis
 */

import { db } from './db';
import { scamTrends, newsItems } from '../shared/schema';
import { eq, lt, and } from 'drizzle-orm';

interface ArchivedAlert {
  id: string;
  title: string;
  description: string;
  url?: string;
  source: string;
  sourceAgency: string;
  category: string;
  severity: string;
  publishedAt: Date;
  archivedAt: Date;
  elderRelevanceScore?: number;
  scamTypes?: string[];
  tags?: string[];
}

export class ArchiveManager {
  
  /**
   * Archive alerts older than 3 months
   */
  async archiveExpiredAlerts(): Promise<{ archived: number; errors: number }> {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    console.log(`🗄️ Archiving alerts older than ${threeMonthsAgo.toISOString()}`);
    
    let archivedCount = 0;
    let errorCount = 0;

    try {
      // Find expired scam trends
      const expiredTrends = await db
        .select()
        .from(scamTrends)
        .where(lt(scamTrends.publishedAt, threeMonthsAgo));

      // Find expired news items  
      const expiredNews = await db
        .select()
        .from(newsItems)
        .where(lt(newsItems.publishDate, threeMonthsAgo));

      console.log(`Found ${expiredTrends.length} expired trends and ${expiredNews.length} expired news items`);

      // Archive scam trends
      for (const trend of expiredTrends) {
        try {
          await this.archiveScamTrend(trend);
          archivedCount++;
        } catch (error) {
          console.error(`Failed to archive trend ${trend.id}:`, error);
          errorCount++;
        }
      }

      // Archive news items
      for (const news of expiredNews) {
        try {
          await this.archiveNewsItem(news);
          archivedCount++;
        } catch (error) {
          console.error(`Failed to archive news ${news.id}:`, error);
          errorCount++;
        }
      }

      console.log(`✅ Archive operation completed: ${archivedCount} items archived, ${errorCount} errors`);
      
      return { archived: archivedCount, errors: errorCount };

    } catch (error) {
      console.error('Archive operation failed:', error);
      return { archived: archivedCount, errors: errorCount + 1 };
    }
  }

  /**
   * Archive individual scam trend
   */
  private async archiveScamTrend(trend: any): Promise<void> {
    // In a real implementation, you'd move to an archive table
    // For now, we'll add an 'archived' flag and timestamp
    console.log(`📦 Archiving scam trend: ${trend.title}`);
    
    // Update the trend with archive status
    await db
      .update(scamTrends)
      .set({ 
        category: 'archived',
        updatedAt: new Date()
      })
      .where(eq(scamTrends.id, trend.id));
  }

  /**
   * Archive individual news item
   */
  private async archiveNewsItem(news: any): Promise<void> {
    console.log(`📦 Archiving news item: ${news.title}`);
    
    // Update the news item with archive status
    await db
      .update(newsItems)
      .set({
        category: 'archived',
        updatedAt: new Date()
      })
      .where(eq(newsItems.id, news.id));
  }

  /**
   * Search archived content
   */
  async searchArchive(query: string, filters: {
    startDate?: Date;
    endDate?: Date;
    category?: string;
    severity?: string;
    scamTypes?: string[];
  } = {}): Promise<ArchivedAlert[]> {
    
    try {
      // Search archived scam trends
      const archivedTrends = await db
        .select()
        .from(scamTrends)
        .where(
          and(
            eq(scamTrends.category, 'archived'),
            // Add additional filters as needed
          )
        )
        .limit(100);

      // Search archived news items
      const archivedNews = await db
        .select()  
        .from(newsItems)
        .where(
          and(
            eq(newsItems.category, 'archived'),
            // Add additional filters as needed
          )
        )
        .limit(100);

      // Combine and format results
      const results: ArchivedAlert[] = [
        ...archivedTrends.map(trend => ({
          id: trend.id,
          title: trend.title,
          description: trend.description,
          url: trend.url,
          source: trend.source,
          sourceAgency: trend.sourceType || 'Unknown',
          category: trend.category,
          severity: trend.severity || 'medium',
          publishedAt: new Date(trend.publishedAt),
          archivedAt: new Date(trend.updatedAt || trend.publishedAt),
          elderRelevanceScore: trend.elderRelevanceScore,
          scamTypes: trend.scamTypes,
          tags: trend.tags
        })),
        ...archivedNews.map(news => ({
          id: news.id,
          title: news.title,
          description: news.summary,
          url: news.sourceUrl,
          source: news.sourceAgency || 'Unknown',
          sourceAgency: news.sourceAgency || 'Unknown', 
          category: news.category,
          severity: 'medium',
          publishedAt: new Date(news.publishDate),
          archivedAt: new Date(news.updatedAt || news.publishDate),
          elderRelevanceScore: (news.reliabilityScore || 80) / 100,
          scamTypes: [],
          tags: news.tags
        }))
      ];

      // Filter by search query
      const filteredResults = results.filter(item => 
        !query || 
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.description.toLowerCase().includes(query.toLowerCase()) ||
        item.sourceAgency.toLowerCase().includes(query.toLowerCase())
      );

      return filteredResults.sort((a, b) => 
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );

    } catch (error) {
      console.error('Archive search failed:', error);
      return [];
    }
  }

  /**
   * Get archive statistics
   */
  async getArchiveStats(): Promise<{
    totalArchived: number;
    archivedThisMonth: number;
    topScamTypes: string[];
    timeRange: { oldest: Date; newest: Date };
  }> {
    try {
      const archived = await this.searchArchive('');
      const thisMonth = new Date();
      thisMonth.setMonth(thisMonth.getMonth() - 1);
      
      const archivedThisMonth = archived.filter(item => 
        new Date(item.archivedAt) > thisMonth
      );

      const scamTypes = archived
        .flatMap(item => item.scamTypes || [])
        .reduce((counts: Record<string, number>, type) => {
          counts[type] = (counts[type] || 0) + 1;
          return counts;
        }, {});

      const topScamTypes = Object.entries(scamTypes)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([type]) => type);

      const dates = archived.map(item => new Date(item.publishedAt));
      const oldest = dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : new Date();
      const newest = dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : new Date();

      return {
        totalArchived: archived.length,
        archivedThisMonth: archivedThisMonth.length,
        topScamTypes,
        timeRange: { oldest, newest }
      };

    } catch (error) {
      console.error('Failed to get archive stats:', error);
      return {
        totalArchived: 0,
        archivedThisMonth: 0,
        topScamTypes: [],
        timeRange: { oldest: new Date(), newest: new Date() }
      };
    }
  }
}

export const archiveManager = new ArchiveManager();