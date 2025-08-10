import { db } from './db';
import { communityReports, userPoints, validatedSources, sourceValidations, moderationLogs, scamTrends, newsItems } from '../shared/schema';
import { eq, desc, like, and, or, sql, count } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface CommunityReport {
  id: string;
  userId?: string;
  title: string;
  description: string;
  category: string;
  scamType?: string;
  location?: string;
  phoneNumber?: string;
  emailAddress?: string;
  websiteUrl?: string;
  amountLost?: number;
  evidence?: string[];
  tags?: string[];
  ipAddress?: string;
  userAgent?: string;
}

export interface ModerationResult {
  approved: boolean;
  reason: string;
  confidence: number;
  isDuplicate: boolean;
  duplicateId?: string;
  isSpam: boolean;
  spamReason?: string;
  suggestedTags?: string[];
}

export interface ValidationResult {
  isVerified: boolean;
  verificationSource?: string;
  confidence: number;
  relatedSources: string[];
  relatedTrends: string[];
}

export class CommunitySystem {
  
  async submitReport(report: CommunityReport): Promise<string> {
    const reportId = nanoid();
    
    // First run automated moderation
    const moderationResult = await this.automatedModeration(report);
    
    // Insert the report with moderation status
    await db.insert(communityReports).values({
      id: reportId,
      userId: report.userId || null,
      title: report.title,
      description: report.description,
      category: report.category,
      scamType: report.scamType,
      location: report.location,
      phoneNumber: report.phoneNumber,
      emailAddress: report.emailAddress,
      websiteUrl: report.websiteUrl,
      amountLost: report.amountLost ? Math.round(report.amountLost * 100) : null, // Convert to cents
      evidence: report.evidence || [],
      tags: moderationResult.suggestedTags || report.tags || [],
      moderationStatus: moderationResult.approved ? 'approved' : 'rejected',
      moderationReason: moderationResult.reason,
      verificationStatus: 'pending',
      ipAddress: report.ipAddress,
      userAgent: report.userAgent,
    });

    // Log moderation action
    await db.insert(moderationLogs).values({
      id: nanoid(),
      reportId,
      action: moderationResult.approved ? 'approved' : 'rejected',
      reason: moderationResult.reason,
      confidence: moderationResult.confidence,
      automatedRules: {
        isSpam: moderationResult.isSpam,
        isDuplicate: moderationResult.isDuplicate,
        duplicateId: moderationResult.duplicateId
      }
    });

    // Award points if approved and user is logged in
    if (moderationResult.approved && report.userId) {
      await this.awardPoints(report.userId, 'report_submission', 10, 'Submitted community report', reportId);
    }

    // If approved, run verification
    if (moderationResult.approved) {
      setTimeout(() => {
        this.verifyReport(reportId);
      }, 1000);
    }

    return reportId;
  }

  async automatedModeration(report: CommunityReport): Promise<ModerationResult> {
    try {
      // Check for duplicates
      const duplicateCheck = await this.checkForDuplicates(report);
      
      // Use AI to analyze content for spam and quality
      const aiAnalysis = await this.aiContentAnalysis(report);
      
      // Combine results
      const isSpam = aiAnalysis.isSpam || this.containsSpamPatterns(report);
      const approved = !isSpam && !duplicateCheck.isDuplicate && aiAnalysis.qualityScore > 0.6;

      return {
        approved,
        reason: !approved ? (isSpam ? 'Detected as spam' : duplicateCheck.isDuplicate ? 'Duplicate report' : 'Low quality content') : 'Approved',
        confidence: Math.min(aiAnalysis.confidence, duplicateCheck.confidence),
        isDuplicate: duplicateCheck.isDuplicate,
        duplicateId: duplicateCheck.duplicateId,
        isSpam,
        spamReason: isSpam ? aiAnalysis.spamReason : undefined,
        suggestedTags: aiAnalysis.suggestedTags
      };
    } catch (error) {
      console.error('Moderation error:', error);
      // Default to manual review on error
      return {
        approved: false,
        reason: 'Requires manual review',
        confidence: 0.5,
        isDuplicate: false,
        isSpam: false
      };
    }
  }

  private async checkForDuplicates(report: CommunityReport): Promise<{isDuplicate: boolean, duplicateId?: string, confidence: number}> {
    try {
      // Search for similar reports based on title, phone number, email, website
      const searchTerms = [
        report.phoneNumber,
        report.emailAddress,
        report.websiteUrl,
        ...report.title.split(' ').filter(word => word.length > 3)
      ].filter(Boolean);

      if (searchTerms.length === 0) {
        return { isDuplicate: false, confidence: 1.0 };
      }

      const existingReports = await db.select()
        .from(communityReports)
        .where(
          or(
            ...searchTerms.flatMap(term => [
              like(communityReports.title, `%${term}%`),
              like(communityReports.description, `%${term}%`),
              ...(term.includes('@') ? [like(communityReports.emailAddress, `%${term}%`)] : []),
              ...(term.match(/[\d\-\(\)\s]{10,}/) ? [like(communityReports.phoneNumber, `%${term}%`)] : []),
              ...(term.includes('.') ? [like(communityReports.websiteUrl, `%${term}%`)] : [])
            ])
          )
        )
        .limit(10);

      if (existingReports.length === 0) {
        return { isDuplicate: false, confidence: 1.0 };
      }

      // Use AI to determine if it's truly a duplicate
      const duplicateAnalysis = await this.aiDuplicateAnalysis(report, existingReports[0]);
      
      return {
        isDuplicate: duplicateAnalysis.isDuplicate,
        duplicateId: duplicateAnalysis.isDuplicate ? existingReports[0].id : undefined,
        confidence: duplicateAnalysis.confidence
      };
    } catch (error) {
      console.error('Duplicate check error:', error);
      return { isDuplicate: false, confidence: 0.5 };
    }
  }

  private async aiContentAnalysis(report: CommunityReport) {
    try {
      const prompt = `Analyze this community scam report for quality, spam detection, and categorization:

Title: ${report.title}
Description: ${report.description}
Category: ${report.category}
Scam Type: ${report.scamType || 'Unknown'}

Provide analysis in JSON format:
{
  "isSpam": boolean,
  "spamReason": "string if spam",
  "qualityScore": number (0.0-1.0),
  "confidence": number (0.0-1.0),
  "suggestedTags": ["tag1", "tag2"],
  "riskLevel": "low|medium|high|critical"
}`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.1
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error('AI content analysis error:', error);
      return {
        isSpam: false,
        qualityScore: 0.7,
        confidence: 0.5,
        suggestedTags: [],
        riskLevel: 'medium'
      };
    }
  }

  private async aiDuplicateAnalysis(newReport: CommunityReport, existingReport: any) {
    try {
      const prompt = `Compare these two scam reports and determine if they are duplicates:

REPORT 1 (New):
Title: ${newReport.title}
Description: ${newReport.description}
Phone: ${newReport.phoneNumber || 'None'}
Email: ${newReport.emailAddress || 'None'}
Website: ${newReport.websiteUrl || 'None'}

REPORT 2 (Existing):
Title: ${existingReport.title}
Description: ${existingReport.description}
Phone: ${existingReport.phoneNumber || 'None'}
Email: ${existingReport.emailAddress || 'None'}
Website: ${existingReport.websiteUrl || 'None'}

Respond in JSON format:
{
  "isDuplicate": boolean,
  "confidence": number (0.0-1.0),
  "reasoning": "explanation"
}`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.1
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error('AI duplicate analysis error:', error);
      return { isDuplicate: false, confidence: 0.5 };
    }
  }

  private containsSpamPatterns(report: CommunityReport): boolean {
    const spamPatterns = [
      /click here/i,
      /make money fast/i,
      /guaranteed income/i,
      /work from home/i,
      /free money/i,
      /viagra/i,
      /casino/i,
      /lottery winner/i
    ];

    const content = `${report.title} ${report.description}`.toLowerCase();
    return spamPatterns.some(pattern => pattern.test(content));
  }

  async verifyReport(reportId: string): Promise<void> {
    try {
      const report = await db.select()
        .from(communityReports)
        .where(eq(communityReports.id, reportId))
        .limit(1);

      if (report.length === 0) return;

      const validationResult = await this.validateAgainstSources(report[0]);
      
      // Update report with verification results
      await db.update(communityReports)
        .set({
          isVerified: validationResult.isVerified,
          verificationStatus: validationResult.isVerified ? 'verified' : 'unverified',
          verificationSource: validationResult.verificationSource,
          verificationDate: new Date(),
          updatedAt: new Date()
        })
        .where(eq(communityReports.id, reportId));

      // Award additional points for verified reports
      if (validationResult.isVerified && report[0].userId) {
        await this.awardPoints(report[0].userId, 'verification', 25, 'Report verified against official sources', reportId);
      }
    } catch (error) {
      console.error('Report verification error:', error);
    }
  }

  private async validateAgainstSources(report: any): Promise<ValidationResult> {
    try {
      // Get active validated sources
      const sources = await db.select()
        .from(validatedSources)
        .where(eq(validatedSources.isActive, true));

      let isVerified = false;
      let verificationSource: string | undefined;
      let confidence = 0;
      const relatedSources: string[] = [];
      const relatedTrends: string[] = [];

      // Check against news items
      const newsMatches = await this.findNewsMatches(report);
      if (newsMatches.length > 0) {
        isVerified = true;
        verificationSource = newsMatches[0].sourceAgency;
        confidence = 0.9;
        relatedSources.push(...newsMatches.map(n => n.sourceName));
      }

      // Check against scam trends
      const trendMatches = await this.findTrendMatches(report);
      if (trendMatches.length > 0) {
        isVerified = true;
        confidence = Math.max(confidence, 0.8);
        relatedTrends.push(...trendMatches.map(t => t.id));
      }

      return {
        isVerified,
        verificationSource,
        confidence,
        relatedSources,
        relatedTrends
      };
    } catch (error) {
      console.error('Source validation error:', error);
      return {
        isVerified: false,
        confidence: 0,
        relatedSources: [],
        relatedTrends: []
      };
    }
  }

  private async findNewsMatches(report: any) {
    const searchTerms = this.extractSearchTerms(report);
    
    return await db.select()
      .from(newsItems)
      .where(
        or(
          ...searchTerms.map(term => 
            or(
              like(newsItems.title, `%${term}%`),
              like(newsItems.content, `%${term}%`)
            )
          )
        )
      )
      .limit(5);
  }

  private async findTrendMatches(report: any) {
    const searchTerms = this.extractSearchTerms(report);
    
    return await db.select()
      .from(scamTrends)
      .where(
        or(
          ...searchTerms.map(term => 
            or(
              like(scamTrends.title, `%${term}%`),
              like(scamTrends.description, `%${term}%`)
            )
          )
        )
      )
      .limit(5);
  }

  private extractSearchTerms(report: any): string[] {
    const terms = [
      report.phoneNumber,
      report.emailAddress,
      report.websiteUrl,
      ...report.title.split(' ').filter((word: string) => word.length > 3),
      ...report.description.split(' ').filter((word: string) => word.length > 4)
    ].filter(Boolean);

    return Array.from(new Set(terms)).slice(0, 10); // Dedupe and limit
  }

  async awardPoints(userId: string, pointType: string, points: number, description: string, relatedId?: string): Promise<void> {
    try {
      await db.insert(userPoints).values({
        id: nanoid(),
        userId,
        pointType,
        points,
        description,
        relatedId
      });

      // Update user's total points
      const userPointsResult = await db.select({
        totalPoints: sql`sum(${userPoints.points})`
      })
      .from(userPoints)
      .where(eq(userPoints.userId, userId));

      // Note: We would update users table here if we had a totalPoints field
    } catch (error) {
      console.error('Points award error:', error);
    }
  }

  async searchReports(query: string, filters: any = {}, pagination: { limit: number, offset: number } = { limit: 20, offset: 0 }) {
    try {
      let whereConditions = [];

      // Text search
      if (query) {
        whereConditions.push(
          or(
            like(communityReports.title, `%${query}%`),
            like(communityReports.description, `%${query}%`),
            like(communityReports.location, `%${query}%`)
          )
        );
      }

      // Filters
      if (filters.category) {
        whereConditions.push(eq(communityReports.category, filters.category));
      }
      if (filters.verified !== undefined) {
        whereConditions.push(eq(communityReports.isVerified, filters.verified));
      }
      if (filters.moderationStatus) {
        whereConditions.push(eq(communityReports.moderationStatus, filters.moderationStatus));
      }

      // Default to approved reports only
      if (!filters.includeRejected) {
        whereConditions.push(eq(communityReports.moderationStatus, 'approved'));
      }

      const reports = await db.select()
        .from(communityReports)
        .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
        .orderBy(desc(communityReports.createdAt))
        .limit(pagination.limit)
        .offset(pagination.offset);

      const totalCount = await db.select({ count: count() })
        .from(communityReports)
        .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

      return {
        reports,
        total: totalCount[0].count,
        hasMore: totalCount[0].count > pagination.offset + pagination.limit
      };
    } catch (error) {
      console.error('Search reports error:', error);
      return { reports: [], total: 0, hasMore: false };
    }
  }

  async getReportById(reportId: string) {
    try {
      const report = await db.select()
        .from(communityReports)
        .where(eq(communityReports.id, reportId))
        .limit(1);

      return report[0] || null;
    } catch (error) {
      console.error('Get report error:', error);
      return null;
    }
  }

  async getCommunityStats() {
    try {
      const totalReports = await db.select({ count: count() })
        .from(communityReports)
        .where(eq(communityReports.moderationStatus, 'approved'));

      const verifiedReports = await db.select({ count: count() })
        .from(communityReports)
        .where(and(
          eq(communityReports.moderationStatus, 'approved'),
          eq(communityReports.isVerified, true)
        ));

      const recentReports = await db.select({ count: count() })
        .from(communityReports)
        .where(and(
          eq(communityReports.moderationStatus, 'approved'),
          sql`${communityReports.createdAt} >= current_timestamp - interval '30 days'`
        ));

      return {
        totalReports: totalReports[0].count,
        verifiedReports: verifiedReports[0].count,
        recentReports: recentReports[0].count,
        verificationRate: totalReports[0].count > 0 ? (verifiedReports[0].count / totalReports[0].count) : 0
      };
    } catch (error) {
      console.error('Community stats error:', error);
      return {
        totalReports: 0,
        verifiedReports: 0,
        recentReports: 0,
        verificationRate: 0
      };
    }
  }
}

export const communitySystem = new CommunitySystem();