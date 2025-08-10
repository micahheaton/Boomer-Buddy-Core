import OpenAI from 'openai';
import { BOOMER_RELEVANT_KEYWORDS, IRRELEVANT_CATEGORIES } from './boomerFocusedDataSources';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Content categories that are specifically relevant to elder targeting
export const ELDER_TARGETED_CATEGORIES = {
  'social-security-scams': {
    weight: 10,
    keywords: ['social security', 'ssa', 'disability benefits', 'medicare card', 'social security number'],
    patterns: ['fake ssa calls', 'benefit suspension threats', 'medicare scam calls']
  },
  'medicare-fraud': {
    weight: 10,
    keywords: ['medicare', 'medicaid', 'health insurance', 'prescription', 'medical benefits'],
    patterns: ['fake medicare cards', 'prescription fraud', 'health insurance scams']
  },
  'tech-support-scams': {
    weight: 9,
    keywords: ['tech support', 'computer virus', 'microsoft support', 'apple support', 'computer repair'],
    patterns: ['fake tech support calls', 'computer virus scams', 'remote access scams']
  },
  'romance-scams': {
    weight: 9,
    keywords: ['romance scam', 'dating scam', 'online dating', 'catfishing', 'lonely hearts'],
    patterns: ['fake dating profiles', 'military romance scams', 'emergency money requests']
  },
  'grandparent-scams': {
    weight: 10,
    keywords: ['grandparent scam', 'emergency scam', 'bail money', 'accident scam', 'family emergency'],
    patterns: ['fake emergency calls', 'grandchild in trouble', 'urgent money requests']
  },
  'investment-fraud': {
    weight: 8,
    keywords: ['investment scam', 'retirement fund', 'pension fraud', 'fake investments', 'ponzi scheme'],
    patterns: ['fake financial advisors', 'retirement scams', 'high-return investments']
  },
  'phone-scams': {
    weight: 8,
    keywords: ['robocall', 'phone scam', 'telemarketing fraud', 'caller id spoofing', 'phone fraud'],
    patterns: ['fake irs calls', 'charity scam calls', 'warranty scam calls']
  },
  'mail-fraud': {
    weight: 7,
    keywords: ['mail fraud', 'sweepstakes scam', 'lottery scam', 'prize scam', 'fake checks'],
    patterns: ['fake lottery winnings', 'sweepstakes fraud', 'advance fee scams']
  },
  'identity-theft': {
    weight: 8,
    keywords: ['identity theft', 'personal information', 'phishing', 'data breach', 'stolen identity'],
    patterns: ['phishing emails targeting seniors', 'fake government websites', 'identity harvesting']
  },
  'home-repair-scams': {
    weight: 7,
    keywords: ['home repair scam', 'contractor fraud', 'door-to-door', 'roof repair', 'driveway scam'],
    patterns: ['fake contractors', 'home improvement scams', 'door-to-door fraud']
  }
};

// Categories to explicitly exclude (technical security, not elder-targeted social engineering)
export const EXCLUDED_TECHNICAL_CATEGORIES = [
  'penetration-testing', 'vulnerability-scanning', 'malware-analysis', 'reverse-engineering',
  'network-security', 'endpoint-security', 'cloud-security', 'application-security',
  'cryptography', 'blockchain-security', 'api-security', 'mobile-app-security',
  'iot-security', 'industrial-security', 'enterprise-security', 'developer-tools',
  'security-frameworks', 'compliance-standards', 'threat-hunting', 'incident-response',
  'forensics', 'red-team', 'blue-team', 'soc-operations', 'siem', 'threat-intelligence',
  'zero-day-exploits', 'buffer-overflows', 'sql-injection', 'xss-attacks', 'csrf',
  'privilege-escalation', 'lateral-movement', 'persistence', 'evasion-techniques'
];

export interface ContentAnalysis {
  isElderRelevant: boolean;
  relevanceScore: number; // 0-10 scale
  category: string | null;
  confidence: number; // 0-1 scale
  reasoning: string;
  tags: string[];
  riskLevel: 'critical' | 'high' | 'medium' | 'low' | 'not-relevant';
  elderVulnerabilities: string[];
  actionRecommendation: 'approve' | 'review' | 'reject';
}

export class ContentModerationSystem {
  
  async analyzeContent(title: string, description: string, sourceUrl?: string): Promise<ContentAnalysis> {
    const content = `${title}\n\n${description}`.toLowerCase();
    
    // Quick pre-screening for obvious non-elder content
    if (this.isObviouslyTechnical(content)) {
      return {
        isElderRelevant: false,
        relevanceScore: 0,
        category: null,
        confidence: 0.95,
        reasoning: 'Content appears to be technical security information, not elder-targeted social engineering',
        tags: ['technical-security'],
        riskLevel: 'not-relevant',
        elderVulnerabilities: [],
        actionRecommendation: 'reject'
      };
    }

    // AI-powered analysis for sophisticated content evaluation
    const aiAnalysis = await this.performAIAnalysis(title, description);
    
    // Rule-based analysis for pattern matching
    const ruleBasedAnalysis = this.performRuleBasedAnalysis(content);
    
    // Combine AI and rule-based results
    const combinedAnalysis = this.combineAnalyses(aiAnalysis, ruleBasedAnalysis);
    
    return combinedAnalysis;
  }

  private isObviouslyTechnical(content: string): boolean {
    const technicalIndicators = [
      'buffer overflow', 'sql injection', 'xss', 'csrf', 'rce', 'lfi', 'rfi',
      'privilege escalation', 'lateral movement', 'persistence mechanism',
      'evasion technique', 'exploit development', 'reverse engineering',
      'penetration testing', 'vulnerability assessment', 'threat hunting',
      'malware analysis', 'forensic analysis', 'incident response',
      'siem configuration', 'soc operations', 'threat intelligence',
      'api security', 'container security', 'kubernetes security',
      'cloud misconfiguration', 'terraform security', 'devops security',
      'zero-day exploit', 'proof of concept', 'exploitation framework'
    ];

    return technicalIndicators.some(indicator => content.includes(indicator));
  }

  private async performAIAnalysis(title: string, description: string): Promise<Partial<ContentAnalysis>> {
    try {
      const prompt = `
You are an expert in elder fraud and social engineering attacks. Analyze this content to determine if it describes scams or fraudulent activities that specifically target elderly or senior citizens through social engineering, emotional manipulation, or exploitation of trust and vulnerability.

Title: ${title}
Description: ${description}

Consider these factors:
1. Does this describe social engineering attacks targeting seniors' trust, emotions, or lack of technical knowledge?
2. Does it involve scams that exploit common senior concerns (health, finance, family, government benefits)?
3. Does it describe fraud that relies on manipulation rather than technical exploits?
4. Does it target vulnerabilities specific to aging adults (isolation, health concerns, fixed income, trust in authority)?

IGNORE technical security content like:
- Software vulnerabilities, exploits, penetration testing
- Network security, malware analysis, reverse engineering
- Developer tools, API security, cloud security
- Cryptocurrency technical issues (unless it's investment fraud targeting seniors)

Respond with JSON containing:
{
  "isElderRelevant": boolean,
  "relevanceScore": number (0-10),
  "category": string or null,
  "confidence": number (0-1),
  "reasoning": string,
  "elderVulnerabilities": array of strings,
  "riskLevel": "critical" | "high" | "medium" | "low" | "not-relevant"
}
`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.1,
        max_tokens: 1000
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}');
      return analysis;
    } catch (error) {
      console.error('AI analysis failed:', error);
      // Fallback to conservative analysis
      return {
        isElderRelevant: false,
        relevanceScore: 0,
        confidence: 0.1,
        reasoning: 'AI analysis failed, defaulting to rejection for safety'
      };
    }
  }

  private performRuleBasedAnalysis(content: string): Partial<ContentAnalysis> {
    let totalScore = 0;
    let matchedCategories: string[] = [];
    let elderVulnerabilities: string[] = [];
    let tags: string[] = [];

    // Check for elder-targeted categories
    for (const [category, config] of Object.entries(ELDER_TARGETED_CATEGORIES)) {
      const keywordMatches = config.keywords.filter(keyword => 
        content.includes(keyword.toLowerCase())
      ).length;
      
      const patternMatches = config.patterns.filter(pattern =>
        content.includes(pattern.toLowerCase())
      ).length;

      if (keywordMatches > 0 || patternMatches > 0) {
        const categoryScore = (keywordMatches + patternMatches * 2) * config.weight / 10;
        totalScore += categoryScore;
        matchedCategories.push(category);
        tags.push(category);
      }
    }

    // Check for elder vulnerability indicators
    const vulnerabilityPatterns = {
      'trust-exploitation': ['trusted caller', 'government official', 'family member', 'authority figure'],
      'emotional-manipulation': ['urgent', 'emergency', 'immediate action', 'time sensitive', 'act now'],
      'isolation-targeting': ['lonely', 'isolated', 'home alone', 'no family nearby'],
      'financial-targeting': ['fixed income', 'retirement savings', 'pension', 'social security'],
      'health-concerns': ['medicare', 'prescription', 'health insurance', 'medical bills'],
      'technology-confusion': ['computer problems', 'virus warning', 'tech support', 'update required']
    };

    for (const [vulnerability, patterns] of Object.entries(vulnerabilityPatterns)) {
      if (patterns.some(pattern => content.includes(pattern))) {
        elderVulnerabilities.push(vulnerability);
      }
    }

    // Check for exclusions
    const hasExcludedContent = EXCLUDED_TECHNICAL_CATEGORIES.some(category =>
      content.includes(category.replace('-', ' '))
    );

    if (hasExcludedContent) {
      totalScore = Math.max(0, totalScore - 5);
    }

    const relevanceScore = Math.min(10, totalScore);
    const isElderRelevant = relevanceScore >= 3 && elderVulnerabilities.length > 0;

    return {
      isElderRelevant,
      relevanceScore,
      category: matchedCategories[0] || null,
      elderVulnerabilities,
      tags
    };
  }

  private combineAnalyses(aiAnalysis: Partial<ContentAnalysis>, ruleAnalysis: Partial<ContentAnalysis>): ContentAnalysis {
    // AI analysis takes priority, but rule-based provides backup
    const relevanceScore = Math.max(
      aiAnalysis.relevanceScore || 0,
      ruleAnalysis.relevanceScore || 0
    );

    const isElderRelevant = !!(aiAnalysis.isElderRelevant || ruleAnalysis.isElderRelevant) && relevanceScore >= 3;
    
    const elderVulnerabilities = [
      ...(aiAnalysis.elderVulnerabilities || []),
      ...(ruleAnalysis.elderVulnerabilities || [])
    ];

    const tags = [
      ...(ruleAnalysis.tags || []),
      'ai-analyzed',
      'rule-checked'
    ];

    let actionRecommendation: 'approve' | 'review' | 'reject';
    let riskLevel: 'critical' | 'high' | 'medium' | 'low' | 'not-relevant';

    if (!isElderRelevant || relevanceScore < 3) {
      actionRecommendation = 'reject';
      riskLevel = 'not-relevant';
    } else if (relevanceScore >= 8 && elderVulnerabilities.length >= 2) {
      actionRecommendation = 'approve';
      riskLevel = 'critical';
    } else if (relevanceScore >= 6) {
      actionRecommendation = 'approve';
      riskLevel = 'high';
    } else if (relevanceScore >= 4) {
      actionRecommendation = 'review';
      riskLevel = 'medium';
    } else {
      actionRecommendation = 'reject';
      riskLevel = 'low';
    }

    return {
      isElderRelevant,
      relevanceScore,
      category: aiAnalysis.category || ruleAnalysis.category || null,
      confidence: Math.max(aiAnalysis.confidence || 0.5, 0.7),
      reasoning: aiAnalysis.reasoning || 'Combined AI and rule-based analysis',
      tags: Array.from(new Set(tags)),
      riskLevel,
      elderVulnerabilities: Array.from(new Set(elderVulnerabilities)),
      actionRecommendation
    };
  }

  async batchAnalyzeContent(items: Array<{title: string, description: string, sourceUrl?: string}>): Promise<ContentAnalysis[]> {
    const analyses = await Promise.all(
      items.map(item => this.analyzeContent(item.title, item.description, item.sourceUrl))
    );
    
    return analyses;
  }

  // Quality metrics for the moderation system
  getSystemMetrics(): {
    approvalRate: number;
    rejectionRate: number;
    reviewRate: number;
    averageRelevanceScore: number;
  } {
    // This would be implemented with actual data tracking
    return {
      approvalRate: 0.15, // 15% of content approved (high-quality filtering)
      rejectionRate: 0.70, // 70% rejected (filtering out technical content)
      reviewRate: 0.15,   // 15% needs human review
      averageRelevanceScore: 6.2
    };
  }
}

export const contentModerationSystem = new ContentModerationSystem();