import { StorageService } from './StorageService';

export interface TranslationRequest {
  id: string;
  sourceText: string;
  sourceLanguage: string;
  targetLanguage: string;
  context: 'scam_content' | 'safety_tip' | 'alert_message' | 'user_interface' | 'emergency_message';
  priority: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
}

export interface TranslationResult {
  id: string;
  translatedText: string;
  confidence: number;
  method: 'cached' | 'api' | 'offline_model' | 'fallback_dictionary';
  alternatives?: string[];
  culturalAdaptations?: string[];
  warnings?: string[];
  timestamp: number;
}

export interface SupportedLanguage {
  code: string;
  name: string;
  nativeName: string;
  region: string;
  isRightToLeft: boolean;
  hasScamDatabase: boolean;
  qualityScore: number; // 0-1, translation quality for scam-specific content
  emergencyPhrases: { [key: string]: string };
}

export interface CulturalContext {
  language: string;
  region: string;
  commonScamTypes: string[];
  culturalSensitivities: string[];
  preferredTones: 'formal' | 'informal' | 'respectful';
  emergencyContactMethods: string[];
  authorityFigures: string[];
}

export interface TranslationCache {
  [key: string]: {
    translation: string;
    confidence: number;
    lastUsed: number;
    useCount: number;
    context: string;
  };
}

export interface OfflineTranslationModel {
  language: string;
  modelVersion: string;
  accuracy: number;
  modelData: any;
  lastUpdated: number;
  contextSpecialized: boolean;
}

export class MultilingualTranslationService {
  private storageService: StorageService;
  private supportedLanguages: SupportedLanguage[] = [];
  private translationCache: TranslationCache = {};
  private offlineModels: Map<string, OfflineTranslationModel> = new Map();
  private fallbackDictionary: Map<string, Map<string, string>> = new Map();

  constructor() {
    this.storageService = new StorageService();
    this.initializeTranslationService();
  }

  /**
   * Initialize translation service with supported languages and models
   */
  private async initializeTranslationService(): Promise<void> {
    try {
      await this.loadSupportedLanguages();
      await this.loadTranslationCache();
      await this.loadOfflineModels();
      await this.initializeFallbackDictionary();
    } catch (error) {
      console.error('Failed to initialize translation service:', error);
    }
  }

  /**
   * Translate text with context-aware scam detection
   */
  async translateText(request: TranslationRequest): Promise<TranslationResult> {
    try {
      // Check cache first
      const cachedResult = this.getCachedTranslation(request);
      if (cachedResult) {
        return cachedResult;
      }

      // Attempt different translation methods in order of preference
      let result: TranslationResult | null = null;

      // 1. Try API translation (best for scam-specific content)
      if (request.priority === 'critical' || request.priority === 'high') {
        result = await this.translateViaAPI(request);
      }

      // 2. Try offline model if available
      if (!result) {
        result = await this.translateViaOfflineModel(request);
      }

      // 3. Fallback to dictionary translation
      if (!result) {
        result = await this.translateViaFallbackDictionary(request);
      }

      // 4. Last resort - return source text with warning
      if (!result) {
        result = {
          id: request.id,
          translatedText: request.sourceText,
          confidence: 0.1,
          method: 'fallback_dictionary',
          warnings: ['Translation not available - showing original text'],
          timestamp: Date.now()
        };
      }

      // Apply cultural adaptations
      result = await this.applyCulturalAdaptations(result, request);

      // Cache the result
      await this.cacheTranslation(request, result);

      return result;
    } catch (error) {
      console.error('Translation failed:', error);
      throw error;
    }
  }

  /**
   * Translate emergency message with highest priority
   */
  async translateEmergencyMessage(text: string, targetLanguage: string): Promise<TranslationResult> {
    const request: TranslationRequest = {
      id: `emergency_${Date.now()}`,
      sourceText: text,
      sourceLanguage: 'en',
      targetLanguage,
      context: 'emergency_message',
      priority: 'critical',
      timestamp: Date.now()
    };

    const result = await this.translateText(request);

    // Add emergency-specific enhancements
    const language = this.supportedLanguages.find(l => l.code === targetLanguage);
    if (language?.emergencyPhrases) {
      const emergencyPrefix = language.emergencyPhrases['attention'] || 'ATTENTION: ';
      result.translatedText = emergencyPrefix + result.translatedText;
    }

    return result;
  }

  /**
   * Translate scam alert with threat-specific terminology
   */
  async translateScamAlert(alert: any, targetLanguage: string): Promise<TranslationResult> {
    const request: TranslationRequest = {
      id: `scam_alert_${Date.now()}`,
      sourceText: `${alert.title}\n\n${alert.description}`,
      sourceLanguage: 'en',
      targetLanguage,
      context: 'alert_message',
      priority: 'high',
      timestamp: Date.now()
    };

    const result = await this.translateText(request);
    
    // Add scam-specific warnings in target language
    result.warnings = await this.generateScamWarnings(alert.type, targetLanguage);

    return result;
  }

  /**
   * Translate safety tip with cultural context
   */
  async translateSafetyTip(tip: any, targetLanguage: string): Promise<TranslationResult> {
    const request: TranslationRequest = {
      id: `safety_tip_${Date.now()}`,
      sourceText: `${tip.title}\n\n${tip.content}\n\nAction: ${tip.actionable}`,
      sourceLanguage: 'en',
      targetLanguage,
      context: 'safety_tip',
      priority: 'medium',
      timestamp: Date.now()
    };

    return await this.translateText(request);
  }

  /**
   * Batch translate multiple items
   */
  async batchTranslate(items: { text: string; context: string }[], targetLanguage: string): Promise<TranslationResult[]> {
    const requests = items.map((item, index) => ({
      id: `batch_${Date.now()}_${index}`,
      sourceText: item.text,
      sourceLanguage: 'en',
      targetLanguage,
      context: item.context as TranslationRequest['context'],
      priority: 'medium' as TranslationRequest['priority'],
      timestamp: Date.now()
    }));

    const results = await Promise.all(
      requests.map(request => this.translateText(request))
    );

    return results;
  }

  /**
   * Get cached translation if available and fresh
   */
  private getCachedTranslation(request: TranslationRequest): TranslationResult | null {
    const cacheKey = this.generateCacheKey(request);
    const cached = this.translationCache[cacheKey];

    if (cached && this.isCacheValid(cached)) {
      // Update usage stats
      cached.lastUsed = Date.now();
      cached.useCount++;

      return {
        id: request.id,
        translatedText: cached.translation,
        confidence: cached.confidence,
        method: 'cached',
        timestamp: Date.now()
      };
    }

    return null;
  }

  /**
   * Translate via external API (LibreTranslate or similar)
   */
  private async translateViaAPI(request: TranslationRequest): Promise<TranslationResult | null> {
    try {
      // In production, this would call LibreTranslate or Google Translate API
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: request.sourceText,
          source: request.sourceLanguage,
          target: request.targetLanguage,
          context: request.context
        }),
        timeout: 10000
      });

      if (response.ok) {
        const data = await response.json();
        return {
          id: request.id,
          translatedText: data.translatedText,
          confidence: data.confidence || 0.8,
          method: 'api',
          alternatives: data.alternatives,
          timestamp: Date.now()
        };
      }
    } catch (error) {
      console.log('API translation unavailable, trying offline methods');
    }

    return null;
  }

  /**
   * Translate using offline model
   */
  private async translateViaOfflineModel(request: TranslationRequest): Promise<TranslationResult | null> {
    const model = this.offlineModels.get(request.targetLanguage);
    if (!model) return null;

    try {
      // Simulate offline model translation
      // In a real app, this would use TensorFlow Lite or similar
      const translatedText = await this.simulateOfflineTranslation(
        request.sourceText, 
        request.targetLanguage,
        model
      );

      return {
        id: request.id,
        translatedText,
        confidence: model.accuracy * 0.9, // Slightly lower confidence than API
        method: 'offline_model',
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Offline model translation failed:', error);
      return null;
    }
  }

  /**
   * Translate using fallback dictionary
   */
  private async translateViaFallbackDictionary(request: TranslationRequest): Promise<TranslationResult | null> {
    const dictionary = this.fallbackDictionary.get(request.targetLanguage);
    if (!dictionary) return null;

    try {
      const words = request.sourceText.toLowerCase().split(/\s+/);
      const translatedWords = words.map(word => {
        // Remove punctuation for lookup
        const cleanWord = word.replace(/[^\w]/g, '');
        return dictionary.get(cleanWord) || word;
      });

      const translatedText = translatedWords.join(' ');
      
      // Adjust punctuation and capitalization
      const finalText = this.adjustTextFormatting(translatedText, request.targetLanguage);

      return {
        id: request.id,
        translatedText: finalText,
        confidence: 0.5, // Lower confidence for dictionary translation
        method: 'fallback_dictionary',
        warnings: ['Basic translation using word dictionary - meaning may be imprecise'],
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Dictionary translation failed:', error);
      return null;
    }
  }

  /**
   * Apply cultural adaptations to translation
   */
  private async applyCulturalAdaptations(result: TranslationResult, request: TranslationRequest): Promise<TranslationResult> {
    const cultural = await this.getCulturalContext(request.targetLanguage);
    if (!cultural) return result;

    const adaptations: string[] = [];

    // Adjust tone based on cultural preferences
    if (cultural.preferredTones === 'formal' && request.context === 'safety_tip') {
      adaptations.push('Using formal tone appropriate for safety communications');
    }

    // Add cultural context for scam types
    if (request.context === 'scam_content' && cultural.commonScamTypes.length > 0) {
      adaptations.push(`Common in ${cultural.region}: ${cultural.commonScamTypes.join(', ')}`);
    }

    // Adjust authority figure references
    if (result.translatedText.includes('government') && cultural.authorityFigures.length > 0) {
      adaptations.push(`Local authorities: ${cultural.authorityFigures.join(', ')}`);
    }

    result.culturalAdaptations = adaptations;
    return result;
  }

  /**
   * Generate scam warnings in target language
   */
  private async generateScamWarnings(scamType: string, targetLanguage: string): Promise<string[]> {
    const warningTemplates: { [key: string]: { [lang: string]: string[] } } = {
      'phone_scam': {
        'es': ['Nunca proporcione información personal por teléfono', 'Cuelgue y llame al número oficial'],
        'fr': ['Ne donnez jamais d\'informations personnelles par téléphone', 'Raccrochez et appelez le numéro officiel'],
        'de': ['Geben Sie niemals persönliche Daten am Telefon preis', 'Legen Sie auf und rufen Sie die offizielle Nummer an'],
        'zh': ['绝不要在电话中提供个人信息', '挂断并拨打官方号码'],
        'ja': ['電話で個人情報を提供しないでください', '電話を切って公式番号に電話してください']
      },
      'email_phishing': {
        'es': ['No haga clic en enlaces sospechosos', 'Verifique la dirección del remitente'],
        'fr': ['Ne cliquez pas sur les liens suspects', 'Vérifiez l\'adresse de l\'expéditeur'],
        'de': ['Klicken Sie nicht auf verdächtige Links', 'Überprüfen Sie die Absenderadresse'],
        'zh': ['不要点击可疑链接', '验证发件人地址'],
        'ja': ['疑わしいリンクをクリックしないでください', '送信者のアドレスを確認してください']
      }
    };

    return warningTemplates[scamType]?.[targetLanguage] || [
      'Be cautious with this type of communication',
      'Verify through official channels'
    ];
  }

  /**
   * Load supported languages
   */
  private async loadSupportedLanguages(): Promise<void> {
    this.supportedLanguages = [
      {
        code: 'en',
        name: 'English',
        nativeName: 'English',
        region: 'Global',
        isRightToLeft: false,
        hasScamDatabase: true,
        qualityScore: 1.0,
        emergencyPhrases: {
          'attention': 'EMERGENCY: ',
          'help': 'HELP NEEDED: ',
          'danger': 'DANGER: '
        }
      },
      {
        code: 'es',
        name: 'Spanish',
        nativeName: 'Español',
        region: 'Americas',
        isRightToLeft: false,
        hasScamDatabase: true,
        qualityScore: 0.9,
        emergencyPhrases: {
          'attention': 'EMERGENCIA: ',
          'help': 'AYUDA NECESARIA: ',
          'danger': 'PELIGRO: '
        }
      },
      {
        code: 'fr',
        name: 'French',
        nativeName: 'Français',
        region: 'Europe/Africa',
        isRightToLeft: false,
        hasScamDatabase: true,
        qualityScore: 0.85,
        emergencyPhrases: {
          'attention': 'URGENCE: ',
          'help': 'AIDE NÉCESSAIRE: ',
          'danger': 'DANGER: '
        }
      },
      {
        code: 'de',
        name: 'German',
        nativeName: 'Deutsch',
        region: 'Europe',
        isRightToLeft: false,
        hasScamDatabase: true,
        qualityScore: 0.85,
        emergencyPhrases: {
          'attention': 'NOTFALL: ',
          'help': 'HILFE BENÖTIGT: ',
          'danger': 'GEFAHR: '
        }
      },
      {
        code: 'zh',
        name: 'Chinese (Simplified)',
        nativeName: '简体中文',
        region: 'Asia',
        isRightToLeft: false,
        hasScamDatabase: true,
        qualityScore: 0.8,
        emergencyPhrases: {
          'attention': '紧急情况：',
          'help': '需要帮助：',
          'danger': '危险：'
        }
      },
      {
        code: 'ja',
        name: 'Japanese',
        nativeName: '日本語',
        region: 'Asia',
        isRightToLeft: false,
        hasScamDatabase: true,
        qualityScore: 0.8,
        emergencyPhrases: {
          'attention': '緊急事態：',
          'help': 'ヘルプが必要：',
          'danger': '危険：'
        }
      },
      {
        code: 'ar',
        name: 'Arabic',
        nativeName: 'العربية',
        region: 'Middle East/North Africa',
        isRightToLeft: true,
        hasScamDatabase: false,
        qualityScore: 0.7,
        emergencyPhrases: {
          'attention': 'طوارئ: ',
          'help': 'مساعدة مطلوبة: ',
          'danger': 'خطر: '
        }
      }
    ];
  }

  /**
   * Load translation cache from storage
   */
  private async loadTranslationCache(): Promise<void> {
    try {
      this.translationCache = await this.storageService.getTranslationCache() || {};
    } catch (error) {
      console.error('Failed to load translation cache:', error);
      this.translationCache = {};
    }
  }

  /**
   * Load offline translation models
   */
  private async loadOfflineModels(): Promise<void> {
    try {
      const models = await this.storageService.getOfflineTranslationModels();
      models.forEach(model => {
        this.offlineModels.set(model.language, model);
      });
    } catch (error) {
      console.error('Failed to load offline models:', error);
    }
  }

  /**
   * Initialize fallback dictionary for basic translations
   */
  private async initializeFallbackDictionary(): Promise<void> {
    // Spanish dictionary
    const spanishDict = new Map([
      ['scam', 'estafa'], ['fraud', 'fraude'], ['danger', 'peligro'],
      ['safe', 'seguro'], ['help', 'ayuda'], ['emergency', 'emergencia'],
      ['phone', 'teléfono'], ['email', 'correo'], ['money', 'dinero'],
      ['bank', 'banco'], ['police', 'policía'], ['family', 'familia'],
      ['warning', 'advertencia'], ['alert', 'alerta'], ['verify', 'verificar'],
      ['suspicious', 'sospechoso'], ['legitimate', 'legítimo'], ['trust', 'confianza']
    ]);

    // French dictionary
    const frenchDict = new Map([
      ['scam', 'arnaque'], ['fraud', 'fraude'], ['danger', 'danger'],
      ['safe', 'sûr'], ['help', 'aide'], ['emergency', 'urgence'],
      ['phone', 'téléphone'], ['email', 'courriel'], ['money', 'argent'],
      ['bank', 'banque'], ['police', 'police'], ['family', 'famille'],
      ['warning', 'avertissement'], ['alert', 'alerte'], ['verify', 'vérifier'],
      ['suspicious', 'suspect'], ['legitimate', 'légitime'], ['trust', 'confiance']
    ]);

    // German dictionary
    const germanDict = new Map([
      ['scam', 'Betrug'], ['fraud', 'Betrug'], ['danger', 'Gefahr'],
      ['safe', 'sicher'], ['help', 'Hilfe'], ['emergency', 'Notfall'],
      ['phone', 'Telefon'], ['email', 'E-Mail'], ['money', 'Geld'],
      ['bank', 'Bank'], ['police', 'Polizei'], ['family', 'Familie'],
      ['warning', 'Warnung'], ['alert', 'Alarm'], ['verify', 'überprüfen'],
      ['suspicious', 'verdächtig'], ['legitimate', 'legitim'], ['trust', 'Vertrauen']
    ]);

    this.fallbackDictionary.set('es', spanishDict);
    this.fallbackDictionary.set('fr', frenchDict);
    this.fallbackDictionary.set('de', germanDict);
  }

  /**
   * Generate cache key for translation
   */
  private generateCacheKey(request: TranslationRequest): string {
    return `${request.sourceLanguage}_${request.targetLanguage}_${request.context}_${Buffer.from(request.sourceText).toString('base64').slice(0, 32)}`;
  }

  /**
   * Check if cached translation is still valid
   */
  private isCacheValid(cached: any): boolean {
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    return Date.now() - cached.lastUsed < maxAge;
  }

  /**
   * Cache translation result
   */
  private async cacheTranslation(request: TranslationRequest, result: TranslationResult): Promise<void> {
    const cacheKey = this.generateCacheKey(request);
    
    this.translationCache[cacheKey] = {
      translation: result.translatedText,
      confidence: result.confidence,
      lastUsed: Date.now(),
      useCount: 1,
      context: request.context
    };

    // Save to storage periodically
    await this.storageService.saveTranslationCache(this.translationCache);
  }

  /**
   * Simulate offline translation for development
   */
  private async simulateOfflineTranslation(text: string, targetLanguage: string, model: OfflineTranslationModel): Promise<string> {
    // Simulate translation delay
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

    // Use fallback dictionary as simulation
    const dictionary = this.fallbackDictionary.get(targetLanguage);
    if (dictionary) {
      const words = text.toLowerCase().split(/\s+/);
      const translatedWords = words.map(word => {
        const cleanWord = word.replace(/[^\w]/g, '');
        return dictionary.get(cleanWord) || word;
      });
      return translatedWords.join(' ');
    }

    return text; // Fallback to original text
  }

  /**
   * Adjust text formatting for target language
   */
  private adjustTextFormatting(text: string, targetLanguage: string): string {
    const language = this.supportedLanguages.find(l => l.code === targetLanguage);
    
    if (language?.isRightToLeft) {
      // Add RTL marker for Arabic text
      return '\u202E' + text + '\u202C';
    }

    // Basic capitalization for other languages
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  /**
   * Get cultural context for language
   */
  private async getCulturalContext(languageCode: string): Promise<CulturalContext | null> {
    const contexts: { [key: string]: CulturalContext } = {
      'es': {
        language: 'Spanish',
        region: 'Latin America/Spain',
        commonScamTypes: ['Romance scams', 'Lottery scams', 'Family emergency scams'],
        culturalSensitivities: ['Family honor', 'Religious respect', 'Authority respect'],
        preferredTones: 'respectful',
        emergencyContactMethods: ['Family first', 'Local police', 'Church/community'],
        authorityFigures: ['Police (Policía)', 'Mayor (Alcalde)', 'Priest (Padre)']
      },
      'fr': {
        language: 'French',
        region: 'France/Francophone',
        commonScamTypes: ['Investment scams', 'Government impersonation', 'Tech support scams'],
        culturalSensitivities: ['Privacy respect', 'Formal address', 'Government trust'],
        preferredTones: 'formal',
        emergencyContactMethods: ['Police (17)', 'SAMU (15)', 'Fire (18)'],
        authorityFigures: ['Police', 'Maire', 'Préfet']
      }
    };

    return contexts[languageCode] || null;
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages(): SupportedLanguage[] {
    return [...this.supportedLanguages];
  }

  /**
   * Check if language is supported
   */
  isLanguageSupported(languageCode: string): boolean {
    return this.supportedLanguages.some(lang => lang.code === languageCode);
  }

  /**
   * Get translation quality score for language pair
   */
  getQualityScore(sourceLanguage: string, targetLanguage: string): number {
    const targetLang = this.supportedLanguages.find(l => l.code === targetLanguage);
    return targetLang?.qualityScore || 0;
  }

  /**
   * Clear translation cache
   */
  async clearCache(): Promise<void> {
    this.translationCache = {};
    await this.storageService.clearTranslationCache();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; hitRate: number; totalTranslations: number } {
    const entries = Object.values(this.translationCache);
    const totalUse = entries.reduce((sum, entry) => sum + entry.useCount, 0);
    
    return {
      size: entries.length,
      hitRate: entries.length > 0 ? totalUse / entries.length : 0,
      totalTranslations: totalUse
    };
  }

  /**
   * Download offline model for language
   */
  async downloadOfflineModel(languageCode: string): Promise<boolean> {
    try {
      console.log(`Downloading offline translation model for ${languageCode}...`);
      
      // Simulate model download
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const model: OfflineTranslationModel = {
        language: languageCode,
        modelVersion: '1.0.0',
        accuracy: 0.75,
        modelData: { /* Model data would be here */ },
        lastUpdated: Date.now(),
        contextSpecialized: true
      };

      this.offlineModels.set(languageCode, model);
      await this.storageService.storeOfflineTranslationModel(model);
      
      console.log(`Offline model for ${languageCode} downloaded successfully`);
      return true;
    } catch (error) {
      console.error(`Failed to download offline model for ${languageCode}:`, error);
      return false;
    }
  }

  /**
   * Cleanup translation service
   */
  destroy(): void {
    // Save cache before cleanup
    this.storageService.saveTranslationCache(this.translationCache);
  }
}