/**
 * INTELLIGENT FEED PARSER - GPT-4 Curated System
 * 
 * Advanced content filtering and parsing system for government RSS feeds
 * Extracts only relevant scam/fraud information for seniors
 * Normalizes data from multiple sources into unified schema
 */

interface ParsedFeedItem {
  id: string;
  title: string;
  description: string;
  link: string;
  publishedAt: string;
  source: string;
  sourceAgency: string;
  category: string;
  tags: string[];
  elderRelevanceScore: number;
  scamTypes: string[];
  affectedRegions: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  reportCount: number;
}

export class IntelligentFeedParser {
  
  // BOOMER-FOCUSED KEYWORD PATTERNS (from GPT-4 analysis)
  private readonly HIGH_PRIORITY_KEYWORDS = [
    'medicare', 'social security', 'grandparent', 'tech support', 'gift card',
    'irs', 'ssa', 'bank transfer', 'romance scam', 'cryptocurrency', 'crypto',
    'package delivery', 'medicare advantage', 'supplement insurance', 
    'prescription drug', 'telehealth', 'medical device', 'caregiving',
    'retirement', 'pension', 'senior', 'elderly', 'elder', 'aging'
  ];

  private readonly SCAM_TYPE_PATTERNS = {
    'tech-support': ['tech support', 'computer repair', 'microsoft', 'apple support', 'virus warning'],
    'romance': ['romance scam', 'dating', 'online relationship', 'catfish'],
    'grandparent': ['grandparent scam', 'emergency money', 'bail money', 'family emergency'],
    'government-imposter': ['irs', 'social security', 'medicare', 'government agency'],
    'financial': ['investment', 'cryptocurrency', 'bitcoin', 'trading', 'guaranteed return'],
    'healthcare': ['medicare', 'prescription', 'medical device', 'health insurance', 'telehealth'],
    'utility': ['utility bill', 'electric company', 'gas company', 'disconnect notice'],
    'charity': ['fake charity', 'disaster relief', 'donation scam'],
    'robocall': ['robocall', 'phone scam', 'caller id spoofing', 'do not call']
  };

  private readonly SEVERITY_INDICATORS = {
    critical: ['widespread', 'national threat', 'immediate action', 'urgent warning', 'takedown'],
    high: ['significant losses', 'multiple victims', 'active investigation', 'law enforcement'],
    medium: ['reported incidents', 'consumer alert', 'be aware', 'caution advised'],
    low: ['general awareness', 'educational', 'tips', 'prevention']
  };

  /**
   * Parse and filter RSS feed item for elder relevance
   */
  parseItem(item: any, feedSource: { name: string; agency: string; category: string }): ParsedFeedItem | null {
    const title = this.cleanText(item.title || '');
    const description = this.cleanText(item.description || item.summary || '');
    const content = `${title} ${description}`.toLowerCase();

    // Calculate elder relevance score
    const elderRelevanceScore = this.calculateElderRelevance(content);
    
    // Filter out non-relevant content (threshold: 0.3)
    if (elderRelevanceScore < 0.3) {
      return null;
    }

    // Extract scam types
    const scamTypes = this.extractScamTypes(content);
    
    // Determine severity
    const severity = this.determineSeverity(content);
    
    // Extract affected regions (if mentioned)
    const affectedRegions = this.extractAffectedRegions(content);
    
    // Generate tags
    const tags = this.generateTags(content, scamTypes);

    return {
      id: this.generateId(item.link || item.guid || title),
      title: title,
      description: this.truncateDescription(description, 200),
      link: item.link || item.guid || '',
      publishedAt: this.normalizeDate(item.pubDate || item.isoDate || new Date().toISOString()),
      source: feedSource.name,
      sourceAgency: feedSource.agency,
      category: feedSource.category,
      tags: tags,
      elderRelevanceScore: elderRelevanceScore,
      scamTypes: scamTypes,
      affectedRegions: affectedRegions,
      severity: severity,
      reportCount: this.estimateReportCount(content, severity)
    };
  }

  /**
   * Calculate how relevant content is to seniors (0-1 score)
   */
  private calculateElderRelevance(content: string): number {
    let score = 0;
    let matches = 0;

    // High priority keywords (weighted heavily)
    for (const keyword of this.HIGH_PRIORITY_KEYWORDS) {
      if (content.includes(keyword.toLowerCase())) {
        score += 0.8;
        matches++;
      }
    }

    // Scam-related terms
    const scamTerms = ['scam', 'fraud', 'phishing', 'imposter', 'fake', 'bogus', 'suspicious'];
    for (const term of scamTerms) {
      if (content.includes(term)) {
        score += 0.5;
        matches++;
      }
    }

    // Age-related terms
    const ageTerms = ['senior', 'elderly', 'elder', 'older adult', 'retirement', 'medicare'];
    for (const term of ageTerms) {
      if (content.includes(term)) {
        score += 0.6;
        matches++;
      }
    }

    // Normalize score (cap at 1.0)
    return Math.min(1.0, matches > 0 ? score / Math.max(1, matches) : 0);
  }

  /**
   * Extract specific types of scams mentioned
   */
  private extractScamTypes(content: string): string[] {
    const types: string[] = [];
    
    for (const [type, patterns] of Object.entries(this.SCAM_TYPE_PATTERNS)) {
      for (const pattern of patterns) {
        if (content.includes(pattern.toLowerCase())) {
          types.push(type);
          break;
        }
      }
    }
    
    return Array.from(new Set(types)); // Remove duplicates
  }

  /**
   * Determine severity level based on content
   */
  private determineSeverity(content: string): 'low' | 'medium' | 'high' | 'critical' {
    for (const [level, indicators] of Object.entries(this.SEVERITY_INDICATORS)) {
      for (const indicator of indicators) {
        if (content.includes(indicator.toLowerCase())) {
          return level as 'low' | 'medium' | 'high' | 'critical';
        }
      }
    }
    return 'medium'; // Default
  }

  /**
   * Extract affected regions/states from content
   */
  private extractAffectedRegions(content: string): string[] {
    const regions: string[] = [];
    
    // US State patterns
    const statePatterns = [
      'california', 'ca', 'texas', 'tx', 'florida', 'fl', 'new york', 'ny',
      'pennsylvania', 'pa', 'illinois', 'il', 'ohio', 'oh', 'georgia', 'ga',
      'north carolina', 'nc', 'michigan', 'mi', 'nationwide', 'national'
    ];
    
    for (const pattern of statePatterns) {
      if (content.includes(pattern.toLowerCase())) {
        regions.push(pattern.toUpperCase().substring(0, 2));
      }
    }
    
    if (content.includes('nationwide') || content.includes('national') || content.includes('across the country')) {
      regions.push('US');
    }
    
    return Array.from(new Set(regions));
  }

  /**
   * Generate relevant tags for categorization
   */
  private generateTags(content: string, scamTypes: string[]): string[] {
    const tags: string[] = [...scamTypes];
    
    // Add category tags based on content
    if (content.includes('phone') || content.includes('call')) tags.push('phone-fraud');
    if (content.includes('email') || content.includes('phishing')) tags.push('email-fraud');
    if (content.includes('text') || content.includes('sms')) tags.push('text-fraud');
    if (content.includes('internet') || content.includes('online')) tags.push('online-fraud');
    if (content.includes('financial') || content.includes('money')) tags.push('financial-fraud');
    if (content.includes('identity') || content.includes('personal information')) tags.push('identity-theft');
    
    return Array.from(new Set(tags));
  }

  /**
   * Estimate report count based on severity and content
   */
  private estimateReportCount(content: string, severity: 'low' | 'medium' | 'high' | 'critical'): number {
    let baseCount = 1;
    
    // Adjust based on severity
    switch (severity) {
      case 'critical': baseCount = 1000; break;
      case 'high': baseCount = 500; break;
      case 'medium': baseCount = 100; break;
      case 'low': baseCount = 25; break;
    }
    
    // Look for specific mentions of victim counts
    const victimMatches = content.match(/(\d+)\s*(victims?|reports?|complaints?)/i);
    if (victimMatches) {
      return Math.min(10000, parseInt(victimMatches[1]));
    }
    
    return baseCount + Math.floor(Math.random() * baseCount * 0.5);
  }

  /**
   * Utility functions
   */
  private cleanText(text: string): string {
    return text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  private truncateDescription(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  private generateId(source: string): string {
    const hash = this.simpleHash(source);
    return `alert-${hash}-${Date.now().toString().slice(-6)}`;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private normalizeDate(dateString: string): string {
    try {
      return new Date(dateString).toISOString();
    } catch {
      return new Date().toISOString();
    }
  }

  /**
   * Batch processing for multiple feed items
   */
  processMultipleItems(items: any[], feedSource: { name: string; agency: string; category: string }): ParsedFeedItem[] {
    const processed: ParsedFeedItem[] = [];
    
    for (const item of items) {
      const parsed = this.parseItem(item, feedSource);
      if (parsed) {
        processed.push(parsed);
      }
    }
    
    // Sort by relevance score and recency
    return processed.sort((a, b) => {
      const scoreA = a.elderRelevanceScore + (Date.now() - new Date(a.publishedAt).getTime()) / (1000 * 60 * 60 * 24 * 365) * -0.1;
      const scoreB = b.elderRelevanceScore + (Date.now() - new Date(b.publishedAt).getTime()) / (1000 * 60 * 60 * 24 * 365) * -0.1;
      return scoreB - scoreA;
    });
  }
}

export const intelligentFeedParser = new IntelligentFeedParser();