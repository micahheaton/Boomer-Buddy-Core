import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { analyzeContent } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { ScamAnalysisResult } from "@/types/scam-analysis";

interface TranscriptFormProps {
  onAnalysisComplete: (result: ScamAnalysisResult, id: string) => void;
  onLoading: (loading: boolean) => void;
  isLoading: boolean;
}

export default function TranscriptForm({ onAnalysisComplete, onLoading, isLoading }: TranscriptFormProps) {
  const [text, setText] = useState("");
  const [state, setState] = useState("");
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
        title: "No transcript entered",
        description: "Please describe the phone call to analyze.",
        variant: "destructive",
      });
      return;
    }

    const data = {
      inputType: "text" as const,
      text: text.trim(),
      state: state || undefined,
      channel: "phone" as const,
    };

    onLoading(true);
    analyzeMutation.mutate(data);
  };

  return (
    <section className="mb-12">
      <div className="bg-white rounded-xl shadow-md p-8">
        <h3 className="text-2xl font-semibold mb-6">Phone Call Transcript</h3>
        
        <div className="mb-6">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full h-48 p-6 text-lg resize-none focus:ring-2 focus:ring-blue-700 focus:border-blue-700"
            placeholder="Describe what the caller said. Include any threats, urgent requests for money, or personal information they asked for..."
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
          <div className="flex items-end">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 w-full">
              <p className="text-sm text-blue-700 font-medium">Channel: Phone Call</p>
              <p className="text-xs text-blue-600">This will help us provide more accurate analysis for phone scams.</p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Button 
            onClick={handleAnalyze}
            disabled={isLoading || !text.trim()}
            size="lg"
            className="bg-blue-700 hover:bg-blue-800 text-xl px-12 py-4 font-bold"
          >
            <Search className="w-6 h-6 mr-3" />
            Analyze for Scams
          </Button>
        </div>
      </div>
    </section>
  );
}
