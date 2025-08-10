// LibreTranslate API endpoint
const LIBRE_TRANSLATE_URL = 'https://libretranslate.de/translate';

console.log('✅ LibreTranslate configured as primary translation service');

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
      // Try LibreTranslate first, then fallback to basic dictionary
      let translatedText = await this.translateWithLibre(text, targetLanguage, sourceLanguage);
      
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
        confidence: 0.9 // High confidence for LibreTranslate
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
    if (!text.trim()) {
      return { language: 'en', confidence: 1.0 };
    }

    // Simple language detection based on common words
    const spanishWords = ['el', 'la', 'es', 'y', 'de', 'en', 'un', 'que', 'con', 'se'];
    const frenchWords = ['le', 'de', 'et', 'à', 'un', 'il', 'être', 'et', 'en', 'avoir'];
    const germanWords = ['der', 'die', 'und', 'in', 'den', 'von', 'zu', 'das', 'mit', 'sich'];

    const words = text.toLowerCase().split(/\s+/);
    let spanishScore = 0;
    let frenchScore = 0;
    let germanScore = 0;

    words.forEach(word => {
      if (spanishWords.includes(word)) spanishScore++;
      if (frenchWords.includes(word)) frenchScore++;
      if (germanWords.includes(word)) germanScore++;
    });

    if (spanishScore > frenchScore && spanishScore > germanScore) {
      return { language: 'es', confidence: 0.7 };
    }
    if (frenchScore > germanScore) {
      return { language: 'fr', confidence: 0.7 };
    }
    if (germanScore > 0) {
      return { language: 'de', confidence: 0.7 };
    }

    return { language: 'en', confidence: 1.0 };
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheSize(): number {
    return this.cache.size;
  }

  // LibreTranslate with dictionary fallback
  private async translateWithLibre(text: string, targetLanguage: string, sourceLanguage?: string): Promise<string> {
    // Try LibreTranslate.de (free without API key)
    try {
      const response = await fetch(LIBRE_TRANSLATE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
          source: sourceLanguage || 'auto',
          target: targetLanguage,
          format: 'text'
        }),
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });

      if (response.ok) {
        const result = await response.json();
        if (result.translatedText && result.translatedText !== text) {
          return result.translatedText;
        }
      }
    } catch (error) {
      console.log(`LibreTranslate failed, using dictionary fallback: ${error.message}`);
    }

    // Fallback to basic translation dictionary
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
        'Community': 'Comunidad',
        'Upload Screenshot': 'Subir captura de pantalla',
        'Tell Us What Happened': 'Cuéntanos qué pasó',
        'Upload Transcript': 'Subir transcripción',
        'Take a photo of suspicious messages on your phone or computer': 'Toma una foto de mensajes sospechosos en tu teléfono o computadora',
        'Describe what happened or leave an audio message': 'Describe lo que pasó o deja un mensaje de audio',
        'Upload or paste call transcripts from Zoom, Teams, or phone apps': 'Sube o pega transcripciones de llamadas de Zoom, Teams o aplicaciones de teléfono',
        'Phone call transcript': 'Transcripción de llamada telefónica',
        'User describes suspicious call': 'Usuario describe llamada sospechosa',
        'SSA Phone Scam': 'Estafa telefónica del SSA',
        'Translation complete': 'Traducción completa',
        '- Your trusted companion for staying safe online': '- Tu compañero de confianza para mantenerte seguro en línea'
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
        'Community': 'Communauté',
        'Upload Screenshot': 'Télécharger une capture d\'écran',
        'Tell Us What Happened': 'Dites-nous ce qui s\'est passé',
        'Upload Transcript': 'Télécharger la transcription'
      },
      'de': {
        'Hello world': 'Hallo Welt',
        'About': 'Über uns',
        'Analyze': 'Analysieren',
        'Boomer Buddy': 'Boomer Buddy',
        'Scam Trends': 'Betrugs-Trends',
        'Community': 'Gemeinschaft',
        'Upload Screenshot': 'Screenshot hochladen',
        'Tell Us What Happened': 'Erzählen Sie uns, was passiert ist',
        'Upload Transcript': 'Transkript hochladen'
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