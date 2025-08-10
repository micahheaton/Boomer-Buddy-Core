// Zero-PII Data Processing Service
// Removes all personally identifiable information before sending to server

export interface ScrubResult {
  cleanText: string;
  foundPii: string[];
  riskLevel: 'none' | 'low' | 'medium' | 'high';
}

class PiiScrubber {
  private patterns = {
    // Personal Information
    ssn: /\b\d{3}-?\d{2}-?\d{4}\b/g,
    phone: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    creditCard: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
    bankAccount: /\b\d{8,17}\b/g,
    
    // Names (common patterns)
    name: /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g,
    
    // Addresses
    address: /\b\d+\s+[A-Za-z0-9\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Circle|Cir)\b/g,
    zipCode: /\b\d{5}(?:-\d{4})?\b/g,
    
    // Financial Information
    routingNumber: /\b\d{9}\b/g,
    
    // Government IDs
    passport: /\b[A-Z]{1,2}\d{6,9}\b/g,
    driverLicense: /\b[A-Z]\d{8}\b/g,
  };

  private replacements = {
    ssn: '[SSN-REMOVED]',
    phone: '[PHONE-REMOVED]',
    email: '[EMAIL-REMOVED]',
    creditCard: '[CARD-REMOVED]',
    bankAccount: '[ACCOUNT-REMOVED]',
    name: '[NAME-REMOVED]',
    address: '[ADDRESS-REMOVED]',
    zipCode: '[ZIP-REMOVED]',
    routingNumber: '[ROUTING-REMOVED]',
    passport: '[PASSPORT-REMOVED]',
    driverLicense: '[LICENSE-REMOVED]',
  };

  scrubText(text: string): ScrubResult {
    let cleanText = text;
    const foundPii: string[] = [];

    // Apply each pattern
    Object.entries(this.patterns).forEach(([type, pattern]) => {
      const matches = text.match(pattern);
      if (matches) {
        foundPii.push(...matches);
        cleanText = cleanText.replace(pattern, this.replacements[type as keyof typeof this.replacements]);
      }
    });

    // Determine risk level based on amount of PII found
    let riskLevel: 'none' | 'low' | 'medium' | 'high' = 'none';
    if (foundPii.length > 0) {
      if (foundPii.length >= 3) riskLevel = 'high';
      else if (foundPii.length === 2) riskLevel = 'medium';
      else riskLevel = 'low';
    }

    return {
      cleanText,
      foundPii,
      riskLevel,
    };
  }

  // Process image text (from OCR) and scrub PII
  scrubImageText(ocrText: string): ScrubResult {
    return this.scrubText(ocrText);
  }

  // Check if text contains sensitive financial data
  containsFinancialData(text: string): boolean {
    const financialPatterns = [
      this.patterns.creditCard,
      this.patterns.bankAccount,
      this.patterns.routingNumber,
      this.patterns.ssn,
    ];
    
    return financialPatterns.some(pattern => pattern.test(text));
  }

  // Emergency scrubbing for immediate threat scenarios
  emergencyScrub(text: string): string {
    let cleaned = text;
    
    // Remove all numbers longer than 4 digits
    cleaned = cleaned.replace(/\b\d{5,}\b/g, '[NUMBER-REMOVED]');
    
    // Remove potential names (capital words)
    cleaned = cleaned.replace(/\b[A-Z][a-z]{2,}\s+[A-Z][a-z]{2,}\b/g, '[NAME-REMOVED]');
    
    // Remove email patterns
    cleaned = cleaned.replace(/\S+@\S+\.\S+/g, '[EMAIL-REMOVED]');
    
    return cleaned;
  }
}

export const piiScrubber = new PiiScrubber();