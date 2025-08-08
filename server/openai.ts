import OpenAI from "openai";
import type { ScamAnalysisResult } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

interface AnalysisContext {
  channel?: string;
  state?: string;
  federalContacts: any;
  financialContacts: any;
  stateContacts: any;
}

export async function analyzeScam(text: string, context: AnalysisContext): Promise<ScamAnalysisResult> {
  const systemPrompt = `You are a careful consumer protection reviewer for seniors. Analyze the provided content for scam patterns and provide a structured assessment.

RISK SCORING RUBRIC:
Start at 0 points. Add points for:
- Urgent/threatening language demanding immediate action (+20-30 points)
- Requests for gift cards, crypto, wire transfers (+25-35 points)
- Requests for personal information (SSN, passwords, account details) (+20-30 points)
- Pressure tactics or secrecy demands (+15-25 points)
- Spoofed branding or misspelled domains (+20-30 points)
- Threats of arrest, tax issues, or legal action (+25-35 points)
- Grammar/spelling errors in official-looking messages (+10-15 points)
- Suspicious phone numbers or contact methods (+15-25 points)

For phone calls with threats or tax/jail keywords, add +30 points.
Clamp final score to 0-100.

CONFIDENCE LEVELS:
- High: Clear patterns present, obvious determination
- Medium: Some indicators present but mixed signals
- Low: Minimal indicators, difficult to determine

You must respond with valid JSON matching this exact structure. Do not include markdown formatting.`;

  const userPrompt = `Analyze this content for scam patterns:

Content: "${text}"

${context.channel ? `Communication channel: ${context.channel}` : ''}
${context.state ? `User's state: ${context.state}` : ''}

Provide analysis in this exact JSON format:
{
  "scam_score": <number 0-100>,
  "confidence": "<low|medium|high>",
  "label": "<Likely scam|Unclear|Likely legitimate>",
  "top_signals": ["<signal1>", "<signal2>"],
  "explanation": "<short clear paragraph>",
  "recommended_actions": [
    {
      "title": "<action title>",
      "steps": ["<step1>", "<step2>"],
      "when": "<now|within 24 hours|optional>"
    }
  ],
  "contacts": {
    "law_enforcement": [
      {
        "name": "<agency name>",
        "contact": "<phone or website>",
        "type": "<federal|state|local>"
      }
    ],
    "financial": [
      {
        "name": "<institution name>",
        "contact": "<phone or guidance>",
        "type": "<bank|credit>"
      }
    ],
    "state_local": [
      {
        "name": "<agency name>",
        "contact": "<phone or website>",
        "state": "<state code if applicable>"
      }
    ]
  },
  "legal_language": "This analysis is for educational purposes only and should not be considered as legal or financial advice. Always verify suspicious communications through official channels.",
  "version": "v1"
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    // Enhance contacts with knowledge base data
    result.contacts = {
      law_enforcement: context.federalContacts.law_enforcement || [],
      financial: context.financialContacts.financial || [],
      state_local: context.state && context.stateContacts[context.state] 
        ? context.stateContacts[context.state].agencies || []
        : []
    };

    return result as ScamAnalysisResult;
  } catch (error) {
    console.error("OpenAI analysis error:", error);
    throw new Error("Failed to analyze content with AI");
  }
}
