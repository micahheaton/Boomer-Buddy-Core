import type { ScamAnalysisResult } from "@shared/schema";

interface AnalysisContext {
  channel?: string;
  state?: string;
  federalContacts: any;
  financialContacts: any;
  stateContacts: any;
}

export function getMockAnalysis(text: string, context: AnalysisContext): ScamAnalysisResult {
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
        "Never provide personal details over the phone",
        "Do not make immediate payments",
        "Take time to research and verify"
      ],
      when: "now"
    });
  } else {
    recommendedActions.push({
      title: "Stay Cautious",
      steps: [
        "Still verify through official channels if unsure",
        "Use official payment methods only",
        "Keep records of all communications"
      ],
      when: "optional"
    });
  }
  
  // Build explanation
  let explanation = "";
  if (scamScore >= 70) {
    explanation = "This appears to be a high-risk scam attempt. Multiple red flags are present including threats, urgency tactics, and requests for unusual payment methods. Government agencies never demand immediate payment via gift cards.";
  } else if (scamScore >= 40) {
    explanation = "This communication shows some concerning patterns that warrant caution. While not definitively a scam, it contains elements commonly used by fraudsters. Verify independently before taking any action.";
  } else {
    explanation = "This appears to be a legitimate communication with standard business practices. However, always remain vigilant and verify through official channels if you have any doubts.";
  }
  
  return {
    scam_score: scamScore,
    confidence,
    label,
    top_signals: signals.slice(0, 3), // Top 3 signals
    explanation,
    recommended_actions: recommendedActions,
    contacts: {
      law_enforcement: context.federalContacts?.law_enforcement || [
        {
          name: "Federal Trade Commission",
          contact: "reportfraud.ftc.gov",
          type: "federal"
        },
        {
          name: "FBI Internet Crime Complaint Center",
          contact: "ic3.gov",
          type: "federal"
        }
      ],
      financial: context.financialContacts?.financial || [
        {
          name: "Bank Fraud Hotline",
          contact: "Contact your bank directly",
          type: "bank"
        }
      ],
      state_local: context.state && context.stateContacts?.[context.state]
        ? context.stateContacts[context.state].agencies || []
        : [
            {
              name: "State Attorney General",
              contact: "Check your state's official website",
              state: context.state || ""
            }
          ]
    },
    legal_language: "This analysis is for educational purposes only and should not be considered as legal or financial advice. Always verify suspicious communications through official channels.",
    version: "v1"
  };
}