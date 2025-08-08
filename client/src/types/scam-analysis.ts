export interface ScamAnalysisRequest {
  userId?: string | null;
  inputType: "image" | "text";
  text?: string;
  imageUrl?: string;
  state?: string;
  phoneNumber?: string;
  emailFrom?: string;
  channel?: "sms" | "email" | "phone" | "social" | "web";
}

export interface RecommendedAction {
  title: string;
  steps: string[];
  when: string;
}

export interface Contact {
  name: string;
  contact: string;
  type?: string;
  state?: string;
}

export interface Contacts {
  law_enforcement: Contact[];
  financial: Contact[];
  state_local: Contact[];
}

export interface ScamAnalysisResult {
  scam_score: number;
  confidence: "low" | "medium" | "high";
  label: "Likely scam" | "Unclear" | "Likely legitimate";
  top_signals: string[];
  explanation: string;
  recommended_actions: RecommendedAction[];
  contacts: Contacts;
  legal_language: string;
  version: string;
}
