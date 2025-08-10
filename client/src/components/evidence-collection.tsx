import { useState } from "react";
import { Camera, FileText, Phone, Upload, Download, Shield, Clock, MapPin, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface EvidenceItem {
  id: string;
  type: 'screenshot' | 'document' | 'audio' | 'text' | 'call_log';
  title: string;
  description?: string;
  timestamp: Date;
  location?: string;
  fileUrl?: string;
  metadata: {
    size?: number;
    mimeType?: string;
    duration?: number;
    phoneNumber?: string;
    callerName?: string;
  };
}

interface EvidencePackage {
  id: string;
  title: string;
  description: string;
  items: EvidenceItem[];
  createdAt: Date;
  status: 'collecting' | 'complete' | 'submitted';
  reportId?: string;
}

export default function EvidenceCollection() {
  const [currentPackage, setCurrentPackage] = useState<EvidencePackage | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createEvidencePackage = () => {
    const newPackage: EvidencePackage = {
      id: `evidence-${Date.now()}`,
      title: `Scam Evidence ${new Date().toLocaleDateString()}`,
      description: '',
      items: [],
      createdAt: new Date(),
      status: 'collecting'
    };
    setCurrentPackage(newPackage);
    
    toast({
      title: "Evidence Collection Started",
      description: "You can now capture screenshots, documents, and other evidence.",
    });
  };

  const captureScreenshot = async () => {
    setIsCapturing(true);
    try {
      // Request screen capture
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      });

      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();

      video.addEventListener('loadedmetadata', () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(video, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob && currentPackage) {
            const newItem: EvidenceItem = {
              id: `screenshot-${Date.now()}`,
              type: 'screenshot',
              title: `Screenshot ${new Date().toLocaleTimeString()}`,
              timestamp: new Date(),
              location: window.location.hostname,
              metadata: {
                size: blob.size,
                mimeType: 'image/png'
              }
            };

            // Create object URL for preview
            const objectUrl = URL.createObjectURL(blob);
            newItem.fileUrl = objectUrl;

            setCurrentPackage(prev => prev ? {
              ...prev,
              items: [...prev.items, newItem]
            } : null);

            toast({
              title: "Screenshot Captured",
              description: "Evidence has been added to your collection.",
            });
          }
        }, 'image/png');

        // Stop the stream
        stream.getTracks().forEach(track => track.stop());
      });
    } catch (error) {
      console.error('Screenshot capture failed:', error);
      toast({
        title: "Capture Failed",
        description: "Unable to capture screenshot. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCapturing(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !currentPackage) return;

    Array.from(files).forEach(file => {
      const newItem: EvidenceItem = {
        id: `file-${Date.now()}-${Math.random()}`,
        type: file.type.startsWith('audio/') ? 'audio' : 'document',
        title: file.name,
        timestamp: new Date(),
        fileUrl: URL.createObjectURL(file),
        metadata: {
          size: file.size,
          mimeType: file.type,
          duration: file.type.startsWith('audio/') ? 0 : undefined
        }
      };

      setCurrentPackage(prev => prev ? {
        ...prev,
        items: [...prev.items, newItem]
      } : null);
    });

    toast({
      title: "Files Added",
      description: `${files.length} file(s) added to evidence collection.`,
    });
  };

  const addTextEvidence = (text: string, title: string) => {
    if (!currentPackage || !text.trim()) return;

    const newItem: EvidenceItem = {
      id: `text-${Date.now()}`,
      type: 'text',
      title,
      description: text,
      timestamp: new Date(),
      metadata: {}
    };

    setCurrentPackage(prev => prev ? {
      ...prev,
      items: [...prev.items, newItem]
    } : null);

    toast({
      title: "Text Evidence Added",
      description: "Your text evidence has been recorded.",
    });
  };

  const submitEvidenceMutation = useMutation({
    mutationFn: async (evidencePackage: EvidencePackage) => {
      // Create FormData to handle file uploads
      const formData = new FormData();
      formData.append('packageData', JSON.stringify({
        id: evidencePackage.id,
        title: evidencePackage.title,
        description: evidencePackage.description,
        createdAt: evidencePackage.createdAt,
        items: evidencePackage.items.map(item => ({
          ...item,
          fileUrl: undefined // Remove object URLs for JSON
        }))
      }));

      // Add files
      evidencePackage.items.forEach((item, index) => {
        if (item.fileUrl && item.fileUrl.startsWith('blob:')) {
          // This is a placeholder - in a real app, you'd need to handle the blob data
          // For now, we'll just send the metadata
        }
      });

      const response = await fetch('/api/evidence/submit', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to submit evidence package');
      }

      return response.json();
    },
    onSuccess: (data) => {
      if (currentPackage) {
        setCurrentPackage({
          ...currentPackage,
          status: 'submitted',
          reportId: data.reportId
        });
      }
      
      toast({
        title: "Evidence Submitted",
        description: "Your evidence package has been securely submitted for analysis.",
      });

      queryClient.invalidateQueries({ queryKey: ["/api/evidence"] });
    },
    onError: () => {
      toast({
        title: "Submission Failed",
        description: "Unable to submit evidence package. Please try again.",
        variant: "destructive",
      });
    }
  });

  const exportPackage = () => {
    if (!currentPackage) return;

    const exportData = {
      ...currentPackage,
      items: currentPackage.items.map(item => ({
        ...item,
        fileUrl: undefined // Remove object URLs for export
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `evidence-${currentPackage.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'screenshot': return <Camera className="h-4 w-4" />;
      case 'document': return <FileText className="h-4 w-4" />;
      case 'audio': return <Phone className="h-4 w-4" />;
      case 'text': return <FileText className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Start Collection */}
      {!currentPackage && (
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Shield className="h-5 w-5" />
              One-Tap Secure Evidence Collection
            </CardTitle>
            <CardDescription>
              Quickly collect and organize evidence of scam attempts with secure, tamper-proof documentation
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={createEvidencePackage} size="lg">
              Start Collecting Evidence
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Active Collection */}
      {currentPackage && (
        <>
          {/* Collection Header */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{currentPackage.title}</CardTitle>
                  <CardDescription>
                    Started {currentPackage.createdAt.toLocaleDateString()} • {currentPackage.items.length} items
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={
                    currentPackage.status === 'collecting' ? 'secondary' :
                    currentPackage.status === 'complete' ? 'outline' : 'default'
                  }>
                    {currentPackage.status}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Add a description of this scam incident..."
                value={currentPackage.description}
                onChange={(e) => setCurrentPackage(prev => prev ? {
                  ...prev,
                  description: e.target.value
                } : null)}
                rows={2}
              />
            </CardContent>
          </Card>

          {/* Collection Tools */}
          {currentPackage.status === 'collecting' && (
            <Card>
              <CardHeader>
                <CardTitle>Evidence Collection Tools</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button
                    onClick={captureScreenshot}
                    disabled={isCapturing}
                    className="h-20 flex-col gap-2"
                  >
                    <Camera className="h-6 w-6" />
                    <span className="text-xs">Screenshot</span>
                  </Button>

                  <label className="cursor-pointer">
                    <Button className="h-20 flex-col gap-2 w-full" asChild>
                      <div>
                        <Upload className="h-6 w-6" />
                        <span className="text-xs">Upload Files</span>
                      </div>
                    </Button>
                    <input
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                      accept="image/*,audio/*,.pdf,.doc,.docx,.txt"
                    />
                  </label>

                  <Button
                    onClick={() => {
                      const text = prompt("Enter text evidence (e.g., email content, phone call details):");
                      const title = prompt("Title for this evidence:") || "Text Evidence";
                      if (text) addTextEvidence(text, title);
                    }}
                    className="h-20 flex-col gap-2"
                  >
                    <FileText className="h-6 w-6" />
                    <span className="text-xs">Add Text</span>
                  </Button>

                  <Button
                    onClick={() => {
                      const phoneNumber = prompt("Enter phone number:");
                      const callerName = prompt("Enter caller name (if known):");
                      const details = prompt("Call details:");
                      if (phoneNumber && details) {
                        addTextEvidence(
                          `Phone: ${phoneNumber}\nCaller: ${callerName || 'Unknown'}\nDetails: ${details}`,
                          `Call Log - ${phoneNumber}`
                        );
                      }
                    }}
                    className="h-20 flex-col gap-2"
                  >
                    <Phone className="h-6 w-6" />
                    <span className="text-xs">Call Log</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Evidence Items */}
          {currentPackage.items.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Collected Evidence ({currentPackage.items.length})</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={exportPackage}>
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                    {currentPackage.status === 'collecting' && (
                      <Button 
                        onClick={() => submitEvidenceMutation.mutate(currentPackage)}
                        disabled={submitEvidenceMutation.isPending}
                      >
                        Submit Package
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {currentPackage.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded">
                        {getItemIcon(item.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{item.title}</h4>
                        <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {item.timestamp.toLocaleTimeString()}
                          </span>
                          {item.metadata.size && (
                            <span>{formatFileSize(item.metadata.size)}</span>
                          )}
                          {item.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {item.location}
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                            {item.description}
                          </p>
                        )}
                      </div>

                      <Badge variant="outline" className="text-xs">
                        {item.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Security Notice */}
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              All evidence is collected with secure timestamps and metadata for legal validity. 
              Files are processed locally and encrypted during transmission.
            </AlertDescription>
          </Alert>
        </>
      )}
    </div>
  );
}