/**
 * CONTENT VALIDATION SYSTEM - LLM-Based Relevance Filter
 * 
 * One-time LLM processing per new item to ensure strict relevance to scams/elderly protection
 * Items are validated BEFORE being added to database and cache
 */

import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface ValidationResult {
  isRelevant: boolean;
  relevanceScore: number; // 0-1 scale
  scamTypes: string[];
  elderRelevance: 'high' | 'medium' | 'low' | 'none';
  severity: 'critical' | 'high' | 'medium' | 'low';
  reason: string;
  category: 'scam-alert' | 'prevention-tip' | 'government-advisory' | 'irrelevant';
}

interface FeedItem {
  title: string;
  description: string;
  content?: string;
  source: string;
  url: string;
}

export class ContentValidator {
  
  /**
   * Validate content relevance using GPT-4o for strict filtering
   */
  async validateRelevance(item: FeedItem): Promise<ValidationResult> {
    const prompt = `
You are a content validator for "Boomer Buddy" - an anti-scam platform specifically protecting seniors (ages 55+) from fraud.

STRICT VALIDATION CRITERIA:
- ONLY approve content directly related to:
  1. Scam alerts targeting seniors/elderly
  2. Fraud prevention for older adults  
  3. Government advisories about elder-targeted scams
  4. Consumer protection specifically relevant to seniors

REJECT content about:
- General cybersecurity (unless elder-focused)
- Technical vulnerabilities (unless exploiting seniors)
- Corporate data breaches (unless affecting senior services)
- General business/political news
- Legislative updates (unless directly about elder fraud protection)
- Academic/research content

ANALYZE THIS CONTENT:
Title: "${item.title}"
Description: "${item.description}"
Source: "${item.source}"

Respond in JSON format:
{
  "isRelevant": boolean,
  "relevanceScore": number (0-1),
  "scamTypes": string[],
  "elderRelevance": "high|medium|low|none",
  "severity": "critical|high|medium|low", 
  "reason": "brief explanation",
  "category": "scam-alert|prevention-tip|government-advisory|irrelevant"
}

SCAM TYPES include: tech-support, romance, grandparent, government-imposter, financial, healthcare, utility, charity, robocall, identity-theft, medicare-fraud, social-security-scam
`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are an expert content validator for elder fraud protection. Be extremely strict - only approve content directly relevant to protecting seniors from scams and fraud."
          },
          {
            role: "user", 
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1 // Low temperature for consistent validation
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      // Additional validation checks
      if (result.relevanceScore < 0.4) {
        result.isRelevant = false;
        result.category = 'irrelevant';
      }

      return {
        isRelevant: result.isRelevant || false,
        relevanceScore: Math.max(0, Math.min(1, result.relevanceScore || 0)),
        scamTypes: Array.isArray(result.scamTypes) ? result.scamTypes : [],
        elderRelevance: result.elderRelevance || 'none',
        severity: result.severity || 'low',
        reason: result.reason || 'Automated validation',
        category: result.category || 'irrelevant'
      };

    } catch (error) {
      console.error('Content validation failed:', error);
      
      // Fallback to keyword-based validation if LLM fails
      return this.keywordBasedValidation(item);
    }
  }

  /**
   * Fallback keyword-based validation if LLM is unavailable
   */
  private keywordBasedValidation(item: FeedItem): ValidationResult {
    const content = `${item.title} ${item.description}`.toLowerCase();
    
    const elderKeywords = [
      'senior', 'elderly', 'elder', 'retiree', 'medicare', 'social security',
      'grandparent', 'older adult', 'retirement', 'pension'
    ];
    
    const scamKeywords = [
      'scam', 'fraud', 'phishing', 'identity theft', 'romance scam',
      'tech support', 'gift card', 'wire transfer', 'cryptocurrency',
      'government imposter', 'medicare fraud', 'robocall'
    ];

    const elderScore = elderKeywords.filter(k => content.includes(k)).length / elderKeywords.length;
    const scamScore = scamKeywords.filter(k => content.includes(k)).length / scamKeywords.length;
    
    const relevanceScore = (elderScore + scamScore) / 2;
    const isRelevant = relevanceScore > 0.3;

    return {
      isRelevant,
      relevanceScore,
      scamTypes: scamKeywords.filter(k => content.includes(k)),
      elderRelevance: elderScore > 0.5 ? 'high' : elderScore > 0.2 ? 'medium' : 'low',
      severity: scamScore > 0.5 ? 'high' : 'medium',
      reason: 'Keyword-based fallback validation',
      category: isRelevant ? 'government-advisory' : 'irrelevant'
    };
  }

  /**
   * Batch validate multiple items efficiently
   */
  async validateBatch(items: FeedItem[]): Promise<ValidationResult[]> {
    // Process in batches of 5 to avoid API rate limits
    const batchSize = 5;
    const results: ValidationResult[] = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchPromises = batch.map(item => this.validateRelevance(item));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Small delay between batches to respect API limits
      if (i + batchSize < items.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
  }

  /**
   * Check if content has expired (3+ months old) and should be archived
   */
  shouldArchive(publishedDate: Date): boolean {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    return publishedDate < threeMonthsAgo;
  }
}

export const contentValidator = new ContentValidator();