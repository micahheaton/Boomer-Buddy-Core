import Parser from 'rss-parser';
import { db } from './db';
import { scamTrends, newsItems, dataSources } from '../shared/schema';
import { eq, desc } from 'drizzle-orm';
import { mobileNotificationService } from './mobileNotificationService';
import { BOOMER_FOCUSED_DATA_SOURCES, isBoomerRelevant, calculateBoomerRelevanceScore } from './boomerFocusedDataSources';
import { intelligentSourceManager } from './intelligentSourceManager';
import { contentModerationSystem } from './contentModerationSystem';
import { intelligentFeedParser } from './intelligentFeedParser';

interface RSSFeed {
  name: string;
  url: string;
  category: string;
  reliability: number;
  agency: string;
}

// COMPREHENSIVE OFFICIAL GOVERNMENT RSS FEEDS ONLY (.gov/.us domains)
// Updated with GPT-4 curated list of verified sources (August 2025)
const TRUSTED_FEEDS: RSSFeed[] = [
  // === CORE U.S. FEDERAL SCAM/FRAUD FEEDS ===
  
  // Federal Trade Commission - Consumer Protection Alerts
  {
    name: 'FTC Consumer Protection RSS',
    url: 'https://www.ftc.gov/stay-connected/rss',
    category: 'federal-consumer-protection',
    reliability: 0.98,
    agency: 'FTC'
  },
  {
    name: 'FTC Consumer Blog - Scam Alerts',
    url: 'https://consumer.ftc.gov/blog/rss',
    category: 'federal-consumer-protection',
    reliability: 0.98,
    agency: 'FTC'
  },
  
  // FBI - National Security & Field Offices
  {
    name: 'FBI National Press Releases',
    url: 'https://www.fbi.gov/feeds',
    category: 'federal-law-enforcement',
    reliability: 0.99,
    agency: 'FBI'
  },
  
  // FBI Internet Crime Complaint Center (IC3)
  {
    name: 'FBI IC3 Public Service Announcements',
    url: 'https://www.ic3.gov/PSA',
    category: 'federal-cybercrime',
    reliability: 0.97,
    agency: 'FBI-IC3'
  },
  {
    name: 'FBI IC3 Industry Alerts',
    url: 'https://www.ic3.gov/CSA',
    category: 'federal-cybercrime',
    reliability: 0.97,
    agency: 'FBI-IC3'
  },
  
  // Department of Justice - Elder Justice Initiative
  {
    name: 'DOJ Elder Justice Initiative',
    url: 'https://www.justice.gov/elderjustice/elder-justice-initiative-press-room',
    category: 'federal-elder-justice',
    reliability: 0.96,
    agency: 'DOJ'
  },
  
  // Securities and Exchange Commission (SEC)
  {
    name: 'SEC Investor Alerts & Bulletins',
    url: 'https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins',
    category: 'federal-financial-fraud',
    reliability: 0.95,
    agency: 'SEC'
  },
  
  // Consumer Financial Protection Bureau (CFPB)
  {
    name: 'CFPB Consumer Blog',
    url: 'https://www.consumerfinance.gov/about-us/blog/',
    category: 'federal-financial-protection',
    reliability: 0.94,
    agency: 'CFPB'
  },
  
  // Federal Communications Commission (FCC)
  {
    name: 'FCC Consumer Scam Alerts',
    url: 'https://www.fcc.gov/news-events/rss-feeds-and-email-updates-fcc',
    category: 'federal-communications',
    reliability: 0.93,
    agency: 'FCC'
  },
  
  // Health & Human Services Office of Inspector General
  {
    name: 'HHS-OIG Special Fraud Alerts',
    url: 'https://oig.hhs.gov/compliance/alerts/',
    category: 'federal-healthcare-fraud',
    reliability: 0.96,
    agency: 'HHS-OIG'
  },
  
  // Cybersecurity and Infrastructure Security Agency (CISA)
  {
    name: 'CISA Security Alerts & Advisories',
    url: 'https://www.cisa.gov/about/contact-us/subscribe-updates-cisa',
    category: 'federal-cybersecurity',
    reliability: 0.97,
    agency: 'CISA'
  },
  
  // Social Security Administration - VERIFIED WORKING
  {
    name: 'Social Security Administration Blog',
    url: 'https://blog.ssa.gov/feed/',
    category: 'federal-benefits', 
    reliability: 0.95,
    agency: 'SSA'
  },
  
  // === STATE-LEVEL ATTORNEY GENERAL FEEDS ===
  
  // Washington State Attorney General (Model for other states)
  {
    name: 'Washington State AG Consumer Alerts',
    url: 'https://www.atg.wa.gov/feeds',
    category: 'state-attorney-general',
    reliability: 0.90,
    agency: 'WA-AG'
  },
  
  // === TRUSTED .ORG ELDER-FOCUSED SOURCES ===
  
  // AARP - Elder-focused fraud alerts
  {
    name: 'AARP Fraud & Scams Alerts',
    url: 'https://press.aarp.org/rss',
    category: 'nonprofit-elder-focused',
    reliability: 0.88,
    agency: 'AARP'
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

      // Use intelligent feed parser to filter and process items
      const parsedItems = intelligentFeedParser.processMultipleItems(
        feedData.items, 
        { name: feed.name, agency: feed.agency, category: feed.category }
      );

      console.log(`📊 Processed ${parsedItems.length} relevant items from ${feedData.items.length} total items`);

      for (const item of parsedItems) {
        await this.storeProcessedItem(item, feed);
      }
    } catch (error) {
      console.error(`Failed to collect from ${feed.name}:`, error);
      throw error;
    }
  }

  private async storeProcessedItem(item: any, feed: RSSFeed): Promise<void> {
    try {
      // Check if item already exists
      const existingItem = await db
        .select()
        .from(scamTrends)
        .where(eq(scamTrends.id, item.id))
        .limit(1);

      if (existingItem.length > 0) {
        console.log(`Skipping duplicate item: ${item.title}`);
        return;
      }

      // Store in scamTrends table
      await db.insert(scamTrends).values({
        id: item.id,
        title: item.title,
        description: item.description,
        severity: item.severity,
        category: item.category,
        reportCount: item.reportCount,
        affectedRegions: item.affectedRegions,
        sourceAgency: item.sourceAgency,
        firstReported: item.publishedAt,
        lastReported: item.publishedAt,
        sources: [{
          name: item.source,
          url: item.link,
          reliability: feed.reliability,
          lastUpdated: new Date().toISOString()
        }],
        elderRelevanceScore: item.elderRelevanceScore
      });

      // Also store in newsItems for news feed
      await db.insert(newsItems).values({
        id: `news-${item.id}`,
        title: item.title,
        summary: item.description,
        publishDate: item.publishedAt,
        sourceUrl: item.link,
        sourceAgency: item.sourceAgency,
        category: item.category,
        tags: item.tags,
        reliabilityScore: Math.round(feed.reliability * 100)
      });

      console.log(`✅ Stored: ${item.title} (Elder relevance: ${Math.round(item.elderRelevanceScore * 100)}%)`);

    } catch (error) {
      console.error(`Failed to store item ${item.title}:`, error);
    }
  }

  // Continue with existing methods from old version
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async logDataSourceError(feed: RSSFeed, error: Error): Promise<void> {
    try {
      await db.insert(dataSources).values({
        id: `source-${feed.name.toLowerCase().replace(/\s+/g, '-')}`,
        name: feed.name,
        url: feed.url,
        category: feed.category,
        isActive: false,
        reliability: Math.max(0, feed.reliability - 0.1),
        lastChecked: new Date(),
        errorMessage: error.message,
        successfulFetches: 0,
        failedFetches: 1
      }).onConflictDoUpdate({
        target: dataSources.id,
        set: {
          isActive: false,
          errorMessage: error.message,
          failedFetches: dataSources.failedFetches + 1,
          lastChecked: new Date()
        }
      });
    } catch (dbError) {
      console.error('Failed to log data source error:', dbError);
    }
  }

  private async updateDataSourceStatus(): Promise<void> {
    console.log('Updating data source status...');
    
    for (const feed of TRUSTED_FEEDS) {
      try {
        await db.insert(dataSources).values({
          id: `source-${feed.name.toLowerCase().replace(/\s+/g, '-')}`,
          name: feed.name,
          url: feed.url,
          category: feed.category,
          isActive: true,
          reliability: feed.reliability,
          lastChecked: new Date(),
          successfulFetches: 1,
          failedFetches: 0
        }).onConflictDoUpdate({
          target: dataSources.id,
          set: {
            isActive: true,
            reliability: feed.reliability,
            lastChecked: new Date(),
            successfulFetches: dataSources.successfulFetches + 1
          }
        });
      } catch (error) {
        console.error(`Failed to update status for ${feed.name}:`, error);
      }
    }
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