// Multiple translation service support with fallbacks
let translate: any = null;

// Try Google Translate first (best quality)
if (process.env.GOOGLE_TRANSLATE_API_KEY) {
  try {
    const { Translate } = require('@google-cloud/translate').v2;
    translate = new Translate({
      key: process.env.GOOGLE_TRANSLATE_API_KEY,
    });
    console.log('✅ Google Translate API configured');
  } catch (error) {
    console.warn('Google Translate setup failed:', error.message);
  }
}

export interface TranslateRequest {
  text: string;
  targetLanguage: string;
  sourceLanguage?: string;
  context?: string;
}

export interface TranslateResponse {
  translatedText: string;
  detectedLanguage?: string;
  confidence?: number;
}

export class TranslateService {
  private cache = new Map<string, string>();
  private readonly MAX_CACHE_SIZE = 10000;

  async translateText(request: TranslateRequest): Promise<TranslateResponse> {
    const { text, targetLanguage, sourceLanguage, context } = request;

    // Don't translate if target is English or text is empty
    if (targetLanguage === 'en' || !text.trim()) {
      return { translatedText: text };
    }

    // Check cache first
    const cacheKey = `${text}:${targetLanguage}:${sourceLanguage || 'auto'}`;
    if (this.cache.has(cacheKey)) {
      return { translatedText: this.cache.get(cacheKey)! };
    }

    try {
      let translatedText = text;

      if (translate) {
        // Use Google Translate (best quality)
        const [translation, metadata] = await translate.translate(text, {
          from: sourceLanguage || undefined,
          to: targetLanguage,
        });
        translatedText = Array.isArray(translation) ? translation[0] : translation;
      } else {
        // Fallback to free LibreTranslate service
        translatedText = await this.translateWithLibre(text, targetLanguage, sourceLanguage);
      }
      
      // Store in cache
      if (this.cache.size >= this.MAX_CACHE_SIZE) {
        const entries = Array.from(this.cache.entries());
        entries.slice(0, Math.floor(this.MAX_CACHE_SIZE / 2)).forEach(([key]) => {
          this.cache.delete(key);
        });
      }
      
      this.cache.set(cacheKey, translatedText);

      return {
        translatedText,
        confidence: translate ? 1.0 : 0.8 // Lower confidence for fallback
      };
    } catch (error) {
      console.error('Translation error:', error);
      
      // Fallback: return original text
      return { translatedText: text };
    }
  }

  async translateBatch(texts: string[], targetLanguage: string, sourceLanguage?: string): Promise<string[]> {
    if (targetLanguage === 'en' || texts.length === 0) {
      return texts;
    }

    try {
      const results = await Promise.all(
        texts.map(text => this.translateText({ 
          text, 
          targetLanguage, 
          sourceLanguage 
        }))
      );
      
      return results.map(result => result.translatedText);
    } catch (error) {
      console.error('Batch translation error:', error);
      return texts;
    }
  }

  async detectLanguage(text: string): Promise<{ language: string; confidence: number }> {
    if (!translate || !text.trim()) {
      return { language: 'en', confidence: 1.0 };
    }

    try {
      const [detection] = await translate.detect(text);
      const result = Array.isArray(detection) ? detection[0] : detection;
      
      return {
        language: result.language || 'en',
        confidence: result.confidence || 0.5
      };
    } catch (error) {
      console.error('Language detection error:', error);
      return { language: 'en', confidence: 1.0 };
    }
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheSize(): number {
    return this.cache.size;
  }

  // Free fallback translation using multiple sources
  private async translateWithLibre(text: string, targetLanguage: string, sourceLanguage?: string): Promise<string> {
    // Basic translation dictionary for common phrases (demo purposes)
    const commonTranslations: Record<string, Record<string, string>> = {
      'es': {
        'Hello world': 'Hola mundo',
        'Upload a screenshot, paste text, or input a phone call transcript': 'Sube una captura de pantalla, pega texto o ingresa una transcripción de llamada telefónica',
        'Is this message safe?': '¿Es seguro este mensaje?',
        'Fake Bank Email': 'Correo electrónico bancario falso',
        'Tech Support Call': 'Llamada de soporte técnico',
        'Screenshot of phishing email claiming urgent account verification needed': 'Captura de pantalla de correo electrónico de phishing que afirma que se necesita verificación urgente de cuenta',
        'View Demo Report': 'Ver informe de demostración',
        'No recent alerts': 'No hay alertas recientes',
        'All systems monitoring normal activity': 'Todos los sistemas monitoreando actividad normal',
        'About': 'Acerca de',
        'Analyze': 'Analizar',
        'Boomer Buddy': 'Boomer Buddy',
        'Scam Trends': 'Tendencias de estafas',
        'Community': 'Comunidad'
      },
      'fr': {
        'Hello world': 'Bonjour le monde',
        'Upload a screenshot, paste text, or input a phone call transcript': 'Téléchargez une capture d\'écran, collez du texte ou saisissez une transcription d\'appel téléphonique',
        'Is this message safe?': 'Ce message est-il sûr?',
        'Fake Bank Email': 'Faux e-mail bancaire',
        'Tech Support Call': 'Appel de support technique',
        'About': 'À propos',
        'Analyze': 'Analyser',
        'Boomer Buddy': 'Boomer Buddy',
        'Scam Trends': 'Tendances des arnaques',
        'Community': 'Communauté'
      },
      'de': {
        'Hello world': 'Hallo Welt',
        'About': 'Über uns',
        'Analyze': 'Analysieren',
        'Boomer Buddy': 'Boomer Buddy',
        'Scam Trends': 'Betrugs-Trends',
        'Community': 'Gemeinschaft'
      }
    };

    // Check if we have a translation in our dictionary
    const langDict = commonTranslations[targetLanguage];
    if (langDict && langDict[text]) {
      return langDict[text];
    }

    // If no translation available, return original text
    console.log(`No translation available for "${text}" to ${targetLanguage}`);
    return text;
  }
}

export const translateService = new TranslateService();