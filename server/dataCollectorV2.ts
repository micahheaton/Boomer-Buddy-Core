import Parser from 'rss-parser';
import { db } from './db';
import { dataSources as dataSourcesTable, scamTrends, newsItems } from '@shared/schema';
import { eq, desc, sql } from 'drizzle-orm';

interface RSSItem {
  title?: string;
  contentSnippet?: string;
  content?: string;
  link?: string;
  pubDate?: string;
  isoDate?: string;
}

export class DataCollectorV2 {
  private parser: Parser;
  
  // Real government sources with proper classification
  private readonly GOVERNMENT_SOURCES = [
    // Federal Agencies
    {
      name: 'FTC Consumer Alerts',
      url: 'https://consumer.ftc.gov/blog/rss',
      agency: 'FTC',
      sourceType: 'federal' as const,
      contentTypes: ['scam_alert', 'advisory'],
    },
    {
      name: 'FBI Internet Crime Alerts',
      url: 'https://www.fbi.gov/feeds/fbi-in-the-news/@@rss.xml',
      agency: 'FBI',
      sourceType: 'federal' as const,
      contentTypes: ['warning', 'advisory'],
    },
    {
      name: 'Social Security Administration Blog',
      url: 'https://blog.ssa.gov/feed/',
      agency: 'SSA',
      sourceType: 'federal' as const,
      contentTypes: ['news_update', 'advisory'],
    },
    {
      name: 'CISA Security Advisories',
      url: 'https://www.cisa.gov/feeds/advisories.xml',
      agency: 'CISA',
      sourceType: 'federal' as const,
      contentTypes: ['warning', 'advisory'],
    },
    {
      name: 'SEC Investor Alerts',
      url: 'https://www.sec.gov/rss/news/investor-alerts-bulletins.xml',
      agency: 'SEC',
      sourceType: 'federal' as const,
      contentTypes: ['scam_alert', 'advisory'],
    },
    {
      name: 'CFPB Consumer Advisories',
      url: 'https://www.consumerfinance.gov/about-us/blog/rss/',
      agency: 'CFPB',
      sourceType: 'federal' as const,
      contentTypes: ['advisory', 'news_update'],
    },
    {
      name: 'HHS-OIG Fraud Alerts',
      url: 'https://oig.hhs.gov/rss/fraud-alerts.xml',
      agency: 'HHS-OIG',
      sourceType: 'federal' as const,
      contentTypes: ['scam_alert', 'warning'],
    },
    {
      name: 'FCC Consumer Complaints',
      url: 'https://www.fcc.gov/news-events/rss',
      agency: 'FCC',
      sourceType: 'federal' as const,
      contentTypes: ['advisory', 'news_update'],
    },
    
    // State Agencies
    {
      name: 'California AG Consumer Alerts',
      url: 'https://oag.ca.gov/rss/consumer-alerts',
      agency: 'CA-AG',
      sourceType: 'state' as const,
      contentTypes: ['scam_alert', 'advisory'],
    },
    {
      name: 'Washington State AG Alerts',
      url: 'https://www.atg.wa.gov/news/rss.xml',
      agency: 'WA-AG',
      sourceType: 'state' as const,
      contentTypes: ['advisory', 'scam_alert'],
    },
    {
      name: 'Texas AG Consumer Protection',
      url: 'https://www.texasattorneygeneral.gov/rss/consumer',
      agency: 'TX-AG',
      sourceType: 'state' as const,
      contentTypes: ['scam_alert', 'advisory'],
    },
    {
      name: 'New York AG Press Releases',
      url: 'https://ag.ny.gov/press-releases/rss.xml',
      agency: 'NY-AG',
      sourceType: 'state' as const,
      contentTypes: ['advisory', 'news_update'],
    },
    
    // Trusted Nonprofits
    {
      name: 'AARP Fraud Watch Network',
      url: 'https://www.aarp.org/money/scams-fraud/rss.xml',
      agency: 'AARP',
      sourceType: 'nonprofit' as const,
      contentTypes: ['scam_alert', 'advisory'],
    },
    {
      name: 'Better Business Bureau Scam Tracker',
      url: 'https://www.bbb.org/scamtracker/rss',
      agency: 'BBB',
      sourceType: 'nonprofit' as const,
      contentTypes: ['scam_alert', 'warning'],
    },
    {
      name: 'NCOA Elder Justice',
      url: 'https://www.ncoa.org/rss/news',
      agency: 'NCOA',
      sourceType: 'nonprofit' as const,
      contentTypes: ['advisory', 'news_update'],
    },
  ];

  constructor() {
    this.parser = new Parser({
      timeout: 10000,
      headers: {
        'User-Agent': 'BoomerBuddy/1.0 (Government Data Collector)',
      },
    });
  }

  async initializeDataSources(): Promise<void> {
    console.log('Initializing government data sources...');
    
    for (const source of this.GOVERNMENT_SOURCES) {
      try {
        await db.insert(dataSourcesTable)
          .values({
            name: source.name,
            url: source.url,
            status: 'active',
            lastChecked: new Date(),
            errorCount: 0,
          })
          .onConflictDoNothing();
        
        console.log(`✅ Initialized: ${source.name}`);
      } catch (error) {
        console.error(`❌ Failed to initialize ${source.name}:`, error);
      }
    }
  }

  async collectAllData(): Promise<void> {
    console.log('Starting comprehensive data collection from government sources...');
    
    const sources = await db.select().from(dataSources).where(eq(dataSources.isActive, true));
    
    for (const source of sources) {
      await this.collectFromSource(source);
    }
    
    // After collecting all content, analyze and create threat intelligence
    await this.analyzeThreatIntelligence();
    await this.updateGeographicRisk();
    
    console.log('✅ Data collection completed');
  }

  private async collectFromSource(source: any): Promise<void> {
    try {
      console.log(`Collecting from ${source.name}...`);
      
      const feed = await this.parser.parseURL(source.url);
      let processedCount = 0;
      
      for (const item of feed.items.slice(0, 20)) { // Limit to recent items
        if (!item.title || !item.link) continue;
        
        const content = await this.processContent(item, source);
        if (content) {
          await this.saveContent(content, source.id);
          processedCount++;
        }
      }
      
      // Update source status
      await db.update(dataSources)
        .set({
          lastChecked: new Date(),
          lastSuccessful: new Date(),
          itemCount: processedCount,
          errorCount: 0,
          lastError: null,
        })
        .where(eq(dataSources.id, source.id));
        
      console.log(`✅ ${source.name}: ${processedCount} items processed`);
      
    } catch (error) {
      console.error(`❌ Failed to collect from ${source.name}:`, error);
      
      await db.update(dataSources)
        .set({
          lastChecked: new Date(),
          errorCount: sql`${dataSources.errorCount} + 1`,
          lastError: error instanceof Error ? error.message : 'Unknown error',
        })
        .where(eq(dataSources.id, source.id));
    }
  }

  private async processContent(item: RSSItem, source: any): Promise<any | null> {
    if (!item.title || !item.link) return null;
    
    const title = item.title.trim();
    const description = item.contentSnippet || item.content || '';
    const publishedAt = item.isoDate || item.pubDate ? new Date(item.isoDate || item.pubDate!) : new Date();
    
    // Classify content type based on title and source
    const contentType = this.classifyContentType(title, description, source.agency);
    const riskLevel = this.assessRiskLevel(title, description, contentType);
    
    // Extract scam-specific data if it's a scam alert
    let scamTypes: string[] | null = null;
    let targetDemographics: string[] | null = null;
    let affectedStates: string[] | null = null;
    
    if (contentType === 'scam_alert' || contentType === 'warning') {
      scamTypes = this.extractScamTypes(title, description);
      targetDemographics = this.extractTargetDemographics(title, description);
      affectedStates = this.extractAffectedStates(title, description);
    }
    
    const elderRelevanceScore = this.calculateElderRelevance(title, description, targetDemographics || []);
    
    return {
      title,
      description: description.substring(0, 1000), // Truncate long descriptions
      url: item.link,
      contentType,
      riskLevel,
      publishedAt,
      scamTypes,
      targetDemographics,
      affectedStates,
      elderRelevanceScore,
    };
  }

  private classifyContentType(title: string, description: string, agency: string): string {
    const text = (title + ' ' + description).toLowerCase();
    
    // High-confidence scam alert indicators
    if (
      text.includes('scam') || 
      text.includes('fraud') || 
      text.includes('phishing') || 
      text.includes('scheme') ||
      text.includes('beware') ||
      text.includes('warning') ||
      text.includes('alert')
    ) {
      return text.includes('warning') || text.includes('urgent') ? 'warning' : 'scam_alert';
    }
    
    // Advisory content
    if (text.includes('advisory') || text.includes('guidance') || agency === 'CISA') {
      return 'advisory';
    }
    
    // Default to news update
    return 'news_update';
  }

  private assessRiskLevel(title: string, description: string, contentType: string): string {
    const text = (title + ' ' + description).toLowerCase();
    
    if (contentType === 'warning' || text.includes('urgent') || text.includes('immediate')) {
      return 'critical';
    }
    
    if (contentType === 'scam_alert' || text.includes('significant') || text.includes('widespread')) {
      return 'high';
    }
    
    if (contentType === 'advisory' || text.includes('caution')) {
      return 'medium';
    }
    
    return 'info';
  }

  private extractScamTypes(title: string, description: string): string[] {
    const text = (title + ' ' + description).toLowerCase();
    const types: string[] = [];
    
    if (text.includes('phone') || text.includes('call') || text.includes('robocall')) types.push('phone');
    if (text.includes('email') || text.includes('phishing')) types.push('email');
    if (text.includes('text') || text.includes('sms')) types.push('sms');
    if (text.includes('medicare') || text.includes('health insurance')) types.push('medicare');
    if (text.includes('social security') || text.includes('ssa')) types.push('social_security');
    if (text.includes('investment') || text.includes('cryptocurrency')) types.push('investment');
    if (text.includes('romance') || text.includes('dating')) types.push('romance');
    if (text.includes('tech support') || text.includes('computer')) types.push('tech_support');
    if (text.includes('grandparent') || text.includes('family emergency')) types.push('family_emergency');
    
    return types.length > 0 ? types : ['general'];
  }

  private extractTargetDemographics(title: string, description: string): string[] {
    const text = (title + ' ' + description).toLowerCase();
    const demographics: string[] = [];
    
    if (text.includes('senior') || text.includes('elderly') || text.includes('older adult')) demographics.push('seniors');
    if (text.includes('veteran') || text.includes('military')) demographics.push('veterans');
    if (text.includes('medicare') || text.includes('social security')) demographics.push('seniors'); // Implied
    if (text.includes('small business') || text.includes('entrepreneur')) demographics.push('business_owners');
    
    return demographics.length > 0 ? demographics : ['general_public'];
  }

  private extractAffectedStates(title: string, description: string): string[] {
    // This would be more sophisticated in a real implementation
    // For now, return null to indicate national scope
    return [];
  }

  private calculateElderRelevance(title: string, description: string, targetDemographics: string[]): number {
    let score = 0;
    const text = (title + ' ' + description).toLowerCase();
    
    // Direct targeting of seniors
    if (targetDemographics.includes('seniors')) score += 50;
    
    // Elder-specific services/benefits
    if (text.includes('medicare') || text.includes('social security')) score += 30;
    if (text.includes('retirement') || text.includes('pension')) score += 20;
    
    // Common elder scam tactics
    if (text.includes('grandparent') || text.includes('family emergency')) score += 40;
    if (text.includes('tech support') || text.includes('computer repair')) score += 25;
    if (text.includes('charity') || text.includes('donation')) score += 15;
    if (text.includes('healthcare') || text.includes('prescription')) score += 20;
    
    // Communication methods preferred by scammers targeting elders
    if (text.includes('phone call') || text.includes('robocall')) score += 15;
    if (text.includes('mail') || text.includes('letter')) score += 10;
    
    return Math.min(100, score);
  }

  private async saveContent(content: any, sourceId: string): Promise<void> {
    try {
      await db.insert(governmentContent)
        .values({
          sourceId,
          ...content,
        })
        .onConflictDoNothing(); // Avoid duplicates based on URL
        
    } catch (error) {
      console.error('Error saving content:', error);
    }
  }

  private async analyzeThreatIntelligence(): Promise<void> {
    console.log('Analyzing threat intelligence...');
    
    // Get scam alerts from the last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const scamAlerts = await db.select()
      .from(governmentContent)
      .where(sql`${governmentContent.contentType} IN ('scam_alert', 'warning') AND ${governmentContent.publishedAt} >= ${thirtyDaysAgo}`)
      .orderBy(desc(governmentContent.publishedAt));
    
    // Group by scam type and analyze trends
    const threatMap = new Map<string, any>();
    
    for (const alert of scamAlerts) {
      const scamTypes = alert.scamTypes as string[] || ['general'];
      
      for (const scamType of scamTypes) {
        if (!threatMap.has(scamType)) {
          threatMap.set(scamType, {
            threatType: scamType,
            threatName: this.formatThreatName(scamType),
            reports: [],
            affectedStates: new Set<string>(),
            totalReports: 0,
            currentRiskLevel: 'low',
          });
        }
        
        const threat = threatMap.get(scamType);
        threat.reports.push(alert);
        threat.totalReports++;
        
        // Add affected states
        const states = alert.affectedStates as string[] || [];
        states.forEach(state => threat.affectedStates.add(state));
        
        // Update risk level based on frequency and recent activity
        if (threat.totalReports >= 10) threat.currentRiskLevel = 'high';
        else if (threat.totalReports >= 5) threat.currentRiskLevel = 'medium';
      }
    }
    
    // Save threat intelligence
    for (const [_, threat] of threatMap) {
      const reportsThisWeek = threat.reports.filter((r: any) => 
        new Date(r.publishedAt) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ).length;
      
      await db.insert(threatIntelligence)
        .values({
          threatType: threat.threatType,
          threatName: threat.threatName,
          currentRiskLevel: threat.currentRiskLevel,
          trendDirection: reportsThisWeek > threat.totalReports / 4 ? 'increasing' : 'stable',
          totalReports: threat.totalReports,
          reportsThisWeek,
          affectedStates: Array.from(threat.affectedStates),
          sourceContentIds: threat.reports.map((r: any) => r.id),
          lastUpdatedFromSource: new Date(),
        })
        .onConflictDoUpdate({
          target: [threatIntelligence.threatType],
          set: {
            currentRiskLevel: threat.currentRiskLevel,
            totalReports: threat.totalReports,
            reportsThisWeek,
            affectedStates: Array.from(threat.affectedStates),
            updatedAt: new Date(),
          },
        });
    }
    
    console.log(`✅ Analyzed ${threatMap.size} threat types`);
  }

  private formatThreatName(scamType: string): string {
    const names: Record<string, string> = {
      phone: 'Phone & Robocall Scams',
      email: 'Email & Phishing Attacks',
      sms: 'Text Message Scams',
      medicare: 'Medicare Fraud',
      social_security: 'Social Security Impersonation',
      investment: 'Investment & Cryptocurrency Fraud',
      romance: 'Romance & Dating Scams',
      tech_support: 'Tech Support Fraud',
      family_emergency: 'Grandparent & Family Emergency Scams',
      general: 'General Fraud Alerts',
    };
    
    return names[scamType] || scamType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  private async updateGeographicRisk(): Promise<void> {
    console.log('Updating geographic risk data...');
    
    // This would be more sophisticated in a real implementation
    // For now, create baseline data for all US states
    const states = [
      { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' },
      { code: 'AZ', name: 'Arizona' }, { code: 'AR', name: 'Arkansas' },
      { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
      { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' },
      { code: 'FL', name: 'Florida' }, { code: 'GA', name: 'Georgia' },
      // ... would include all 50 states
    ];
    
    for (const state of states.slice(0, 10)) { // Sample for demo
      const riskScore = Math.floor(Math.random() * 40) + 30; // 30-70 range
      const activeThreats = Math.floor(Math.random() * 8) + 2; // 2-10 range
      
      await db.insert(geographicRisk)
        .values({
          stateCode: state.code,
          stateName: state.name,
          overallRiskScore: riskScore,
          activeThreats,
          reportsLast30Days: Math.floor(Math.random() * 500) + 50,
          seniorPopulation: Math.floor(Math.random() * 10) + 15, // 15-25%
          vulnerabilityIndex: Math.floor(Math.random() * 30) + 40, // 40-70
        })
        .onConflictDoUpdate({
          target: [geographicRisk.stateCode],
          set: {
            overallRiskScore: riskScore,
            activeThreats,
            lastUpdated: new Date(),
          },
        });
    }
  }
}

export const dataCollectorV2 = new DataCollectorV2();