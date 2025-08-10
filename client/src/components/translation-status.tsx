import { useLanguage } from "@/contexts/LanguageContext";
import { Loader2, Globe, CheckCircle } from "lucide-react";

export function TranslationStatus() {
  const { isTranslating, currentLanguage } = useLanguage();

  if (currentLanguage.code === 'en') {
    return null;
  }

  return (
    <div className={`fixed bottom-4 right-4 bg-white shadow-lg rounded-lg p-3 border transition-all duration-300 ${
      isTranslating ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
    }`}>
      <div className="flex items-center gap-2 text-sm">
        {isTranslating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            <span className="text-gray-700">Translating to {currentLanguage.nativeName}...</span>
          </>
        ) : (
          <>
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-gray-700">Translation complete</span>
          </>
        )}
      </div>
    </div>
  );
}