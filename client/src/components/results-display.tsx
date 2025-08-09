import RiskScore from "./risk-score";
import ActionList from "./action-list";
import ContactList from "./contact-list";
import Logo from "./logo";
import { Button } from "@/components/ui/button";
import { Save, Copy, RotateCcw } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { ScamAnalysisResult } from "@/types/scam-analysis";

interface ResultsDisplayProps {
  result: ScamAnalysisResult;
  analysisId: string;
  onStartOver: () => void;
  hideStartOver?: boolean;
}

export default function ResultsDisplay({ result, analysisId, onStartOver, hideStartOver }: ResultsDisplayProps) {
  const [showShareLink, setShowShareLink] = useState(false);
  const { toast } = useToast();

  const shareLink = `${window.location.origin}/report/${analysisId}`;

  const handleSaveReport = () => {
    setShowShareLink(true);
    toast({
      title: "Report saved",
      description: "Your analysis has been saved and can be shared.",
    });
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      toast({
        title: "Link copied",
        description: "The report link has been copied to your clipboard.",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy link to clipboard.",
        variant: "destructive",
      });
    }
  };

  return (
    <section>
      {/* Risk Score Display */}
      <RiskScore result={result} />

      {/* Warning Signals */}
      {result.top_signals && result.top_signals.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-8 mb-8">
          <h3 className="text-2xl font-semibold mb-6 flex items-center">
            <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center mr-3">
              <span className="text-amber-600 text-lg">⚠</span>
            </div>
            Warning Signs Detected
          </h3>
          {result.top_signals.map((signal, index) => (
            <div key={index} className="bg-yellow-50 border border-amber-200 rounded-lg p-4 mb-3">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-white text-sm">!</span>
                </div>
                <span className="text-lg">{signal}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recommended Actions */}
      <ActionList actions={result.recommended_actions} />

      {/* Important Contacts */}
      <ContactList contacts={result.contacts} />

      {/* Legal Disclaimer */}
      <div className="bg-gray-50 border border-gray-300 rounded-lg p-6 mb-8">
        <div className="flex items-start space-x-3">
          <div className="w-6 h-6 bg-boomer-light-navy rounded-full flex items-center justify-center mt-0.5">
            <span className="text-boomer-navy text-sm">i</span>
          </div>
          <div>
            <h4 className="font-semibold text-lg mb-2">Important Disclaimer</h4>
            <p className="text-gray-600 text-lg">
              {result.legal_language}
            </p>
          </div>
        </div>
      </div>

      {/* Save Report */}
      <div className="bg-white rounded-xl shadow-md p-8 text-center mb-8">
        <h3 className="text-2xl font-semibold mb-4">Save This Report</h3>
        <p className="text-lg text-gray-600 mb-6">Save this analysis to refer back to later or share with family members.</p>
        <div className="space-y-4">
          <Button 
            onClick={handleSaveReport}
            size="lg"
            className="bg-boomer-navy hover:bg-boomer-teal text-lg px-8 py-4 w-full md:w-auto"
          >
            <Save className="w-5 h-5 mr-3" />
            Save Report
          </Button>
          
          {showShareLink && (
            <div className="bg-boomer-light-teal border border-boomer-teal rounded-lg p-4 mt-4">
              <p className="text-boomer-navy font-semibold mb-2">Report Saved Successfully!</p>
              <div className="flex items-center space-x-2">
                <input 
                  type="text" 
                  value={shareLink} 
                  readOnly 
                  className="flex-1 p-3 border border-boomer-teal rounded-lg text-lg bg-white"
                />
                <Button 
                  onClick={handleCopyLink}
                  variant="outline"
                  size="lg"
                  className="border-boomer-teal text-boomer-navy hover:bg-boomer-light-teal"
                >
                  <Copy className="w-5 h-5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Start Over */}
      {!hideStartOver && (
        <div className="text-center">
          <Button 
            onClick={onStartOver}
            variant="outline"
            size="lg"
            className="text-lg px-8 py-4"
          >
            <RotateCcw className="w-5 h-5 mr-3" />
            Analyze Another Message
          </Button>
        </div>
      )}
    </section>
  );
}
