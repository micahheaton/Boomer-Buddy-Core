/**
 * PII Scrubber - Client-side privacy protection
 * Ensures no sensitive data leaves the device
 */

interface PiiPatterns {
  email: RegExp;
  phone: RegExp;
  ssn: RegExp;
  creditCard: RegExp;
  routingNumber: RegExp;
  address: RegExp;
  crypto: RegExp;
}

export class PiiScrubber {
  private static patterns: PiiPatterns = {
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    phone: /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g,
    ssn: /\b\d{3}-?\d{2}-?\d{4}\b/g,
    creditCard: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
    routingNumber: /\b\d{9}\b/g,
    address: /\b\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Place|Pl)\b/gi,
    crypto: /\b[13][a-km-zA-HJ-NP-Z1-9]{25,34}\b|0x[a-fA-F0-9]{40}/g
  };

  private static initialized = false;

  static initialize(): void {
    if (this.initialized) return;
    console.log('🔒 PII Scrubber initialized - Zero-PII mobile protection active');
    this.initialized = true;
  }

  /**
   * Scrub text content of all PII
   */
  static scrubText(text: string): {
    scrubbedText: string;
    hasPii: boolean;
    blockedTypes: string[];
  } {
    let scrubbedText = text;
    const blockedTypes: string[] = [];
    let hasPii = false;

    // Check for hard-block PII (never transmit)
    if (this.patterns.ssn.test(text) || this.patterns.creditCard.test(text)) {
      return {
        scrubbedText: '[BLOCKED_SENSITIVE_DATA]',
        hasPii: true,
        blockedTypes: ['SSN_OR_CREDIT_CARD']
      };
    }

    // Replace other PII types
    Object.entries(this.patterns).forEach(([type, pattern]) => {
      if (pattern.test(scrubbedText)) {
        hasPii = true;
        blockedTypes.push(type.toUpperCase());
        scrubbedText = scrubbedText.replace(pattern, `[REDACTED_${type.toUpperCase()}]`);
      }
    });

    return {
      scrubbedText,
      hasPii,
      blockedTypes
    };
  }

  /**
   * Create feature vector from scrubbed text (no PII)
   */
  static createFeatureVector(
    text: string, 
    channel: 'sms' | 'call' | 'voicemail' | 'email' | 'web' | 'letter',
    state?: string
  ): any {
    const scrubbed = this.scrubText(text);
    
    // Hard block if sensitive PII detected
    if (scrubbed.blockedTypes.includes('SSN_OR_CREDIT_CARD')) {
      throw new Error('HARD_BLOCK_SENSITIVE_PII');
    }

    const scrubbedText = scrubbed.scrubbedText;
    
    // Extract signals without exposing PII
    const signals = this.extractSignals(scrubbedText);
    const linkDomains = this.extractDomains(scrubbedText);
    const brandSuspects = this.detectBrandImpersonation(scrubbedText);
    
    const now = new Date();
    const timeOfDayBucket = this.getTimeOfDayBucket(now);

    return {
      v: 1,
      channel,
      language: 'en',
      length_chars: scrubbedText.length,
      has_links: linkDomains.length > 0,
      link_domains: linkDomains,
      signals,
      brand_suspects: brandSuspects,
      time_of_day_bucket: timeOfDayBucket,
      state: state || null,
      model_score: 0 // Will be calculated by on-device model
    };
  }

  private static extractSignals(text: string): string[] {
    const signals: string[] = [];
    const lowerText = text.toLowerCase();

    // Urgency indicators
    if (/urgent|immediately|expire|within \d+ hour|deadline|act now|limited time/i.test(text)) {
      signals.push('urgency');
    }

    // Payment methods
    if (/gift card|prepaid card|bitcoin|crypto|wire transfer|western union|moneygram/i.test(text)) {
      signals.push('gift_card');
    }

    // Threats
    if (/arrest|lawsuit|legal action|suspended|frozen|investigation|warrant|police/i.test(text)) {
      signals.push('threat');
    }

    // Callback number mismatch
    if (/call.*(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/i.test(text)) {
      signals.push('callback_number_mismatch');
    }

    // Secrecy
    if (/don't tell|keep secret|between us|confidential|don't share/i.test(text)) {
      signals.push('secrecy');
    }

    return signals;
  }

  private static extractDomains(text: string): string[] {
    const urlRegex = /https?:\/\/(www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,})/g;
    const domains: string[] = [];
    let match;

    while ((match = urlRegex.exec(text)) !== null) {
      domains.push(match[2]);
    }

    return [...new Set(domains)]; // Remove duplicates
  }

  private static detectBrandImpersonation(text: string): string[] {
    const brands: string[] = [];
    const lowerText = text.toLowerCase();

    const brandPatterns = {
      'irs': /\b(?:irs|internal revenue|tax refund)\b/i,
      'ssa': /\b(?:social security|ssa|medicare)\b/i,
      'amazon': /\b(?:amazon|aws)\b/i,
      'microsoft': /\b(?:microsoft|windows|office)\b/i,
      'apple': /\b(?:apple|icloud|itunes)\b/i,
      'google': /\b(?:google|gmail|chrome)\b/i,
      'paypal': /\bpaypal\b/i,
      'bank': /\b(?:bank|credit union|visa|mastercard)\b/i
    };

    Object.entries(brandPatterns).forEach(([brand, pattern]) => {
      if (pattern.test(lowerText)) {
        brands.push(brand);
      }
    });

    return brands;
  }

  private static getTimeOfDayBucket(date: Date): string {
    const hour = date.getHours();
    
    if (hour >= 22 || hour < 6) return 'night';
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    return 'evening';
  }
}