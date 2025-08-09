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

  const { toast } = useToast();
  
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

        {!selectedInputType && (
          <>
            {/* Demo Examples Section */}
            <section className="mb-12">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-boomer-navy mb-3">See How It Works</h2>
                <p className="text-lg text-gray-600">Try these examples to understand how each option helps protect you</p>
              </div>
              
              <div className="grid lg:grid-cols-3 gap-6 mb-8">
                {/* Screenshot Upload Demo */}
                <Card className="bg-white border-2 border-boomer-light-navy">
                  <CardHeader className="text-center">
                    <div className="w-12 h-12 bg-boomer-light-navy rounded-full flex items-center justify-center mx-auto mb-3">
                      <Camera className="text-boomer-navy w-6 h-6" />
                    </div>
                    <CardTitle className="text-xl text-boomer-navy">Upload Screenshot</CardTitle>
                    <CardDescription className="text-base">
                      Take a photo of suspicious messages on your phone or computer
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                      <p className="text-sm text-gray-600 mb-2"><strong>Example:</strong></p>
                      <p className="text-sm italic">
                        "I got a text saying my bank account will be closed. It has a link to click. 
                        I took a screenshot - can you check if this is real?"
                      </p>
                    </div>
                    <Button 
                      onClick={() => setSelectedInputType('upload')}
                      className="w-full bg-boomer-navy hover:bg-boomer-teal"
                    >
                      Try Upload Demo
                    </Button>
                  </CardContent>
                </Card>

                {/* Tell Us What Happened Demo */}
                <Card className="bg-white border-2 border-boomer-light-teal">
                  <CardHeader className="text-center">
                    <div className="w-12 h-12 bg-boomer-light-teal rounded-full flex items-center justify-center mx-auto mb-3">
                      <Keyboard className="text-boomer-teal w-6 h-6" />
                    </div>
                    <CardTitle className="text-xl text-boomer-teal">Tell Us What Happened</CardTitle>
                    <CardDescription className="text-base">
                      Describe suspicious emails, texts, or experiences in your own words
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                      <p className="text-sm text-gray-600 mb-2"><strong>Example:</strong></p>
                      <p className="text-sm italic">
                        "Someone called saying they're from Microsoft and my computer has viruses. 
                        They want me to download software to fix it. Should I trust them?"
                      </p>
                    </div>
                    <Button 
                      onClick={() => runDemo({
                        inputType: "text",
                        text: "I received an email from what looks like my bank asking me to verify my account information. The email says there's been suspicious activity and I need to click a link to secure my account. The sender shows as 'security@bankofamerica-verify.net' and it's asking for my social security number and account details. The email looks official with the bank logo but something feels off about it. Should I be worried?",
                        state: "CA",
                        phoneNumber: "",
                        emailFrom: "security@bankofamerica-verify.net",
                        channel: "email"
                      }, "Suspicious Bank Email")}
                      disabled={isLoading}
                      className="w-full bg-boomer-teal hover:bg-boomer-navy"
                    >
                      Try Text Demo
                    </Button>
                  </CardContent>
                </Card>

                {/* Phone Transcript Demo */}
                <Card className="bg-white border-2 border-orange-200">
                  <CardHeader className="text-center">
                    <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Phone className="text-boomer-orange w-6 h-6" />
                    </div>
                    <CardTitle className="text-xl text-boomer-orange">Phone Transcript</CardTitle>
                    <CardDescription className="text-base">
                      Copy call transcripts from Zoom, Teams, or phone apps
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                      <p className="text-sm text-gray-600 mb-2"><strong>Example:</strong></p>
                      <p className="text-sm italic">
                        "Caller: This is Social Security Administration. Your number has been suspended 
                        due to suspicious activity..."
                      </p>
                    </div>
                    <Button 
                      onClick={() => runDemo({
                        inputType: "text",
                        text: "Transcript from suspicious call:\n\nCaller: Hello, this is Agent Johnson from the Social Security Administration. Your social security number has been suspended due to suspicious activity. We need to verify your identity immediately to prevent your benefits from being permanently cancelled.\n\nMe: What kind of suspicious activity?\n\nCaller: There are several charges and bank accounts linked to your social security number that we need to clear. For security, I need you to confirm your social security number so I can access your file.\n\nMe: I don't feel comfortable giving that over the phone.\n\nCaller: Ma'am, if you don't cooperate, we will have to issue a warrant for your arrest. This is very serious. You need to stay on the line while we resolve this matter. Do not hang up or contact anyone else about this call.\n\nMe: That sounds scary. What do I need to do?\n\nCaller: First, I need your social security number to pull up your case. Then you'll need to purchase gift cards to pay the clearance fee to unlock your account.\n\nNote: I hung up at this point because it seemed suspicious.",
                        state: "FL",
                        phoneNumber: "8005551234",
                        emailFrom: "",
                        channel: "phone"
                      }, "Social Security Scam Call")}
                      disabled={isLoading}
                      className="w-full bg-boomer-orange hover:bg-red-600"
                    >
                      Try Transcript Demo
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </section>

            <InputSelector onSelectType={setSelectedInputType} />
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
