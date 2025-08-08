import { useState } from "react";
import { Shield, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import InputSelector from "@/components/input-selector";
import UploadForm from "@/components/upload-form";
import TextForm from "@/components/text-form";
import TranscriptForm from "@/components/transcript-form";
import ResultsDisplay from "@/components/results-display";
import type { ScamAnalysisResult } from "@/types/scam-analysis";

export default function Home() {
  const [selectedInputType, setSelectedInputType] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<ScamAnalysisResult | null>(null);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAnalysisComplete = (result: ScamAnalysisResult, id: string) => {
    setAnalysisResult(result);
    setAnalysisId(id);
    setIsLoading(false);
  };

  const handleStartOver = () => {
    setSelectedInputType(null);
    setAnalysisResult(null);
    setAnalysisId(null);
    setIsLoading(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (analysisResult) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center">
                  <Shield className="text-white w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Fraud & Scam Shield</h1>
                  <p className="text-gray-600 text-lg">Protect yourself from online scams</p>
                </div>
              </div>
              <Button 
                variant="default" 
                size="lg"
                className="bg-blue-700 hover:bg-blue-800 text-lg px-6 py-3"
              >
                <History className="w-5 h-5 mr-2" />
                My Reports
              </Button>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-6 py-8">
          <ResultsDisplay 
            result={analysisResult} 
            analysisId={analysisId!}
            onStartOver={handleStartOver}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center">
                <Shield className="text-white w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Fraud & Scam Shield</h1>
                <p className="text-gray-600 text-lg">Protect yourself from online scams</p>
              </div>
            </div>
            <Button 
              variant="default" 
              size="lg"
              className="bg-blue-700 hover:bg-blue-800 text-lg px-6 py-3"
            >
              <History className="w-5 h-5 mr-2" />
              My Reports
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <section className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Is this message safe?</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Upload a screenshot, paste suspicious text, or share a phone call transcript. 
            We'll analyze it for scam patterns and give you clear next steps.
          </p>
        </section>

        {!selectedInputType && (
          <InputSelector onSelectType={setSelectedInputType} />
        )}

        {selectedInputType === "upload" && (
          <UploadForm 
            onAnalysisComplete={handleAnalysisComplete}
            onLoading={setIsLoading}
            isLoading={isLoading}
          />
        )}

        {selectedInputType === "text" && (
          <TextForm 
            onAnalysisComplete={handleAnalysisComplete}
            onLoading={setIsLoading}
            isLoading={isLoading}
          />
        )}

        {selectedInputType === "transcript" && (
          <TranscriptForm 
            onAnalysisComplete={handleAnalysisComplete}
            onLoading={setIsLoading}
            isLoading={isLoading}
          />
        )}

        {isLoading && (
          <section className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="animate-spin w-16 h-16 border-4 border-blue-700 border-t-transparent rounded-full mx-auto mb-6"></div>
            <h3 className="text-2xl font-semibold mb-4">Analyzing Content...</h3>
            <p className="text-lg text-gray-600">We're checking for scam patterns and preparing your report.</p>
          </section>
        )}

        {selectedInputType && (
          <section className="text-center mt-12">
            <Button 
              variant="outline" 
              size="lg"
              onClick={handleStartOver}
              className="text-lg px-8 py-4"
            >
              <Shield className="w-5 h-5 mr-3" />
              Analyze Another Message
            </Button>
          </section>
        )}
      </main>

      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="text-center text-gray-600">
            <p className="text-lg mb-4">
              Fraud & Scam Shield helps seniors identify and respond to online scams.
            </p>
            <div className="flex justify-center space-x-8 text-lg">
              <a href="#" className="hover:text-blue-700 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-blue-700 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-blue-700 transition-colors">Contact Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
