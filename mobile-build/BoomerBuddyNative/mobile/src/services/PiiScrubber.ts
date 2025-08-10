/**
 * PII Scrubber Service - Client-side PII detection and redaction
 * Ensures no personally identifiable information leaves the device
 */

export interface ScrubResult {
  scrubbedText: string;
  foundPii: PiiDetection[];
  hasHardBlocks: boolean;
  riskLevel: 'safe' | 'caution' | 'blocked';
}

export interface PiiDetection {
  type: 'ssn' | 'pan' | 'phone' | 'email' | 'address' | 'routing' | 'account' | 'iban' | 'crypto_wallet';
  originalText: string;
  redactedText: string;
  confidence: number;
  position: { start: number; end: number };
}

export class PiiScrubber {
  // SSN patterns (XXX-XX-XXXX, XXXXXXXXX)
  private static readonly SSN_PATTERNS = [
    /\b\d{3}-\d{2}-\d{4}\b/g,
    /\b\d{9}\b/g
  ];

  // PAN patterns (credit card numbers)
  private static readonly PAN_PATTERNS = [
    /\b(?:4[0-9]{12}(?:[0-9]{3})?)\b/g, // Visa
    /\b(?:5[1-5][0-9]{2}|222[1-9]|22[3-9][0-9]|2[3-6][0-9]{2}|27[01][0-9]|2720)[0-9]{12}\b/g, // Mastercard
    /\b3[47][0-9]{13}\b/g, // American Express
    /\b3[0-9]{13}\b/g, // Diners Club
    /\b6(?:011|5[0-9]{2})[0-9]{12}\b/g // Discover
  ];

  // Phone number patterns
  private static readonly PHONE_PATTERNS = [
    /\b(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g,
    /\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b/g,
    /\b\(\d{3}\)\s?\d{3}[-.\s]\d{4}\b/g
  ];

  // Email patterns
  private static readonly EMAIL_PATTERNS = [
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g
  ];

  // Address patterns (simplified)
  private static readonly ADDRESS_PATTERNS = [
    /\b\d+\s+[A-Za-z0-9\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd|Way|Court|Ct|Place|Pl)\b/gi
  ];

  // Banking patterns
  private static readonly ROUTING_PATTERNS = [
    /\b\d{9}\b/g // 9-digit routing numbers
  ];

  private static readonly ACCOUNT_PATTERNS = [
    /\b\d{6,17}\b/g // Account numbers typically 6-17 digits
  ];

  // IBAN patterns
  private static readonly IBAN_PATTERNS = [
    /\b[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}([A-Z0-9]?){0,16}\b/g
  ];

  // Cryptocurrency wallet patterns
  private static readonly CRYPTO_PATTERNS = [
    /\b[13][a-km-zA-HJ-NP-Z1-9]{25,34}\b/g, // Bitcoin
    /\b0x[a-fA-F0-9]{40}\b/g, // Ethereum
    /\b[A-Z0-9]{56}\b/g // Solana
  ];

  /**
   * Scrub text content and remove all PII
   */
  static scrubText(text: string): ScrubResult {
    if (!text || text.trim().length === 0) {
      return {
        scrubbedText: '',
        foundPii: [],
        hasHardBlocks: false,
        riskLevel: 'safe'
      };
    }

    let scrubbedText = text;
    const foundPii: PiiDetection[] = [];
    let hasHardBlocks = false;

    // Check for hard blocks first (SSN, PAN)
    const ssnDetections = this.detectAndRedact(text, this.SSN_PATTERNS, 'ssn');
    const panDetections = this.detectAndRedact(text, this.PAN_PATTERNS, 'pan');

    if (ssnDetections.length > 0 || panDetections.length > 0) {
      hasHardBlocks = true;
      foundPii.push(...ssnDetections, ...panDetections);
    }

    // If hard blocks found, return blocked
    if (hasHardBlocks) {
      return {
        scrubbedText: '[CONTENT_BLOCKED_PII_DETECTED]',
        foundPii,
        hasHardBlocks: true,
        riskLevel: 'blocked'
      };
    }

    // Continue with other PII detection
    const phoneDetections = this.detectAndRedact(scrubbedText, this.PHONE_PATTERNS, 'phone');
    const emailDetections = this.detectAndRedact(scrubbedText, this.EMAIL_PATTERNS, 'email');
    const addressDetections = this.detectAndRedact(scrubbedText, this.ADDRESS_PATTERNS, 'address');
    const routingDetections = this.detectAndRedact(scrubbedText, this.ROUTING_PATTERNS, 'routing');
    const accountDetections = this.detectAndRedact(scrubbedText, this.ACCOUNT_PATTERNS, 'account');
    const ibanDetections = this.detectAndRedact(scrubbedText, this.IBAN_PATTERNS, 'iban');
    const cryptoDetections = this.detectAndRedact(scrubbedText, this.CRYPTO_PATTERNS, 'crypto_wallet');

    // Apply redactions
    scrubbedText = this.applyRedactions(scrubbedText, [
      ...phoneDetections,
      ...emailDetections,
      ...addressDetections,
      ...routingDetections,
      ...accountDetections,
      ...ibanDetections,
      ...cryptoDetections
    ]);

    foundPii.push(
      ...phoneDetections,
      ...emailDetections,
      ...addressDetections,
      ...routingDetections,
      ...accountDetections,
      ...ibanDetections,
      ...cryptoDetections
    );

    const riskLevel = foundPii.length > 0 ? 'caution' : 'safe';

    return {
      scrubbedText,
      foundPii,
      hasHardBlocks: false,
      riskLevel
    };
  }

  /**
   * Scrub image content using OCR
   */
  static async scrubImage(imageData: string | Blob): Promise<ScrubResult> {
    try {
      // In a real implementation, this would use Tesseract.js or similar
      // For now, return safe result
      console.log('Image PII scrubbing not implemented - blocking by default');
      
      return {
        scrubbedText: '[IMAGE_CONTENT_BLOCKED_FOR_PRIVACY]',
        foundPii: [],
        hasHardBlocks: true,
        riskLevel: 'blocked'
      };
    } catch (error) {
      console.error('Image scrubbing failed:', error);
      return {
        scrubbedText: '[IMAGE_SCRUBBING_ERROR]',
        foundPii: [],
        hasHardBlocks: true,
        riskLevel: 'blocked'
      };
    }
  }

  /**
   * Scrub audio content after transcription
   */
  static async scrubAudio(audioData: Blob): Promise<ScrubResult> {
    try {
      // In a real implementation, this would:
      // 1. Use on-device speech-to-text
      // 2. Apply text scrubbing to transcript
      // 3. Never store the original audio
      
      console.log('Audio PII scrubbing - transcribing locally...');
      
      // Simulate local transcription
      const mockTranscript = '[AUDIO_TRANSCRIBED_LOCALLY]';
      
      return this.scrubText(mockTranscript);
    } catch (error) {
      console.error('Audio scrubbing failed:', error);
      return {
        scrubbedText: '[AUDIO_SCRUBBING_ERROR]',
        foundPii: [],
        hasHardBlocks: true,
        riskLevel: 'blocked'
      };
    }
  }

  /**
   * Generate feature vector from scrubbed content
   */
  static generateFeatureVector(scrubbedText: string, metadata: {
    channel: 'sms' | 'call' | 'voicemail' | 'email' | 'web' | 'letter';
    state?: string;
    timeOfDay?: string;
  }): any {
    if (!scrubbedText || scrubbedText.includes('[CONTENT_BLOCKED')) {
      return null; // Never send blocked content
    }

    const hasLinks = /https?:\/\/|www\./i.test(scrubbedText);
    const linkDomains = this.extractDomains(scrubbedText);
    const signals = this.detectSignals(scrubbedText);
    const brandSuspects = this.detectBrandImpersonation(scrubbedText);

    return {
      v: 1,
      channel: metadata.channel,
      language: 'en', // Could be detected
      length_chars: scrubbedText.length,
      has_links: hasLinks,
      link_domains: linkDomains,
      signals,
      brand_suspects: brandSuspects,
      time_of_day_bucket: metadata.timeOfDay || 'unknown',
      state: metadata.state || 'unknown',
      model_score: 0 // Will be calculated by local model
    };
  }

  /**
   * Detect and redact PII patterns
   */
  private static detectAndRedact(text: string, patterns: RegExp[], type: PiiDetection['type']): PiiDetection[] {
    const detections: PiiDetection[] = [];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        detections.push({
          type,
          originalText: match[0],
          redactedText: `[REDACTED_${type.toUpperCase()}]`,
          confidence: this.calculateConfidence(match[0], type),
          position: { start: match.index, end: match.index + match[0].length }
        });
      }
    });

    return detections;
  }

  /**
   * Apply redactions to text
   */
  private static applyRedactions(text: string, detections: PiiDetection[]): string {
    // Sort by position (descending) to avoid index shifting
    const sortedDetections = detections.sort((a, b) => b.position.start - a.position.start);

    let result = text;
    sortedDetections.forEach(detection => {
      result = result.substring(0, detection.position.start) + 
               detection.redactedText + 
               result.substring(detection.position.end);
    });

    return result;
  }

  /**
   * Calculate confidence score for PII detection
   */
  private static calculateConfidence(text: string, type: PiiDetection['type']): number {
    switch (type) {
      case 'ssn':
        return text.includes('-') ? 0.95 : 0.8; // Formatted SSN more likely
      case 'pan':
        return this.luhnCheck(text) ? 0.9 : 0.7; // Luhn algorithm validation
      case 'email':
        return text.includes('@') && text.includes('.') ? 0.95 : 0.8;
      case 'phone':
        return text.length === 10 || text.length === 11 ? 0.9 : 0.7;
      default:
        return 0.8;
    }
  }

  /**
   * Luhn algorithm for credit card validation
   */
  private static luhnCheck(cardNumber: string): boolean {
    const digits = cardNumber.replace(/\D/g, '');
    let sum = 0;
    let isEven = false;

    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = parseInt(digits[i]);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  /**
   * Extract domains from text
   */
  private static extractDomains(text: string): string[] {
    const urlPattern = /https?:\/\/([^\/\s]+)/gi;
    const wwwPattern = /www\.([^\/\s]+)/gi;
    const domains: string[] = [];

    let match;
    while ((match = urlPattern.exec(text)) !== null) {
      domains.push(match[1].toLowerCase());
    }

    while ((match = wwwPattern.exec(text)) !== null) {
      domains.push(match[1].toLowerCase());
    }

    return [...new Set(domains)]; // Remove duplicates
  }

  /**
   * Detect scam signals in text
   */
  private static detectSignals(text: string): string[] {
    const signals: string[] = [];
    const lowerText = text.toLowerCase();

    // Urgency signals
    if (/urgent|immediately|asap|expire|deadline|limited time/i.test(text)) {
      signals.push('urgency');
    }

    // Payment signals
    if (/gift card|prepaid|wire transfer|bitcoin|cryptocurrency|apple pay|google pay|venmo|zelle/i.test(text)) {
      signals.push('gift_card');
    }

    // Threat signals
    if (/arrest|jail|legal action|lawsuit|warrant|police|court|suspended|frozen/i.test(text)) {
      signals.push('threat');
    }

    // Secrecy signals
    if (/don't tell|keep secret|confidential|private|between us/i.test(text)) {
      signals.push('secrecy');
    }

    // Callback mismatch (simplified)
    if (/call back|callback/i.test(text) && /\d{3}[-.\s]\d{3}[-.\s]\d{4}/.test(text)) {
      signals.push('callback_number_mismatch');
    }

    return signals;
  }

  /**
   * Detect brand impersonation
   */
  private static detectBrandImpersonation(text: string): string[] {
    const brands: string[] = [];
    const lowerText = text.toLowerCase();

    const brandPatterns = {
      'irs': /\b(irs|internal revenue|tax|refund)\b/i,
      'ssa': /\b(social security|ssa|benefits)\b/i,
      'medicare': /\b(medicare|medicaid|health insurance)\b/i,
      'amazon': /\b(amazon|prime|aws)\b/i,
      'apple': /\b(apple|icloud|itunes|app store)\b/i,
      'google': /\b(google|gmail|play store)\b/i,
      'microsoft': /\b(microsoft|windows|office|outlook)\b/i,
      'paypal': /\b(paypal|payment)\b/i,
      'bank': /\b(bank|banking|account|credit card|debit)\b/i
    };

    Object.entries(brandPatterns).forEach(([brand, pattern]) => {
      if (pattern.test(lowerText)) {
        brands.push(brand);
      }
    });

    return brands;
  }

  /**
   * Validate scrubbing result before transmission
   */
  static validateForTransmission(result: ScrubResult): boolean {
    // Never transmit if hard blocks detected
    if (result.hasHardBlocks) {
      return false;
    }

    // Double-check for any remaining PII patterns
    const doubleCheck = this.scrubText(result.scrubbedText);
    if (doubleCheck.foundPii.length > 0) {
      console.warn('PII detected in supposedly scrubbed content!');
      return false;
    }

    return true;
  }

  /**
   * Get user-friendly explanation of scrubbing results
   */
  static getScrubExplanation(result: ScrubResult): string {
    if (result.hasHardBlocks) {
      return 'Content blocked: Sensitive information detected (SSN, credit card, etc.). Analysis performed locally only.';
    }

    if (result.foundPii.length === 0) {
      return 'No personal information detected. Safe to analyze.';
    }

    const piiTypes = [...new Set(result.foundPii.map(p => p.type))];
    const typeNames = piiTypes.map(type => {
      switch (type) {
        case 'phone': return 'phone numbers';
        case 'email': return 'email addresses';
        case 'address': return 'addresses';
        default: return type.replace('_', ' ');
      }
    });

    return `Personal information detected and removed: ${typeNames.join(', ')}. Analysis performed on redacted content only.`;
  }
}