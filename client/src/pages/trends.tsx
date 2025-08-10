import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Search, TrendingUp, Shield, Clock } from "lucide-react";


interface ScamTrend {
  id: string;
  title: string;
  description: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  keywords: string[];
  tactics: string[];
  targetDemographics: string[];
  reportedCases: number;
  firstSeen: string;
  lastUpdated: string;
  regions: string[];
  examples: string[];
  preventionTips: string[];
}

interface TrendAlert {
  id: string;
  trendId: string;
  alertType: 'new_trend' | 'escalation' | 'geographic_spread' | 'tactic_change';
  severity: 'info' | 'warning' | 'urgent' | 'critical';
  title: string;
  message: string;
  actionRequired: boolean;
  timestamp: string;
}

interface TrendsData {
  trends: ScamTrend[];
  alerts: TrendAlert[];
  lastUpdated: string;
}

export default function TrendsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ScamTrend[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const { data: trendsData, isLoading, error } = useQuery<TrendsData>({
    queryKey: ["/api/trends"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await fetch(`/api/trends/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      setSearchResults(data.trends || []);
    } catch (error) {
      console.error("Search failed:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-50 border-red-200';
      case 'urgent': return 'bg-orange-50 border-orange-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      case 'info': return 'bg-blue-50 border-blue-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading current scam trends...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Loading Trends</AlertTitle>
          <AlertDescription>
            Unable to fetch current scam trends. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const trendsToDisplay = searchResults.length > 0 ? searchResults : trendsData?.trends || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-gray-900">Scam Trends & Alerts</h1>
        </div>
        <p className="text-lg text-muted-foreground">
          Stay informed about the latest scam patterns and threats targeting seniors and vulnerable populations.
        </p>
        {trendsData?.lastUpdated && (
          <p className="text-sm text-muted-foreground mt-2">
            <Clock className="h-4 w-4 inline mr-1" />
            Last updated: {formatDate(trendsData.lastUpdated)}
          </p>
        )}
      </div>

      {/* Active Alerts */}
      {trendsData?.alerts && trendsData.alerts.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            Active Alerts
          </h2>
          <div className="space-y-3">
            {trendsData.alerts.map((alert) => (
              <Alert key={alert.id} className={getSeverityColor(alert.severity)}>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle className="flex items-center justify-between">
                  {alert.title}
                  <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}>
                    {alert.severity.toUpperCase()}
                  </Badge>
                </AlertTitle>
                <AlertDescription>
                  <p>{alert.message}</p>
                  <p className="text-xs mt-2 opacity-70">
                    {formatDate(alert.timestamp)} • {alert.alertType.replace('_', ' ').toUpperCase()}
                  </p>
                </AlertDescription>
              </Alert>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Search Trends</h2>
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Search for specific scam types, keywords, or tactics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1"
          />
          <Button 
            onClick={handleSearch} 
            disabled={isSearching || !searchQuery.trim()}
            className="px-6"
          >
            <Search className="h-4 w-4 mr-2" />
            {isSearching ? 'Searching...' : 'Search'}
          </Button>
        </div>
        {searchResults.length > 0 && (
          <div className="mt-2 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Found {searchResults.length} trend{searchResults.length !== 1 ? 's' : ''} matching "{searchQuery}"
            </p>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                setSearchQuery("");
                setSearchResults([]);
              }}
            >
              Clear search
            </Button>
          </div>
        )}
      </div>

      {/* Trends Grid */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          {searchResults.length > 0 ? 'Search Results' : 'Current Trends'}
        </h2>
        
        {trendsToDisplay.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">
                {searchQuery ? 'No trends found matching your search.' : 'No trends available at this time.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
            {trendsToDisplay.map((trend) => (
              <Card key={trend.id} className="h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg leading-tight pr-4">
                      {trend.title}
                    </CardTitle>
                    <Badge className={`${getRiskColor(trend.riskLevel)} shrink-0`}>
                      {trend.riskLevel.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {trend.description}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Statistics */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-muted-foreground">Reported Cases</p>
                      <p className="text-lg font-semibold text-red-600">{trend.reportedCases.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="font-medium text-muted-foreground">Last Updated</p>
                      <p className="text-sm">{formatDate(trend.lastUpdated)}</p>
                    </div>
                  </div>

                  <Separator />

                  {/* Keywords */}
                  <div>
                    <p className="font-medium text-sm mb-2">Common Keywords</p>
                    <div className="flex flex-wrap gap-1">
                      {trend.keywords.slice(0, 6).map((keyword) => (
                        <Badge key={keyword} variant="outline" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                      {trend.keywords.length > 6 && (
                        <Badge variant="outline" className="text-xs">
                          +{trend.keywords.length - 6} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Target Demographics */}
                  <div>
                    <p className="font-medium text-sm mb-2">Target Demographics</p>
                    <div className="flex flex-wrap gap-1">
                      {trend.targetDemographics.map((demographic) => (
                        <Badge key={demographic} variant="secondary" className="text-xs">
                          {demographic}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Prevention Tip */}
                  {trend.preventionTips.length > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="font-medium text-sm text-green-800 mb-1">💡 Prevention Tip</p>
                      <p className="text-sm text-green-700">
                        {trend.preventionTips[0]}
                      </p>
                    </div>
                  )}

                  {/* Geographic Spread */}
                  {trend.regions.length > 0 && (
                    <div>
                      <p className="font-medium text-sm mb-2">Geographic Activity</p>
                      <p className="text-sm text-muted-foreground">
                        {trend.regions.join(", ")}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Educational Footer */}
      <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-3">🛡️ Stay Protected</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div>
            <p className="font-medium mb-2">General Safety Tips:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Never give personal information to unsolicited callers</li>
              <li>Verify suspicious messages through official channels</li>
              <li>Be skeptical of urgent requests for money or information</li>
            </ul>
          </div>
          <div>
            <p className="font-medium mb-2">Red Flags to Watch For:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Threats of immediate consequences</li>
              <li>Requests for gift cards or wire transfers</li>
              <li>Impersonation of government agencies or companies</li>
            </ul>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}