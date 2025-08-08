import { useState } from "react";
import { Shield, History, Play, FileText, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
          <>
            {/* Demo Section */}
            <section className="mb-12">
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-2xl text-blue-900 flex items-center">
                    <Play className="w-6 h-6 mr-2" />
                    Try Demo Examples
                  </CardTitle>
                  <CardDescription className="text-lg text-blue-700">
                    Test the scam detection with real examples from our database
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-semibold text-lg flex items-center">
                        <Phone className="w-5 h-5 mr-2 text-red-600" />
                        Phone Scam (High Risk)
                      </h4>
                      <p className="text-gray-600">
                        Treasury Department impersonation scam demanding gift cards for "tax reconciliation"
                      </p>
                      <Button 
                        onClick={() => runDemo({
                          inputType: "text",
                          text: "Header\nChannel: Phone\nCaller ID shown: Treasury Dept Main 202 555 0142\nState: WA\nRecipient age: 71\nContext: Recipient received a voicemail about a tax review and called back\n\nTranscript\n00:00 Caller: Thank you for returning the call. This is David Martin with the Treasury review team. I see your file. Before we begin, do not discuss this call with anyone while the review is open. Do you understand\n00:10 Recipient: I think so. What is this about\n00:12 Caller: We completed an automated reconciliation of your 2021 through 2023 filings. There is a mismatch tied to a stimulus credit. The system shows a pending federal action if we cannot verify payment today\n00:25 Recipient: That is scary. I thought I paid everything\n00:28 Caller: I know this is frustrating. I am here to help you avoid escalation. I will give you a reference number. Are you ready\n00:34 Recipient: Yes\n00:35 Caller: Case number T R seven three nine five six. Repeat that back please\n00:41 Recipient: T R seven three nine five six\n00:43 Caller: Correct. I need to confirm the last four of your Social for identity. Please state only the last four\n00:49 Recipient: I do not feel comfortable. Can you tell me something from your side\n00:53 Caller: I understand. For security I can only see the last two of your number. It ends in three six. That matches our records. Now the last four please so I can stop the enforcement clock\n01:04 Recipient: I cannot give that. Can I call the main number for the IRS\n01:08 Caller: If you hang up the system will flag the case as non responsive. That will place a hold on your bank account for seventy two hours. I can resolve this now. We accept same day verification through certified vouchers. You will pick up government vouchers at a participating retailer and read me the codes. This clears the mismatch immediately\n01:26 Recipient: Vouchers. Like gift cards\n01:29 Caller: They are government certified cards carried by stores like Target and Walgreens. The code proves identity for this review. You must keep this private. If a cashier asks, say this is for a family purchase, not for taxes. That prevents fraud at the store level\n01:44 Recipient: This sounds odd. Can I pay on IRS dot gov\n01:48 Caller: Online payments post in three to five business days. Your file will lock today at 3 pm Pacific. If you complete the voucher verification in the next thirty minutes, the system cancels the hold. I will stay on the line to assist\n02:02 Recipient: How much is the voucher\n02:04 Caller: The reconciliation shows one thousand four hundred and eighty six dollars and twenty two cents. The system can accept two vouchers of seven hundred fifty dollars. I can split it for you\n02:14 Recipient: I do not have that money\n02:16 Caller: I understand. We can place a partial compliance note with one voucher today and a second tomorrow. If we do not post a code today, the case moves to the sheriff for a civil notice. I want to keep this private for you\n02:29 Recipient: You said sheriff\n02:31 Caller: Only a notification visit. No one wants that. Let us do the first voucher now. Do you have a car\n02:37 Recipient: I am not giving you any codes. I will call my daughter and my bank\n02:41 Caller: If you tell anyone about this open review the case will lock. I am noting refusal to comply. You will receive the visit within seventy two hours. Good day\n02:51 Recipient: I am hanging up now\n\nOutcome note\nRecipient hung up and called daughter. No payment made. Saved the case number and caller ID",
                          state: "WA",
                          phoneNumber: "2025550142",
                          emailFrom: "",
                          channel: "phone"
                        }, "Treasury Department Tax Scam")}
                        disabled={isLoading}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        Analyze Treasury Scam
                      </Button>
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="font-semibold text-lg flex items-center">
                        <FileText className="w-5 h-5 mr-2 text-green-600" />
                        Legitimate Call (Low Risk)
                      </h4>
                      <p className="text-gray-600">
                        Real utility company payment reminder with proper verification methods
                      </p>
                      <Button 
                        onClick={() => runDemo({
                          inputType: "text",
                          text: "Header\nChannel: Phone\nCaller ID shown: City Utilities Billing 425 555 0199\nState: WA\nContext: Routine payment reminder. Caller offers standard payment channels and no urgency tricks\n\nTranscript\n00:00 Caller: Hello, this is City Utilities with a reminder that your water bill for account ending one two three is due on the fifteenth. You can pay on our website, by mail, or at our service center. We will never ask for gift cards\n00:15 Recipient: Thank you. What is the amount due\n00:17 Caller: Forty two dollars and ten cents. You can visit cityutilities.example slash pay or mail a check to the address on your statement\n00:26 Recipient: I will pay on the website\n00:28 Caller: Thank you. Have a nice day\n\nOutcome note\nNo payment taken on the call. Clear website reference and normal options",
                          state: "WA",
                          phoneNumber: "4255550199",
                          emailFrom: "",
                          channel: "phone"
                        }, "Legitimate Utility Call")}
                        disabled={isLoading}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        Analyze Utility Call
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
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
