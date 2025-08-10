import { db } from './db';
import { scamTrends, newsItems } from '../shared/schema';
import { desc, eq, like, and, or, sql, asc } from 'drizzle-orm';

export interface FilterOptions {
  category?: string[];
  severity?: string[];
  agency?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  tags?: string[];
  searchQuery?: string;
  sortBy?: 'date' | 'reports' | 'relevance';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface SavedFilter {
  id: string;
  userId?: string;
  name: string;
  description?: string;
  filters: FilterOptions;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class FilterService {
  
  // Filter scam trends with advanced options
  async filterScamTrends(filters: FilterOptions = {}) {
    try {
      const baseQuery = db.select().from(scamTrends).where(eq(scamTrends.isActive, true));
      
      // For now, use simpler filtering approach 
      let results = await baseQuery.orderBy(desc(scamTrends.lastReported)).limit(filters.limit || 50);
      
      // Apply client-side filtering for search if needed
      if (filters.searchQuery) {
        const searchTerm = filters.searchQuery.toLowerCase();
        results = results.filter(trend => 
          trend.title.toLowerCase().includes(searchTerm) ||
          trend.description.toLowerCase().includes(searchTerm)
        );
      }

      // Apply category filter
      if (filters.category && filters.category.length > 0) {
        results = results.filter(trend => filters.category!.includes(trend.category));
      }

      // Apply severity filter  
      if (filters.severity && filters.severity.length > 0) {
        results = results.filter(trend => filters.severity!.includes(trend.severity));
      }

      // Apply agency filter
      if (filters.agency && filters.agency.length > 0) {
        results = results.filter(trend => filters.agency!.includes(trend.sourceAgency));
      }

      return results;
    } catch (error) {
      console.error('Filter scam trends error:', error);
      return [];
    }
  }

  // Filter news items with advanced options  
  async filterNewsItems(filters: FilterOptions = {}) {
    try {
      const baseQuery = db.select().from(newsItems).where(eq(newsItems.isVerified, true));
      
      let results = await baseQuery.orderBy(desc(newsItems.publishDate)).limit(filters.limit || 20);
      
      // Apply client-side filtering for search if needed
      if (filters.searchQuery) {
        const searchTerm = filters.searchQuery.toLowerCase();
        results = results.filter(item => 
          item.title.toLowerCase().includes(searchTerm) ||
          item.summary.toLowerCase().includes(searchTerm) ||
          item.content.toLowerCase().includes(searchTerm)
        );
      }

      // Apply category filter
      if (filters.category && filters.category.length > 0) {
        results = results.filter(item => filters.category!.includes(item.category));
      }

      // Apply agency filter
      if (filters.agency && filters.agency.length > 0) {
        results = results.filter(item => filters.agency!.includes(item.sourceAgency));
      }

      return results;
    } catch (error) {
      console.error('Filter news items error:', error);
      return [];
    }
  }

  // Get filter options for dropdowns
  async getFilterOptions() {
    try {
      // Get sample data to extract unique values
      const trends = await db.select().from(scamTrends).where(eq(scamTrends.isActive, true)).limit(100);
      const news = await db.select().from(newsItems).where(eq(newsItems.isVerified, true)).limit(100);

      const trendCategories = Array.from(new Set(trends.map(t => t.category)));
      const newsCategories = Array.from(new Set(news.map(n => n.category)));
      const trendAgencies = Array.from(new Set(trends.map(t => t.sourceAgency)));
      const newsAgencies = Array.from(new Set(news.map(n => n.sourceAgency)));

      const allTags: string[] = [];
      trends.forEach(trend => {
        if (trend.tags && Array.isArray(trend.tags)) {
          trend.tags.forEach((tag: string) => {
            if (!allTags.includes(tag)) {
              allTags.push(tag);
            }
          });
        }
      });

      return {
        categories: {
          trends: trendCategories,
          news: newsCategories,
          all: Array.from(new Set([...trendCategories, ...newsCategories]))
        },
        agencies: {
          trends: trendAgencies,
          news: newsAgencies,
          all: Array.from(new Set([...trendAgencies, ...newsAgencies]))
        },
        severities: ['critical', 'high', 'medium', 'low'],
        tags: allTags.sort(),
        sortOptions: [
          { value: 'date', label: 'Most Recent' },
          { value: 'reports', label: 'Most Reported' },
          { value: 'relevance', label: 'Most Relevant' }
        ]
      };
    } catch (error) {
      console.error('Get filter options error:', error);
      return {
        categories: { trends: [], news: [], all: [] },
        agencies: { trends: [], news: [], all: [] },
        severities: ['critical', 'high', 'medium', 'low'],
        tags: [],
        sortOptions: [
          { value: 'date', label: 'Most Recent' },
          { value: 'reports', label: 'Most Reported' },
          { value: 'relevance', label: 'Most Relevant' }
        ]
      };
    }
  }

  // Search across all content
  async globalSearch(query: string, options: { limit?: number; offset?: number } = {}) {
    try {
      const searchTerm = query.toLowerCase();
      const limit = options.limit || 10;

      // Get trends and news
      const trends = await db.select().from(scamTrends).where(eq(scamTrends.isActive, true)).limit(50);
      const news = await db.select().from(newsItems).where(eq(newsItems.isVerified, true)).limit(50);

      // Filter by search term
      const filteredTrends = trends.filter(trend =>
        trend.title.toLowerCase().includes(searchTerm) ||
        trend.description.toLowerCase().includes(searchTerm)
      ).slice(0, Math.floor(limit / 2));

      const filteredNews = news.filter(item =>
        item.title.toLowerCase().includes(searchTerm) ||
        item.summary.toLowerCase().includes(searchTerm) ||
        item.content.toLowerCase().includes(searchTerm)
      ).slice(0, Math.floor(limit / 2));

      const results = [
        ...filteredTrends.map(r => ({
          id: r.id,
          title: r.title,
          description: r.description,
          type: 'trend',
          category: r.category,
          agency: r.sourceAgency,
          date: r.lastReported,
          url: r.sourceUrl,
          severity: r.severity,
          reports: r.reportCount
        })),
        ...filteredNews.map(r => ({
          id: r.id,
          title: r.title,
          description: r.summary,
          type: 'news',
          category: r.category,
          agency: r.sourceAgency,
          date: r.publishDate,
          url: r.sourceUrl,
          reliability: r.reliability
        }))
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return {
        query,
        results,
        total: results.length
      };
    } catch (error) {
      console.error('Global search error:', error);
      return { query, results: [], total: 0 };
    }
  }

  // Generate summary statistics
  async getStatistics(filters: FilterOptions = {}) {
    try {
      const trends = await this.filterScamTrends(filters);
      const news = await this.filterNewsItems(filters);

      const totalReports = trends.reduce((sum, trend) => sum + (trend.reportCount || 0), 0);
      const criticalTrends = trends.filter(t => t.severity === 'critical').length;
      const highSeverityTrends = trends.filter(t => t.severity === 'high').length;

      const agencyBreakdown: { [key: string]: number } = {};
      trends.forEach(trend => {
        agencyBreakdown[trend.sourceAgency] = (agencyBreakdown[trend.sourceAgency] || 0) + 1;
      });

      const categoryBreakdown: { [key: string]: number } = {};
      trends.forEach(trend => {
        categoryBreakdown[trend.category] = (categoryBreakdown[trend.category] || 0) + 1;
      });

      const newsAgencyBreakdown: { [key: string]: number } = {};
      news.forEach(item => {
        newsAgencyBreakdown[item.sourceAgency] = (newsAgencyBreakdown[item.sourceAgency] || 0) + 1;
      });

      const averageReliability = news.length > 0 
        ? news.reduce((sum, item) => sum + item.reliability, 0) / news.length 
        : 0;

      return {
        trends: {
          total: trends.length,
          critical: criticalTrends,
          high: highSeverityTrends,
          totalReports,
          byAgency: agencyBreakdown,
          byCategory: categoryBreakdown
        },
        news: {
          total: news.length,
          byAgency: newsAgencyBreakdown,
          averageReliability
        }
      };
    } catch (error) {
      console.error('Get statistics error:', error);
      return {
        trends: { total: 0, critical: 0, high: 0, totalReports: 0, byAgency: {}, byCategory: {} },
        news: { total: 0, byAgency: {}, averageReliability: 0 }
      };
    }
  }
}

export const filterService = new FilterService();