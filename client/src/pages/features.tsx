
import CallTranscription from "@/components/call-transcription";
import EvidenceCollection from "@/components/evidence-collection";
import VoiceGuidance from "@/components/voice-guidance";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, Camera, Volume2 } from "lucide-react";

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Advanced Protection Features
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Protect yourself with cutting-edge tools for call recording, evidence collection, 
            and multilingual voice guidance specifically designed for seniors.
          </p>
        </div>

        <Tabs defaultValue="transcription" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="transcription" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Call Recording
            </TabsTrigger>
            <TabsTrigger value="evidence" className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Evidence Collection
            </TabsTrigger>
            <TabsTrigger value="voice" className="flex items-center gap-2">
              <Volume2 className="h-4 w-4" />
              Voice Guidance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transcription" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Live Call Transcription with PII Protection</CardTitle>
                <CardDescription>
                  Record suspicious phone calls with automatic transcription and privacy protection. 
                  Personal information is automatically filtered to keep you safe.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CallTranscription />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="evidence" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Secure Evidence Collection</CardTitle>
                <CardDescription>
                  Collect screenshots, documents, and other evidence of scam attempts with 
                  secure timestamps and legal-grade documentation.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EvidenceCollection />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="voice" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Multilingual Voice Guidance</CardTitle>
                <CardDescription>
                  Get spoken instructions and warnings in your preferred language with 
                  customizable voice settings for optimal accessibility.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <VoiceGuidance />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}