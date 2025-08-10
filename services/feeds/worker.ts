/**
 * Feeds Worker - Aggregates government/org sources (§15)
 * Merges FTC, IC3, SSA OIG, HHS OIG, CISA, SEC, CFPB, FCC, DOJ, AARP + state AG feeds
 */

import * as fs from 'fs';
import * as path from 'path';
import fetch from 'node-fetch';
import { parseStringPromise } from 'xml2js';

export interface FeedSource {
  id: string;
  name: string;
  url: string;
  type: 'federal' | 'state' | 'nonprofit';
  priority: number;
  state?: string;
}

export interface FeedItem {
  id: string;
  source: string;
  title: string;
  link: string;
  publishedAt: number;
  tags: string[];
  state?: string;
  priority: number;
}

export interface MergedFeed {
  lastUpdated: number;
  sources: FeedSource[];
  alerts: FeedItem[];
}

export class FeedsWorker {
  private static instance: FeedsWorker;
  private sources: FeedSource[] = [];

  private constructor() {
    this.initializeSources();
  }

  static getInstance(): FeedsWorker {
    if (!FeedsWorker.instance) {
      FeedsWorker.instance = new FeedsWorker();
    }
    return FeedsWorker.instance;
  }

  /**
   * Initialize government and org RSS sources
   */
  private initializeSources(): void {
    this.sources = [
      // Federal sources (highest priority)
      {
        id: 'ftc_consumer_alerts',
        name: 'FTC Consumer Alerts',
        url: 'https://www.consumer.ftc.gov/rss/alerts',
        type: 'federal',
        priority: 1
      },
      {
        id: 'fbi_ic3_psa',
        name: 'FBI IC3 Public Service Announcements',
        url: 'https://www.ic3.gov/Media/Rss',
        type: 'federal',
        priority: 1
      },
      {
        id: 'ssa_blog',
        name: 'Social Security Administration Blog',
        url: 'https://blog.ssa.gov/feed/',
        type: 'federal',
        priority: 1
      },
      {
        id: 'hhs_oig_alerts',
        name: 'HHS Office of Inspector General Consumer Alerts',
        url: 'https://oig.hhs.gov/rss/consumer-alerts.xml',
        type: 'federal',
        priority: 1
      },
      {
        id: 'cisa_advisories',
        name: 'CISA Cybersecurity Advisories',
        url: 'https://www.cisa.gov/rss/cybersecurity-advisories.xml',
        type: 'federal',
        priority: 1
      },
      {
        id: 'sec_investor_alerts',
        name: 'SEC Investor Alerts',
        url: 'https://www.investor.gov/rss/investor-alerts',
        type: 'federal',
        priority: 1
      },
      {
        id: 'cfpb_blog',
        name: 'Consumer Financial Protection Bureau Blog',
        url: 'https://www.consumerfinance.gov/about-us/blog/feed/',
        type: 'federal',
        priority: 1
      },
      {
        id: 'fcc_consumer_guides',
        name: 'FCC Consumer Guides',
        url: 'https://www.fcc.gov/rss/consumer-guides',
        type: 'federal',
        priority: 1
      },

      // State AG sources
      {
        id: 'wa_ag_consumer',
        name: 'Washington AG Consumer Protection',
        url: 'https://www.atg.wa.gov/rss/consumer-protection',
        type: 'state',
        priority: 2,
        state: 'WA'
      },
      {
        id: 'ca_ag_consumer',
        name: 'California AG Consumer Alerts',
        url: 'https://oag.ca.gov/rss/consumer-alerts',
        type: 'state',
        priority: 2,
        state: 'CA'
      },
      {
        id: 'ny_ag_consumer',
        name: 'New York AG Consumer Frauds',
        url: 'https://ag.ny.gov/rss/consumer-frauds',
        type: 'state',
        priority: 2,
        state: 'NY'
      },
      {
        id: 'tx_ag_consumer',
        name: 'Texas AG Consumer Protection',
        url: 'https://www.texasattorneygeneral.gov/rss/consumer',
        type: 'state',
        priority: 2,
        state: 'TX'
      },
      {
        id: 'fl_ag_consumer',
        name: 'Florida AG Consumer Protection',
        url: 'https://www.myfloridalegal.com/rss/consumer',
        type: 'state',
        priority: 2,
        state: 'FL'
      },

      // Authorized elder-focused nonprofits
      {
        id: 'aarp_fraud_watch',
        name: 'AARP Fraud Watch Network',
        url: 'https://www.aarp.org/money/scams-fraud/feed.rss',
        type: 'nonprofit',
        priority: 3
      },
      {
        id: 'bbb_scam_tracker',
        name: 'Better Business Bureau Scam Tracker',
        url: 'https://www.bbb.org/rss/scam-tracker',
        type: 'nonprofit',
        priority: 3
      }
    ];

    console.log(`Initialized ${this.sources.length} feed sources`);
  }

  /**
   * Run feeds collection (called every 6-12 hours)
   */
  async collectFeeds(): Promise<MergedFeed> {
    console.log('Starting feeds collection...');
    
    const allItems: FeedItem[] = [];
    const startTime = Date.now();

    // Collect from all sources in parallel
    const promises = this.sources.map(source => this.collectFromSource(source));
    const results = await Promise.allSettled(promises);

    // Process results
    results.forEach((result, index) => {
      const source = this.sources[index];
      if (result.status === 'fulfilled') {
        allItems.push(...result.value);
        console.log(`✓ Collected ${result.value.length} items from ${source.name}`);
      } else {
        console.error(`✗ Failed to collect from ${source.name}:`, result.reason);
      }
    });

    // De-duplicate and rank
    const deduplicatedItems = this.deduplicateItems(allItems);
    const rankedItems = this.rankItems(deduplicatedItems);

    const mergedFeed: MergedFeed = {
      lastUpdated: Date.now(),
      sources: this.sources,
      alerts: rankedItems.slice(0, 100) // Keep top 100 items
    };

    // Write feeds.json
    await this.writeFeedsFile(mergedFeed);

    const duration = Date.now() - startTime;
    console.log(`Feeds collection completed in ${duration}ms. ${rankedItems.length} items collected.`);

    return mergedFeed;
  }

  /**
   * Collect items from a single source
   */
  private async collectFromSource(source: FeedSource): Promise<FeedItem[]> {
    try {
      const response = await fetch(source.url, {
        timeout: 30000,
        headers: {
          'User-Agent': 'BoomerBuddy-FeedsWorker/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const xmlContent = await response.text();
      const parsed = await parseStringPromise(xmlContent);

      // Handle different RSS/Atom formats
      const items = this.extractItemsFromParsedXML(parsed, source);
      
      return items;
    } catch (error) {
      console.error(`Error collecting from ${source.name}:`, error);
      return [];
    }
  }

  /**
   * Extract items from parsed XML (RSS/Atom)
   */
  private extractItemsFromParsedXML(parsed: any, source: FeedSource): FeedItem[] {
    const items: FeedItem[] = [];

    try {
      // Handle RSS format
      if (parsed.rss && parsed.rss.channel && parsed.rss.channel[0].item) {
        const rssItems = parsed.rss.channel[0].item;
        
        for (const item of rssItems) {
          const feedItem = this.createFeedItem(item, source, 'rss');
          if (feedItem) items.push(feedItem);
        }
      }
      // Handle Atom format
      else if (parsed.feed && parsed.feed.entry) {
        const atomEntries = parsed.feed.entry;
        
        for (const entry of atomEntries) {
          const feedItem = this.createFeedItem(entry, source, 'atom');
          if (feedItem) items.push(feedItem);
        }
      }
    } catch (error) {
      console.error(`Error parsing items from ${source.name}:`, error);
    }

    return items;
  }

  /**
   * Create feed item from RSS/Atom entry
   */
  private createFeedItem(item: any, source: FeedSource, format: 'rss' | 'atom'): FeedItem | null {
    try {
      let title: string;
      let link: string;
      let publishedAt: number;

      if (format === 'rss') {
        title = item.title?.[0] || '';
        link = item.link?.[0] || '';
        publishedAt = item.pubDate?.[0] ? new Date(item.pubDate[0]).getTime() : Date.now();
      } else { // atom
        title = item.title?.[0]?._ || item.title?.[0] || '';
        link = item.link?.[0]?.$?.href || '';
        publishedAt = item.published?.[0] ? new Date(item.published[0]).getTime() : Date.now();
      }

      if (!title || !link) {
        return null;
      }

      // Filter for elder-relevant content
      if (!this.isElderRelevant(title)) {
        return null;
      }

      const tags = this.extractTags(title, source);

      return {
        id: this.generateItemId(title, source.id, publishedAt),
        source: source.id,
        title: title.trim(),
        link: link.trim(),
        publishedAt,
        tags,
        state: source.state,
        priority: source.priority
      };
    } catch (error) {
      console.error('Error creating feed item:', error);
      return null;
    }
  }

  /**
   * Check if content is relevant to elder protection
   */
  private isElderRelevant(title: string): boolean {
    const lowerTitle = title.toLowerCase();
    
    // Elder-relevant keywords
    const elderKeywords = [
      'scam', 'fraud', 'phishing', 'identity theft', 'elder', 'senior',
      'medicare', 'social security', 'retirement', 'pension', 'investment',
      'gift card', 'tech support', 'romance', 'grandparent', 'robocall',
      'telemarketing', 'consumer alert', 'warning', 'avoid', 'protect'
    ];

    return elderKeywords.some(keyword => lowerTitle.includes(keyword));
  }

  /**
   * Extract tags from title and source
   */
  private extractTags(title: string, source: FeedSource): string[] {
    const tags: string[] = [];
    const lowerTitle = title.toLowerCase();

    // Scam type tags
    const scamTypes = {
      'phishing': ['phishing', 'phish', 'email scam'],
      'robocall': ['robocall', 'robo call', 'telemarketing'],
      'romance': ['romance', 'dating', 'online dating'],
      'tech_support': ['tech support', 'computer', 'virus', 'software'],
      'gift_card': ['gift card', 'prepaid', 'apple pay', 'google play'],
      'medicare': ['medicare', 'health insurance', 'medical'],
      'social_security': ['social security', 'ssa', 'benefits'],
      'investment': ['investment', 'crypto', 'bitcoin', 'stock'],
      'government': ['irs', 'federal', 'government', 'agency']
    };

    Object.entries(scamTypes).forEach(([tag, keywords]) => {
      if (keywords.some(keyword => lowerTitle.includes(keyword))) {
        tags.push(tag);
      }
    });

    // Source type tag
    tags.push(source.type);

    return tags;
  }

  /**
   * Generate unique item ID
   */
  private generateItemId(title: string, sourceId: string, publishedAt: number): string {
    const normalizedTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '');
    const dateBucket = Math.floor(publishedAt / (24 * 60 * 60 * 1000)); // Day bucket
    return `${sourceId}_${dateBucket}_${normalizedTitle.substring(0, 20)}`;
  }

  /**
   * De-duplicate items by normalized title + domain + date bucket
   */
  private deduplicateItems(items: FeedItem[]): FeedItem[] {
    const seen = new Set<string>();
    const deduplicated: FeedItem[] = [];

    for (const item of items) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        deduplicated.push(item);
      }
    }

    console.log(`De-duplicated ${items.length} → ${deduplicated.length} items`);
    return deduplicated;
  }

  /**
   * Rank items: federal PSAs > state AG alerts > nonprofit explainers
   */
  private rankItems(items: FeedItem[]): FeedItem[] {
    return items.sort((a, b) => {
      // First by priority (lower number = higher priority)
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      
      // Then by publication date (newer first)
      return b.publishedAt - a.publishedAt;
    });
  }

  /**
   * Write feeds.json file
   */
  private async writeFeedsFile(mergedFeed: MergedFeed): Promise<void> {
    try {
      const outputPath = process.env.FEEDS_OUTPUT_PATH || './feeds.json';
      const outputDir = path.dirname(outputPath);
      
      // Ensure output directory exists
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const jsonContent = JSON.stringify(mergedFeed, null, 2);
      fs.writeFileSync(outputPath, jsonContent, 'utf8');
      
      console.log(`Feeds written to ${outputPath}`);
    } catch (error) {
      console.error('Error writing feeds file:', error);
      throw error;
    }
  }

  /**
   * Get current feeds (for API endpoint)
   */
  async getCurrentFeeds(): Promise<MergedFeed> {
    try {
      const feedsPath = process.env.FEEDS_OUTPUT_PATH || './feeds.json';
      
      if (!fs.existsSync(feedsPath)) {
        console.log('No feeds file found, collecting fresh feeds...');
        return await this.collectFeeds();
      }

      const feedsContent = fs.readFileSync(feedsPath, 'utf8');
      const feeds = JSON.parse(feedsContent) as MergedFeed;

      // Check if feeds are stale (older than 12 hours)
      const twelveHours = 12 * 60 * 60 * 1000;
      if (Date.now() - feeds.lastUpdated > twelveHours) {
        console.log('Feeds are stale, collecting fresh feeds...');
        return await this.collectFeeds();
      }

      return feeds;
    } catch (error) {
      console.error('Error getting current feeds:', error);
      // Return empty feeds if everything fails
      return {
        lastUpdated: Date.now(),
        sources: this.sources,
        alerts: []
      };
    }
  }
}

// CLI execution
if (require.main === module) {
  const worker = FeedsWorker.getInstance();
  
  if (process.argv.includes('--collect')) {
    worker.collectFeeds()
      .then(() => {
        console.log('Feeds collection completed successfully');
        process.exit(0);
      })
      .catch(error => {
        console.error('Feeds collection failed:', error);
        process.exit(1);
      });
  } else {
    console.log('Feeds worker initialized. Use --collect to run collection.');
  }
}

export default FeedsWorker;