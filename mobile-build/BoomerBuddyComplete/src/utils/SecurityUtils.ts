import CryptoJS from 'crypto-js';

export class SecurityUtils {
  private static readonly ENCRYPTION_KEY = 'boomer-buddy-mobile-2025';
  private static readonly IV_LENGTH = 16;

  /**
   * Encrypt sensitive data before storing locally
   */
  static encrypt(data: string): string {
    try {
      const iv = CryptoJS.lib.WordArray.random(this.IV_LENGTH);
      const encrypted = CryptoJS.AES.encrypt(data, this.ENCRYPTION_KEY, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });
      
      return iv.concat(encrypted.ciphertext).toString(CryptoJS.enc.Base64);
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt sensitive data when retrieving from storage
   */
  static decrypt(encryptedData: string): string {
    try {
      const cipherParams = CryptoJS.enc.Base64.parse(encryptedData);
      const iv = CryptoJS.lib.WordArray.create(
        cipherParams.words.slice(0, this.IV_LENGTH / 4)
      );
      const ciphertext = CryptoJS.lib.WordArray.create(
        cipherParams.words.slice(this.IV_LENGTH / 4)
      );

      const decrypted = CryptoJS.AES.decrypt(
        { ciphertext: ciphertext } as any,
        this.ENCRYPTION_KEY,
        {
          iv: iv,
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7
        }
      );

      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Generate secure hash for data integrity
   */
  static generateHash(data: string): string {
    return CryptoJS.SHA256(data).toString(CryptoJS.enc.Hex);
  }

  /**
   * Verify data integrity using hash
   */
  static verifyHash(data: string, hash: string): boolean {
    const computedHash = this.generateHash(data);
    return computedHash === hash;
  }

  /**
   * Generate secure random token
   */
  static generateSecureToken(length: number = 32): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      result += charset[randomIndex];
    }
    
    return result;
  }

  /**
   * Sanitize input to prevent injection attacks
   */
  static sanitizeInput(input: string): string {
    if (typeof input !== 'string') return '';
    
    return input
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/['"]/g, '') // Remove quotes
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  }

  /**
   * Validate URL to ensure it's safe
   */
  static isValidUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      
      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return false;
      }
      
      // Block localhost and private IP ranges
      const hostname = urlObj.hostname.toLowerCase();
      if (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname.match(/^192\.168\./) ||
        hostname.match(/^10\./) ||
        hostname.match(/^172\.(1[6-9]|2[0-9]|3[01])\./)
      ) {
        return false;
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if content contains potential security threats
   */
  static scanForThreats(content: string): {
    isSafe: boolean;
    threats: string[];
    riskLevel: 'low' | 'medium' | 'high';
  } {
    const threats: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' = 'low';

    const lowRiskPatterns = [
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<script/gi,
      /<iframe/gi
    ];

    const mediumRiskPatterns = [
      /eval\s*\(/gi,
      /document\.write/gi,
      /window\.location/gi,
      /\.innerHTML/gi
    ];

    const highRiskPatterns = [
      /password/gi,
      /credit.*card/gi,
      /social.*security/gi,
      /ssn/gi,
      /routing.*number/gi,
      /account.*number/gi
    ];

    // Check for low risk patterns
    lowRiskPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        threats.push('Potential script injection');
        riskLevel = 'medium';
      }
    });

    // Check for medium risk patterns
    mediumRiskPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        threats.push('Suspicious JavaScript patterns');
        riskLevel = 'medium';
      }
    });

    // Check for high risk patterns
    highRiskPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        threats.push('Sensitive information request');
        riskLevel = 'high';
      }
    });

    return {
      isSafe: threats.length === 0,
      threats,
      riskLevel
    };
  }

  /**
   * Rate limiting for API calls
   */
  static rateLimiter = {
    attempts: new Map<string, number[]>(),
    
    isAllowed(key: string, maxAttempts: number = 5, windowMs: number = 60000): boolean {
      const now = Date.now();
      const attempts = this.attempts.get(key) || [];
      
      // Remove attempts outside the time window
      const validAttempts = attempts.filter(time => now - time < windowMs);
      
      if (validAttempts.length >= maxAttempts) {
        return false;
      }
      
      // Add current attempt
      validAttempts.push(now);
      this.attempts.set(key, validAttempts);
      
      return true;
    },
    
    getRemainingTime(key: string, windowMs: number = 60000): number {
      const attempts = this.attempts.get(key) || [];
      if (attempts.length === 0) return 0;
      
      const oldestAttempt = Math.min(...attempts);
      const timeRemaining = windowMs - (Date.now() - oldestAttempt);
      
      return Math.max(0, timeRemaining);
    }
  };

  /**
   * Secure session management
   */
  static session = {
    create(userId: string): string {
      const sessionData = {
        userId,
        timestamp: Date.now(),
        token: this.generateSecureToken()
      };
      
      return this.encrypt(JSON.stringify(sessionData));
    },
    
    validate(sessionToken: string): { valid: boolean; userId?: string } {
      try {
        const decrypted = this.decrypt(sessionToken);
        const sessionData = JSON.parse(decrypted);
        
        // Check if session is not older than 24 hours
        const maxAge = 24 * 60 * 60 * 1000;
        if (Date.now() - sessionData.timestamp > maxAge) {
          return { valid: false };
        }
        
        return { valid: true, userId: sessionData.userId };
      } catch (error) {
        return { valid: false };
      }
    }
  };

  /**
   * Content Security Policy validation
   */
  static validateCSP(content: string): boolean {
    // Check for inline scripts, styles, and dangerous attributes
    const dangerousPatterns = [
      /<script[^>]*>.*?<\/script>/gis,
      /<style[^>]*>.*?<\/style>/gis,
      /on\w+\s*=\s*["'][^"']*["']/gi,
      /href\s*=\s*["']javascript:/gi,
      /src\s*=\s*["']javascript:/gi
    ];

    return !dangerousPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Generate Content Security Policy header
   */
  static generateCSPHeader(): string {
    return [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "connect-src 'self' https:",
      "font-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ');
  }

  /**
   * Secure data transmission
   */
  static secureTransmission = {
    prepareForTransmission(data: any): string {
      const jsonString = JSON.stringify(data);
      const hash = this.generateHash(jsonString);
      
      return this.encrypt(JSON.stringify({
        data: jsonString,
        hash,
        timestamp: Date.now()
      }));
    },
    
    validateTransmission(encryptedData: string): { valid: boolean; data?: any } {
      try {
        const decrypted = this.decrypt(encryptedData);
        const transmission = JSON.parse(decrypted);
        
        // Verify hash
        if (!this.verifyHash(transmission.data, transmission.hash)) {
          return { valid: false };
        }
        
        // Check timestamp (data should not be older than 1 hour)
        const maxAge = 60 * 60 * 1000;
        if (Date.now() - transmission.timestamp > maxAge) {
          return { valid: false };
        }
        
        return { valid: true, data: JSON.parse(transmission.data) };
      } catch (error) {
        return { valid: false };
      }
    }
  };
}