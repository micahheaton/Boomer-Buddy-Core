// Curated data sources specifically targeting scams that affect seniors/boomers
// Focus on financial fraud, tech support scams, healthcare fraud, and romance scams
// Mix of federal, state, local, and private sector sources

export interface DataSource {
  id: string;
  name: string;
  description: string;
  url: string;
  category: 'federal' | 'state' | 'local' | 'hyperscaler' | 'independent' | 'advocacy';
  priority: 'high' | 'medium' | 'low';
  active: boolean;
  boomerRelevance: number; // 1-10 scale, how relevant to boomer-specific scams
  updateFrequency: string;
  lastChecked?: Date;
  status?: 'active' | 'inactive' | 'error';
}

export const BOOMER_FOCUSED_DATA_SOURCES: DataSource[] = [
  // Federal Government Sources - High Priority
  {
    id: 'ftc-consumer-sentinel',
    name: 'FTC Consumer Sentinel Network',
    description: 'Federal Trade Commission fraud alerts specifically targeting elder fraud and financial scams',
    url: 'https://www.ftc.gov/news-events/topics/protecting-consumers/elder-fraud',
    category: 'federal',
    priority: 'high',
    active: true,
    boomerRelevance: 10,
    updateFrequency: 'daily'
  },
  {
    id: 'fbi-ic3-seniors',
    name: 'FBI Internet Crime Complaint Center - Elder Fraud',
    description: 'FBI alerts and bulletins specifically about crimes targeting seniors',
    url: 'https://www.ic3.gov/Media/Y2024/PSA240125',
    category: 'federal',
    priority: 'high',
    active: true,
    boomerRelevance: 10,
    updateFrequency: 'weekly'
  },
  {
    id: 'ssa-fraud-alerts',
    name: 'Social Security Administration Fraud Alerts',
    description: 'SSA warnings about social security and benefit-related scams',
    url: 'https://www.ssa.gov/scam/',
    category: 'federal',
    priority: 'high',
    active: true,
    boomerRelevance: 10,
    updateFrequency: 'weekly'
  },
  {
    id: 'cms-medicare-fraud',
    name: 'Centers for Medicare & Medicaid Services Fraud Alerts',
    description: 'CMS alerts about Medicare and healthcare fraud targeting seniors',
    url: 'https://www.cms.gov/newsroom/fact-sheets',
    category: 'federal',
    priority: 'high',
    active: true,
    boomerRelevance: 9,
    updateFrequency: 'weekly'
  },
  {
    id: 'cfpb-elder-complaints',
    name: 'Consumer Financial Protection Bureau - Elder Financial Protection',
    description: 'CFPB data and alerts about financial exploitation of older adults',
    url: 'https://www.consumerfinance.gov/about-us/newsroom/',
    category: 'federal',
    priority: 'high',
    active: true,
    boomerRelevance: 9,
    updateFrequency: 'weekly'
  },
  {
    id: 'sec-investor-alerts',
    name: 'SEC Investor Alerts - Senior Investor Protection',
    description: 'Securities and Exchange Commission alerts about investment fraud targeting seniors',
    url: 'https://www.sec.gov/investor/alerts',
    category: 'federal',
    priority: 'high',
    active: true,
    boomerRelevance: 8,
    updateFrequency: 'weekly'
  },

  // Advocacy Organizations - High Priority
  {
    id: 'aarp-fraud-watch',
    name: 'AARP Fraud Watch Network',
    description: 'AARP\'s comprehensive fraud alerts and scam tracking for 50+ adults',
    url: 'https://www.aarp.org/money/scams-fraud/info-2019/scam-tracking-map.html',
    category: 'advocacy',
    priority: 'high',
    active: true,
    boomerRelevance: 10,
    updateFrequency: 'daily'
  },
  {
    id: 'ncoa-fraud-prevention',
    name: 'National Council on Aging - Fraud Prevention',
    description: 'NCOA resources and alerts specifically about elder financial abuse',
    url: 'https://www.ncoa.org/article/top-10-scams-targeting-seniors',
    category: 'advocacy',
    priority: 'high',
    active: true,
    boomerRelevance: 9,
    updateFrequency: 'weekly'
  },
  {
    id: 'bbb-scam-tracker',
    name: 'Better Business Bureau Scam Tracker',
    description: 'BBB\'s real-time scam reports with senior-focused filtering',
    url: 'https://www.bbb.org/scamtracker',
    category: 'independent',
    priority: 'high',
    active: true,
    boomerRelevance: 8,
    updateFrequency: 'hourly'
  },

  // Hyperscaler/Tech Company Sources - Medium Priority
  {
    id: 'microsoft-security-seniors',
    name: 'Microsoft Security - Senior Protection',
    description: 'Microsoft alerts about tech support scams and phishing targeting seniors',
    url: 'https://www.microsoft.com/en-us/security/blog/',
    category: 'hyperscaler',
    priority: 'medium',
    active: true,
    boomerRelevance: 8,
    updateFrequency: 'weekly'
  },
  {
    id: 'google-safety-seniors',
    name: 'Google Safety Center - Senior Safety',
    description: 'Google resources about online safety specifically for older adults',
    url: 'https://safety.google/elderly/',
    category: 'hyperscaler',
    priority: 'medium',
    active: true,
    boomerRelevance: 7,
    updateFrequency: 'monthly'
  },
  {
    id: 'amazon-security-alerts',
    name: 'Amazon Security Alerts',
    description: 'Amazon warnings about account takeover and shopping scams',
    url: 'https://www.amazon.com/gp/help/customer/display.html?nodeId=G7Y4B4QCC47XEE4M',
    category: 'hyperscaler',
    priority: 'medium',
    active: true,
    boomerRelevance: 7,
    updateFrequency: 'weekly'
  },

  // State-Level Sources - Medium Priority
  {
    id: 'california-doj-seniors',
    name: 'California DOJ - Senior Protection',
    description: 'California Department of Justice alerts about elder abuse and fraud',
    url: 'https://oag.ca.gov/consumers/general/seniors',
    category: 'state',
    priority: 'medium',
    active: true,
    boomerRelevance: 8,
    updateFrequency: 'weekly'
  },
  {
    id: 'florida-aging-fraud',
    name: 'Florida Department of Elder Affairs - Fraud Prevention',
    description: 'Florida state alerts about elder fraud (high senior population state)',
    url: 'https://elderaffairs.org/doea/elder_abuse_fraud.php',
    category: 'state',
    priority: 'medium',
    active: true,
    boomerRelevance: 8,
    updateFrequency: 'weekly'
  },
  {
    id: 'texas-hhsc-seniors',
    name: 'Texas Health and Human Services - Senior Protection',
    description: 'Texas HHSC alerts about healthcare and benefit fraud targeting seniors',
    url: 'https://www.hhs.texas.gov/about-hhs/communications-events/news',
    category: 'state',
    priority: 'medium',
    active: true,
    boomerRelevance: 7,
    updateFrequency: 'weekly'
  },
  {
    id: 'ny-attorney-general-seniors',
    name: 'New York Attorney General - Senior Protection',
    description: 'NY AG alerts and bulletins about scams targeting older New Yorkers',
    url: 'https://ag.ny.gov/consumer-frauds/seniors',
    category: 'state',
    priority: 'medium',
    active: true,
    boomerRelevance: 8,
    updateFrequency: 'weekly'
  },

  // Independent/Research Organizations - Medium Priority
  {
    id: 'krebsonsecurity-seniors',
    name: 'Krebs on Security - Senior-Focused Threats',
    description: 'Brian Krebs\' security blog with frequent coverage of elder-targeted scams',
    url: 'https://krebsonsecurity.com/',
    category: 'independent',
    priority: 'medium',
    active: true,
    boomerRelevance: 7,
    updateFrequency: 'daily'
  },
  {
    id: 'sans-elder-threats',
    name: 'SANS Internet Storm Center - Elder Threat Intelligence',
    description: 'SANS ISC threat intelligence with focus on scams affecting seniors',
    url: 'https://isc.sans.edu/',
    category: 'independent',
    priority: 'medium',
    active: true,
    boomerRelevance: 6,
    updateFrequency: 'daily'
  },

  // Local/Community Sources - Lower Priority but Important
  {
    id: 'elder-abuse-hotline',
    name: 'National Elder Abuse Hotline Reports',
    description: 'Aggregated reports from the National Elder Abuse Hotline about trending scams',
    url: 'https://ncea.acl.gov/',
    category: 'advocacy',
    priority: 'medium',
    active: true,
    boomerRelevance: 9,
    updateFrequency: 'weekly'
  },
  {
    id: 'local-police-seniors',
    name: 'Local Police Senior Safety Bulletins',
    description: 'Aggregated bulletins from major metro police departments about senior-targeted crime',
    url: 'https://www.policefoundation.org/elder-abuse/',
    category: 'local',
    priority: 'low',
    active: true,
    boomerRelevance: 7,
    updateFrequency: 'monthly'
  },

  // Financial Industry Sources - High Priority
  {
    id: 'finra-senior-alerts',
    name: 'FINRA Senior Investor Alerts',
    description: 'Financial Industry Regulatory Authority alerts about investment fraud targeting seniors',
    url: 'https://www.finra.org/investors/alerts',
    category: 'independent',
    priority: 'high',
    active: true,
    boomerRelevance: 8,
    updateFrequency: 'weekly'
  },
  {
    id: 'aba-elder-fraud',
    name: 'American Bankers Association - Elder Financial Abuse',
    description: 'ABA resources and alerts about banking fraud targeting seniors',
    url: 'https://www.aba.com/advocacy/policy-analysis/elder-financial-abuse',
    category: 'independent',
    priority: 'high',
    active: true,
    boomerRelevance: 8,
    updateFrequency: 'weekly'
  }
];

// Categories that are NOT relevant to boomers (to filter out):
export const IRRELEVANT_CATEGORIES = [
  'prompt-injection',
  'ai-model-attacks',
  'cryptocurrency-mining',
  'gaming-exploits',
  'developer-tools',
  'enterprise-security',
  'cloud-infrastructure',
  'mobile-app-security',
  'iot-vulnerabilities',
  'social-media-teens'
];

// Keywords that indicate boomer relevance:
export const BOOMER_RELEVANT_KEYWORDS = [
  'senior', 'seniors', 'elder', 'elderly', 'older adult', 'older adults',
  'medicare', 'medicaid', 'social security', 'retirement', 'pension',
  'tech support scam', 'phone scam', 'romance scam', 'grandparent scam',
  'healthcare fraud', 'prescription fraud', 'insurance fraud',
  'financial exploitation', 'elder abuse', 'elder fraud',
  'benefit fraud', 'tax preparation scam', 'charity scam',
  'home repair scam', 'telemarketing fraud', 'mail fraud',
  'phishing email', 'fake website', 'identity theft',
  'credit card fraud', 'bank fraud', 'investment fraud',
  'sweepstakes scam', 'lottery scam', 'prize scam',
  'computer virus scam', 'microsoft scam', 'apple scam',
  'amazon scam', 'irs scam', 'social security scam'
];

export function isBoomerRelevant(title: string, description: string): boolean {
  const content = `${title} ${description}`.toLowerCase();
  
  // Check for explicit boomer-relevant keywords
  const hasRelevantKeywords = BOOMER_RELEVANT_KEYWORDS.some(keyword => 
    content.includes(keyword.toLowerCase())
  );
  
  // Check for irrelevant categories
  const hasIrrelevantContent = IRRELEVANT_CATEGORIES.some(category => 
    content.includes(category.toLowerCase())
  );
  
  return hasRelevantKeywords && !hasIrrelevantContent;
}

export function calculateBoomerRelevanceScore(title: string, description: string): number {
  const content = `${title} ${description}`.toLowerCase();
  let score = 0;
  
  // High-value keywords (common boomer-targeted scams)
  const highValueKeywords = [
    'senior', 'elder', 'medicare', 'social security', 'tech support',
    'romance scam', 'grandparent scam', 'phone scam'
  ];
  
  highValueKeywords.forEach(keyword => {
    if (content.includes(keyword)) score += 3;
  });
  
  // Medium-value keywords
  const mediumValueKeywords = [
    'older adult', 'retirement', 'healthcare fraud', 'financial exploitation',
    'telemarketing', 'phishing', 'identity theft', 'investment fraud'
  ];
  
  mediumValueKeywords.forEach(keyword => {
    if (content.includes(keyword)) score += 2;
  });
  
  // Basic relevance keywords
  BOOMER_RELEVANT_KEYWORDS.forEach(keyword => {
    if (content.includes(keyword.toLowerCase())) score += 1;
  });
  
  // Penalty for irrelevant content
  IRRELEVANT_CATEGORIES.forEach(category => {
    if (content.includes(category.toLowerCase())) score -= 5;
  });
  
  return Math.max(0, Math.min(10, score));
}