import { BOOMER_FOCUSED_DATA_SOURCES, type DataSource } from './boomerFocusedDataSources';
import { contentModerationSystem, type ContentAnalysis } from './contentModerationSystem';
import { db } from './db';
import { dataSources, newsItems, scamTrends } from '@shared/schema';
import { eq, and, gte, desc } from 'drizzle-orm';

export interface SourceMetrics {
  sourceId: string;
  totalItems: number;
  approvedItems: number;
  rejectedItems: number;
  averageRelevanceScore: number;
  qualityScore: number; // 0-1 scale
  elderFocusScore: number; // 0-1 scale
  lastUpdated: Date;
  reliability: number;
  isActive: boolean;
  performanceIssues: string[];
}

export interface ContentItem {
  id: string;
  title: string;
  description: string;
  sourceUrl: string;
  sourceId: string;
  publishDate: Date;
  analysis?: ContentAnalysis;
  status: 'pending' | 'approved' | 'rejected' | 'reviewing';
  moderationReason?: string;
}

export class IntelligentSourceManager {
  private sourceMetrics: Map<string, SourceMetrics> = new Map();
  private qualityThresholds = {
    minimumElderFocus: 0.7,
    minimumQualityScore: 0.6,
    maximumRejectionRate: 0.8,
    minimumApprovalRate: 0.1
  };

  constructor() {
    this.initializeSourceMetrics();
  }

  private initializeSourceMetrics() {
    BOOMER_FOCUSED_DATA_SOURCES.forEach(source => {
      this.sourceMetrics.set(source.id, {
        sourceId: source.id,
        totalItems: 0,
        approvedItems: 0,
        rejectedItems: 0,
        averageRelevanceScore: source.boomerRelevance,
        qualityScore: source.boomerRelevance / 10,
        elderFocusScore: source.boomerRelevance / 10,
        lastUpdated: new Date(),
        reliability: source.boomerRelevance / 10,
        isActive: source.active,
        performanceIssues: []
      });
    });
  }

  async processContentFromSource(sourceId: string, rawContent: any[]): Promise<ContentItem[]> {
    const source = BOOMER_FOCUSED_DATA_SOURCES.find(s => s.id === sourceId);
    if (!source) {
      throw new Error(`Unknown source: ${sourceId}`);
    }

    const processedItems: ContentItem[] = [];
    
    console.log(`Processing ${rawContent.length} items from ${source.name}...`);

    for (const rawItem of rawContent) {
      try {
        const contentItem: ContentItem = {
          id: `${sourceId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: this.sanitizeTitle(rawItem.title || ''),
          description: this.extractDescription(rawItem),
          sourceUrl: rawItem.link || rawItem.url || '',
          sourceId,
          publishDate: new Date(rawItem.pubDate || Date.now()),
          status: 'pending'
        };

        // Skip empty or invalid content
        if (!contentItem.title || contentItem.title.length < 10) {
          continue;
        }

        // Analyze content for elder relevance
        const analysis = await contentModerationSystem.analyzeContent(
          contentItem.title,
          contentItem.description,
          contentItem.sourceUrl
        );

        contentItem.analysis = analysis;

        // Apply moderation decision
        switch (analysis.actionRecommendation) {
          case 'approve':
            if (analysis.relevanceScore >= 7) {
              contentItem.status = 'approved';
              await this.storeApprovedContent(contentItem);
              console.log(`✓ APPROVED: ${contentItem.title.substring(0, 60)}... (Score: ${analysis.relevanceScore})`);
            } else {
              contentItem.status = 'reviewing';
              contentItem.moderationReason = 'Medium relevance score, needs review';
              console.log(`? REVIEW: ${contentItem.title.substring(0, 60)}... (Score: ${analysis.relevanceScore})`);
            }
            break;

          case 'review':
            contentItem.status = 'reviewing';
            contentItem.moderationReason = analysis.reasoning;
            console.log(`? REVIEW: ${contentItem.title.substring(0, 60)}... (${analysis.reasoning})`);
            break;

          case 'reject':
            contentItem.status = 'rejected';
            contentItem.moderationReason = analysis.reasoning;
            console.log(`✗ REJECTED: ${contentItem.title.substring(0, 60)}... (${analysis.reasoning})`);
            break;
        }

        processedItems.push(contentItem);
        
        // Update source metrics
        this.updateSourceMetrics(sourceId, analysis);

      } catch (error) {
        console.error(`Error processing item from ${sourceId}:`, error);
      }
    }

    // Evaluate source performance
    await this.evaluateSourcePerformance(sourceId);

    return processedItems;
  }

  private async storeApprovedContent(item: ContentItem) {
    if (!item.analysis) return;

    try {
      // Determine if this should be stored as news or trend
      if (item.analysis.riskLevel === 'critical' || item.analysis.relevanceScore >= 8) {
        // Store as scam trend for high-priority items
        await db.insert(scamTrends).values({
          title: item.title,
          description: item.description,
          severity: item.analysis.riskLevel as any,
          category: item.analysis.category || 'other',
          affectedDemographics: ['seniors', 'elderly'],
          geographicScope: 'national',
          verificationStatus: 'verified',
          tags: item.analysis.tags,
          sources: [item.sourceUrl],
          firstReported: item.publishDate,
          lastUpdated: new Date(),
          isActive: true,
          elderVulnerabilities: item.analysis.elderVulnerabilities,
          preventionTips: this.generatePreventionTips(item.analysis.category),
          reportingInstructions: 'Report to local law enforcement and FTC at reportfraud.ftc.gov'
        });
      } else {
        // Store as news item
        await db.insert(newsItems).values({
          title: item.title,
          content: item.description,
          summary: item.description.substring(0, 200),
          category: item.analysis.category || 'fraud-alert',
          sourceAgency: item.sourceId.toUpperCase(),
          sourceUrl: item.sourceUrl,
          sourceName: BOOMER_FOCUSED_DATA_SOURCES.find(s => s.id === item.sourceId)?.name || 'Unknown',
          reliability: item.analysis.confidence,
          publishDate: item.publishDate,
          isVerified: item.analysis.confidence > 0.8,
          relatedTrends: [],
          elderRelevanceScore: item.analysis.relevanceScore,
          elderVulnerabilities: item.analysis.elderVulnerabilities
        });
      }
    } catch (error) {
      console.error('Failed to store approved content:', error);
    }
  }

  private generatePreventionTips(category: string | null): string[] {
    const tipsByCategory: Record<string, string[]> = {
      'social-security-scams': [
        'The SSA will never call threatening to suspend your benefits',
        'Never give your Social Security number over the phone',
        'Contact SSA directly at 1-800-772-1213 to verify any communication'
      ],
      'tech-support-scams': [
        'Microsoft/Apple will never call you about computer problems',
        'Never allow remote access to your computer',
        'Hang up on unsolicited tech support calls'
      ],
      'romance-scams': [
        'Never send money to someone you met online',
        'Be suspicious of anyone asking for financial help',
        'Meet in person before developing a relationship'
      ],
      'medicare-fraud': [
        'Guard your Medicare number like a credit card',
        'Medicare will never call asking for personal information',
        'Review your Medicare statements regularly'
      ]
    };

    return tipsByCategory[category || ''] || [
      'Verify suspicious communications through official channels',
      'Never provide personal information to unsolicited callers',
      'When in doubt, hang up and call the official number'
    ];
  }

  private updateSourceMetrics(sourceId: string, analysis: ContentAnalysis) {
    const metrics = this.sourceMetrics.get(sourceId);
    if (!metrics) return;

    metrics.totalItems++;
    
    if (analysis.actionRecommendation === 'approve') {
      metrics.approvedItems++;
    } else if (analysis.actionRecommendation === 'reject') {
      metrics.rejectedItems++;
    }

    // Update running averages
    metrics.averageRelevanceScore = (
      (metrics.averageRelevanceScore * (metrics.totalItems - 1)) + analysis.relevanceScore
    ) / metrics.totalItems;

    // Calculate quality score based on approval rate and relevance
    const approvalRate = metrics.approvedItems / metrics.totalItems;
    const rejectionRate = metrics.rejectedItems / metrics.totalItems;
    
    metrics.qualityScore = Math.min(1, (approvalRate * 2 + metrics.averageRelevanceScore / 10) / 2);
    metrics.elderFocusScore = metrics.averageRelevanceScore / 10;

    metrics.lastUpdated = new Date();
    this.sourceMetrics.set(sourceId, metrics);
  }

  private async evaluateSourcePerformance(sourceId: string) {
    const metrics = this.sourceMetrics.get(sourceId);
    if (!metrics || metrics.totalItems < 10) return; // Need minimum sample size

    const issues: string[] = [];
    
    // Check approval rate
    const approvalRate = metrics.approvedItems / metrics.totalItems;
    if (approvalRate < this.qualityThresholds.minimumApprovalRate) {
      issues.push(`Low approval rate: ${(approvalRate * 100).toFixed(1)}%`);
    }

    // Check rejection rate
    const rejectionRate = metrics.rejectedItems / metrics.totalItems;
    if (rejectionRate > this.qualityThresholds.maximumRejectionRate) {
      issues.push(`High rejection rate: ${(rejectionRate * 100).toFixed(1)}%`);
    }

    // Check elder focus
    if (metrics.elderFocusScore < this.qualityThresholds.minimumElderFocus) {
      issues.push(`Low elder focus score: ${(metrics.elderFocusScore * 100).toFixed(1)}%`);
    }

    // Check overall quality
    if (metrics.qualityScore < this.qualityThresholds.minimumQualityScore) {
      issues.push(`Low quality score: ${(metrics.qualityScore * 100).toFixed(1)}%`);
    }

    metrics.performanceIssues = issues;

    // Deactivate consistently poor sources
    if (issues.length >= 3 && metrics.totalItems > 50) {
      metrics.isActive = false;
      console.warn(`⚠️  Deactivating source ${sourceId} due to poor performance: ${issues.join(', ')}`);
    }

    // Log performance summary
    if (metrics.totalItems % 50 === 0) { // Every 50 items
      console.log(`📊 Source Performance [${sourceId}]:
        - Total Items: ${metrics.totalItems}
        - Approval Rate: ${(approvalRate * 100).toFixed(1)}%
        - Avg Relevance: ${metrics.averageRelevanceScore.toFixed(1)}/10
        - Quality Score: ${(metrics.qualityScore * 100).toFixed(1)}%
        - Elder Focus: ${(metrics.elderFocusScore * 100).toFixed(1)}%
        - Issues: ${issues.length > 0 ? issues.join(', ') : 'None'}`);
    }
  }

  getSourceMetrics(sourceId?: string): SourceMetrics[] {
    if (sourceId) {
      const metrics = this.sourceMetrics.get(sourceId);
      return metrics ? [metrics] : [];
    }
    return Array.from(this.sourceMetrics.values());
  }

  getTopPerformingSources(limit: number = 10): SourceMetrics[] {
    return Array.from(this.sourceMetrics.values())
      .filter(metrics => metrics.isActive && metrics.totalItems > 5)
      .sort((a, b) => b.qualityScore - a.qualityScore)
      .slice(0, limit);
  }

  getPoorPerformingSources(): SourceMetrics[] {
    return Array.from(this.sourceMetrics.values())
      .filter(metrics => 
        metrics.performanceIssues.length > 0 || 
        metrics.qualityScore < this.qualityThresholds.minimumQualityScore
      )
      .sort((a, b) => a.qualityScore - b.qualityScore);
  }

  private sanitizeTitle(title: string): string {
    return title.trim().substring(0, 200);
  }

  private extractDescription(item: any): string {
    let description = item.contentSnippet || item.content || item.summary || item.description || '';
    
    // Clean HTML tags and entities
    description = description
      .replace(/<[^>]*>/g, ' ')
      .replace(/&[^;]+;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    return description.substring(0, 500);
  }
}

export const intelligentSourceManager = new IntelligentSourceManager();