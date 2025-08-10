export interface PiiScrubResult {
  cleanText: string;
  foundPii: Array<{
    type: string;
    redacted: string;
    position: number;
  }>;
  scrubCount: number;
}

class PiiScrubberService {
  private patterns = {
    ssn: {
      regex: /\b\d{3}-?\d{2}-?\d{4}\b/g,
      replacement: '[SSN_REDACTED]',
      type: 'Social Security Number'
    },
    creditCard: {
      regex: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
      replacement: '[CARD_REDACTED]',
      type: 'Credit Card'
    },
    phone: {
      regex: /\b\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})\b/g,
      replacement: '[PHONE_REDACTED]',
      type: 'Phone Number'
    },
    email: {
      regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      replacement: '[EMAIL_REDACTED]',
      type: 'Email Address'
    },
    address: {
      regex: /\b\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd)\b/gi,
      replacement: '[ADDRESS_REDACTED]',
      type: 'Street Address'
    },
    bankAccount: {
      regex: /\b\d{8,17}\b/g,
      replacement: '[ACCOUNT_REDACTED]',
      type: 'Bank Account'
    },
    dob: {
      regex: /\b(0?[1-9]|1[0-2])[\/\-](0?[1-9]|[12][0-9]|3[01])[\/\-](19|20)\d{2}\b/g,
      replacement: '[DOB_REDACTED]',
      type: 'Date of Birth'
    }
  };

  scrubText(text: string): PiiScrubResult {
    let cleanText = text;
    const foundPii: Array<{ type: string; redacted: string; position: number }> = [];

    // Process each PII pattern
    Object.entries(this.patterns).forEach(([key, pattern]) => {
      const matches = [...text.matchAll(pattern.regex)];
      
      matches.forEach(match => {
        if (match.index !== undefined) {
          foundPii.push({
            type: pattern.type,
            redacted: match[0],
            position: match.index
          });
        }
      });

      cleanText = cleanText.replace(pattern.regex, pattern.replacement);
    });

    // Additional name scrubbing (basic pattern)
    const namePattern = /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g;
    const nameMatches = [...text.matchAll(namePattern)];
    
    nameMatches.forEach(match => {
      // Only redact if it looks like a full name (not common words)
      const name = match[0];
      if (this.isLikelyName(name) && match.index !== undefined) {
        foundPii.push({
          type: 'Full Name',
          redacted: name,
          position: match.index
        });
        cleanText = cleanText.replace(name, '[NAME_REDACTED]');
      }
    });

    return {
      cleanText,
      foundPii,
      scrubCount: foundPii.length
    };
  }

  private isLikelyName(text: string): boolean {
    // Simple heuristic to check if text looks like a name
    // Avoid common words that might match the name pattern
    const commonWords = [
      'United States', 'New York', 'Los Angeles', 'San Francisco',
      'First National', 'Bank Account', 'Credit Card', 'Social Security',
      'Dear Sir', 'Dear Madam', 'John Doe', 'Jane Doe'
    ];

    return !commonWords.some(word => 
      text.toLowerCase().includes(word.toLowerCase())
    );
  }

  // Check if text contains potential PII without scrubbing
  containsPii(text: string): boolean {
    return Object.values(this.patterns).some(pattern => 
      pattern.regex.test(text)
    );
  }

  // Get PII types found in text
  detectPiiTypes(text: string): string[] {
    const types: string[] = [];
    
    Object.entries(this.patterns).forEach(([key, pattern]) => {
      if (pattern.regex.test(text)) {
        types.push(pattern.type);
      }
    });

    return types;
  }

  // Validate that text is safe to send (no PII remaining)
  validateSafeText(text: string): { safe: boolean; issues: string[] } {
    const issues: string[] = [];
    
    Object.entries(this.patterns).forEach(([key, pattern]) => {
      if (pattern.regex.test(text)) {
        issues.push(`Potential ${pattern.type} detected`);
      }
    });

    return {
      safe: issues.length === 0,
      issues
    };
  }
}

export const piiScrubber = new PiiScrubberService();