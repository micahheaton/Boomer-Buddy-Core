import Parser from 'rss-parser';
import { db } from './db';
import { scamTrends, newsItems, dataSources } from '../shared/schema';
import { eq, desc } from 'drizzle-orm';
import { mobileNotificationService } from './mobileNotificationService';
import { BOOMER_FOCUSED_DATA_SOURCES, isBoomerRelevant, calculateBoomerRelevanceScore } from './boomerFocusedDataSources';
import { intelligentSourceManager } from './intelligentSourceManager';
import { contentModerationSystem } from './contentModerationSystem';

interface RSSFeed {
  name: string;
  url: string;
  category: string;
  reliability: number;
  agency: string;
}

// VERIFIED OFFICIAL GOVERNMENT RSS FEEDS ONLY (.gov/.us domains)
// These URLs are verified working as of August 2025
const TRUSTED_FEEDS: RSSFeed[] = [
  // Federal Trade Commission - WORKING RSS FEED (verified 2025)
  {
    name: 'FTC Consumer Blog - Scam Alerts',
    url: 'https://consumer.ftc.gov/blog/rss',
    category: 'government-consumer',
    reliability: 0.98,
    agency: 'FTC'
  },
  // Social Security Administration - VERIFIED WORKING
  {
    name: 'Social Security Administration Blog',
    url: 'https://blog.ssa.gov/feed/',
    category: 'government-benefits', 
    reliability: 0.95,
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
    try {
      console.log(`🔍 Collecting from ${feed.name} with intelligent filtering...`);
      const feedData = await this.parser.parseURL(feed.url);
      
      if (!feedData.items || feedData.items.length === 0) {
        console.log(`No items found in ${feed.name}`);
        return;
      }

      // Use intelligent source manager to process and filter content
      const sourceId = feed.agency.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const processedItems = await intelligentSourceManager.processContentFromSource(
        sourceId, 
        feedData.items.slice(0, 30) // Process more items but filter intelligently
      );

      // Log filtering results
      const approved = processedItems.filter(item => item.status === 'approved').length;
      const rejected = processedItems.filter(item => item.status === 'rejected').length;
      const reviewing = processedItems.filter(item => item.status === 'reviewing').length;

      console.log(`📊 ${feed.name} Results: ${approved} approved, ${rejected} rejected, ${reviewing} reviewing (${feedData.items.length} total)`);
      
      await this.logSuccessfulCollection(feed);
      
    } catch (error) {
      console.error(`Failed to collect from ${feed.name}:`, error);
      await this.logDataSourceError(feed, error as Error);
      throw new Error(`RSS parsing failed for ${feed.name}: ${error instanceof Error ? error.message : String(error)}`);
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
          reportCount: (existingTrend[0].reportCount || 0) + 1,
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
      // New user-friendly fields
      impactScore: this.calculateImpactScore(item, feed),
      actionableSteps: this.generateActionableSteps(item, feed),
      simplifiedLanguage: this.createSimplifiedSummary(item),
      geographicRelevance: this.extractGeographicRelevance(feed),
      authorityBadge: this.determineAuthorityBadge(feed),
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
      'elderly-target': ['senior', 'elderly', 'medicare', 'social security', 'retirement', 'older adult'],
      'financial': ['money', 'payment', 'bank', 'credit', 'debt', 'investment', 'retirement fund'],
      'identity-theft': ['identity', 'personal info', 'ssn', 'social security number'],
      'phone-scam': ['phone', 'call', 'robocall', 'voicemail', 'telemarketing'],
      'online': ['email', 'internet', 'website', 'online', 'phishing'],
      'tech-support': ['tech support', 'computer virus', 'microsoft', 'apple support'],
      'romance-scam': ['romance', 'dating', 'online dating', 'relationship'],
      'healthcare': ['medicare', 'medicaid', 'prescription', 'health insurance'],
      'government': ['irs', 'social security', 'fbi', 'federal', 'government']
    };

    for (const [tag, keywords] of Object.entries(tagKeywords)) {
      if (keywords.some(keyword => content.includes(keyword))) {
        tags.push(tag);
      }
    }

    // Add boomer relevance score as a tag
    const relevanceScore = calculateBoomerRelevanceScore(item.title || '', item.contentSnippet || '');
    if (relevanceScore >= 7) {
      tags.push('high-boomer-relevance');
    }

    return tags;
  }

  private sanitizeTitle(title: string): string {
    return title.trim().substring(0, 200);
  }

  private extractDescription(item: any): string {
    let description = item.contentSnippet || item.content || item.summary || '';
    
    // Clean HTML tags and entities
    description = description
      .replace(/<[^>]*>/g, ' ') // Remove HTML tags
      .replace(/&[^;]+;/g, ' ') // Remove HTML entities
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    return description.substring(0, 500);
  }

  private extractContent(item: any): string {
    let content = item.content || item.contentSnippet || item.summary || '';
    
    // Clean HTML tags and entities
    content = content
      .replace(/<[^>]*>/g, ' ') // Remove HTML tags
      .replace(/&[^;]+;/g, ' ') // Remove HTML entities
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    return content.substring(0, 1000);
  }

  private extractSummary(item: any): string {
    let summary = item.contentSnippet || item.summary || '';
    
    // Clean HTML tags and entities
    summary = summary
      .replace(/<[^>]*>/g, ' ') // Remove HTML tags  
      .replace(/&[^;]+;/g, ' ') // Remove HTML entities
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    return summary.substring(0, 300);
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

  // New user-friendly enhancement methods
  private calculateImpactScore(item: any, feed: RSSFeed): number {
    let score = 30; // Base score

    // Authority level
    if (feed.agency === 'FBI' || feed.agency === 'FTC') score += 30;
    else if (feed.agency.includes('AG')) score += 20;
    else score += 15;

    // Urgency keywords
    const content = `${item.title} ${item.contentSnippet || ''}`.toLowerCase();
    if (content.includes('urgent') || content.includes('immediate')) score += 25;
    if (content.includes('widespread') || content.includes('national')) score += 20;
    if (content.includes('elderly') || content.includes('senior')) score += 15;

    return Math.min(100, score);
  }

  private generateActionableSteps(item: any, feed: RSSFeed): string[] {
    const content = `${item.title} ${item.contentSnippet || ''}`.toLowerCase();
    const steps: string[] = [];

    // Generic protective steps
    steps.push("Do not provide personal information to unsolicited callers or emails");
    
    if (content.includes('phone') || content.includes('call')) {
      steps.push("Hang up immediately if someone asks for Social Security numbers or bank details");
      steps.push("Call back using the official phone number from the organization's website");
    }
    
    if (content.includes('email') || content.includes('phishing')) {
      steps.push("Do not click links in suspicious emails");
      steps.push("Type website addresses directly into your browser");
    }
    
    if (content.includes('social security') || content.includes('medicare')) {
      steps.push("Remember: Government agencies never call demanding immediate payment");
      steps.push("Contact the agency directly using their official phone number");
    }

    steps.push("Report this scam to your local authorities and the FTC at reportfraud.ftc.gov");
    
    return steps;
  }

  private createSimplifiedSummary(item: any): string {
    const title = item.title || '';
    const content = item.contentSnippet || item.content || '';
    
    // Create a simple, plain-language summary
    let summary = `Scammers are targeting people `;
    
    if (title.toLowerCase().includes('social security')) {
      summary += `by pretending to be from Social Security. They claim there's a problem with your benefits or account.`;
    } else if (title.toLowerCase().includes('medicare')) {
      summary += `by pretending to be from Medicare. They may offer fake benefits or ask for your Medicare number.`;
    } else if (title.toLowerCase().includes('irs') || title.toLowerCase().includes('tax')) {
      summary += `by pretending to be from the IRS. They claim you owe taxes and demand immediate payment.`;
    } else if (title.toLowerCase().includes('tech support')) {
      summary += `by pretending to fix computer problems. They want remote access to your computer.`;
    } else {
      summary += `with a new type of fraud. Be extra careful with unexpected contact.`;
    }
    
    return summary;
  }

  private extractGeographicRelevance(feed: RSSFeed): string[] {
    const relevance: string[] = [];
    
    if (feed.agency.includes('CA')) relevance.push('California');
    if (feed.agency.includes('WA')) relevance.push('Washington');
    if (feed.agency === 'FTC' || feed.agency === 'FBI' || feed.agency === 'SSA') {
      relevance.push('All U.S. States');
    }
    
    if (relevance.length === 0) relevance.push('Nationwide');
    
    return relevance;
  }

  private determineAuthorityBadge(feed: RSSFeed): 'federal' | 'state' | 'nonprofit' {
    if (feed.agency === 'FTC' || feed.agency === 'FBI' || feed.agency === 'SSA' || feed.agency === 'HHS-OIG' || feed.agency === 'CISA') {
      return 'federal';
    }
    if (feed.agency.includes('AG') || feed.agency.includes('WA') || feed.agency.includes('CA')) {
      return 'state';
    }
    return 'nonprofit';
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