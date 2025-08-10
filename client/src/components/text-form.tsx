import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { analyzeContent } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import VoiceRecorder from "./voice-recorder";
import type { ScamAnalysisResult } from "@/types/scam-analysis";

interface TextFormProps {
  onAnalysisComplete: (result: ScamAnalysisResult, id: string) => void;
  onLoading: (loading: boolean) => void;
  isLoading: boolean;
}

export default function TextForm({ onAnalysisComplete, onLoading, isLoading }: TextFormProps) {
  const [text, setText] = useState("");
  const [state, setState] = useState("");
  const [channel, setChannel] = useState("");
  const { toast } = useToast();

  const { data: states } = useQuery({
    queryKey: ["/api/states"],
  }) as { data: Array<{ code: string; name: string }> | undefined };

  const analyzeMutation = useMutation({
    mutationFn: analyzeContent,
    onSuccess: (data) => {
      onAnalysisComplete(data.result, data.analysisId);
      onLoading(false);
    },
    onError: (error) => {
      toast({
        title: "Analysis failed",
        description: error.message,
        variant: "destructive",
      });
      onLoading(false);
    },
  });

  const handleAnalyze = () => {
    if (!text.trim()) {
      toast({
        title: "No text entered",
        description: "Please tell us what happened or paste the suspicious text.",
        variant: "destructive",
      });
      return;
    }

    const data = {
      inputType: "text" as const,
      text: text.trim(),
      state: state || undefined,
      channel: channel || undefined,
    };

    onLoading(true);
    analyzeMutation.mutate(data);
  };

  return (
    <section className="mb-12">
      <div className="bg-white rounded-xl shadow-md p-8">
        <h3 className="text-2xl font-semibold mb-6 text-boomer-navy">Tell Us What Happened</h3>
        
        {/* Voice Recording Option */}
        <div className="mb-6">
          <VoiceRecorder 
            onTranscription={(transcribedText) => {
              setText(transcribedText);
            }}
            onError={(error) => {
              toast({
                title: "Voice Recording Error",
                description: error,
                variant: "destructive",
              });
            }}
          />
        </div>

        <div className="text-center my-6">
          <div className="flex items-center">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="px-4 text-gray-500 text-sm font-medium">OR TYPE YOUR MESSAGE</span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>
        </div>

        <div className="mb-6">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full h-48 p-6 text-lg resize-none focus:ring-2 focus:ring-boomer-teal focus:border-boomer-teal"
            placeholder="Describe what happened... For example: 'I got an email from my bank asking me to verify my account' or paste the suspicious message here."
          />
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div>
            <Label className="text-lg font-medium mb-3 block">Your State (Optional)</Label>
            <Select value={state} onValueChange={setState}>
              <SelectTrigger className="text-lg p-4 h-auto">
                <SelectValue placeholder="Select your state" />
              </SelectTrigger>
              <SelectContent>
                {states?.map((stateOption: any) => (
                  <SelectItem key={stateOption.code} value={stateOption.code}>
                    {stateOption.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-lg font-medium mb-3 block">Contact Method (Optional)</Label>
            <Select value={channel} onValueChange={setChannel}>
              <SelectTrigger className="text-lg p-4 h-auto">
                <SelectValue placeholder="How did they contact you?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="sms">Text Message</SelectItem>
                <SelectItem value="phone">Phone Call</SelectItem>
                <SelectItem value="social">Social Media</SelectItem>
                <SelectItem value="web">Website</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="text-center">
          <Button 
            onClick={handleAnalyze}
            disabled={isLoading || !text.trim()}
            size="lg"
            className="bg-boomer-teal hover:bg-boomer-navy text-xl px-12 py-4 font-bold"
          >
            <Search className="w-6 h-6 mr-3" />
            Analyze for Scams
          </Button>
        </div>
      </div>
    </section>
  );
}
