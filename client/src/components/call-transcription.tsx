import { useState, useEffect, useRef } from "react";
import { Phone, PhoneCall, Square, Mic, MicOff, Shield, Eye, EyeOff, Download } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface CallTranscriptionProps {
  onTranscriptionComplete?: (transcript: string, analysis: any) => void;
}

interface PIIFilter {
  type: 'ssn' | 'phone' | 'email' | 'address' | 'name' | 'credit_card' | 'bank_account';
  original: string;
  redacted: string;
  confidence: number;
}

interface TranscriptionSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  rawTranscript: string;
  filteredTranscript: string;
  piiItems: PIIFilter[];
  riskScore: number;
  status: 'recording' | 'processing' | 'complete' | 'error';
}

export default function CallTranscription({ onTranscriptionComplete }: CallTranscriptionProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [session, setSession] = useState<TranscriptionSession | null>(null);
  const [showRawTranscript, setShowRawTranscript] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const { toast } = useToast();
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const startRecording = async () => {
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000
        } 
      });
      
      const recorder = new MediaRecorder(audioStream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      audioChunksRef.current = [];
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        processRecording();
      };

      recorder.start(1000); // Collect data every 1 second
      setMediaRecorder(recorder);
      setStream(audioStream);
      setIsRecording(true);

      const newSession: TranscriptionSession = {
        id: `session-${Date.now()}`,
        startTime: new Date(),
        rawTranscript: '',
        filteredTranscript: '',
        piiItems: [],
        riskScore: 0,
        status: 'recording'
      };

      setSession(newSession);

      toast({
        title: "Recording Started",
        description: "Live call transcription with PII protection is now active.",
      });

    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Recording Failed",
        description: "Unable to access microphone. Please check your permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    }
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    
    setIsRecording(false);
    setMediaRecorder(null);
    setStream(null);
  };

  const processRecording = async () => {
    if (!session) return;

    setSession(prev => prev ? { ...prev, status: 'processing' } : null);

    try {
      // Create audio blob
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
      
      // Convert to base64 for API
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        
        // Send to backend for transcription and PII filtering
        const response = await fetch('/api/transcribe-and-filter', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            audioData: base64Audio,
            sessionId: session.id,
          }),
        });

        if (!response.ok) {
          throw new Error('Transcription failed');
        }

        const result = await response.json();
        
        // Update session with results
        const updatedSession: TranscriptionSession = {
          ...session,
          endTime: new Date(),
          rawTranscript: result.rawTranscript,
          filteredTranscript: result.filteredTranscript,
          piiItems: result.piiItems,
          riskScore: result.analysis?.scam_score || 0,
          status: 'complete'
        };

        setSession(updatedSession);
        
        // Trigger callback with filtered transcript
        if (onTranscriptionComplete) {
          onTranscriptionComplete(result.filteredTranscript, result.analysis);
        }

        toast({
          title: "Transcription Complete",
          description: `Call analyzed with ${result.piiItems.length} PII items filtered.`,
        });
      };
      
      reader.readAsDataURL(audioBlob);

    } catch (error) {
      console.error('Processing error:', error);
      setSession(prev => prev ? { ...prev, status: 'error' } : null);
      
      toast({
        title: "Processing Failed",
        description: "Unable to transcribe and analyze the call recording.",
        variant: "destructive",
      });
    }
  };

  const exportSession = () => {
    if (!session) return;

    const exportData = {
      sessionId: session.id,
      startTime: session.startTime.toISOString(),
      endTime: session.endTime?.toISOString(),
      filteredTranscript: session.filteredTranscript,
      piiItemsCount: session.piiItems.length,
      riskScore: session.riskScore,
      analysis: "Scam analysis completed with PII protection"
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `call-session-${session.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 70) return "text-red-600";
    if (score >= 40) return "text-yellow-600";
    return "text-green-600";
  };

  const getDuration = () => {
    if (!session?.startTime) return "00:00";
    const end = session.endTime || new Date();
    const duration = Math.floor((end.getTime() - session.startTime.getTime()) / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Recording Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Live Call Transcription with PII Protection
          </CardTitle>
          <CardDescription>
            Record phone calls with real-time transcription and automatic PII filtering
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center">
            {!isRecording ? (
              <Button 
                onClick={startRecording}
                size="lg"
                className="bg-green-600 hover:bg-green-700 text-white h-16 w-16 rounded-full"
              >
                <PhoneCall className="h-8 w-8" />
              </Button>
            ) : (
              <div className="text-center space-y-4">
                <Button 
                  onClick={stopRecording}
                  size="lg"
                  variant="destructive"
                  className="h-16 w-16 rounded-full"
                >
                  <Square className="h-8 w-8" />
                </Button>
                <div className="flex items-center justify-center gap-4">
                  <div className="flex items-center gap-2 text-red-600">
                    <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
                    <span className="font-medium">RECORDING</span>
                  </div>
                  <Badge variant="outline">{getDuration()}</Badge>
                </div>
              </div>
            )}
          </div>

          {isRecording && (
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                PII Protection is active. Personal information will be automatically filtered from the transcript.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Session Results */}
      {session && session.status !== 'recording' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Session Results</span>
              <div className="flex items-center gap-2">
                {session.status === 'processing' && (
                  <Badge variant="secondary">Processing...</Badge>
                )}
                {session.status === 'complete' && (
                  <Badge variant="outline" className={getRiskScoreColor(session.riskScore)}>
                    Risk Score: {session.riskScore}%
                  </Badge>
                )}
                {session.status === 'error' && (
                  <Badge variant="destructive">Error</Badge>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {session.status === 'processing' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Processing transcript...</span>
                  <span>Filtering PII...</span>
                </div>
                <Progress value={66} className="w-full" />
              </div>
            )}

            {session.status === 'complete' && (
              <>
                {/* PII Filter Summary */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{session.piiItems.length}</div>
                    <div className="text-xs text-gray-600">PII Items Filtered</div>
                  </div>
                  <div>
                    <div className={`text-2xl font-bold ${getRiskScoreColor(session.riskScore)}`}>
                      {session.riskScore}%
                    </div>
                    <div className="text-xs text-gray-600">Risk Score</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{getDuration()}</div>
                    <div className="text-xs text-gray-600">Duration</div>
                  </div>
                </div>

                {/* Transcript Display */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        variant={showRawTranscript ? "outline" : "default"}
                        size="sm"
                        onClick={() => setShowRawTranscript(false)}
                      >
                        <Shield className="h-4 w-4 mr-2" />
                        Protected Transcript
                      </Button>
                      <Button
                        variant={showRawTranscript ? "default" : "outline"}
                        size="sm"
                        onClick={() => setShowRawTranscript(true)}
                        className="text-red-600 border-red-200"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Show Raw (Admin Only)
                      </Button>
                    </div>
                    <Button size="sm" variant="outline" onClick={exportSession}>
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>

                  <Textarea
                    value={showRawTranscript ? session.rawTranscript : session.filteredTranscript}
                    readOnly
                    className="min-h-32"
                    placeholder="Transcript will appear here..."
                  />

                  {session.piiItems.length > 0 && (
                    <Alert>
                      <Shield className="h-4 w-4" />
                      <AlertDescription>
                        Protected {session.piiItems.length} PII items: {
                          Array.from(new Set(session.piiItems.map(item => item.type))).join(', ')
                        }
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}