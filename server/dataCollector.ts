import Parser from 'rss-parser';
import { db } from './db';
import { scamTrends, newsItems, dataSources } from '../shared/schema';
import { eq, desc } from 'drizzle-orm';
import { mobileNotificationService } from './mobileNotificationService';

interface RSSFeed {
  name: string;
  url: string;
  category: string;
  reliability: number;
  agency: string;
}

// Verified RSS feeds from trusted government sources
const TRUSTED_FEEDS: RSSFeed[] = [
  {
    name: 'FTC Consumer Alerts',
    url: 'https://www.consumer.ftc.gov/rss/consumer-alerts.xml',
    category: 'government',
    reliability: 0.95,
    agency: 'FTC'
  },
  {
    name: 'FBI IC3 Press Releases',
    url: 'https://www.fbi.gov/feeds/ic3-press-releases/rss.xml',
    category: 'government',
    reliability: 0.98,
    agency: 'FBI'
  },
  {
    name: 'AARP Fraud Watch',
    url: 'https://www.aarp.org/money/scams-fraud/feed.rss',
    category: 'consumer-protection',
    reliability: 0.85,
    agency: 'AARP'
  },
  {
    name: 'BBB Scam Alerts',
    url: 'https://www.bbb.org/all/scamtracker/rss',
    category: 'consumer-protection',
    reliability: 0.80,
    agency: 'BBB'
  },
  {
    name: 'Social Security Admin Alerts',
    url: 'https://blog.ssa.gov/feed/',
    category: 'government',
    reliability: 0.93,
    agency: 'SSA'
  }
];

export class DataCollector {
  private parser: Parser;

  constructor() {
    this.parser = new Parser({
      timeout: 10000,
      headers: {
        'User-Agent': 'Boomer-Buddy-Data-Collector/1.0'
      }
    });
  }

  async collectAllData(): Promise<void> {
    console.log('Starting data collection from verified sources...');
    
    for (const feed of TRUSTED_FEEDS) {
      try {
        await this.collectFromFeed(feed);
        await this.delay(2000); // Rate limiting - be respectful
      } catch (error) {
        console.error(`Failed to collect from ${feed.name}:`, error);
        await this.logDataSourceError(feed, error as Error);
      }
    }

    await this.updateDataSourceStatus();
    console.log('Data collection completed');
  }

  private async collectFromFeed(feed: RSSFeed): Promise<void> {
    console.log(`Collecting from ${feed.name}...`);
    
    try {
      const parsedFeed = await this.parser.parseURL(feed.url);
      
      for (const item of parsedFeed.items) {
        if (this.isScamRelated(item)) {
          await this.processScamTrend(item, feed);
        }
        await this.processNewsItem(item, feed);
      }

      await this.logSuccessfulCollection(feed);
    } catch (error) {
      throw new Error(`RSS parsing failed for ${feed.name}: ${error}`);
    }
  }

  private isScamRelated(item: any): boolean {
    const scamKeywords = [
      'scam', 'fraud', 'phishing', 'identity theft', 'robocall',
      'fake', 'counterfeit', 'imposter', 'social security',
      'medicare', 'romance scam', 'tech support', 'irs scam'
    ];
    
    const content = `${item.title} ${item.contentSnippet || item.content || ''}`.toLowerCase();
    return scamKeywords.some(keyword => content.includes(keyword));
  }

  private async processScamTrend(item: any, feed: RSSFeed): Promise<void> {
    const existingTrend = await db.select()
      .from(scamTrends)
      .where(eq(scamTrends.sourceUrl, item.link))
      .limit(1);

    if (existingTrend.length > 0) {
      // Update report count and last seen
      await db.update(scamTrends)
        .set({
          reportCount: existingTrend[0].reportCount + 1,
          lastReported: new Date(),
          updatedAt: new Date()
        })
        .where(eq(scamTrends.id, existingTrend[0].id));
      return;
    }

    const severity = this.calculateSeverity(item, feed);
    const category = this.categorizeScam(item);
    
    const [newTrend] = await db.insert(scamTrends).values({
      title: this.sanitizeTitle(item.title),
      description: this.extractDescription(item),
      category,
      severity,
      reportCount: 1,
      affectedRegions: ['national'], // Most government alerts are national
      sourceAgency: feed.agency,
      sourceUrl: item.link,
      verificationStatus: 'verified',
      tags: this.extractTags(item),
      firstReported: new Date(item.pubDate || Date.now()),
      lastReported: new Date(item.pubDate || Date.now()),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    console.log(`Added new scam trend: ${item.title.substring(0, 50)}...`);
    
    // Send mobile notification for critical/high severity trends
    if (severity === 'critical' || severity === 'high') {
      await mobileNotificationService.notifyNewCriticalTrend(newTrend);
    }
  }

  private async processNewsItem(item: any, feed: RSSFeed): Promise<void> {
    const existingNews = await db.select()
      .from(newsItems)
      .where(eq(newsItems.sourceUrl, item.link))
      .limit(1);

    if (existingNews.length > 0) return;

    const [newNews] = await db.insert(newsItems).values({
      title: this.sanitizeTitle(item.title),
      summary: this.extractSummary(item),
      content: this.extractContent(item),
      category: feed.category,
      sourceAgency: feed.agency,
      sourceUrl: item.link,
      sourceName: feed.name,
      reliability: feed.reliability,
      publishDate: new Date(item.pubDate || Date.now()),
      isVerified: feed.reliability >= 0.85,
      relatedTrends: [],
      createdAt: new Date()
    }).returning();

    console.log(`Added new news item: ${item.title.substring(0, 50)}...`);
    
    // Send mobile notification for verified news
    if (feed.reliability >= 0.85) {
      await mobileNotificationService.notifyVerifiedNews(newNews);
    }
  }

  private calculateSeverity(item: any, feed: RSSFeed): 'critical' | 'high' | 'medium' | 'low' {
    const content = `${item.title} ${item.contentSnippet || ''}`.toLowerCase();
    
    if (content.includes('urgent') || content.includes('immediate') || feed.agency === 'FBI') {
      return 'critical';
    }
    if (content.includes('widespread') || content.includes('national') || feed.reliability >= 0.9) {
      return 'high';
    }
    if (feed.reliability >= 0.8) {
      return 'medium';
    }
    return 'low';
  }

  private categorizeScam(item: any): string {
    const content = `${item.title} ${item.contentSnippet || ''}`.toLowerCase();
    
    if (content.includes('social security') || content.includes('ssa')) return 'social-security';
    if (content.includes('medicare') || content.includes('health')) return 'medicare';
    if (content.includes('irs') || content.includes('tax')) return 'tax-scam';
    if (content.includes('romance') || content.includes('dating')) return 'romance-scam';
    if (content.includes('tech support') || content.includes('computer')) return 'tech-support';
    if (content.includes('phone') || content.includes('robocall')) return 'phone-scam';
    if (content.includes('email') || content.includes('phishing')) return 'phishing';
    if (content.includes('investment') || content.includes('crypto')) return 'investment-scam';
    
    return 'other';
  }

  private extractTags(item: any): string[] {
    const content = `${item.title} ${item.contentSnippet || ''}`.toLowerCase();
    const tags: string[] = [];
    
    const tagKeywords = {
      'elderly-target': ['senior', 'elderly', 'medicare', 'social security'],
      'financial': ['money', 'payment', 'bank', 'credit', 'debt'],
      'identity-theft': ['identity', 'personal info', 'ssn', 'social security number'],
      'phone-scam': ['phone', 'call', 'robocall', 'voicemail'],
      'online': ['email', 'internet', 'website', 'online', 'phishing']
    };

    for (const [tag, keywords] of Object.entries(tagKeywords)) {
      if (keywords.some(keyword => content.includes(keyword))) {
        tags.push(tag);
      }
    }

    return tags;
  }

  private sanitizeTitle(title: string): string {
    return title.trim().substring(0, 200);
  }

  private extractDescription(item: any): string {
    return (item.contentSnippet || item.content || item.summary || '').trim().substring(0, 500);
  }

  private extractSummary(item: any): string {
    return (item.contentSnippet || item.summary || '').trim().substring(0, 300);
  }

  private extractContent(item: any): string {
    return (item.content || item.contentSnippet || item.summary || '').trim().substring(0, 1000);
  }

  private async logSuccessfulCollection(feed: RSSFeed): Promise<void> {
    await db.insert(dataSources).values({
      name: feed.name,
      url: feed.url,
      agency: feed.agency,
      lastChecked: new Date(),
      status: 'active',
      reliability: feed.reliability,
      lastError: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }).onConflictDoUpdate({
      target: dataSources.url,
      set: {
        lastChecked: new Date(),
        status: 'active',
        lastError: null,
        updatedAt: new Date()
      }
    });
  }

  private async logDataSourceError(feed: RSSFeed, error: Error): Promise<void> {
    await db.insert(dataSources).values({
      name: feed.name,
      url: feed.url,
      agency: feed.agency,
      lastChecked: new Date(),
      status: 'error',
      reliability: feed.reliability,
      lastError: error.message,
      createdAt: new Date(),
      updatedAt: new Date()
    }).onConflictDoUpdate({
      target: dataSources.url,
      set: {
        lastChecked: new Date(),
        status: 'error',
        lastError: error.message,
        updatedAt: new Date()
      }
    });
  }

  private async updateDataSourceStatus(): Promise<void> {
    console.log('Updating data source status...');
    // Additional status updates can be added here
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Auto-run data collection every 6 hours
export function startDataCollection(): void {
  const collector = new DataCollector();
  
  // Run immediately
  collector.collectAllData();
  
  // Run every 6 hours
  setInterval(() => {
    collector.collectAllData();
  }, 6 * 60 * 60 * 1000);
}