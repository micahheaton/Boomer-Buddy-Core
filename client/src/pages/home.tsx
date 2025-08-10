import { useState } from "react";
import { Shield, History, Play, FileText, Phone, Camera, Keyboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Logo from "@/components/logo";
import InputSelector from "@/components/input-selector";
import UploadForm from "@/components/upload-form";
import TextForm from "@/components/text-form";
import TranscriptForm from "@/components/transcript-form";
import ResultsDisplay from "@/components/results-display";
import type { ScamAnalysisResult } from "@/types/scam-analysis";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";

export default function Home() {
  const [selectedInputType, setSelectedInputType] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<ScamAnalysisResult | null>(null);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'demo' | 'report' | null>(null);

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
    setViewMode(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const { toast } = useToast();

  // Demo data - canned responses that don't call the API
  const demoResults = {
    phishing: {
      scam_score: 9,
      confidence: "high" as const,
      label: "Likely scam" as const,
      explanation: "This email exhibits multiple classic phishing indicators including urgent language, suspicious sender domain, requests for personal information, and mismatched branding elements.",
      red_flags: [
        "Suspicious sender domain: 'security@bankofamerica-verify.net' is not an official Bank of America domain",
        "Urgent language demanding immediate action",
        "Requests for social security number and account details",
        "Generic greeting without personalization",
        "Threatens account closure to create pressure"
      ],
      top_signals: [
        "Suspicious sender domain",
        "Urgent language",
        "Requests personal information",
        "Threatens account closure"
      ],
      next_steps: [
        "DO NOT click any links in this email",
        "Do not provide any personal information",
        "Contact Bank of America directly using the phone number on your official bank card",
        "Report this phishing attempt to reportphishing@banksecurity.com",
        "Forward this email to the Anti-Phishing Working Group at reportphishing@apwg.org"
      ],
      recommended_actions: [
        {
          title: "Immediate Actions",
          steps: ["Do not click any links", "Do not provide personal information"],
          when: "Right now"
        },
        {
          title: "Contact Your Bank",
          steps: ["Call the number on your bank card", "Verify if communication is legitimate"],
          when: "Within 1 hour"
        },
        {
          title: "Report the Scam",
          steps: ["Forward email to reportphishing@apwg.org", "Report to FBI IC3"],
          when: "Today"
        }
      ],
      legal_language: "This appears to be a phishing attempt designed to steal personal and financial information. Engaging with this communication could result in identity theft or financial fraud.",
      contacts: {
        law_enforcement: [
          { name: "FBI Internet Crime Complaint Center", contact: "1-800-CALL-FBI", type: "Federal" }
        ],
        state_local: [
          { name: "California Attorney General - Consumer Protection", contact: "1-800-952-5225", state: "CA" }
        ],
        financial: [
          { name: "Bank of America Fraud Hotline", contact: "1-800-432-1000" }
        ]
      },
      version: "1.0"
    },
    techsupport: {
      scam_score: 8,
      confidence: "high" as const,
      label: "Likely scam" as const,
      explanation: "This is a classic tech support scam. Microsoft never makes unsolicited calls about computer viruses and legitimate companies don't ask you to download remote access software.",
      top_signals: [
        "Unsolicited call from tech company",
        "Claims computer has viruses",
        "Requests to download software",
        "Creates urgency and fear"
      ],
      next_steps: [
        "Hang up immediately - this is 100% a scam",
        "Do not download any software they recommend",
        "Run a legitimate antivirus scan if concerned about your computer",
        "Report this to Microsoft's scam reporting website",
        "Warn friends and family about this common scam"
      ],
      recommended_actions: [
        {
          title: "Immediate Actions",
          steps: ["Hang up immediately", "Do not download any software"],
          when: "Right now"
        },
        {
          title: "Verify Computer Security",
          steps: ["Run legitimate antivirus scan", "Check with local tech support"],
          when: "Today"
        },
        {
          title: "Report the Scam",
          steps: ["Report to FTC", "Warn family and friends"],
          when: "Today"
        }
      ],
      legal_language: "This appears to be a tech support scam designed to gain remote access to your computer and steal personal information or install malware.",
      contacts: {
        law_enforcement: [
          { name: "FTC Consumer Sentinel", contact: "1-877-FTC-HELP", type: "Federal" },
          { name: "FBI Internet Crime Complaint Center", contact: "1-800-CALL-FBI", type: "Federal" }
        ],
        state_local: [],
        financial: []
      },
      version: "1.0"
    },
    ssa: {
      scam_score: 10,
      confidence: "high" as const,
      label: "Likely scam" as const,
      explanation: "This is definitely a Social Security Administration impersonation scam. The SSA never threatens arrest or demands gift cards. All the tactics used are classic scam indicators.",
      top_signals: [
        "Threatens arrest",
        "Demands gift cards",
        "Creates artificial urgency",
        "Claims SSN is suspended",
        "Requests personal information"
      ],
      next_steps: [
        "You were right to hang up - this was 100% a scam",
        "The Social Security Administration will never call to threaten you",
        "If concerned about your SSA account, visit ssa.gov or call the official number",
        "Report this scam to the SSA Office of Inspector General",
        "Consider placing a fraud alert on your credit reports"
      ],
      recommended_actions: [
        {
          title: "Immediate Actions",
          steps: ["Do not call them back", "Do not provide any information"],
          when: "Right now"
        },
        {
          title: "Verify SSA Account",
          steps: ["Visit ssa.gov", "Call official SSA number if needed"],
          when: "Today"
        },
        {
          title: "Report the Scam",
          steps: ["Report to SSA Inspector General", "File report with FTC"],
          when: "Today"
        }
      ],
      legal_language: "This is a government impersonation scam. The Social Security Administration does not make unsolicited calls threatening legal action or demanding payment.",
      contacts: {
        law_enforcement: [
          { name: "SSA Office of Inspector General", contact: "1-800-269-0271", type: "Federal" },
          { name: "FTC Consumer Sentinel", contact: "1-877-FTC-HELP", type: "Federal" }
        ],
        state_local: [
          { name: "Florida Attorney General", contact: "1-866-966-7226", state: "FL" }
        ],
        financial: []
      },
      version: "1.0"
    }
  };

  const showDemoResult = (demoType: 'phishing' | 'techsupport' | 'ssa') => {
    const result = demoResults[demoType];
    setAnalysisResult(result);
    setAnalysisId(`demo-${demoType}-${Date.now()}`);
    setViewMode('demo');
  };
  
  const demoMutation = useMutation({
    mutationFn: async (demoData: any) => {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(demoData),
      });
      if (!response.ok) {
        throw new Error("Analysis failed");
      }
      return await response.json();
    },
    onSuccess: (data) => {
      setAnalysisResult(data.result);
      setAnalysisId(data.analysisId);
      setIsLoading(false);
    },
    onError: (error: any) => {
      console.error("Demo analysis failed:", error);
      toast({
        title: "Analysis Failed",
        description: "Unable to analyze the demo content. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    },
  });

  const runDemo = (demoData: any, title: string) => {
    setIsLoading(true);
    toast({
      title: "Running Demo",
      description: `Analyzing: ${title}`,
    });
    demoMutation.mutate(demoData);
  };

  if (analysisResult) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <Logo size="md" />
              <Button 
                variant="default" 
                size="lg"
                className="bg-boomer-navy hover:bg-boomer-teal text-lg px-6 py-3"
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
            <Logo size="md" />
            <Button 
              variant="default" 
              size="lg"
              className="bg-boomer-navy hover:bg-boomer-teal text-lg px-6 py-3"
            >
              <History className="w-5 h-5 mr-2" />
              My Reports
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <section className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 text-boomer-navy">Is this message safe?</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Upload a screenshot, paste suspicious text, or share a phone call transcript. 
            We'll analyze it for scam patterns and give you clear next steps.
          </p>
        </section>

        {!selectedInputType && !viewMode && (
          <>
            {/* Demo Scams Section */}
            <section className="mb-12">
              <Card className="bg-gradient-to-r from-boomer-light-navy to-boomer-light-teal border-2 border-boomer-teal">
                <CardHeader className="text-center">
                  <CardTitle className="text-3xl text-boomer-navy mb-4">
                    <Play className="w-8 h-8 mx-auto mb-3" />
                    See Demo Scams
                  </CardTitle>
                  <CardDescription className="text-lg text-gray-700">
                    View examples of common scams and see how our analysis works
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6">
                    {/* Email Phishing Demo */}
                    <div className="bg-white rounded-lg p-6 shadow-md">
                      <div className="text-center mb-4">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Camera className="text-red-600 w-6 h-6" />
                        </div>
                        <h4 className="font-semibold text-lg text-red-600">Fake Bank Email</h4>
                        <p className="text-sm text-gray-600">Screenshot of phishing email</p>
                      </div>
                      <Button 
                        onClick={() => showDemoResult('phishing')}
                        className="w-full bg-red-600 hover:bg-red-700"
                      >
                        View Demo Report
                      </Button>
                    </div>

                    {/* Tech Support Scam Demo */}
                    <div className="bg-white rounded-lg p-6 shadow-md">
                      <div className="text-center mb-4">
                        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Keyboard className="text-orange-600 w-6 h-6" />
                        </div>
                        <h4 className="font-semibold text-lg text-orange-600">Tech Support Call</h4>
                        <p className="text-sm text-gray-600">User describes suspicious call</p>
                      </div>
                      <Button 
                        onClick={() => showDemoResult('techsupport')}
                        className="w-full bg-orange-600 hover:bg-orange-700"
                      >
                        View Demo Report
                      </Button>
                    </div>

                    {/* Social Security Scam Demo */}
                    <div className="bg-white rounded-lg p-6 shadow-md">
                      <div className="text-center mb-4">
                        <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Phone className="text-amber-600 w-6 h-6" />
                        </div>
                        <h4 className="font-semibold text-lg text-amber-600">SSA Phone Scam</h4>
                        <p className="text-sm text-gray-600">Phone call transcript</p>
                      </div>
                      <Button 
                        onClick={() => showDemoResult('ssa')}
                        className="w-full bg-amber-600 hover:bg-amber-700"
                      >
                        View Demo Report
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Report Scam Section */}
            <section className="mb-12">
              <Card className="bg-white border-2 border-boomer-navy">
                <CardHeader className="text-center">
                  <CardTitle className="text-3xl text-boomer-navy mb-4">
                    <Shield className="w-8 h-8 mx-auto mb-3" />
                    Report a Scam
                  </CardTitle>
                  <CardDescription className="text-lg text-gray-600">
                    Get real-time analysis of suspicious messages, calls, or emails
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6">
                    {/* Upload Screenshot */}
                    <div 
                      className="bg-white rounded-xl shadow-md border-2 border-gray-200 hover:border-boomer-navy transition-colors cursor-pointer p-6"
                      onClick={() => setSelectedInputType('upload')}
                    >
                      <div className="text-center">
                        <div className="w-16 h-16 bg-boomer-light-navy rounded-full flex items-center justify-center mx-auto mb-4">
                          <Camera className="text-boomer-navy w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Upload Screenshot</h3>
                        <p className="text-gray-600 text-lg">Take a photo of suspicious messages on your phone or computer</p>
                      </div>
                    </div>

                    {/* Tell Us What Happened */}
                    <div 
                      className="bg-white rounded-xl shadow-md border-2 border-gray-200 hover:border-boomer-teal transition-colors cursor-pointer p-6"
                      onClick={() => setSelectedInputType('text')}
                    >
                      <div className="text-center">
                        <div className="w-16 h-16 bg-boomer-light-teal rounded-full flex items-center justify-center mx-auto mb-4">
                          <Keyboard className="text-boomer-teal w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Tell Us What Happened</h3>
                        <p className="text-gray-600 text-lg">Describe what happened or leave an audio message</p>
                      </div>
                    </div>

                    {/* Upload Transcript */}
                    <div 
                      className="bg-white rounded-xl shadow-md border-2 border-gray-200 hover:border-boomer-orange transition-colors cursor-pointer p-6"
                      onClick={() => setSelectedInputType('transcript')}
                    >
                      <div className="text-center">
                        <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Phone className="text-boomer-orange w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Upload Transcript</h3>
                        <p className="text-gray-600 text-lg">Upload or paste call transcripts from Zoom, Teams, or phone apps</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>
          </>
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
            <div className="animate-spin w-16 h-16 border-4 border-boomer-navy border-t-transparent rounded-full mx-auto mb-6"></div>
            <h3 className="text-2xl font-semibold mb-4 text-boomer-navy">Analyzing Content...</h3>
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
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <Logo size="sm" showText={false} />
            </div>
            <p className="text-lg mb-4 text-gray-600">
              <span className="font-semibold text-boomer-navy">Boomer Buddy</span> - Your trusted companion for staying safe online
            </p>
            <div className="flex justify-center space-x-8 text-lg">
              <a href="#" className="hover:text-boomer-teal transition-colors text-gray-600">Privacy Policy</a>
              <a href="#" className="hover:text-boomer-teal transition-colors text-gray-600">Terms of Service</a>
              <a href="#" className="hover:text-boomer-teal transition-colors text-gray-600">Contact Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
