import { db } from './db';
import { communityReports, userPoints, validatedSources } from '../shared/schema';
import { nanoid } from 'nanoid';

export class HistoricalCommunitySeeder {
  
  async seedCommunityData(): Promise<void> {
    console.log('Seeding historical community data...');
    
    await this.seedValidatedSources();
    await this.seedHistoricalReports();
    
    console.log('Historical community data seeding completed');
  }

  private async seedValidatedSources(): Promise<void> {
    const sources = [
      {
        id: 'source-ftc-001',
        name: 'Federal Trade Commission',
        url: 'https://www.ftc.gov',
        baseUrl: 'ftc.gov',
        sourceType: 'government',
        category: 'government',
        agency: 'FTC',
        reliability: 0.98,
        trustScore: 0.96,
        isActive: true,
        validationCount: 245,
        successfulValidations: 238,
        verificationCriteria: {
          domainVerification: true,
          contentPatterns: ['scam', 'fraud', 'consumer protection'],
          officialStatus: true
        }
      },
      {
        id: 'source-fbi-001',
        name: 'FBI Internet Crime Complaint Center',
        url: 'https://www.ic3.gov',
        baseUrl: 'ic3.gov',
        sourceType: 'government',
        category: 'government',
        agency: 'FBI',
        reliability: 0.99,
        trustScore: 0.98,
        isActive: true,
        validationCount: 189,
        successfulValidations: 186,
        verificationCriteria: {
          domainVerification: true,
          contentPatterns: ['cybercrime', 'internet crime', 'scam'],
          officialStatus: true
        }
      },
      {
        id: 'source-bbb-001',
        name: 'Better Business Bureau',
        url: 'https://www.bbb.org',
        baseUrl: 'bbb.org',
        sourceType: 'organization',
        category: 'consumer-protection',
        agency: 'BBB',
        reliability: 0.85,
        trustScore: 0.82,
        isActive: true,
        validationCount: 156,
        successfulValidations: 134,
        verificationCriteria: {
          domainVerification: true,
          contentPatterns: ['scam tracker', 'business review', 'fraud alert'],
          officialStatus: true
        }
      },
      {
        id: 'source-aarp-001',
        name: 'AARP Fraud Watch Network',
        url: 'https://www.aarp.org/money/scams-fraud',
        baseUrl: 'aarp.org',
        sourceType: 'organization',
        category: 'consumer-protection',
        agency: 'AARP',
        reliability: 0.88,
        trustScore: 0.85,
        isActive: true,
        validationCount: 123,
        successfulValidations: 108,
        verificationCriteria: {
          domainVerification: true,
          contentPatterns: ['fraud watch', 'scam alert', 'senior protection'],
          officialStatus: true
        }
      }
    ];

    for (const source of sources) {
      await db.insert(validatedSources).values({
        ...source,
        lastValidated: new Date(),
        createdAt: new Date('2023-02-01'),
        updatedAt: new Date()
      }).onConflictDoNothing();
    }
  }

  private async seedHistoricalReports(): Promise<void> {
    const reports = [
      // Early 2023 reports
      {
        id: 'report-2023-001',
        userId: null,
        title: 'Fake Amazon Customer Service Phone Scam',
        description: 'Received a call claiming to be from Amazon about suspicious activity on my account. They asked for my credit card details to "verify" my account. The caller ID showed a local number but they had a foreign accent.',
        category: 'phone-scam',
        scamType: 'imposter',
        location: 'Tampa, FL',
        phoneNumber: '813-555-0147',
        amountLost: 0,
        evidence: ['Caller ID screenshot', 'Call log'],
        tags: ['amazon', 'imposter', 'credit-card'],
        isVerified: true,
        verificationStatus: 'verified',
        verificationSource: 'FTC',
        verificationDate: new Date('2023-03-15'),
        moderationStatus: 'approved',
        upvotes: 34,
        downvotes: 2,
        reportCount: 12,
        createdAt: new Date('2023-03-12'),
        updatedAt: new Date('2023-03-15')
      },
      {
        id: 'report-2023-002',
        userId: null,
        title: 'Cryptocurrency Investment Ponzi Scheme',
        description: 'Lost $5,000 to a fake cryptocurrency investment platform called "CryptoGainsPro". They promised 20% weekly returns and showed fake profit dashboards. When I tried to withdraw, they asked for additional fees.',
        category: 'online-scam',
        scamType: 'investment',
        location: 'Phoenix, AZ',
        websiteUrl: 'cryptogainspro.net',
        amountLost: 5000,
        evidence: ['Website screenshots', 'Email communications', 'Bank statements'],
        tags: ['cryptocurrency', 'investment', 'ponzi-scheme', 'fake-website'],
        isVerified: true,
        verificationStatus: 'verified',
        verificationSource: 'SEC',
        verificationDate: new Date('2023-04-20'),
        moderationStatus: 'approved',
        upvotes: 89,
        downvotes: 3,
        reportCount: 47,
        createdAt: new Date('2023-04-10'),
        updatedAt: new Date('2023-04-20')
      },
      {
        id: 'report-2023-003',
        userId: null,
        title: 'Social Security Administration Imposter Call',
        description: 'Got a call saying my Social Security number was suspended due to suspicious activity. They wanted me to confirm my SSN and date of birth. Hung up and called SSA directly - they confirmed it was a scam.',
        category: 'phone-scam',
        scamType: 'government-imposter',
        location: 'Denver, CO',
        phoneNumber: '202-555-0198',
        amountLost: 0,
        evidence: ['Call recording', 'SSA confirmation'],
        tags: ['social-security', 'government-imposter', 'identity-theft'],
        isVerified: true,
        verificationStatus: 'verified',
        verificationSource: 'SSA',
        verificationDate: new Date('2023-05-08'),
        moderationStatus: 'approved',
        upvotes: 67,
        downvotes: 1,
        reportCount: 23,
        createdAt: new Date('2023-05-05'),
        updatedAt: new Date('2023-05-08')
      },
      {
        id: 'report-2023-004',
        userId: null,
        title: 'Romance Scam on Dating App',
        description: 'Met someone on a dating app who claimed to be a military contractor overseas. After 3 weeks of messages, they asked for money for emergency travel expenses. Profile photos were stolen from a model\'s Instagram.',
        category: 'online-scam',
        scamType: 'romance',
        location: 'Austin, TX',
        amountLost: 1200,
        evidence: ['Dating app messages', 'Reverse image search results', 'Wire transfer receipts'],
        tags: ['romance-scam', 'dating-app', 'military-imposter', 'stolen-photos'],
        isVerified: true,
        verificationStatus: 'verified',
        verificationSource: 'FTC',
        verificationDate: new Date('2023-06-18'),
        moderationStatus: 'approved',
        upvotes: 156,
        downvotes: 4,
        reportCount: 31,
        createdAt: new Date('2023-06-12'),
        updatedAt: new Date('2023-06-18')
      },
      
      // Mid-2023 reports
      {
        id: 'report-2023-005',
        userId: null,
        title: 'Tech Support Scam via Pop-up Ad',
        description: 'Browser pop-up claimed my computer was infected and to call Microsoft support. The number connected me to scammers who tried to get remote access to my computer and wanted $299 for fake antivirus software.',
        category: 'online-scam',
        scamType: 'tech-support',
        location: 'Seattle, WA',
        phoneNumber: '855-555-0234',
        amountLost: 0,
        evidence: ['Screenshot of pop-up', 'Call recording', 'Remote access software they sent'],
        tags: ['tech-support', 'microsoft-imposter', 'remote-access', 'fake-antivirus'],
        isVerified: true,
        verificationStatus: 'verified',
        verificationSource: 'Microsoft',
        verificationDate: new Date('2023-07-25'),
        moderationStatus: 'approved',
        upvotes: 78,
        downvotes: 2,
        reportCount: 19,
        createdAt: new Date('2023-07-20'),
        updatedAt: new Date('2023-07-25')
      },
      {
        id: 'report-2023-006',
        userId: null,
        title: 'Fake Job Offer Work From Home Scam',
        description: 'Received job offer for data entry work from home paying $25/hour. They sent a fake check for $2,500 for "equipment purchase" and asked me to wire most of it back. Check bounced after 3 days.',
        category: 'online-scam',
        scamType: 'employment',
        location: 'Miami, FL',
        emailAddress: 'hr@datatech-solutions.biz',
        amountLost: 0,
        evidence: ['Fake check photo', 'Email correspondence', 'Job posting screenshot'],
        tags: ['job-scam', 'work-from-home', 'fake-check', 'advance-fee'],
        isVerified: true,
        verificationStatus: 'verified',
        verificationSource: 'FTC',
        verificationDate: new Date('2023-08-14'),
        moderationStatus: 'approved',
        upvotes: 124,
        downvotes: 3,
        reportCount: 28,
        createdAt: new Date('2023-08-08'),
        updatedAt: new Date('2023-08-14')
      },

      // Late 2023 reports
      {
        id: 'report-2023-007',
        userId: null,
        title: 'Prize Notification Text Message Scam',
        description: 'Text claiming I won $1,000 gift card from Walmart. Link led to phishing site asking for personal info and credit card for "shipping fees". Site looked professional but domain was suspicious.',
        category: 'sms-scam',
        scamType: 'prize-lottery',
        location: 'Chicago, IL',
        websiteUrl: 'walmart-prizes.net',
        amountLost: 0,
        evidence: ['Text message screenshot', 'Phishing site screenshots', 'Domain lookup'],
        tags: ['prize-scam', 'walmart-imposter', 'phishing', 'text-message'],
        isVerified: true,
        verificationStatus: 'verified',
        verificationSource: 'FTC',
        verificationDate: new Date('2023-09-28'),
        moderationStatus: 'approved',
        upvotes: 92,
        downvotes: 1,
        reportCount: 15,
        createdAt: new Date('2023-09-22'),
        updatedAt: new Date('2023-09-28')
      },

      // 2024 reports with newer scam types
      {
        id: 'report-2024-001',
        userId: null,
        title: 'AI Voice Clone Grandparent Scam',
        description: 'Received call from someone sounding exactly like my grandson asking for bail money. Voice was convincing but when I asked personal questions, caller hung up. Later found out it was AI voice cloning technology.',
        category: 'phone-scam',
        scamType: 'family-emergency',
        location: 'Orlando, FL',
        phoneNumber: '407-555-0289',
        amountLost: 0,
        evidence: ['Call recording', 'Voice analysis from security expert'],
        tags: ['ai-voice-clone', 'grandparent-scam', 'family-emergency', 'deepfake'],
        isVerified: true,
        verificationStatus: 'verified',
        verificationSource: 'FBI',
        verificationDate: new Date('2024-02-18'),
        moderationStatus: 'approved',
        upvotes: 203,
        downvotes: 5,
        reportCount: 67,
        createdAt: new Date('2024-02-12'),
        updatedAt: new Date('2024-02-18')
      },
      {
        id: 'report-2024-002',
        userId: null,
        title: 'QR Code Package Scam',
        description: 'Received unexpected package with QR code inside claiming to be from delivery company survey. QR code led to site requesting personal information and bank details for "$50 reward".',
        category: 'mail-scam',
        scamType: 'identity-theft',
        location: 'San Diego, CA',
        websiteUrl: 'delivery-survey-rewards.com',
        amountLost: 0,
        evidence: ['Package photos', 'QR code screenshot', 'Phishing site analysis'],
        tags: ['qr-code', 'package-scam', 'identity-theft', 'phishing'],
        isVerified: true,
        verificationStatus: 'verified',
        verificationSource: 'FBI',
        verificationDate: new Date('2024-08-05'),
        moderationStatus: 'approved',
        upvotes: 87,
        downvotes: 2,
        reportCount: 23,
        createdAt: new Date('2024-07-28'),
        updatedAt: new Date('2024-08-05')
      },
      {
        id: 'report-2024-003',
        userId: null,
        title: 'Fake Tesla Dealership Deposit Scam',
        description: 'Found "Tesla dealership" online offering Model 3 at below market price. They requested $5,000 deposit via wire transfer. Site looked official but Tesla confirmed they don\'t operate that way.',
        category: 'online-scam',
        scamType: 'automotive',
        location: 'Las Vegas, NV',
        websiteUrl: 'tesla-directsales.net',
        amountLost: 5000,
        evidence: ['Website screenshots', 'Wire transfer receipts', 'Tesla official response'],
        tags: ['tesla-imposter', 'automotive-scam', 'fake-dealership', 'deposit-fraud'],
        isVerified: true,
        verificationStatus: 'verified',
        verificationSource: 'FBI',
        verificationDate: new Date('2024-12-20'),
        moderationStatus: 'approved',
        upvotes: 145,
        downvotes: 3,
        reportCount: 34,
        createdAt: new Date('2024-12-10'),
        updatedAt: new Date('2024-12-20')
      },

      // Recent 2024/2025 reports
      {
        id: 'report-2025-001',
        userId: null,
        title: 'Fake LinkedIn Job Recruiter Scam',
        description: 'Recruiter on LinkedIn offered high-paying remote position but asked for personal documents and SSN upfront for "background check". Profile was fake with stolen photos.',
        category: 'online-scam',
        scamType: 'employment',
        location: 'Portland, OR',
        amountLost: 0,
        evidence: ['LinkedIn profile screenshots', 'Message history', 'Reverse image search'],
        tags: ['linkedin-scam', 'job-scam', 'identity-theft', 'fake-recruiter'],
        isVerified: false,
        verificationStatus: 'pending',
        moderationStatus: 'approved',
        upvotes: 23,
        downvotes: 1,
        reportCount: 8,
        createdAt: new Date('2025-01-15'),
        updatedAt: new Date('2025-01-15')
      }
    ];

    // Generate additional reports to reach 1200+ total
    const additionalReports = this.generateAdditionalReports();
    const allReports = [...reports, ...additionalReports];

    // Add IP addresses and user agents
    const ipAddresses = ['192.168.1.', '10.0.0.', '172.16.0.', '203.0.113.', '198.51.100.'];
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
      'Mozilla/5.0 (Android 13; Mobile; rv:109.0)'
    ];

    for (const report of allReports) {
      const randomIp = ipAddresses[Math.floor(Math.random() * ipAddresses.length)] + 
                       Math.floor(Math.random() * 254 + 1);
      const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];

      await db.insert(communityReports).values({
        ...report,
        ipAddress: randomIp,
        userAgent: randomUserAgent
      }).onConflictDoNothing();
    }
  }

  private generateAdditionalReports() {
    const scamTypes = [
      { category: 'phone-scam', scamType: 'tech-support', title: 'Windows Support Scam Call', baseDescription: 'Caller claimed to be from Microsoft Windows support saying my computer was infected with viruses' },
      { category: 'email-scam', scamType: 'phishing', title: 'PayPal Account Verification Scam', baseDescription: 'Email saying my PayPal account was suspended and needed to verify by clicking link' },
      { category: 'sms-scam', scamType: 'prize-lottery', title: 'Walmart Gift Card Text Scam', baseDescription: 'Text message claiming I won a $500 Walmart gift card from random drawing' },
      { category: 'online-scam', scamType: 'investment', title: 'Bitcoin Investment Platform Scam', baseDescription: 'Website promised guaranteed returns on Bitcoin investments with fake testimonials' },
      { category: 'phone-scam', scamType: 'government-imposter', title: 'IRS Tax Debt Call Scam', baseDescription: 'Caller claiming to be from IRS saying I owed back taxes and would be arrested' },
      { category: 'email-scam', scamType: 'romance', title: 'Dating Site Romance Scam', baseDescription: 'Person on dating site claimed to be military deployed overseas and asked for money' },
      { category: 'online-scam', scamType: 'employment', title: 'Work From Home Check Scam', baseDescription: 'Job offer to work from home processing payments with fake starter check' },
      { category: 'sms-scam', scamType: 'phishing', title: 'Bank Account Alert Text Scam', baseDescription: 'Text claiming suspicious activity on bank account with link to verify' },
      { category: 'phone-scam', scamType: 'family-emergency', title: 'Grandson in Jail Scam Call', baseDescription: 'Caller claiming my grandson was arrested and needed bail money immediately' },
      { category: 'online-scam', scamType: 'charity', title: 'Fake Hurricane Relief Donation Scam', baseDescription: 'Website soliciting donations for hurricane victims but was not legitimate charity' }
    ];

    const locations = [
      'Miami, FL', 'Phoenix, AZ', 'Chicago, IL', 'Houston, TX', 'Philadelphia, PA', 
      'San Antonio, TX', 'San Diego, CA', 'Dallas, TX', 'San Jose, CA', 'Austin, TX',
      'Jacksonville, FL', 'Fort Worth, TX', 'Columbus, OH', 'Indianapolis, IN', 'Charlotte, NC',
      'San Francisco, CA', 'Seattle, WA', 'Denver, CO', 'Boston, MA', 'El Paso, TX',
      'Detroit, MI', 'Nashville, TN', 'Portland, OR', 'Memphis, TN', 'Oklahoma City, OK',
      'Las Vegas, NV', 'Louisville, KY', 'Baltimore, MD', 'Milwaukee, WI', 'Albuquerque, NM'
    ];

    const phoneNumbers = [
      '555-123-4567', '555-234-5678', '555-345-6789', '555-456-7890', '555-567-8901',
      '800-123-4567', '800-234-5678', '866-345-6789', '877-456-7890', '888-567-8901',
      '202-555-0123', '212-555-0234', '310-555-0345', '415-555-0456', '713-555-0567'
    ];

    const additionalReports = [];
    let reportNumber = 2025;

    // Generate 1200 additional reports
    for (let i = 0; i < 1200; i++) {
      const scamType = scamTypes[Math.floor(Math.random() * scamTypes.length)];
      const location = locations[Math.floor(Math.random() * locations.length)];
      const isVerified = Math.random() > 0.3; // 70% verification rate
      const reportCount = Math.floor(Math.random() * 50) + 1;
      const upvotes = Math.floor(Math.random() * 200) + 5;
      const amountLost = Math.random() > 0.6 ? Math.floor(Math.random() * 10000) : 0;
      
      // Generate date between Feb 2023 and Jan 2025
      const startDate = new Date('2023-02-01');
      const endDate = new Date('2025-01-20');
      const randomTime = startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime());
      const randomDate = new Date(randomTime);

      const report = {
        id: `report-${reportNumber}-${String(i).padStart(3, '0')}`,
        userId: null,
        title: `${scamType.title} ${i + 1}`,
        description: `${scamType.baseDescription}. ${this.generateRandomDescription()}`,
        category: scamType.category,
        scamType: scamType.scamType,
        location,
        phoneNumber: scamType.category === 'phone-scam' ? phoneNumbers[Math.floor(Math.random() * phoneNumbers.length)] : null,
        emailAddress: scamType.category === 'email-scam' ? `scammer${i}@fake-domain.com` : null,
        websiteUrl: scamType.category === 'online-scam' ? `https://fake-scam-site-${i}.net` : null,
        amountLost,
        evidence: this.generateEvidence(scamType.category),
        tags: this.generateTags(scamType.scamType),
        isVerified,
        verificationStatus: isVerified ? 'verified' : (Math.random() > 0.5 ? 'pending' : 'unverified'),
        verificationSource: isVerified ? this.getRandomVerificationSource() : null,
        verificationDate: isVerified ? randomDate : null,
        moderationStatus: 'approved',
        upvotes,
        downvotes: Math.floor(Math.random() * 5),
        reportCount,
        createdAt: randomDate,
        updatedAt: randomDate
      };

      additionalReports.push(report);
    }

    return additionalReports;
  }

  private generateRandomDescription(): string {
    const descriptions = [
      'The caller was very persistent and threatening.',
      'They had my personal information which made it seem legitimate.',
      'The website looked very professional and convincing.',
      'They used high-pressure tactics and created urgency.',
      'I almost fell for it but something seemed off.',
      'They asked for unusual payment methods like gift cards.',
      'The email looked exactly like the real company.',
      'They knew details about my recent purchases.',
      'The phone number appeared to be from a legitimate source.',
      'They offered unrealistic guarantees and returns.'
    ];
    return descriptions[Math.floor(Math.random() * descriptions.length)];
  }

  private generateEvidence(category: string): string[] {
    const evidenceTypes = {
      'phone-scam': ['Call recording', 'Caller ID screenshot', 'Phone bill'],
      'email-scam': ['Email screenshots', 'Email headers', 'Phishing site screenshots'],
      'sms-scam': ['Text message screenshots', 'Phone screenshots'],
      'online-scam': ['Website screenshots', 'Domain registration info', 'Browser history'],
      'mail-scam': ['Photos of mail', 'Envelope photos', 'Return address info']
    };
    
    const available = evidenceTypes[category] || ['Screenshots', 'Documentation'];
    const count = Math.floor(Math.random() * 3) + 1;
    return available.slice(0, count);
  }

  private generateTags(scamType: string): string[] {
    const tagMapping = {
      'tech-support': ['microsoft', 'windows', 'virus', 'remote-access'],
      'phishing': ['fake-email', 'identity-theft', 'credential-theft'],
      'prize-lottery': ['fake-prize', 'gift-cards', 'advance-fee'],
      'investment': ['cryptocurrency', 'stocks', 'ponzi-scheme', 'fake-returns'],
      'government-imposter': ['irs', 'social-security', 'arrest-threat'],
      'romance': ['dating-site', 'military', 'overseas', 'money-request'],
      'employment': ['work-from-home', 'fake-check', 'job-scam'],
      'charity': ['fake-charity', 'disaster-relief', 'donation-fraud'],
      'family-emergency': ['grandparent-scam', 'bail-money', 'urgent']
    };
    
    return tagMapping[scamType] || ['scam', 'fraud'];
  }

  private getRandomVerificationSource(): string {
    const sources = ['FTC', 'FBI', 'BBB', 'AARP', 'SSA', 'IRS', 'SEC'];
    return sources[Math.floor(Math.random() * sources.length)];
  }
}

export const historicalCommunitySeeder = new HistoricalCommunitySeeder();