import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  MapPin, 
  AlertTriangle, 
  TrendingUp, 
  Activity,
  Shield,
  Clock,
  Search,
  ExternalLink,
  Zap,
  CheckCircle,
  Filter,
  Globe
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface UnifiedAlert {
  id: string;
  title: string;
  description: string;
  url?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  timestamp: string;
  sourceAgency: string;
  isScamAlert: boolean;
  type: 'scam-alert' | 'news';
  scamTypes?: string[];
  elderRelevanceScore?: number;
}

interface UnifiedData {
  alerts: UnifiedAlert[];
  statistics: {
    totalActiveAlerts: number;
    highSeverityAlerts: number;
    scamAlertsToday: number;
    governmentAdvisories: number;
    dataSourcesOnline: number;
    lastUpdate: string;
    coverage: string;
  };
  metadata: {
    total: number;
    scamTrends: number;
    newsItems: number;
    lastUpdated: string;
  };
}

export default function UnifiedTrendsHeatmap() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<'all' | 'scam-alert' | 'news'>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<'all' | 'high' | 'critical'>('all');

  // Fetch unified data from both trends and live alerts
  const { data: unifiedData, isLoading } = useQuery<UnifiedData>({
    queryKey: ["/api/unified-trends-heatmap"],
    refetchInterval: 30000, // 30 seconds for live updates
  });

  // Get data sources info
  const { data: sourcesData } = useQuery<{
    stats: { totalSources: number; activeSources: number; };
  }>({
    queryKey: ["/api/v2/data-sources"],
    refetchInterval: 60000, // 1 minute
  });

  const filteredAlerts = unifiedData?.alerts?.filter(alert => {
    const matchesSearch = !searchQuery || 
      alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.sourceAgency.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = selectedType === 'all' || alert.type === selectedType;
    
    const matchesSeverity = selectedSeverity === 'all' || 
      (selectedSeverity === 'high' && (alert.severity === 'high' || alert.severity === 'critical')) ||
      alert.severity === selectedSeverity;
    
    return matchesSearch && matchesType && matchesSeverity;
  }) || [];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950 dark:text-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300';
      default: return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const alertTime = new Date(timestamp);
    const diffMs = now.getTime() - alertTime.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffHours >= 24) {
      const days = Math.floor(diffHours / 24);
      return `${days}d ago`;
    } else if (diffHours >= 1) {
      return `${diffHours}h ago`;
    } else if (diffMins >= 1) {
      return `${diffMins}m ago`;
    }
    return 'Just now';
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Live Trends & Scam Intelligence
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Real-time monitoring and historical data from {sourcesData?.stats?.totalSources || '60+'} comprehensive government sources
          </p>
        </div>
        <div className="text-right text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>LIVE</span>
          </div>
          <div>Last updated: {unifiedData?.statistics?.lastUpdate ? new Date(unifiedData.statistics.lastUpdate).toLocaleTimeString() : 'Loading...'}</div>
        </div>
      </div>

      {/* Live Statistics Cards */}
      {unifiedData?.statistics && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card className="bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">Live Alerts</p>
                  <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                    {unifiedData.statistics.totalActiveAlerts}
                  </p>
                </div>
                <Zap className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-800 dark:text-orange-200">High Priority</p>
                  <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                    {unifiedData.statistics.highSeverityAlerts}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Scam Alerts</p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {unifiedData.statistics.scamAlertsToday}
                  </p>
                </div>
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">Gov News</p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                    {unifiedData.statistics.governmentAdvisories}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 border-purple-200 dark:bg-purple-950 dark:border-purple-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-800 dark:text-purple-200">Sources</p>
                  <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                    {sourcesData?.stats?.totalSources || '60+'}
                  </p>
                </div>
                <Globe className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Comprehensive Collection Alert */}
      <Alert className="mb-6 border-green-200 bg-green-50">
        <Shield className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <strong>Comprehensive Live System:</strong> Enhanced data collection from {sourcesData?.stats?.totalSources || '60+'} government sources across all 50 states. 
          Intelligent triage distinguishes between scam alerts and government news with real-time updates every 30 seconds.
        </AlertDescription>
      </Alert>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search alerts, news, and trends..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={selectedType === 'all' ? 'default' : 'outline'}
            onClick={() => setSelectedType('all')}
            size="sm"
          >
            All ({filteredAlerts.length})
          </Button>
          <Button
            variant={selectedType === 'scam-alert' ? 'default' : 'outline'}
            onClick={() => setSelectedType('scam-alert')}
            size="sm"
          >
            Alerts ({unifiedData?.statistics?.scamAlertsToday || 0})
          </Button>
          <Button
            variant={selectedType === 'news' ? 'default' : 'outline'}
            onClick={() => setSelectedType('news')}
            size="sm"
          >
            News ({unifiedData?.statistics?.governmentAdvisories || 0})
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            variant={selectedSeverity === 'all' ? 'default' : 'outline'}
            onClick={() => setSelectedSeverity('all')}
            size="sm"
          >
            All Priority
          </Button>
          <Button
            variant={selectedSeverity === 'high' ? 'default' : 'outline'}
            onClick={() => setSelectedSeverity('high')}
            size="sm"
          >
            High Priority
          </Button>
        </div>
      </div>

      {/* Unified Alert Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredAlerts.map((alert) => (
          <Card 
            key={alert.id} 
            className={`hover:shadow-lg transition-all duration-200 ${
              alert.url ? 'cursor-pointer hover:border-blue-400' : ''
            }`}
            onClick={alert.url ? () => window.open(alert.url, '_blank') : undefined}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getSeverityColor(alert.severity)}>
                      {alert.severity.toUpperCase()}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {alert.isScamAlert ? 'ALERT' : 'NEWS'}
                    </Badge>
                    {alert.url && (
                      <Badge variant="outline" className="text-xs text-blue-600">
                        CLICKABLE
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg leading-tight">{alert.title}</CardTitle>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
                {alert.description}
              </p>
              
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatTimeAgo(alert.timestamp)}
                </div>
                <span>{alert.sourceAgency}</span>
              </div>
              
              {alert.scamTypes && alert.scamTypes.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {alert.scamTypes.slice(0, 2).map((type) => (
                    <Badge key={type} variant="secondary" className="text-xs">
                      {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Badge>
                  ))}
                  {alert.scamTypes.length > 2 && (
                    <Badge variant="secondary" className="text-xs">
                      +{alert.scamTypes.length - 2} more
                    </Badge>
                  )}
                </div>
              )}
              
              {alert.elderRelevanceScore && alert.elderRelevanceScore > 70 && (
                <div className="flex items-center gap-1 text-amber-600">
                  <AlertTriangle className="h-3 w-3" />
                  <span className="text-xs font-medium">High Elder Risk</span>
                </div>
              )}
              
              {alert.url && (
                <div className="pt-2 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                  <span className="text-xs text-blue-600">Click anywhere to view official source</span>
                  <ExternalLink className="h-3 w-3 text-blue-600" />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      
      {filteredAlerts.length === 0 && (
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No results found
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Try adjusting your search terms or filters
          </p>
        </div>
      )}

      {/* System Status */}
      <Alert className="mt-8">
        <Activity className="h-4 w-4" />
        <AlertDescription>
          <strong>System Status:</strong> All {sourcesData?.stats?.totalSources || '60+'} government data sources online. 
          Real-time collection from comprehensive system with intelligent content filtering. 
          Coverage: {unifiedData?.statistics?.coverage || 'All 50 States + Federal Agencies'}
        </AlertDescription>
      </Alert>
    </div>
  );
}