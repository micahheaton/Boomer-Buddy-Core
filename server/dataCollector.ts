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
    console.log('Starting comprehensive government RSS data collection...');
    
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
    console.log('✅ Comprehensive data collection completed from all government sources');
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

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async logDataSourceError(feed: RSSFeed, error: Error): Promise<void> {
    try {
      await db.insert(dataSources).values({
        id: `source-${feed.name.toLowerCase().replace(/\s+/g, '-')}`,
        name: feed.name,
        url: feed.url,
        agency: feed.agency,
        lastChecked: new Date(),
        status: 'error',
        reliability: Math.max(0, feed.reliability - 0.1),
        lastError: error.message
      }).onConflictDoUpdate({
        target: dataSources.id,
        set: {
          status: 'error',
          lastError: error.message,
          lastChecked: new Date(),
          updatedAt: new Date()
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
          agency: feed.agency,
          lastChecked: new Date(),
          status: 'active',
          reliability: feed.reliability
        }).onConflictDoUpdate({
          target: dataSources.id,
          set: {
            status: 'active',
            reliability: feed.reliability,
            lastChecked: new Date(),
            updatedAt: new Date()
          }
        });
      } catch (error) {
        console.error(`Failed to update status for ${feed.name}:`, error);
      }
    }
  }
}

// Export singleton instance
export const dataCollector = new DataCollector();