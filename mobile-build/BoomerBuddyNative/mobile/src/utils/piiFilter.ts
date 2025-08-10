// PII filtering utility to remove sensitive information before transmission
export interface PIIDetectionResult {
  cleanedText: string;
  piiDetected: boolean;
  piiTypes: string[];
}

const PII_PATTERNS = {
  ssn: {
    regex: /\b(?:\d{3}-?\d{2}-?\d{4}|\d{9})\b/g,
    replacement: '[SSN_REDACTED]',
    type: 'Social Security Number'
  },
  creditCard: {
    regex: /\b(?:\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}|\d{13,19})\b/g,
    replacement: '[CARD_REDACTED]',
    type: 'Credit Card Number'
  },
  phone: {
    regex: /\b(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g,
    replacement: '[PHONE_REDACTED]',
    type: 'Phone Number'
  },
  email: {
    regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    replacement: '[EMAIL_REDACTED]',
    type: 'Email Address'
  },
  address: {
    regex: /\b\d+\s+[A-Za-z0-9\s,.-]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Court|Ct|Circle|Cir|Place|Pl)\b/gi,
    replacement: '[ADDRESS_REDACTED]',
    type: 'Street Address'
  },
  bankAccount: {
    regex: /\b(?:account|acct)[\s#]*:?\s*(\d{8,17})\b/gi,
    replacement: '[ACCOUNT_REDACTED]',
    type: 'Bank Account Number'
  },
  routingNumber: {
    regex: /\b(?:routing|rtn)[\s#]*:?\s*(\d{9})\b/gi,
    replacement: '[ROUTING_REDACTED]',
    type: 'Routing Number'
  }
};

export function filterPII(text: string): PIIDetectionResult {
  let cleanedText = text;
  const detectedTypes: string[] = [];
  let piiDetected = false;

  Object.entries(PII_PATTERNS).forEach(([key, pattern]) => {
    if (pattern.regex.test(cleanedText)) {
      cleanedText = cleanedText.replace(pattern.regex, pattern.replacement);
      detectedTypes.push(pattern.type);
      piiDetected = true;
    }
  });

  return {
    cleanedText,
    piiDetected,
    piiTypes: detectedTypes
  };
}

// Additional utility to check if text likely contains PII without cleaning it
export function detectPII(text: string): { detected: boolean; types: string[] } {
  const detectedTypes: string[] = [];
  
  Object.entries(PII_PATTERNS).forEach(([key, pattern]) => {
    if (pattern.regex.test(text)) {
      detectedTypes.push(pattern.type);
    }
  });

  return {
    detected: detectedTypes.length > 0,
    types: detectedTypes
  };
}