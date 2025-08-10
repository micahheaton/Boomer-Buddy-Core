/**
 * SMS Interception Service - Real-time SMS analysis and overlay
 * Integrates with Android SMS system to detect scam messages
 */

import { ApiService } from './ApiService';
import { StorageService } from './StorageService';

export interface SmsAnalysisResult {
  messageId: string;
  isScam: boolean;
  scamScore: number;
  confidence: 'low' | 'medium' | 'high';
  threatType: string[];
  warningText: string;
  recommendedAction: 'safe' | 'caution' | 'danger' | 'block';
  timestamp: number;
}

export interface SmsOverlayData {
  show: boolean;
  messageText: string;
  analysis: SmsAnalysisResult;
  senderInfo: {
    number: string;
    name?: string;
    isKnownContact: boolean;
  };
}

export class SmsInterceptionService {
  private storageService: StorageService;
  private isMonitoring: boolean = false;

  constructor() {
    this.storageService = new StorageService();
  }

  /**
   * Start monitoring SMS messages for real-time analysis
   */
  async startSmsMonitoring(): Promise<boolean> {
    try {
      console.log('🔍 Starting SMS monitoring...');
      
      // Register SMS broadcast receiver (Android native)
      const { NativeModules } = require('react-native');
      if (NativeModules.SmsInterceptor) {
        await NativeModules.SmsInterceptor.startMonitoring();
        this.isMonitoring = true;
        console.log('✅ SMS monitoring active');
        return true;
      }
      
      console.log('⚠️ SMS interception not available - requires native Android implementation');
      return false;
    } catch (error) {
      console.error('❌ Failed to start SMS monitoring:', error);
      return false;
    }
  }

  /**
   * Stop SMS monitoring
   */
  async stopSmsMonitoring(): Promise<void> {
    try {
      const { NativeModules } = require('react-native');
      if (NativeModules.SmsInterceptor) {
        await NativeModules.SmsInterceptor.stopMonitoring();
        this.isMonitoring = false;
        console.log('🛑 SMS monitoring stopped');
      }
    } catch (error) {
      console.error('❌ Failed to stop SMS monitoring:', error);
    }
  }

  /**
   * Analyze incoming SMS message in real-time
   */
  async analyzeSmsMessage(
    messageText: string,
    senderNumber: string,
    timestamp: number
  ): Promise<SmsAnalysisResult> {
    try {
      console.log(`📱 Analyzing SMS from ${senderNumber.slice(-4)}`);
      
      // Basic PII scrubbing before sending to backend
      const scrubbedText = this.basicPiiScrub(messageText);
      
      // Extract SMS-specific features for analysis
      const features = this.extractSmsFeatures(scrubbedText, senderNumber);
      
      // Analyze using backend ML engine
      const analysis = await ApiService.analyzeContent(features);
      
      const result: SmsAnalysisResult = {
        messageId: `sms_${timestamp}_${Math.random()}`,
        isScam: analysis.analysis.label === 'likely_scam',
        scamScore: analysis.analysis.score,
        confidence: analysis.analysis.confidence,
        threatType: this.detectSmsThreats(scrubbedText),
        warningText: this.generateWarningText(analysis.analysis),
        recommendedAction: this.determineRecommendedAction(analysis.analysis),
        timestamp
      };
      
      // Store analysis for learning
      await this.storageService.storeSmsAnalysis(result);
      
      console.log(`✅ SMS analysis complete - Risk: ${result.recommendedAction}`);
      return result;
      
    } catch (error) {
      console.error('❌ SMS analysis failed:', error);
      
      // Fallback local analysis
      return this.performLocalSmsAnalysis(messageText, senderNumber, timestamp);
    }
  }

  /**
   * Extract SMS-specific features for ML analysis
   */
  private extractSmsFeatures(text: string, sender: string): Record<string, any> {
    return {
      message_type: 'sms',
      content_length: text.length,
      has_links: /https?:\/\//.test(text),
      has_phone_numbers: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/.test(text),
      has_urgent_words: /urgent|immediate|expire|act now|limited time/i.test(text),
      has_money_terms: /\$|\bmoney\b|payment|account|bank|credit/i.test(text),
      sender_is_shortcode: /^\d{5,6}$/.test(sender),
      sender_is_unknown: !sender.match(/^[+]?[1-9]\d{1,14}$/),
      has_verification_codes: /\b\d{4,8}\b/.test(text),
      has_personal_info_requests: /ssn|social security|password|pin\b/i.test(text),
      content_sentiment: this.analyzeSentiment(text),
      urgency_indicators: this.countUrgencyIndicators(text),
      link_count: (text.match(/https?:\/\/[^\s]+/g) || []).length,
      suspicious_domains: this.checkSuspiciousDomains(text)
    };
  }

  /**
   * Detect specific SMS threat types
   */
  private detectSmsThreats(text: string): string[] {
    const threats: string[] = [];
    
    if (/bank|account.*suspend|verify.*account/i.test(text)) {
      threats.push('Banking Scam');
    }
    
    if (/won|prize|lottery|congratulations/i.test(text)) {
      threats.push('Prize Scam');
    }
    
    if (/irs|tax|refund.*pending/i.test(text)) {
      threats.push('Tax Scam');
    }
    
    if (/amazon|package|delivery.*fail/i.test(text)) {
      threats.push('Delivery Scam');
    }
    
    if (/medicare|insurance|health.*benefit/i.test(text)) {
      threats.push('Healthcare Scam');
    }
    
    if (/click.*link|verify.*click/i.test(text)) {
      threats.push('Phishing');
    }
    
    if (/urgent|expire.*today|act.*now/i.test(text)) {
      threats.push('Urgency Manipulation');
    }
    
    return threats;
  }

  /**
   * Generate user-friendly warning text
   */
  private generateWarningText(analysis: any): string {
    if (analysis.label === 'likely_scam') {
      return `⚠️ SCAM ALERT: This message shows ${analysis.confidence} confidence scam indicators. Do not click links or provide personal information.`;
    } else if (analysis.label === 'suspicious') {
      return `🟡 CAUTION: This message has suspicious elements. Verify sender before taking action.`;
    } else {
      return `✅ This message appears legitimate.`;
    }
  }

  /**
   * Determine recommended action
   */
  private determineRecommendedAction(analysis: any): 'safe' | 'caution' | 'danger' | 'block' {
    if (analysis.score > 0.8) return 'block';
    if (analysis.score > 0.6) return 'danger';
    if (analysis.score > 0.3) return 'caution';
    return 'safe';
  }

  /**
   * Fallback local analysis when backend unavailable
   */
  private performLocalSmsAnalysis(
    text: string, 
    sender: string, 
    timestamp: number
  ): SmsAnalysisResult {
    const scamKeywords = [
      'verify account', 'click here', 'act now', 'urgent', 'expire today',
      'won prize', 'congratulations', 'refund pending', 'suspend account'
    ];
    
    const scamCount = scamKeywords.filter(keyword => 
      text.toLowerCase().includes(keyword)
    ).length;
    
    const hasLinks = /https?:\/\//.test(text);
    const isShortCode = /^\d{5,6}$/.test(sender);
    
    const riskScore = (scamCount * 0.3) + (hasLinks ? 0.3 : 0) + (isShortCode ? 0.2 : 0);
    
    return {
      messageId: `local_sms_${timestamp}`,
      isScam: riskScore > 0.5,
      scamScore: Math.min(riskScore, 1.0),
      confidence: riskScore > 0.7 ? 'high' : riskScore > 0.4 ? 'medium' : 'low',
      threatType: ['Local Analysis'],
      warningText: riskScore > 0.5 ? 
        '⚠️ LOCAL ALERT: Suspicious message detected offline' : 
        '✅ No immediate threats detected',
      recommendedAction: riskScore > 0.7 ? 'danger' : riskScore > 0.4 ? 'caution' : 'safe',
      timestamp
    };
  }

  /**
   * Helper methods for feature extraction
   */
  private analyzeSentiment(text: string): number {
    const positiveWords = ['free', 'win', 'prize', 'congratulations', 'offer'];
    const negativeWords = ['urgent', 'expire', 'suspend', 'verify', 'confirm'];
    
    const positive = positiveWords.filter(word => text.toLowerCase().includes(word)).length;
    const negative = negativeWords.filter(word => text.toLowerCase().includes(word)).length;
    
    return (positive - negative) / Math.max(positive + negative, 1);
  }
  
  private countUrgencyIndicators(text: string): number {
    const urgencyWords = ['urgent', 'immediate', 'expire', 'act now', 'limited time', 'today only'];
    return urgencyWords.filter(word => text.toLowerCase().includes(word)).length;
  }
  
  private checkSuspiciousDomains(text: string): boolean {
    const urls = text.match(/https?:\/\/([^\/\s]+)/g);
    if (!urls) return false;
    
    const suspiciousTlds = ['.tk', '.ml', '.ga', '.cf'];
    return urls.some(url => 
      suspiciousTlds.some(tld => url.includes(tld))
    );
  }

  /**
   * Basic PII scrubbing for SMS content
   */
  private basicPiiScrub(text: string): string {
    return text
      .replace(/\b\d{3}[-.]?\d{2}[-.]?\d{4}\b/g, '[SSN]') // SSN
      .replace(/\b\d{4}[-.]?\d{4}[-.]?\d{4}[-.]?\d{4}\b/g, '[CARD]') // Credit card
      .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE]') // Phone number
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]'); // Email
  }

  /**
   * Get monitoring status
   */
  isCurrentlyMonitoring(): boolean {
    return this.isMonitoring;
  }
}