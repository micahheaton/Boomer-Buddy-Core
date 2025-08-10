import type { ScamAnalysisResult } from "@shared/schema";

interface AnalysisContext {
  channel?: string;
  state?: string;
  federalContacts: any;
  financialContacts: any;
  stateContacts: any;
}

// Pre-generated authentic GPT analysis results for demos
const AUTHENTIC_DEMO_RESULTS: Record<string, ScamAnalysisResult> = {
  'phishing': {
    scam_likelihood: 92,
    confidence: "high" as const,
    label: "Likely scam" as const,
    explanation: "This appears to be a high-risk scam attempt. Multiple red flags are present including threats, urgency tactics, and requests for unusual payment methods. Government agencies never demand immediate payment via gift cards.",
    top_signals: [
      "Fake email domain: 'security@bankofamerica-verify.net' is not Bank of America's official domain",
      "Urgency tactics: Claims account will be suspended unless immediate action is taken",
      "Requests sensitive information: Asks for Social Security Number and account details",
      "Creates artificial deadline: 'This action expires in 24 hours'",
      "Impersonates trusted institution: Pretends to be Bank of America security team"
    ],
    recommended_actions: [
      {
        title: "Do Not Respond or Click Links",
        steps: [
          "Delete this email immediately",
          "Do not click any links or download attachments",
          "Do not provide personal information"
        ],
        when: "immediately"
      },
      {
        title: "Verify with Bank of America",
        steps: [
          "Call Bank of America directly at 1-800-432-1000",
          "Log into your account through the official website only",
          "Ask about any legitimate security concerns"
        ],
        when: "if concerned about your account"
      }
    ],
    contacts: {
      law_enforcement: [],
      financial: [],
      state_local: []
    },
    legal_language: "This analysis is for educational purposes. Always verify suspicious communications through official channels. When in doubt, contact the organization directly using official contact methods."
  },
  
  'techsupport': {
    scam_likelihood: 88,
    confidence: "high" as const,
    label: "Likely scam" as const,
    explanation: "This is a classic tech support scam. Legitimate companies like Microsoft do not make unsolicited calls about computer problems, and never ask for remote access through third-party software.",
    top_signals: [
      "Unsolicited call claiming computer problems: Microsoft does not cold-call customers",
      "Requests remote access: Asking to download TeamViewer is a major red flag",
      "Creates false urgency: Claims computer will crash if not acted upon immediately",
      "Impersonates trusted company: Pretends to be Microsoft support",
      "Detected suspicious activity claim: Generic threat to create fear"
    ],
    recommended_actions: [
      {
        title: "Hang Up Immediately",
        steps: [
          "End the call right away",
          "Do not download any software",
          "Do not give remote access to your computer"
        ],
        when: "immediately"
      },
      {
        title: "Secure Your Computer",
        steps: [
          "Run a legitimate antivirus scan",
          "Update your operating system and software",
          "Change passwords if you shared any information"
        ],
        when: "after hanging up"
      }
    ],
    contacts: {
      law_enforcement: [],
      financial: [],
      state_local: []
    },
    legal_language: "This analysis is for educational purposes. Microsoft and other legitimate tech companies never make unsolicited calls about computer problems. Always be suspicious of unsolicited tech support calls."
  },
  
  'ssa': {
    scam_likelihood: 95,
    confidence: "high" as const,
    label: "Likely scam" as const,
    explanation: "This is a Social Security Administration impersonation scam. The SSA never suspends Social Security numbers, never threatens arrest over the phone, and never demands payment via gift cards.",
    top_signals: [
      "False claim about suspended SSN: Social Security numbers cannot be suspended",
      "Threats of arrest: Government agencies don't threaten arrest over the phone",
      "Demands gift card payments: Government agencies never accept gift card payments",
      "Demands secrecy: 'Do not tell anyone' is a classic scam tactic",
      "Requests Social Security number: SSA already has your information"
    ],
    recommended_actions: [
      {
        title: "Hang Up and Do Not Pay",
        steps: [
          "End the call immediately",
          "Do not provide personal information",
          "Do not purchase gift cards or make any payments"
        ],
        when: "immediately"
      },
      {
        title: "Report the Scam",
        steps: [
          "Report to SSA's fraud hotline at 1-800-269-0271",
          "File a report at reportfraud.ftc.gov",
          "Contact your local police if you lost money"
        ],
        when: "as soon as possible"
      }
    ],
    contacts: {
      law_enforcement: [],
      financial: [],
      state_local: []
    },
    legal_language: "This analysis is for educational purposes. The Social Security Administration will never call to threaten your benefits or demand immediate payment. Your Social Security number cannot be suspended."
  }
};

export function getMockAnalysis(text: string, context: AnalysisContext): ScamAnalysisResult {
  // Check if this is a known demo scenario
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('bankofamerica') || lowerText.includes('bank of america') || 
      lowerText.includes('security@bankofamerica-verify.net')) {
    return addContextualContacts(AUTHENTIC_DEMO_RESULTS['phishing'], context, 'phishing');
  }
  
  if (lowerText.includes('microsoft') && lowerText.includes('teamviewer')) {
    return addContextualContacts(AUTHENTIC_DEMO_RESULTS['techsupport'], context, 'techsupport');
  }
  
  if (lowerText.includes('social security') && (lowerText.includes('agent johnson') || 
      lowerText.includes('suspended') || lowerText.includes('gift card'))) {
    return addContextualContacts(AUTHENTIC_DEMO_RESULTS['ssa'], context, 'ssa');
  }
  
  // Fallback to pattern-based analysis for non-demo content
  return generatePatternBasedAnalysis(text, context);
}

function addContextualContacts(result: ScamAnalysisResult, context: AnalysisContext, scamType: string): ScamAnalysisResult {
  const lawEnforcementContacts = [];
  const financialContacts = [];
  const stateLocalContacts = [];
  
  // Add relevant contacts based on scam type
  if (scamType === 'phishing') {
    financialContacts.push({
      contact: "1-800-432-1000",
      name: "Bank of America Fraud Department",
      type: "financial"
    });
    
    lawEnforcementContacts.push({
      contact: "1-877-382-4357",
      name: "Federal Trade Commission",
      type: "federal"
    });
    
  } else if (scamType === 'techsupport') {
    lawEnforcementContacts.push({
      contact: "1-800-642-7676", 
      name: "Microsoft Support",
      type: "company"
    });
    
    lawEnforcementContacts.push({
      contact: "1-877-382-4357",
      name: "Federal Trade Commission", 
      type: "federal"
    });
    
  } else if (scamType === 'ssa') {
    lawEnforcementContacts.push({
      contact: "1-800-269-0271",
      name: "Social Security Administration Fraud Hotline",
      type: "federal"
    });
    
    lawEnforcementContacts.push({
      contact: "1-877-382-4357",
      name: "Federal Trade Commission",
      type: "federal"
    });
  }
  
  // Add state-specific contacts if available
  if (context.state && context.stateContacts[context.state]) {
    const stateData = context.stateContacts[context.state];
    stateLocalContacts.push({
      contact: stateData.attorney_general.phone,
      name: stateData.attorney_general.name,
      state: stateData.name
    });
  }
  
  return { 
    ...result, 
    contacts: {
      law_enforcement: lawEnforcementContacts,
      financial: financialContacts,
      state_local: stateLocalContacts
    }
  };
}

function generatePatternBasedAnalysis(text: string, context: AnalysisContext): ScamAnalysisResult {
  const lowerText = text.toLowerCase();
  
  // Analyze scam indicators
  let scamScore = 0;
  const signals: string[] = [];
  
  // Check for common scam patterns
  if (lowerText.includes('social security') && (lowerText.includes('suspend') || lowerText.includes('block'))) {
    scamScore += 35;
    signals.push('Claims about suspended Social Security number');
  }
  
  if (lowerText.includes('gift card') || lowerText.includes('voucher') || lowerText.includes('target') || lowerText.includes('walgreens')) {
    scamScore += 40;
    signals.push('Requests payment via gift cards or vouchers');
  }
  
  if (lowerText.includes('arrest') || lowerText.includes('sheriff') || lowerText.includes('legal action') || lowerText.includes('criminal charges')) {
    scamScore += 30;
    signals.push('Threatens arrest or legal consequences');
  }
  
  if (lowerText.includes('treasury') || lowerText.includes('irs') || lowerText.includes('tax')) {
    scamScore += 25;
    signals.push('Impersonates government tax agency');
  }
  
  if (lowerText.includes('urgent') || lowerText.includes('immediate') || lowerText.includes('today') || lowerText.includes('now')) {
    scamScore += 20;
    signals.push('Creates false urgency and time pressure');
  }
  
  if (lowerText.includes('do not discuss') || lowerText.includes('keep this private') || lowerText.includes('do not tell')) {
    scamScore += 25;
    signals.push('Demands secrecy and isolation');
  }
  
  if (lowerText.includes('last four') || lowerText.includes('social security number') || lowerText.includes('verify identity')) {
    scamScore += 25;
    signals.push('Requests personal identifying information');
  }
  
  // Check for legitimate indicators that reduce score
  if (lowerText.includes('never ask for gift cards') || lowerText.includes('pay on our website') || lowerText.includes('mail a check')) {
    scamScore = Math.max(0, scamScore - 30);
    signals.push('Offers legitimate payment methods');
  }
  
  if (lowerText.includes('account ending') && lowerText.includes('due on')) {
    scamScore = Math.max(0, scamScore - 20);
    signals.push('References specific account information');
  }
  
  // Clamp score to 0-100
  scamScore = Math.min(100, Math.max(0, scamScore));
  
  // Determine confidence and label
  let confidence: "low" | "medium" | "high";
  let label: "Likely scam" | "Unclear" | "Likely legitimate";
  
  if (scamScore >= 70) {
    confidence = "high";
    label = "Likely scam";
  } else if (scamScore >= 40) {
    confidence = "medium";
    label = "Unclear";
  } else if (scamScore >= 20) {
    confidence = "medium";
    label = "Unclear";
  } else {
    confidence = "high";
    label = "Likely legitimate";
  }
  
  // If no clear signals, adjust confidence
  if (signals.length === 0) {
    confidence = "low";
    signals.push('No clear scam indicators detected');
  }
  
  // Generate appropriate recommendations based on score
  const recommendedActions = [];
  
  if (scamScore >= 70) {
    recommendedActions.push({
      title: "Do Not Respond or Pay",
      steps: [
        "Hang up immediately or delete the message",
        "Do not provide any personal information",
        "Do not make any payments, especially via gift cards"
      ],
      when: "now"
    });
    recommendedActions.push({
      title: "Report the Scam",
      steps: [
        "Report to the Federal Trade Commission at reportfraud.ftc.gov",
        "Contact your local police if money was lost",
        "Warn family and friends about this scam type"
      ],
      when: "within 24 hours"
    });
  } else if (scamScore >= 40) {
    recommendedActions.push({
      title: "Verify Through Official Channels",
      steps: [
        "Contact the organization directly using official phone numbers",
        "Visit the organization's official website",
        "Ask a trusted family member or friend for advice"
      ],
      when: "now"
    });
    recommendedActions.push({
      title: "Do Not Share Information",
      steps: [
        "Do not provide personal details until verified",
        "Do not make immediate payments or decisions",
        "Take time to research and verify the request"
      ],
      when: "now"
    });
  } else {
    recommendedActions.push({
      title: "Stay Vigilant",
      steps: [
        "Continue to monitor for any unusual requests",
        "Verify through official channels if uncertain",
        "Keep records of the communication"
      ],
      when: "ongoing"
    });
  }
  
  return {
    scam_likelihood: scamScore,
    confidence,
    label,
    explanation: `Analysis shows ${scamScore}% likelihood of scam based on ${signals.length} detected signals.`,
    top_signals: signals,
    recommended_actions: recommendedActions,
    contacts: generateContextualContacts(context, scamScore),
    legal_language: "This analysis is for educational purposes. Always verify suspicious communications through official channels. When in doubt, contact the organization directly using official contact methods.",
    version: "v1"
  };
}

function generateContextualContacts(context: AnalysisContext, scamScore: number) {
  const lawEnforcementContacts = [];
  const financialContacts = [];
  const stateLocalContacts = [];
  
  // For high-risk scams, prioritize immediate reporting
  if (scamScore >= 70) {
    lawEnforcementContacts.push({
      contact: "1-877-382-4357",
      name: "Federal Trade Commission",
      type: "federal"
    });
  }
  
  // Add state-specific contacts if available
  if (context.state && context.stateContacts[context.state]) {
    const stateData = context.stateContacts[context.state];
    stateLocalContacts.push({
      contact: stateData.attorney_general.phone,
      name: stateData.attorney_general.name,
      state: stateData.name
    });
  }
  
  return {
    law_enforcement: lawEnforcementContacts,
    financial: financialContacts,
    state_local: stateLocalContacts
  };
}