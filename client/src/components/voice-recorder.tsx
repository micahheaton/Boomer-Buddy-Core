import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Square, Play, Pause, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface VoiceRecorderProps {
  onTranscription: (text: string) => void;
  onError?: (error: string) => void;
}

export default function VoiceRecorder({ onTranscription, onError }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        }
      });
      
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      const chunks: BlobPart[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: mediaRecorder.mimeType });
        setAudioBlob(blob);
        setHasRecording(true);
        
        // Create audio URL for playback
        const audioUrl = URL.createObjectURL(blob);
        if (audioRef.current) {
          audioRef.current.src = audioUrl;
        }
      };
      
      mediaRecorder.start(1000); // Record in 1-second chunks
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      toast({
        title: "Recording started",
        description: "Speak clearly into your microphone",
      });
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      const errorMessage = error instanceof Error ? error.message : 'Could not access microphone';
      onError?.(errorMessage);
      toast({
        title: "Microphone Error",
        description: "Please allow microphone access to record your message",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      toast({
        title: "Recording stopped",
        description: "You can now play back or transcribe your recording",
      });
    }
  };

  const playRecording = () => {
    if (audioRef.current && audioBlob) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const transcribeAudio = async () => {
    if (!audioBlob) return;
    
    setIsTranscribing(true);
    
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Transcription failed');
      }
      
      const data = await response.json();
      
      if (data.text) {
        onTranscription(data.text);
        toast({
          title: "Transcription complete",
          description: "Your audio has been converted to text",
        });
      } else {
        throw new Error('No text was extracted from the audio');
      }
      
    } catch (error) {
      console.error('Transcription error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Transcription failed';
      onError?.(errorMessage);
      toast({
        title: "Transcription Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsTranscribing(false);
    }
  };

  const clearRecording = () => {
    setHasRecording(false);
    setAudioBlob(null);
    setIsPlaying(false);
    setRecordingTime(0);
    if (audioRef.current) {
      audioRef.current.src = '';
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle audio element events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => setIsPlaying(false);
    const handlePause = () => setIsPlaying(false);
    
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('pause', handlePause);
    
    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('pause', handlePause);
    };
  }, [audioBlob]);

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
      <h4 className="text-lg font-semibold mb-4 text-blue-900 flex items-center">
        <Mic className="w-5 h-5 mr-2" />
        Voice Recording
      </h4>
      
      <div className="space-y-4">
        {/* Recording Controls */}
        <div className="flex items-center justify-center space-x-4">
          {!isRecording && !hasRecording && (
            <Button 
              onClick={startRecording}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full"
            >
              <Mic className="w-5 h-5 mr-2" />
              Start Recording
            </Button>
          )}
          
          {isRecording && (
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-red-600">
                <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse mr-2"></div>
                <span className="font-mono text-lg">{formatTime(recordingTime)}</span>
              </div>
              <Button 
                onClick={stopRecording}
                variant="outline"
                className="border-red-600 text-red-600 hover:bg-red-50"
              >
                <Square className="w-4 h-4 mr-2" />
                Stop
              </Button>
            </div>
          )}
        </div>

        {/* Playback Controls */}
        {hasRecording && !isRecording && (
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center justify-center space-x-4 mb-4">
              <Button
                onClick={playRecording}
                variant="outline"
                className="border-blue-600 text-blue-600 hover:bg-blue-50"
              >
                {isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                {isPlaying ? 'Pause' : 'Play'}
              </Button>
              
              <span className="text-sm text-gray-600">
                Recording: {formatTime(recordingTime)}
              </span>
              
              <Button
                onClick={clearRecording}
                variant="ghost"
                className="text-red-600 hover:text-red-800"
              >
                Clear
              </Button>
            </div>
            
            <Button
              onClick={transcribeAudio}
              disabled={isTranscribing}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isTranscribing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Converting to Text...
                </>
              ) : (
                'Convert to Text'
              )}
            </Button>
          </div>
        )}
        
        <audio ref={audioRef} style={{ display: 'none' }} />
        
        <p className="text-sm text-blue-700 text-center">
          Record your voice message and we'll convert it to text for analysis
        </p>
      </div>
    </div>
  );
}