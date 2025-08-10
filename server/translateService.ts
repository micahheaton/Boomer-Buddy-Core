import { Translate } from '@google-cloud/translate/build/src/v2';

// Initialize Google Translate client
// Use service account key if available, otherwise use default credentials
let translate: Translate;

try {
  translate = new Translate({
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    // If running on Replit, use the application default credentials
    // If you need a service account key, set GOOGLE_APPLICATION_CREDENTIALS
  });
} catch (error) {
  console.warn('Google Translate not properly configured. Translation features will be disabled.');
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
      if (!translate) {
        throw new Error('Google Translate not configured');
      }

      const [translation, metadata] = await translate.translate(text, {
        from: sourceLanguage || undefined,
        to: targetLanguage,
      });

      const translatedText = Array.isArray(translation) ? translation[0] : translation;
      
      // Store in cache
      if (this.cache.size >= this.MAX_CACHE_SIZE) {
        // Clear oldest entries
        const entries = Array.from(this.cache.entries());
        entries.slice(0, Math.floor(this.MAX_CACHE_SIZE / 2)).forEach(([key]) => {
          this.cache.delete(key);
        });
      }
      
      this.cache.set(cacheKey, translatedText);

      return {
        translatedText,
        detectedLanguage: metadata?.detectedLanguage,
        confidence: 1.0 // Google Translate doesn't provide confidence scores in v2
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
}

export const translateService = new TranslateService();