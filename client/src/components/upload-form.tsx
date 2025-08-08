import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CloudUpload, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { analyzeContent } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { ScamAnalysisResult } from "@/types/scam-analysis";

interface UploadFormProps {
  onAnalysisComplete: (result: ScamAnalysisResult, id: string) => void;
  onLoading: (loading: boolean) => void;
  isLoading: boolean;
}

export default function UploadForm({ onAnalysisComplete, onLoading, isLoading }: UploadFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleAnalyze = () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select an image file to analyze.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("image", selectedFile);
    formData.append("inputType", "image");
    if (state) formData.append("state", state);
    if (channel) formData.append("channel", channel);

    onLoading(true);
    analyzeMutation.mutate(formData);
  };

  return (
    <section className="mb-12">
      <div className="bg-white rounded-xl shadow-md p-8">
        <h3 className="text-2xl font-semibold mb-6">Upload Screenshot</h3>
        
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center mb-6 hover:border-blue-700 transition-colors">
          <CloudUpload className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <p className="text-xl font-semibold mb-2">Drag and drop your screenshot here</p>
          <p className="text-lg text-gray-600 mb-4">or click to select a file</p>
          <div className="relative">
            <Button 
              size="lg" 
              className="bg-blue-700 hover:bg-blue-800 text-lg px-8 py-3"
            >
              Choose File
            </Button>
            <Input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </div>
        </div>

        {selectedFile && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CloudUpload className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-lg">{selectedFile.name}</p>
                <p className="text-gray-600">{(selectedFile.size / 1024).toFixed(1)} KB</p>
              </div>
            </div>
          </div>
        )}

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
            disabled={isLoading || !selectedFile}
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
