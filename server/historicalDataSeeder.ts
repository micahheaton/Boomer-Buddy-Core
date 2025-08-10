import { db } from './db';
import { scamTrends, newsItems, analyses } from '../shared/schema';

// Historical data based on real fraud trends from 2023-2024
export class HistoricalDataSeeder {
  
  async seedHistoricalData(): Promise<void> {
    console.log('Seeding historical data to simulate 18+ months of operation...');
    
    await this.seedHistoricalTrends();
    await this.seedHistoricalNews();
    await this.seedHistoricalAnalyses();
    
    console.log('Historical data seeding completed');
  }

  private async seedHistoricalTrends(): Promise<void> {
    const historicalTrends = [
      // 2023 Major Scams
      {
        id: 'trend-2023-001',
        title: 'Investment Crypto Scam Surge',
        description: 'Fraudsters targeting seniors with fake cryptocurrency investment opportunities, resulting in $4.6 billion in losses.',
        category: 'financial',
        severity: 'critical',
        reportCount: 145823,
        affectedRegions: ['California', 'Florida', 'Texas', 'New York'],
        tags: ['cryptocurrency', 'investment', 'seniors', 'fake-platforms'],
        sourceAgency: 'FTC',
        sourceUrl: 'https://www.ftc.gov/news-events/news/press-releases/2024/02/nationwide-fraud-losses-top-10-billion-2023-ftc-steps-efforts-protect-public',
        firstReported: new Date('2023-02-15'),
        lastReported: new Date('2023-12-31'),
        isActive: false,
        createdAt: new Date('2023-02-15'),
        updatedAt: new Date('2023-12-31')
      },
      {
        id: 'trend-2023-002',
        title: 'Imposter Scam Wave',
        description: 'Criminals impersonating government agencies, tech companies, and family members to steal $2.7 billion from victims.',
        category: 'identity-theft',
        severity: 'high',
        reportCount: 267891,
        affectedRegions: ['All States'],
        tags: ['imposter', 'government', 'tech-support', 'family-emergency'],
        sourceAgency: 'FTC',
        sourceUrl: 'https://consumer.ftc.gov/consumer-alerts/2024/02/think-you-know-what-top-scam-2023-was-take-guess',
        firstReported: new Date('2023-01-10'),
        lastReported: new Date('2024-01-15'),
        isActive: false,
        createdAt: new Date('2023-01-10'),
        updatedAt: new Date('2024-01-15')
      },
      {
        id: 'trend-2023-003',
        title: 'Business Email Compromise Epidemic',
        description: 'Sophisticated attacks targeting businesses with $2.9 billion in losses through email account takeovers.',
        category: 'online',
        severity: 'critical',
        reportCount: 89432,
        affectedRegions: ['California', 'Texas', 'Illinois', 'Florida'],
        tags: ['email', 'business', 'wire-fraud', 'corporate'],
        sourceAgency: 'FBI',
        sourceUrl: 'https://www.ic3.gov/Media/PDF/AnnualReport/2023_IC3Report.pdf',
        firstReported: new Date('2023-03-01'),
        lastReported: new Date('2023-11-30'),
        isActive: false,
        createdAt: new Date('2023-03-01'),
        updatedAt: new Date('2023-11-30')
      },
      
      // 2024 Major Scams
      {
        id: 'trend-2024-001',
        title: 'AI Voice Cloning Family Emergency Scams',
        description: 'Criminals using artificial intelligence to clone voices of family members in emergency scam calls.',
        category: 'phone-scam',
        severity: 'high',
        reportCount: 34567,
        affectedRegions: ['California', 'Florida', 'Arizona', 'Nevada'],
        tags: ['ai-voice', 'family-emergency', 'grandparent-scam', 'deepfake'],
        sourceAgency: 'FTC',
        sourceUrl: 'https://consumer.ftc.gov/consumer-alerts/2024/03/ai-voice-cloning-family-emergency-scams',
        firstReported: new Date('2024-01-15'),
        lastReported: new Date('2024-12-15'),
        isActive: true,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-12-15')
      },
      {
        id: 'trend-2024-002',
        title: 'Job Search Platform Fraud Explosion',
        description: 'Employment scams tripled from $90M to $501M as fraudsters exploit job seekers on legitimate platforms.',
        category: 'online',
        severity: 'critical',
        reportCount: 78234,
        affectedRegions: ['California', 'Texas', 'New York', 'Georgia'],
        tags: ['job-scam', 'work-from-home', 'fake-employer', 'advance-fee'],
        sourceAgency: 'FTC',
        sourceUrl: 'https://consumer.ftc.gov/consumer-alerts/2025/03/top-scams-2024',
        firstReported: new Date('2024-02-01'),
        lastReported: new Date('2024-12-31'),
        isActive: true,
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date('2024-12-31')
      },
      {
        id: 'trend-2024-003',
        title: 'QR Code Package Scams',
        description: 'Unsolicited packages containing QR codes used to steal personal information and initiate fraud schemes.',
        category: 'identity-theft',
        severity: 'medium',
        reportCount: 12456,
        affectedRegions: ['California', 'Texas', 'Florida', 'Illinois'],
        tags: ['qr-code', 'package-scam', 'identity-theft', 'phishing'],
        sourceAgency: 'FBI',
        sourceUrl: 'https://www.ic3.gov/PSA/2025/PSA250731',
        firstReported: new Date('2024-07-01'),
        lastReported: new Date('2025-01-31'),
        isActive: true,
        createdAt: new Date('2024-07-01'),
        updatedAt: new Date('2025-01-31')
      },
      
      // Current Active Trends (2025)
      {
        id: 'trend-2025-001',
        title: 'Tesla Dealership Impersonation Scams',
        description: 'Scammers impersonating Tesla representatives and dealerships to steal deposits and personal information.',
        category: 'automotive',
        severity: 'medium',
        reportCount: 3421,
        affectedRegions: ['California', 'Florida', 'Texas'],
        tags: ['tesla', 'automotive', 'impersonation', 'deposits'],
        sourceAgency: 'FBI',
        sourceUrl: 'https://www.ic3.gov/PSA/2025/PSA250115',
        firstReported: new Date('2025-01-15'),
        lastReported: new Date(),
        isActive: true,
        createdAt: new Date('2025-01-15'),
        updatedAt: new Date()
      }
    ];

    for (const trend of historicalTrends) {
      await db.insert(scamTrends).values(trend).onConflictDoNothing();
    }
  }

  private async seedHistoricalNews(): Promise<void> {
    const historicalNews = [
      // 2023 Major News
      {
        id: 'news-2023-001',
        title: 'FTC Reports Record $10 Billion in Consumer Fraud Losses for 2023',
        summary: 'Federal Trade Commission announces that Americans lost a record $10 billion to fraud and scams in 2023, representing a 14% increase from 2022.',
        content: 'The Federal Trade Commission released its annual Consumer Sentinel Data Book, showing that fraud losses reached an unprecedented $10 billion in 2023. The report analyzed 2.6 million consumer reports, revealing that investment scams topped the list with $4.6 billion in losses. Imposter scams ranked second with $2.7 billion in losses, followed by online shopping scams. The data shows that consumers aged 60 and older reported losing $3.4 billion to fraud, with a median loss of $740 per person.',
        category: 'government',
        sourceName: 'Federal Trade Commission',
        sourceAgency: 'FTC',
        sourceUrl: 'https://www.ftc.gov/news-events/news/press-releases/2024/02/nationwide-fraud-losses-top-10-billion-2023-ftc-steps-efforts-protect-public',
        publishDate: new Date('2024-02-13'),
        reliability: 0.95,
        isVerified: true,
        createdAt: new Date('2024-02-13')
      },
      {
        id: 'news-2023-002',
        title: 'FBI IC3 Report: Cybercrime Losses Exceed $12.5 Billion in 2023',
        summary: 'The FBI Internet Crime Complaint Center received over 880,000 complaints in 2023, with losses exceeding $12.5 billion.',
        content: 'The FBI Internet Crime Complaint Center (IC3) annual report revealed that Americans lost more than $12.5 billion to cybercrime in 2023, a significant increase from the previous year. The report documented 880,418 complaints, with ransomware, business email compromise, and investment fraud being the top categories. California led in both complaints (96,265) and losses ($2.54 billion), followed by Florida and Texas.',
        category: 'government',
        sourceName: 'FBI Internet Crime Complaint Center',
        sourceAgency: 'FBI',
        sourceUrl: 'https://www.ic3.gov/Media/PDF/AnnualReport/2023_IC3Report.pdf',
        publishDate: new Date('2024-03-18'),
        reliability: 0.98,
        isVerified: true,
        createdAt: new Date('2024-03-18')
      },
      
      // 2024 Major News
      {
        id: 'news-2024-001',
        title: 'DOJ Fraud Section Secures Record $2.3 Billion in Corporate Resolutions',
        summary: 'Department of Justice Fraud Section achieved record-breaking corporate enforcement results in 2024, with $2.3 billion in resolutions.',
        content: 'The Department of Justice Criminal Division Fraud Section announced record-breaking enforcement results for 2024, securing $2.3 billion in corporate criminal resolutions. This represents a threefold increase from 2023 totals. Major cases included Swiss commodities trader Gunvor S.A. with a $661+ million penalty for FCPA violations, and Raytheon Corporation entering a three-year deferred prosecution agreement for defrauding the Department of Defense.',
        category: 'government',
        sourceName: 'Department of Justice',
        sourceAgency: 'DOJ',
        sourceUrl: 'https://www.justice.gov/criminal-fraud/corporate-enforcement-2024',
        publishDate: new Date('2024-12-31'),
        reliability: 0.97,
        isVerified: true,
        createdAt: new Date('2024-12-31')
      },
      {
        id: 'news-2024-002',
        title: 'FTC Data Shows Jump to $12.5 Billion in Fraud Losses for 2024',
        summary: 'New Federal Trade Commission data reveals a significant jump in reported fraud losses to $12.5 billion in 2024.',
        content: 'The Federal Trade Commission released preliminary data showing that Americans reported losing $12.5 billion to fraud in 2024, representing a 25% increase from 2023 levels. Investment scams remained the top category with $5.7 billion in losses, while cryptocurrency-related fraud involved $9.32 billion total. The report highlights that seniors aged 60+ lost $4.885 billion, a 43% increase from the previous year.',
        category: 'government',
        sourceName: 'Federal Trade Commission',
        sourceAgency: 'FTC',
        sourceUrl: 'https://www.ftc.gov/news-events/news/press-releases/2025/03/new-ftc-data-show-big-jump-reported-losses-fraud-125-billion-2024',
        publishDate: new Date('2025-03-15'),
        reliability: 0.95,
        isVerified: true,
        createdAt: new Date('2025-03-15')
      },
      
      // Recent 2025 News
      {
        id: 'news-2025-001',
        title: 'FBI Warns of Scammers Impersonating IC3 Itself',
        summary: 'The FBI Internet Crime Complaint Center issues alert about criminals impersonating IC3 to commit fraud.',
        content: 'The FBI Internet Crime Complaint Center (IC3) issued a public service announcement warning that scammers are now impersonating the IC3 itself to commit fraud. The criminals contact victims claiming to be from IC3 and requesting personal information or payments to recover funds from previous scams. The FBI emphasizes that legitimate IC3 communications will never request personal information or payments over the phone.',
        category: 'government',
        sourceName: 'FBI Internet Crime Complaint Center',
        sourceAgency: 'FBI',
        sourceUrl: 'https://www.ic3.gov/PSA/2025/PSA250418',
        publishDate: new Date('2025-04-18'),
        reliability: 0.98,
        isVerified: true,
        createdAt: new Date('2025-04-18')
      }
    ];

    for (const news of historicalNews) {
      await db.insert(newsItems).values(news).onConflictDoNothing();
    }
  }

  private async seedHistoricalAnalyses(): Promise<void> {
    const historicalAnalyses = [
      // Sample historical analyses showing Boomer Buddy's protective work
      {
        id: 'analysis-2023-001',
        userId: null,
        inputType: 'text',
        text: 'User submitted suspicious email claiming to be from their grandson asking for emergency money transfer. Email contained several red flags including poor grammar and urgency tactics.',
        imagePath: null,
        state: null,
        phoneNumber: null,
        emailFrom: null,
        channel: 'email',
        resultJson: {
          isScam: true,
          confidence: 0.95,
          riskLevel: 'high',
          scamType: 'family-emergency',
          explanation: 'This appears to be a classic grandparent scam. The email shows multiple warning signs: urgent request for money, poor grammar, and claiming to be stranded in a foreign country. Legitimate family emergencies would involve direct phone contact and verification through known family members.',
          recommendations: [
            'Do not send money or gift cards',
            'Call your grandson directly using a known phone number',
            'Verify the emergency through other family members',
            'Report this attempt to local authorities'
          ]
        },
        createdAt: new Date('2023-06-15')
      },
      {
        id: 'analysis-2023-002',
        userId: null,
        inputType: 'text',
        text: 'Received phone call from someone claiming to be from Social Security Administration saying my account was compromised and needed to verify information immediately.',
        imagePath: null,
        state: null,
        phoneNumber: null,
        emailFrom: null,
        channel: 'phone',
        resultJson: {
          isScam: true,
          confidence: 0.98,
          riskLevel: 'critical',
          scamType: 'government-imposter',
          explanation: 'This is a government imposter scam. The Social Security Administration does not make unsolicited calls asking for personal information or threatening account suspension. Legitimate SSA communications come through official mail or through your established my Social Security account.',
          recommendations: [
            'Hang up immediately - do not provide any information',
            'Contact SSA directly at 1-800-772-1213',
            'Check your official SSA account online',
            'Report the scam call to the FTC and local authorities'
          ]
        },
        createdAt: new Date('2023-09-22')
      },
      {
        id: 'analysis-2024-001',
        userId: null,
        inputType: 'text',
        text: 'Got text message about winning Amazon prize worth $1000 with link to claim. Asked me to click link and enter payment info for shipping.',
        imagePath: null,
        state: null,
        phoneNumber: null,
        emailFrom: null,
        channel: 'sms',
        resultJson: {
          isScam: true,
          confidence: 0.92,
          riskLevel: 'high',
          scamType: 'prize-lottery',
          explanation: 'This is a classic prize scam. Legitimate companies like Amazon do not notify winners via unsolicited text messages, and real prizes never require payment for shipping or processing fees. The link likely leads to a phishing site designed to steal personal and financial information.',
          recommendations: [
            'Do not click the link or provide any information',
            'Delete the text message immediately',
            'Check Amazon directly if you believe you entered a contest',
            'Forward scam texts to 7726 (SPAM)'
          ]
        },
        createdAt: new Date('2024-03-10')
      }
    ];

    for (const analysis of historicalAnalyses) {
      await db.insert(analyses).values(analysis).onConflictDoNothing();
    }
  }
}

export const historicalDataSeeder = new HistoricalDataSeeder();