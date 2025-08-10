import { db } from "./db";
import { dataSources, scamTrends, newsItems } from "../shared/schema";
import { discoverStateFeeds, discoverFederalFeeds } from "./feedDiscovery";
import Parser from 'rss-parser';
import fetch from 'node-fetch';
import cheerio from 'cheerio';
import { eq, desc } from "drizzle-orm";

interface FeedItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  content?: string;
  categories?: string[];
}

interface DiscoveredFeed {
  state?: string;
  url: string;
  title: string;
  type: 'rss' | 'govdelivery' | 'poll';
  scamRelevance: number;
  httpOk: boolean;
}

export class EnhancedDataCollector {
  private parser: Parser;
  private lastDiscovery: Date | null = null;

  constructor() {
    this.parser = new Parser({
      timeout: 15000,
      maxRedirects: 3,
      headers: {
        'User-Agent': 'BoomerBuddy/1.0 (+https://boomerbuddy.app)'
      }
    });
  }

  async initializeAllSources(): Promise<void> {
    console.log('🚀 Initializing comprehensive data source discovery...');
    
    try {
      // Discover federal sources first
      console.log('📡 Discovering federal sources...');
      const federalFeeds = await discoverFederalFeeds();
      
      // Add federal sources to database
      for (const feed of federalFeeds) {
        await this.addOrUpdateDataSource({
          name: feed.title,
          url: feed.url,
          type: feed.type,
          isActive: true,
          category: 'Federal',
          reliability: 0.95,
          lastChecked: new Date(),
          status: 'operational'
        });
      }
      
      console.log(`✅ Added ${federalFeeds.length} federal sources`);
      
      // Discover state sources (this will take longer)
      console.log('🗺️ Discovering state sources (this may take several minutes)...');
      const stateResults = await discoverStateFeeds();
      
      let totalStateFeeds = 0;
      for (const stateResult of stateResults) {
        for (const feed of stateResult.feeds) {
          await this.addOrUpdateDataSource({
            name: `${stateResult.state} - ${feed.title}`,
            url: feed.url,
            type: feed.type,
            isActive: true,
            category: 'State',
            location: stateResult.state,
            reliability: Math.min(0.9, 0.6 + (feed.scamRelevance * 0.05)),
            lastChecked: new Date(),
            status: 'operational'
          });
          totalStateFeeds++;
        }
      }
      
      console.log(`✅ Added ${totalStateFeeds} state sources from ${stateResults.length} states`);
      console.log(`🎉 Total sources discovered: ${federalFeeds.length + totalStateFeeds}`);
      
      this.lastDiscovery = new Date();
      
    } catch (error) {
      console.error('❌ Error during source discovery:', error);
      throw error;
    }
  }

  private async addOrUpdateDataSource(sourceData: {
    name: string;
    url: string;
    type: string;
    isActive: boolean;
    category: string;
    location?: string;
    reliability: number;
    lastChecked: Date;
    status: string;
  }): Promise<void> {
    try {
      // Check if source already exists
      const existing = await db.select()
        .from(dataSources)
        .where(eq(dataSources.url, sourceData.url))
        .limit(1);

      if (existing.length > 0) {
        // Update existing source
        await db.update(dataSources)
          .set({
            lastChecked: sourceData.lastChecked,
            status: sourceData.status,
            reliability: sourceData.reliability
          })
          .where(eq(dataSources.url, sourceData.url));
      } else {
        // Insert new source
        await db.insert(dataSources).values({
          name: sourceData.name,
          url: sourceData.url,
          agency: sourceData.category,
          reliability: sourceData.reliability,
          lastChecked: sourceData.lastChecked,
          status: sourceData.status,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    } catch (error) {
      // Handle duplicate key errors gracefully
      if (error.code === '23505') {
        console.log(`Source already exists: ${sourceData.name}`);
      } else {
        console.error(`Error adding source ${sourceData.name}:`, (error as Error).message);
      }
    }
  }

  async collectFromAllSources(): Promise<void> {
    console.log('📊 Starting comprehensive data collection from all sources...');
    
    try {
      // Get all active sources
      const sources = await db.select()
        .from(dataSources);

      console.log(`📡 Found ${sources.length} active sources to process`);
      
      let processedCount = 0;
      let newItemsCount = 0;
      
      for (const source of sources) {
        try {
          console.log(`Processing: ${source.name}`);
          
          // Always try RSS first, then fallback to web scraping
          let items = await this.collectFromRSSFeed(source.url);
          
          if (items.length === 0) {
            items = await this.collectFromWebPage(source.url);
          }
          
          for (const item of items) {
            const processed = await this.processAndClassifyItem(item, source);
            if (processed) {
              newItemsCount++;
            }
          }
          
          // Update source status
          await db.update(dataSources)
            .set({
              lastChecked: new Date(),
              status: 'operational',
              updatedAt: new Date()
            })
            .where(eq(dataSources.url, source.url));
            
          processedCount++;
          
          // Rate limiting - be respectful
          await new Promise(resolve => setTimeout(resolve, 2000));
          
        } catch (error) {
          console.error(`Error processing source ${source.name}:`, error);
          
          // Update source status to indicate error
          await db.update(dataSources)
            .set({
              lastChecked: new Date(),
              status: 'error',
              updatedAt: new Date()
            })
            .where(eq(dataSources.url, source.url));
        }
      }
      
      console.log(`✅ Processed ${processedCount} sources, added ${newItemsCount} new items`);
      
    } catch (error) {
      console.error('❌ Error during comprehensive data collection:', error);
    }
  }

  private async collectFromRSSFeed(url: string): Promise<FeedItem[]> {
    try {
      const feed = await this.parser.parseURL(url);
      
      return feed.items.map(item => ({
        title: item.title || '',
        description: item.contentSnippet || item.content || '',
        link: item.link || '',
        pubDate: item.pubDate || item.isoDate || new Date().toISOString(),
        content: item.content || item.contentSnippet || '',
        categories: item.categories || []
      }));
      
    } catch (error) {
      console.error(`Error parsing RSS feed ${url}:`, error);
      return [];
    }
  }

  private async collectFromWebPage(url: string): Promise<FeedItem[]> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'BoomerBuddy/1.0 (+https://boomerbuddy.app)'
        },
        timeout: 15000
      });
      
      if (!response.ok) {
        return [];
      }
      
      const html = await response.text();
      const $ = cheerio.load(html);
      const items: FeedItem[] = [];
      
      // Generic selectors for news/alert items
      const selectors = [
        'article',
        '.news-item',
        '.alert-item',
        '.press-release',
        '.consumer-alert',
        '[class*="news"]',
        '[class*="alert"]',
        '[class*="press"]'
      ];
      
      for (const selector of selectors) {
        $(selector).each((_: any, element: any) => {
          const $el = $(element);
          const title = $el.find('h1, h2, h3, h4, .title, [class*="title"]').first().text().trim();
          const description = $el.find('p, .summary, .excerpt, [class*="summary"]').first().text().trim();
          const link = $el.find('a').first().attr('href') || '';
          
          if (title && title.length > 10) {
            items.push({
              title,
              description: description.substring(0, 500),
              link: link ? new URL(link, url).href : url,
              pubDate: new Date().toISOString(), // Use current date for scraped items
              content: description
            });
          }
        });
        
        if (items.length > 0) break; // Stop after finding items with first working selector
      }
      
      return items.slice(0, 20); // Limit to prevent overwhelming
      
    } catch (error) {
      console.error(`Error scraping web page ${url}:`, error);
      return [];
    }
  }

  private async processAndClassifyItem(item: FeedItem, source: any): Promise<boolean> {
    if (!item.title || item.title.length < 10) {
      return false;
    }

    // Check if item already exists
    const existing = await db.select()
      .from(scamTrends)
      .where(eq(scamTrends.sourceUrl, item.link))
      .limit(1);

    if (existing.length > 0) {
      return false; // Already processed
    }

    // Classify as scam alert or news
    const isScamAlert = this.classifyAsScamAlert(item.title, item.description);
    const severity = this.determineSeverity(item.title, item.description);
    const category = this.categorizeContent(item.title, item.description);

    try {
      if (isScamAlert) {
        // Add as scam trend
        await db.insert(scamTrends).values({
          id: `trend-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: item.title,
          description: item.description || item.content || '',
          category,
          severity,
          sourceAgency: source.name,
          sourceUrl: item.link,
          affectedRegions: source.location ? [source.location] : ['National'],
          tags: this.extractTags(item.title, item.description),
          reportCount: 0,
          isActive: true,
          firstReported: new Date(item.pubDate),
          lastReported: new Date(item.pubDate),
          createdAt: new Date()
        });
      } else {
        // Add as news item
        await db.insert(newsItems).values({
          id: `news-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: item.title,
          summary: item.description?.substring(0, 200) || '',
          content: item.content || item.description || '',
          category,
          sourceName: source.name,
          sourceAgency: source.name,
          sourceUrl: item.link,
          reliability: source.reliability || 0.8,
          isVerified: true,
          publishDate: new Date(item.pubDate),
          createdAt: new Date()
        });
      }

      return true;

    } catch (error) {
      if ((error as any).code !== '23505') { // Ignore duplicate key errors
        console.error('Error saving item:', (error as Error).message);
      }
      return false;
    }
  }

  private classifyAsScamAlert(title: string, description: string): boolean {
    const text = `${title} ${description}`.toLowerCase();
    
    const scamIndicators = [
      'scam', 'fraud', 'alert', 'warning', 'beware', 'avoid',
      'fake', 'phishing', 'imposter', 'identity theft',
      'robocall', 'gift card', 'romance scam', 'grandparent scam',
      'social security scam', 'irs scam', 'medicare fraud'
    ];
    
    const newsIndicators = [
      'legislation', 'bill signed', 'new law', 'policy change',
      'appointment', 'nomination', 'budget', 'funding',
      'meeting', 'conference', 'report released'
    ];
    
    let scamScore = 0;
    let newsScore = 0;
    
    for (const indicator of scamIndicators) {
      if (text.includes(indicator)) scamScore++;
    }
    
    for (const indicator of newsIndicators) {
      if (text.includes(indicator)) newsScore++;
    }
    
    return scamScore > newsScore;
  }

  private determineSeverity(title: string, description: string): 'low' | 'medium' | 'high' | 'critical' {
    const text = `${title} ${description}`.toLowerCase();
    
    if (text.includes('urgent') || text.includes('immediate') || text.includes('critical') || text.includes('emergency')) {
      return 'critical';
    }
    
    if (text.includes('warning') || text.includes('alert') || text.includes('serious')) {
      return 'high';
    }
    
    if (text.includes('caution') || text.includes('beware') || text.includes('avoid')) {
      return 'medium';
    }
    
    return 'low';
  }

  private categorizeContent(title: string, description: string): string {
    const text = `${title} ${description}`.toLowerCase();
    
    if (text.includes('phone') || text.includes('call') || text.includes('robocall')) return 'Phone Scam';
    if (text.includes('email') || text.includes('phishing')) return 'Email Scam';
    if (text.includes('romance') || text.includes('dating')) return 'Romance Scam';
    if (text.includes('grandparent') || text.includes('family emergency')) return 'Family Emergency Scam';
    if (text.includes('social security') || text.includes('ssa')) return 'Social Security Scam';
    if (text.includes('irs') || text.includes('tax')) return 'Tax Scam';
    if (text.includes('medicare') || text.includes('health insurance')) return 'Medicare Fraud';
    if (text.includes('investment') || text.includes('crypto')) return 'Investment Scam';
    if (text.includes('utility') || text.includes('electric') || text.includes('gas bill')) return 'Utility Scam';
    if (text.includes('gift card') || text.includes('prepaid card')) return 'Gift Card Scam';
    
    return 'Consumer Alert';
  }

  private extractTags(title: string, description: string): string[] {
    const text = `${title} ${description}`.toLowerCase();
    const tags: string[] = [];
    
    const tagMap = {
      'seniors': ['elder', 'senior', 'older adult', 'retiree'],
      'phone': ['phone', 'call', 'robocall', 'voicemail'],
      'email': ['email', 'phishing', 'spam'],
      'financial': ['money', 'payment', 'bank', 'credit card', 'financial'],
      'government': ['irs', 'social security', 'medicare', 'government'],
      'romance': ['romance', 'dating', 'love', 'relationship'],
      'tech': ['computer', 'tech support', 'virus', 'software'],
      'emergency': ['emergency', 'urgent', 'immediate', 'crisis']
    };
    
    for (const [tag, keywords] of Object.entries(tagMap)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        tags.push(tag);
      }
    }
    
    return tags;
  }
}