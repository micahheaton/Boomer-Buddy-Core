import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: 'US' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: 'ES' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: 'FR' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: 'DE' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: 'IT' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: 'PT' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: 'RU' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: 'CN' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: 'JP' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: 'KR' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: 'SA' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी', flag: 'IN' },
];

interface LanguageContextType {
  currentLanguage: Language;
  setLanguage: (language: Language) => void;
  translate: (text: string, options?: TranslateOptions) => Promise<string>;
  translateElement: (element: HTMLElement) => void;
  isTranslating: boolean;
}

interface TranslateOptions {
  context?: string;
  priority?: 'high' | 'normal' | 'low';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Cache for translations to avoid repeated API calls
const translationCache = new Map<string, string>();

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(SUPPORTED_LANGUAGES[0]);
  const [isTranslating, setIsTranslating] = useState(false);

  // Load saved language on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('boomer-buddy-language');
    if (savedLanguage) {
      const language = SUPPORTED_LANGUAGES.find(lang => lang.code === savedLanguage);
      if (language) {
        setCurrentLanguage(language);
      }
    }
  }, []);

  // Auto-translate page content when language changes
  useEffect(() => {
    if (currentLanguage.code !== 'en') {
      translatePageContent();
    }
  }, [currentLanguage]);

  const setLanguage = (language: Language) => {
    setCurrentLanguage(language);
    localStorage.setItem('boomer-buddy-language', language.code);
  };

  const translate = async (text: string, options: TranslateOptions = {}): Promise<string> => {
    if (currentLanguage.code === 'en' || !text.trim()) {
      return text;
    }

    const cacheKey = `${text}:${currentLanguage.code}`;
    if (translationCache.has(cacheKey)) {
      return translationCache.get(cacheKey)!;
    }

    try {
      setIsTranslating(true);
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          targetLanguage: currentLanguage.code,
          context: options.context,
        }),
      });

      if (!response.ok) {
        throw new Error('Translation failed');
      }

      const result = await response.json();
      const translatedText = result.translatedText;
      
      translationCache.set(cacheKey, translatedText);
      return translatedText;
    } catch (error) {
      console.error('Translation error:', error);
      return text; // Return original text on error
    } finally {
      setIsTranslating(false);
    }
  };

  const translateElement = async (element: HTMLElement) => {
    if (currentLanguage.code === 'en') return;

    const textNodes = getTextNodes(element);
    
    for (const node of textNodes) {
      const originalText = node.textContent?.trim();
      if (originalText && originalText.length > 1) {
        try {
          const translatedText = await translate(originalText);
          if (translatedText !== originalText) {
            node.textContent = translatedText;
          }
        } catch (error) {
          console.error('Element translation error:', error);
        }
      }
    }
  };

  const translatePageContent = async () => {
    if (currentLanguage.code === 'en') return;

    const elementsToTranslate = document.querySelectorAll(
      'h1, h2, h3, h4, h5, h6, p, span, button, label, [data-translate="true"]'
    );

    setIsTranslating(true);
    
    const translatePromises = Array.from(elementsToTranslate).map(async (element) => {
      const htmlElement = element as HTMLElement;
      
      // Skip elements that should not be translated
      if (htmlElement.closest('[data-no-translate="true"]') || 
          htmlElement.hasAttribute('data-no-translate') ||
          htmlElement.closest('script') ||
          htmlElement.closest('style') ||
          htmlElement.closest('code') ||
          htmlElement.closest('pre')) {
        return;
      }

      await translateElement(htmlElement);
    });

    try {
      await Promise.all(translatePromises);
    } catch (error) {
      console.error('Page translation error:', error);
    } finally {
      setIsTranslating(false);
    }
  };

  const getTextNodes = (element: HTMLElement): Text[] => {
    const textNodes: Text[] = [];
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          
          // Skip script, style, code elements
          if (['SCRIPT', 'STYLE', 'CODE', 'PRE'].includes(parent.tagName)) {
            return NodeFilter.FILTER_REJECT;
          }
          
          // Skip empty or whitespace-only text
          if (!node.textContent?.trim()) {
            return NodeFilter.FILTER_REJECT;
          }
          
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node as Text);
    }
    
    return textNodes;
  };

  return (
    <LanguageContext.Provider value={{
      currentLanguage,
      setLanguage,
      translate,
      translateElement,
      isTranslating,
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}