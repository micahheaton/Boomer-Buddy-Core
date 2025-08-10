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
      scam_score: 92,
      confidence: "high" as const,
      label: "Likely scam" as const,
      explanation: "This appears to be a high-risk scam attempt. Multiple red flags are present including threats, urgency tactics, and requests for unusual payment methods. Government agencies never demand immediate payment via gift cards.",
      red_flags: [
        "Fake email domain: 'security@bankofamerica-verify.net' is not Bank of America's official domain",
        "Urgency tactics: Claims account will be suspended unless immediate action is taken",
        "Requests sensitive information: Asks for Social Security Number and account details",
        "Creates artificial deadline: 'This action expires in 24 hours'",
        "Impersonates trusted institution: Pretends to be Bank of America security team"
      ],
      top_signals: [
        "Fake email domain: 'security@bankofamerica-verify.net' is not Bank of America's official domain",
        "Urgency tactics: Claims account will be suspended unless immediate action is taken",
        "Requests sensitive information: Asks for Social Security Number and account details",
        "Creates artificial deadline: 'This action expires in 24 hours'"
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
          title: "Do Not Respond or Click Links",
          steps: [
            "Delete this email immediately",
            "Do not click any links or download attachments",
            "Do not provide personal information"
          ],
          when: "immediately"
        },
        {
          title: "Verify with Bank of America",
          steps: [
            "Call Bank of America directly at 1-800-432-1000",
            "Log into your account through the official website only",
            "Ask about any legitimate security concerns"
          ],
          when: "if concerned about your account"
        }
      ],
      legal_language: "This analysis is for educational purposes. Always verify suspicious communications through official channels. When in doubt, contact the organization directly using official contact methods.",
      contacts: {
        law_enforcement: [
          { name: "Federal Trade Commission", contact: "1-877-382-4357", type: "federal" }
        ],
        state_local: [],
        financial: [
          { name: "Bank of America Fraud Department", contact: "1-800-432-1000", type: "financial" }
        ]
      },
      version: "1.0"
    },
    techsupport: {
      scam_score: 88,
      confidence: "high" as const,
      label: "Likely scam" as const,
      explanation: "This is a classic tech support scam. Legitimate companies like Microsoft do not make unsolicited calls about computer problems, and never ask for remote access through third-party software.",
      top_signals: [
        "Unsolicited call claiming computer problems: Microsoft does not cold-call customers",
        "Requests remote access: Asking to download TeamViewer is a major red flag",
        "Creates false urgency: Claims computer will crash if not acted upon immediately",
        "Impersonates trusted company: Pretends to be Microsoft support"
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
          title: "Hang Up Immediately",
          steps: [
            "End the call right away",
            "Do not download any software",
            "Do not give remote access to your computer"
          ],
          when: "immediately"
        },
        {
          title: "Secure Your Computer",
          steps: [
            "Run a legitimate antivirus scan",
            "Update your operating system and software",
            "Change passwords if you shared any information"
          ],
          when: "after hanging up"
        },
        {
          title: "Report the Scam",
          steps: ["Report to FTC", "Warn family and friends"],
          when: "Today"
        }
      ],
      legal_language: "This analysis is for educational purposes. Always verify suspicious communications through official channels. When in doubt, contact the organization directly using official contact methods.",
      contacts: {
        law_enforcement: [
          { name: "Federal Trade Commission", contact: "1-877-382-4357", type: "federal" }
        ],
        state_local: [],
        financial: []
      },
      version: "1.0"
    },
    ssa: {
      scam_score: 95,
      confidence: "high" as const,
      label: "Likely scam" as const,
      explanation: "This appears to be a high-risk scam attempt. Multiple red flags are present including threats, urgency tactics, and requests for unusual payment methods. Government agencies never demand immediate payment via gift cards.",
      top_signals: [
        "Threatens arrest: SSA never threatens immediate arrest over phone calls",
        "Demands gift cards: Government agencies never request gift card payments",
        "Creates artificial urgency: Claims immediate action required to avoid arrest",
        "Claims SSN is suspended: Social Security numbers cannot be suspended"
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
          title: "Do Not Respond or Pay",
          steps: [
            "Hang up immediately or delete the message",
            "Do not provide any personal information",
            "Do not make any payments, especially via gift cards"
          ],
          when: "immediately"
        },
        {
          title: "Verify Through Official Channels",
          steps: [
            "Visit ssa.gov to check account status",
            "Call SSA directly at 1-800-772-1213 if needed",
            "Verify any legitimate concerns through official channels"
          ],
          when: "if concerned"
        }
      ],
      legal_language: "This analysis is for educational purposes. Always verify suspicious communications through official channels. When in doubt, contact the organization directly using official contact methods.",
      contacts: {
        law_enforcement: [
          { name: "Social Security Administration Office of Inspector General", contact: "1-800-269-0271", type: "federal" }
        ],
        state_local: [],
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
          {/* Navigation Button */}
          <div className="mb-6 text-center">
            <Button 
              onClick={handleStartOver}
              variant="outline" 
              size="lg"
              className="text-lg px-8 py-4 bg-white hover:bg-gray-50"
            >
              {viewMode === 'demo' ? 'Back to Home' : 'Analyze Another Scam'}
            </Button>
          </div>
          
          {/* Show Original Content for Demos */}
          {viewMode === 'demo' && (
            <section className="bg-gray-50 rounded-xl border-2 border-gray-200 p-6 mb-8">
              <h3 className="text-xl font-semibold mb-4 text-gray-800">Original Content Being Analyzed:</h3>
              <div className="bg-white rounded-lg p-4 border">
                {analysisId?.includes('phishing') && (
                  <div className="space-y-3">
                    <div className="text-sm text-gray-600">Email Screenshot Analysis:</div>
                    <div className="bg-red-50 border border-red-200 rounded p-3">
                      <div className="font-semibold text-red-800">From: security@bankofamerica-verify.net</div>
                      <div className="font-semibold text-red-800">Subject: URGENT: Account Security Alert - Action Required</div>
                      <div className="mt-2 text-red-700">
                        Dear Customer,<br/><br/>
                        We have detected suspicious activity on your Bank of America account. Your account will be temporarily suspended unless you verify your information immediately.<br/><br/>
                        Click here to secure your account: [VERIFY NOW]<br/><br/>
                        You must provide your Social Security Number and account details to prevent closure.<br/><br/>
                        This action expires in 24 hours.<br/><br/>
                        Bank of America Security Team
                      </div>
                    </div>
                  </div>
                )}
                
                {analysisId?.includes('techsupport') && (
                  <div className="space-y-3">
                    <div className="text-sm text-gray-600">User Description:</div>
                    <div className="bg-orange-50 border border-orange-200 rounded p-3 text-orange-800">
                      "Someone just called me saying they're from Microsoft and my computer has viruses. They said I need to download TeamViewer so they can fix it remotely. The caller had a strong accent and was very insistent that I needed to act immediately or my computer would crash. They said they detected malicious activity from my IP address. Should I trust them and download the software they're asking for?"
                    </div>
                  </div>
                )}
                
                {analysisId?.includes('ssa') && (
                  <div className="space-y-3">
                    <div className="text-sm text-gray-600">Phone Call Transcript:</div>
                    <div className="bg-amber-50 border border-amber-200 rounded p-3 text-amber-800">
                      <div className="font-mono text-sm">
                        <div><strong>Caller:</strong> This is Agent Johnson from the Social Security Administration. Your social security number has been suspended due to suspicious activity.</div><br/>
                        <div><strong>Me:</strong> What kind of suspicious activity?</div><br/>
                        <div><strong>Caller:</strong> There are several fraudulent charges and bank accounts linked to your SSN. We need to clear this immediately or we'll have to issue a warrant for your arrest.</div><br/>
                        <div><strong>Me:</strong> That sounds serious. What do I need to do?</div><br/>
                        <div><strong>Caller:</strong> First, confirm your social security number so I can access your file. Then you'll need to purchase gift cards to pay the clearance fee to unlock your account. Do not hang up or tell anyone about this call.</div><br/>
                        <div><strong>Me:</strong> [Hung up - seemed suspicious]</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

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
