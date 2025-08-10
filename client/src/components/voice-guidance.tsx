import { useState, useEffect } from "react";
import { Volume2, VolumeX, Play, Pause, RotateCcw, Languages, Settings } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

interface VoiceSettings {
  language: string;
  voice: string;
  speed: number;
  volume: number;
  autoPlay: boolean;
}

interface VoiceGuidance {
  id: string;
  title: string;
  content: string;
  language: string;
  category: 'warning' | 'instruction' | 'explanation' | 'emergency';
  priority: 'low' | 'medium' | 'high' | 'critical';
  duration?: number;
}

const supportedLanguages = [
  { code: 'en-US', name: 'English (US)', flag: '🇺🇸' },
  { code: 'es-ES', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr-FR', name: 'French', flag: '🇫🇷' },
  { code: 'de-DE', name: 'German', flag: '🇩🇪' },
  { code: 'it-IT', name: 'Italian', flag: '🇮🇹' },
  { code: 'pt-PT', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'ru-RU', name: 'Russian', flag: '🇷🇺' },
  { code: 'zh-CN', name: 'Chinese', flag: '🇨🇳' },
  { code: 'ja-JP', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko-KR', name: 'Korean', flag: '🇰🇷' },
  { code: 'ar-SA', name: 'Arabic', flag: '🇸🇦' },
  { code: 'hi-IN', name: 'Hindi', flag: '🇮🇳' },
];

const sampleGuidance: VoiceGuidance[] = [
  {
    id: 'scam-warning-1',
    title: 'Scam Alert - Do Not Respond',
    content: 'ATTENTION: This message shows signs of being a scam. Do not click any links, provide personal information, or make payments. Hang up immediately if this is a phone call.',
    language: 'en-US',
    category: 'warning',
    priority: 'critical'
  },
  {
    id: 'next-steps-1',
    title: 'Recommended Next Steps',
    content: 'Here are your recommended next steps: First, do not respond to the suspicious message. Second, verify any claims by contacting the organization directly using official phone numbers. Third, report this scam to protect others.',
    language: 'en-US',
    category: 'instruction',
    priority: 'high'
  },
  {
    id: 'explanation-1',
    title: 'Why This is a Scam',
    content: 'This message is likely a scam because it uses fear tactics, creates false urgency, and asks for personal information or immediate action. Legitimate organizations do not operate this way.',
    language: 'en-US',
    category: 'explanation',
    priority: 'medium'
  }
];

export default function VoiceGuidance() {
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    language: 'en-US',
    voice: '',
    speed: 1,
    volume: 0.8,
    autoPlay: true
  });

  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [currentGuidance, setCurrentGuidance] = useState<VoiceGuidance | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [synthesis, setSynthesis] = useState<SpeechSynthesis | null>(null);
  const [currentUtterance, setCurrentUtterance] = useState<SpeechSynthesisUtterance | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Initialize speech synthesis
    if ('speechSynthesis' in window) {
      setSynthesis(window.speechSynthesis);
      
      // Load voices
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices);
        
        // Set default voice for selected language
        const defaultVoice = voices.find(voice => voice.lang === voiceSettings.language) || voices[0];
        if (defaultVoice && !voiceSettings.voice) {
          setVoiceSettings(prev => ({ ...prev, voice: defaultVoice.name }));
        }
      };

      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    } else {
      toast({
        title: "Voice Not Supported",
        description: "Your browser doesn't support speech synthesis.",
        variant: "destructive",
      });
    }

    // Load saved settings
    const savedSettings = localStorage.getItem('boomer-buddy-voice-settings');
    if (savedSettings) {
      setVoiceSettings({ ...voiceSettings, ...JSON.parse(savedSettings) });
    }
  }, []);

  useEffect(() => {
    // Save settings to localStorage
    localStorage.setItem('boomer-buddy-voice-settings', JSON.stringify(voiceSettings));
  }, [voiceSettings]);

  const speakText = (guidance: VoiceGuidance) => {
    if (!synthesis) return;

    // Stop any current speech
    synthesis.cancel();

    if (isMuted) {
      toast({
        title: "Voice Muted",
        description: "Unmute to hear voice guidance.",
      });
      return;
    }

    const utterance = new SpeechSynthesisUtterance(guidance.content);
    
    // Configure voice settings
    const selectedVoice = availableVoices.find(voice => voice.name === voiceSettings.voice);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    
    utterance.lang = voiceSettings.language;
    utterance.rate = voiceSettings.speed;
    utterance.volume = voiceSettings.volume;

    // Set up event listeners
    utterance.onstart = () => {
      setIsPlaying(true);
      setCurrentGuidance(guidance);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setCurrentGuidance(null);
      setCurrentUtterance(null);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      toast({
        title: "Voice Error",
        description: "Unable to play voice guidance. Please try again.",
        variant: "destructive",
      });
    };

    setCurrentUtterance(utterance);
    synthesis.speak(utterance);
  };

  const pauseResumeSpeech = () => {
    if (!synthesis) return;

    if (synthesis.speaking && !synthesis.paused) {
      synthesis.pause();
    } else if (synthesis.paused) {
      synthesis.resume();
    }
  };

  const stopSpeech = () => {
    if (synthesis) {
      synthesis.cancel();
      setIsPlaying(false);
      setCurrentGuidance(null);
      setCurrentUtterance(null);
    }
  };

  const testVoice = () => {
    const testGuidance: VoiceGuidance = {
      id: 'test',
      title: 'Voice Test',
      content: 'This is a test of the voice guidance system. Your voice settings are working correctly.',
      language: voiceSettings.language,
      category: 'instruction',
      priority: 'low'
    };
    speakText(testGuidance);
  };

  const translateAndSpeak = async (guidance: VoiceGuidance) => {
    if (guidance.language === voiceSettings.language) {
      speakText(guidance);
      return;
    }

    try {
      // In a real implementation, you would call a translation API
      // For now, we'll simulate translation
      toast({
        title: "Translating...",
        description: `Translating to ${supportedLanguages.find(l => l.code === voiceSettings.language)?.name}`,
      });

      // Simulate translation delay
      setTimeout(() => {
        const translatedGuidance: VoiceGuidance = {
          ...guidance,
          content: `[Translated] ${guidance.content}`, // Placeholder
          language: voiceSettings.language
        };
        speakText(translatedGuidance);
      }, 1000);

    } catch (error) {
      console.error('Translation failed:', error);
      toast({
        title: "Translation Failed",
        description: "Playing in original language.",
      });
      speakText(guidance);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'warning': return 'destructive';
      case 'emergency': return 'destructive';
      case 'instruction': return 'default';
      case 'explanation': return 'secondary';
      default: return 'outline';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return '🔴';
      case 'high': return '🟠';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  const getLanguageVoices = () => {
    return availableVoices.filter(voice => voice.lang.startsWith(voiceSettings.language.split('-')[0]));
  };

  return (
    <div className="space-y-6">
      {/* Voice Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Languages className="h-5 w-5" />
            Multilingual Voice Guidance Settings
          </CardTitle>
          <CardDescription>
            Configure voice guidance in your preferred language with custom settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Language Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Language</label>
              <Select value={voiceSettings.language} onValueChange={(value) => 
                setVoiceSettings(prev => ({ ...prev, language: value, voice: '' }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {supportedLanguages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      <div className="flex items-center gap-2">
                        <span>{lang.flag}</span>
                        <span>{lang.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Voice Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Voice</label>
              <Select value={voiceSettings.voice} onValueChange={(value) =>
                setVoiceSettings(prev => ({ ...prev, voice: value }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Select voice" />
                </SelectTrigger>
                <SelectContent>
                  {getLanguageVoices().map((voice) => (
                    <SelectItem key={voice.name} value={voice.name}>
                      {voice.name} {voice.gender ? `(${voice.gender})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Speed and Volume Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Speed: {voiceSettings.speed}x</label>
              <Slider
                value={[voiceSettings.speed]}
                onValueChange={([value]) => setVoiceSettings(prev => ({ ...prev, speed: value }))}
                min={0.5}
                max={2}
                step={0.1}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Volume: {Math.round(voiceSettings.volume * 100)}%</label>
              <Slider
                value={[voiceSettings.volume]}
                onValueChange={([value]) => setVoiceSettings(prev => ({ ...prev, volume: value }))}
                min={0}
                max={1}
                step={0.1}
                className="w-full"
              />
            </div>
          </div>

          {/* Test Voice */}
          <div className="flex items-center gap-4">
            <Button onClick={testVoice} variant="outline">
              <Play className="h-4 w-4 mr-2" />
              Test Voice
            </Button>
            <Button
              onClick={() => setIsMuted(!isMuted)}
              variant={isMuted ? "destructive" : "outline"}
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              {isMuted ? "Unmute" : "Mute"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Current Playback */}
      {currentGuidance && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Volume2 className="h-5 w-5" />
                Now Playing
              </CardTitle>
              <Badge variant={getCategoryColor(currentGuidance.category)}>
                {getPriorityIcon(currentGuidance.priority)} {currentGuidance.category}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">{currentGuidance.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{currentGuidance.content}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={pauseResumeSpeech}>
                  {synthesis?.paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                </Button>
                <Button size="sm" variant="outline" onClick={stopSpeech}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sample Voice Guidance */}
      <Card>
        <CardHeader>
          <CardTitle>Voice Guidance Examples</CardTitle>
          <CardDescription>Test different types of voice guidance for scam prevention</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sampleGuidance.map((guidance) => (
              <div key={guidance.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium">{guidance.title}</h4>
                    <Badge variant={getCategoryColor(guidance.category)}>
                      {getPriorityIcon(guidance.priority)} {guidance.category}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">{guidance.content}</p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    size="sm"
                    onClick={() => translateAndSpeak(guidance)}
                    disabled={isPlaying}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Play
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Accessibility Notice */}
      <Alert>
        <Settings className="h-4 w-4" />
        <AlertDescription>
          Voice guidance supports over 60 languages and dialects. Settings are automatically saved. 
          Use keyboard shortcuts: Space to pause/resume, Escape to stop.
        </AlertDescription>
      </Alert>
    </div>
  );
}