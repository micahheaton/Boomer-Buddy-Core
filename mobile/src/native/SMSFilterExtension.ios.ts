/**
 * iOS SMS Filter Extension Handler
 * Provides SMS filtering for unknown senders
 */

export interface SMSFilterResult {
  action: 'allow' | 'junk' | 'promotion' | 'transaction';
  confidence: number;
  reason?: string;
}

export class SMSFilterExtension {
  private static instance: SMSFilterExtension;
  private isEnabled = false;

  private constructor() {}

  static getInstance(): SMSFilterExtension {
    if (!SMSFilterExtension.instance) {
      SMSFilterExtension.instance = new SMSFilterExtension();
    }
    return SMSFilterExtension.instance;
  }

  /**
   * Initialize SMS filter extension
   */
  async initialize(): Promise<boolean> {
    try {
      console.log('Initializing iOS SMS Filter Extension...');

      // Check if extension is enabled in Settings
      const isExtensionEnabled = await this.checkExtensionStatus();
      
      if (!isExtensionEnabled) {
        console.warn('SMS Filter Extension not enabled in Settings');
        await this.promptToEnableExtension();
      }

      this.isEnabled = isExtensionEnabled;
      console.log('SMS Filter Extension initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize SMS Filter Extension:', error);
      return false;
    }
  }

  /**
   * Filter SMS message (called by iOS extension)
   */
  async filterMessage(messageBody: string, sender?: string): Promise<SMSFilterResult> {
    try {
      if (!this.isEnabled) {
        return { action: 'allow', confidence: 1.0 };
      }

      // Import RiskEngine here to avoid circular dependencies
      const { RiskEngine } = await import('../services/RiskEngine');
      const riskEngine = RiskEngine.getInstance();

      // Score the message content
      const riskScore = await riskEngine.scoreContent(messageBody, {
        channel: 'sms',
        phoneNumber: sender
      });

      // Determine filter action based on risk score
      let action: SMSFilterResult['action'];
      let reason: string | undefined;

      if (riskScore.label === 'danger') {
        action = 'junk';
        reason = 'High scam risk detected';
      } else if (riskScore.label === 'caution') {
        // Check for specific message types
        if (this.isPromotionalMessage(messageBody)) {
          action = 'promotion';
          reason = 'Marketing/promotional content';
        } else if (this.isTransactionalMessage(messageBody)) {
          action = 'transaction';
          reason = 'Transaction or service notification';
        } else {
          action = 'allow';
          reason = 'Caution but allowing';
        }
      } else {
        // Safe messages
        if (this.isPromotionalMessage(messageBody)) {
          action = 'promotion';
          reason = 'Promotional content';
        } else if (this.isTransactionalMessage(messageBody)) {
          action = 'transaction';
          reason = 'Transaction notification';
        } else {
          action = 'allow';
          reason = 'Safe message';
        }
      }

      const result: SMSFilterResult = {
        action,
        confidence: riskScore.confidence === 'high' ? 0.9 : 
                   riskScore.confidence === 'medium' ? 0.7 : 0.5,
        reason
      };

      // Log filtering result (locally)
      await this.logFilterResult(messageBody, sender, result);

      console.log(`SMS filtered: ${action} (${result.confidence}) - ${reason}`);
      return result;
    } catch (error) {
      console.error('SMS filtering failed:', error);
      // Fail safe - allow message
      return { action: 'allow', confidence: 0.1, reason: 'Filtering error' };
    }
  }

  /**
   * Check if message is promotional
   */
  private isPromotionalMessage(messageBody: string): boolean {
    const promotionalPatterns = [
      /\b(sale|discount|offer|deal|promo|coupon)\b/i,
      /\b(buy now|limited time|act fast|don't miss)\b/i,
      /\b(shop|store|retail|marketing)\b/i,
      /\bunsubscribe\b/i,
      /\boptout\b/i,
      /\bstop to opt out\b/i
    ];

    return promotionalPatterns.some(pattern => pattern.test(messageBody));
  }

  /**
   * Check if message is transactional
   */
  private isTransactionalMessage(messageBody: string): boolean {
    const transactionalPatterns = [
      /\b(verification|confirm|code|pin)\b/i,
      /\b(order|delivery|shipment|tracking)\b/i,
      /\b(payment|receipt|invoice|billing)\b/i,
      /\b(appointment|reminder|schedule)\b/i,
      /\b(account|balance|statement)\b/i,
      /\b(security|alert|notification)\b/i,
      /\b\d{4,6}\b/, // Verification codes
      /\bconfirm.*\d+\b/i
    ];

    return transactionalPatterns.some(pattern => pattern.test(messageBody));
  }

  /**
   * Check if SMS Filter Extension is enabled in Settings
   */
  private async checkExtensionStatus(): Promise<boolean> {
    try {
      // In a real implementation, this would check iOS settings
      // The extension status can only be determined through the extension itself
      
      console.log('Checking SMS Filter Extension status...');
      
      // Simulate status check
      return true; // In real app, would check actual status
    } catch (error) {
      console.error('Failed to check extension status:', error);
      return false;
    }
  }

  /**
   * Prompt user to enable extension in Settings
   */
  private async promptToEnableExtension(): Promise<void> {
    try {
      console.log('Prompting user to enable SMS Filter Extension...');
      
      // In React Native, this would show an alert with instructions:
      /*
      import { Alert, Linking } from 'react-native';
      
      Alert.alert(
        'Enable SMS Protection',
        'To filter scam messages, please enable the Boomer Buddy SMS Filter Extension in Settings:\n\n1. Open Settings app\n2. Go to Messages > Unknown & Spam\n3. Turn on "Filter Unknown Senders"\n4. Turn on "Boomer Buddy"',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openURL('App-Prefs:Messages') }
        ]
      );
      */

    } catch (error) {
      console.error('Failed to prompt for extension:', error);
    }
  }

  /**
   * Log filter result locally
   */
  private async logFilterResult(
    messageBody: string, 
    sender: string | undefined, 
    result: SMSFilterResult
  ): Promise<void> {
    try {
      const logEntry = {
        timestamp: Date.now(),
        sender: sender || 'unknown',
        action: result.action,
        confidence: result.confidence,
        reason: result.reason,
        messageLength: messageBody.length
        // Note: We don't log the actual message content for privacy
      };

      console.log('📋 SMS Filter Log:', logEntry);

      // In a real implementation, would store in encrypted local database
      // await StorageService.getInstance().logSMSFilter(logEntry);

    } catch (error) {
      console.error('Failed to log filter result:', error);
    }
  }

  /**
   * Get filter statistics
   */
  async getFilterStats(): Promise<{
    totalMessages: number;
    junkFiltered: number;
    promotionsFiltered: number;
    transactionsFiltered: number;
    last24Hours: { junk: number; promotions: number; transactions: number };
  }> {
    try {
      // In a real implementation, would query local database
      // For now, return mock data
      
      return {
        totalMessages: 234,
        junkFiltered: 45,
        promotionsFiltered: 67,
        transactionsFiltered: 89,
        last24Hours: {
          junk: 3,
          promotions: 8,
          transactions: 12
        }
      };
    } catch (error) {
      console.error('Failed to get filter stats:', error);
      return {
        totalMessages: 0,
        junkFiltered: 0,
        promotionsFiltered: 0,
        transactionsFiltered: 0,
        last24Hours: { junk: 0, promotions: 0, transactions: 0 }
      };
    }
  }

  /**
   * Update filter settings
   */
  async updateFilterSettings(settings: {
    strictMode: boolean;
    allowPromotions: boolean;
    blockSuspiciousLinks: boolean;
  }): Promise<boolean> {
    try {
      console.log('Updating SMS filter settings:', settings);
      
      // In a real implementation, would update extension configuration
      // The settings would affect how messages are classified
      
      return true;
    } catch (error) {
      console.error('Failed to update filter settings:', error);
      return false;
    }
  }

  /**
   * Enable/disable SMS filtering
   */
  async setEnabled(enabled: boolean): Promise<boolean> {
    try {
      this.isEnabled = enabled;
      
      if (enabled) {
        return await this.initialize();
      } else {
        console.log('SMS Filter Extension disabled');
        return true;
      }
    } catch (error) {
      console.error('Failed to set SMS filter state:', error);
      return false;
    }
  }

  /**
   * Check if SMS filtering is enabled
   */
  isSMSFilterEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Test SMS filter with sample message
   */
  async testFilter(messageBody: string): Promise<SMSFilterResult> {
    console.log('Testing SMS filter with message:', messageBody.substring(0, 50) + '...');
    return await this.filterMessage(messageBody);
  }

  /**
   * Cleanup SMS filter
   */
  destroy(): void {
    this.isEnabled = false;
    console.log('SMS Filter Extension destroyed');
  }
}

/*
Native iOS Swift implementation would be in SMS Filter Extension target:

final class MessageFilterExtension: ILMessageFilterExtension {
  override func handle(
    _ request: ILMessageFilterQueryRequest,
    context: ILMessageFilterExtensionContext,
    completion: @escaping (ILMessageFilterQueryResponse) -> Void
  ) {
    let messageBody = request.messageBody ?? ""
    let sender = request.sender
    
    // Call React Native bridge to filter message
    SMSFilterManager.shared.filterMessage(
      messageBody: messageBody,
      sender: sender
    ) { result in
      let response = ILMessageFilterQueryResponse()
      
      switch result.action {
      case "allow":
        response.action = .allow
      case "junk":
        response.action = .junk
      case "promotion":
        response.action = .promotion
      case "transaction":
        response.action = .transaction
      default:
        response.action = .allow
      }
      
      completion(response)
    }
  }
}
*/