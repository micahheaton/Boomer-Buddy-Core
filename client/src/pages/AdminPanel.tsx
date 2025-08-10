import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Database, Globe, Shield, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { apiRequest } from "@/lib/queryClient";

export default function AdminPanel() {
  const [isInitializing, setIsInitializing] = useState(false);
  const [isCollecting, setIsCollecting] = useState(false);
  const [results, setResults] = useState<any>(null);
  const { toast } = useToast();

  const handleInitializeSources = async () => {
    setIsInitializing(true);
    try {
      const response = await apiRequest("POST", "/api/admin/initialize-sources");
      const data = await response.json();
      
      setResults(data);
      toast({
        title: "Sources Initialized",
        description: "Comprehensive source discovery completed successfully",
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Initialization Failed",
        description: "Failed to initialize sources",
        variant: "destructive",
      });
    } finally {
      setIsInitializing(false);
    }
  };

  const handleCollectData = async () => {
    setIsCollecting(true);
    try {
      const response = await apiRequest("POST", "/api/admin/collect-all-data");
      const data = await response.json();
      
      setResults(data);
      toast({
        title: "Data Collection Complete",
        description: "Successfully collected data from all sources",
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Collection Failed", 
        description: "Failed to collect data from sources",
        variant: "destructive",
      });
    } finally {
      setIsCollecting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Boomer Buddy Admin Panel
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Comprehensive Data Source Management
        </p>
      </div>

      <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-800 dark:text-blue-200">
          Government Data Sources Only
        </AlertTitle>
        <AlertDescription className="text-blue-700 dark:text-blue-300">
          This system exclusively uses verified government (.gov/.us) sources to ensure 
          maximum authenticity and reliability for scam detection and prevention.
        </AlertDescription>
      </Alert>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Source Discovery */}
        <Card className="border-2 border-dashed border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-600" />
              Initialize Data Sources
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Discover and initialize comprehensive government data sources across all 50 states.
              This will scan for RSS feeds, GovDelivery accounts, and other official sources.
            </p>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline">Federal Sources</Badge>
                <span className="text-sm text-gray-500">FTC, FBI, SSA, CISA, etc.</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">State Sources</Badge>
                <span className="text-sm text-gray-500">All 50 State AGs</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Authorized Nonprofits</Badge>
                <span className="text-sm text-gray-500">AARP, BBB</span>
              </div>
            </div>

            <Button 
              onClick={handleInitializeSources}
              disabled={isInitializing}
              className="w-full"
            >
              {isInitializing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Discovering Sources...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Initialize Sources
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Data Collection */}
        <Card className="border-2 border-dashed border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-600" />
              Collect Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Trigger comprehensive data collection from all initialized sources.
              This will classify content as scam alerts or government news.
            </p>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                <span className="text-sm">Scam alerts & fraud warnings</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-blue-500" />
                <span className="text-sm">Government news & updates</span>
              </div>
            </div>

            <Button 
              onClick={handleCollectData}
              disabled={isCollecting}
              className="w-full"
              variant="secondary"
            >
              {isCollecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Collecting Data...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Collect All Data
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      {results && (
        <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
              <CheckCircle className="w-5 h-5" />
              Operation Complete
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-green-700 dark:text-green-300">
              {results.message}
            </p>
            {results.details && (
              <pre className="mt-2 text-sm bg-white dark:bg-gray-900 p-2 rounded border">
                {JSON.stringify(results.details, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>
      )}

      <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertTitle className="text-yellow-800 dark:text-yellow-200">
          Production Notice
        </AlertTitle>
        <AlertDescription className="text-yellow-700 dark:text-yellow-300">
          Source initialization may take several minutes as it respectfully scans government websites.
          Data collection will process RSS feeds and classify content using intelligent triage.
        </AlertDescription>
      </Alert>
    </div>
  );
}