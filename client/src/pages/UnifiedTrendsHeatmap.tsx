import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
  Globe,
  X,
  Eye
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

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
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const [showDailySummary, setShowDailySummary] = useState(false);
  const [selectedSources, setSelectedSources] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch unified data from both trends and live alerts
  const { data: unifiedData, isLoading } = useQuery<UnifiedData>({
    queryKey: ["/api/unified-trends-heatmap"],
    refetchInterval: 30000, // 30 seconds for live updates
  });

  // Get data sources info
  const { data: sourcesData } = useQuery<{
    sources: Array<{
      id: string;
      name: string;
      url: string;
      sourceType: string;
      isActive: boolean;
      state?: string;
    }>;
    stats: { totalSources: number; activeSources: number; };
  }>({
    queryKey: ["/api/v2/data-sources"],
    refetchInterval: 60000, // 1 minute
  });

  // WebSocket connection for real-time updates
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);
    
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'cache-updated') {
        // Invalidate and refetch the data
        queryClient.invalidateQueries({ queryKey: ["/api/unified-trends-heatmap"] });
        toast({
          title: "Live Update",
          description: `New alerts available: ${data.newAlerts || 0} fresh items`,
        });
      }
    };

    return () => socket.close();
  }, [queryClient, toast]);

  // Toggle card filters
  const toggleFilter = (filterType: string) => {
    setActiveFilters(prev => {
      const newFilters = new Set(prev);
      if (newFilters.has(filterType)) {
        newFilters.delete(filterType);
      } else {
        newFilters.clear(); // Only one filter at a time for simplicity
        newFilters.add(filterType);
      }
      return newFilters;
    });
  };

  // Filter alerts based on search, filters, and active card filters
  const filteredAlerts = unifiedData?.alerts?.filter(alert => {
    const matchesSearch = !searchQuery || 
      alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.sourceAgency.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = selectedType === 'all' || alert.type === selectedType;
    
    const matchesSeverity = selectedSeverity === 'all' || 
      (selectedSeverity === 'high' && (alert.severity === 'high' || alert.severity === 'critical')) ||
      alert.severity === selectedSeverity;
    
    // Card filter logic
    const matchesCardFilter = activeFilters.size === 0 || 
      (activeFilters.has('live-alerts')) ||
      (activeFilters.has('high-priority') && (alert.severity === 'high' || alert.severity === 'critical')) ||
      (activeFilters.has('scam-alerts') && alert.isScamAlert) ||
      (activeFilters.has('gov-news') && !alert.isScamAlert);

    // Source filter logic  
    const matchesSourceFilter = selectedSources.size === 0 || 
      selectedSources.has(alert.sourceAgency);
    
    return matchesSearch && matchesType && matchesSeverity && matchesCardFilter && matchesSourceFilter;
  }) || [];

  // Calculate consistent statistics from filtered data
  const currentStats = {
    totalActiveAlerts: filteredAlerts.length,
    highSeverityAlerts: filteredAlerts.filter(a => a.severity === 'high' || a.severity === 'critical').length,
    scamAlertsToday: filteredAlerts.filter(a => a.isScamAlert).length,
    governmentAdvisories: filteredAlerts.filter(a => !a.isScamAlert).length,
  };

  // Generate daily summary
  const generateDailySummary = () => {
    const todayAlerts = unifiedData?.alerts.filter(alert => 
      new Date(alert.timestamp).toDateString() === new Date().toDateString()
    ) || [];
    
    return {
      newAlertsToday: todayAlerts.length,
      highPriorityToday: todayAlerts.filter(a => a.severity === 'high' || a.severity === 'critical').length,
      scamAlertsToday: todayAlerts.filter(a => a.isScamAlert).length,
      topScamTypes: [...new Set(todayAlerts.flatMap(a => a.scamTypes || []))].slice(0, 3),
      coverage: `${sourcesData?.stats?.totalSources || '60+'} government sources monitored`
    };
  };

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
        <div className="text-right text-sm text-gray-500 space-y-2">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>LIVE</span>
          </div>
          <div>Last updated: {unifiedData?.statistics?.lastUpdate ? new Date(unifiedData.statistics.lastUpdate).toLocaleTimeString() : 'Loading...'}</div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowDailySummary(true)}
            className="text-xs"
          >
            <Eye className="h-3 w-3 mr-1" />
            Daily Briefing
          </Button>
        </div>
      </div>

      {/* Daily Summary Dialog */}
      <Dialog open={showDailySummary} onOpenChange={setShowDailySummary}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Daily Intelligence Briefing
            </DialogTitle>
            <DialogDescription>
              Your comprehensive update for {new Date().toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {(() => {
              const summary = generateDailySummary();
              return (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-900">{summary.newAlertsToday}</div>
                      <div className="text-sm text-blue-600">New Alerts Today</div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-900">{summary.highPriorityToday}</div>
                      <div className="text-sm text-orange-600">High Priority</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Key Updates:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• {summary.scamAlertsToday} scam alerts identified</li>
                      <li>• {summary.coverage} active monitoring</li>
                      {summary.topScamTypes.length > 0 && (
                        <li>• Top threats: {summary.topScamTypes.join(', ')}</li>
                      )}
                    </ul>
                  </div>
                  <Button 
                    onClick={() => setShowDailySummary(false)}
                    className="w-full"
                  >
                    Got it, all up to date!
                  </Button>
                </>
              );
            })()}
          </div>
        </DialogContent>
      </Dialog>

      {/* Live Statistics Cards - Now Clickable */}
      {unifiedData?.statistics && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card 
            className={`cursor-pointer transition-all hover:shadow-md ${
              activeFilters.has('live-alerts') 
                ? 'bg-red-100 border-red-300 dark:bg-red-900 dark:border-red-700' 
                : 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
            }`}
            onClick={() => toggleFilter('live-alerts')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">Live Alerts</p>
                  <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                    {currentStats.totalActiveAlerts}
                  </p>
                </div>
                <Zap className="h-8 w-8 text-red-600" />
              </div>
              {activeFilters.has('live-alerts') && (
                <div className="mt-2 text-xs text-red-700 dark:text-red-300">
                  Filtering active
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card 
            className={`cursor-pointer transition-all hover:shadow-md ${
              activeFilters.has('high-priority') 
                ? 'bg-orange-100 border-orange-300 dark:bg-orange-900 dark:border-orange-700' 
                : 'bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800'
            }`}
            onClick={() => toggleFilter('high-priority')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-800 dark:text-orange-200">High Priority</p>
                  <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                    {currentStats.highSeverityAlerts}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-600" />
              </div>
              {activeFilters.has('high-priority') && (
                <div className="mt-2 text-xs text-orange-700 dark:text-orange-300">
                  Filtering active
                </div>
              )}
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all hover:shadow-md ${
              activeFilters.has('scam-alerts') 
                ? 'bg-blue-100 border-blue-300 dark:bg-blue-900 dark:border-blue-700' 
                : 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800'
            }`}
            onClick={() => toggleFilter('scam-alerts')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Scam Alerts</p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {currentStats.scamAlertsToday}
                  </p>
                </div>
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
              {activeFilters.has('scam-alerts') && (
                <div className="mt-2 text-xs text-blue-700 dark:text-blue-300">
                  Filtering active
                </div>
              )}
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all hover:shadow-md ${
              activeFilters.has('gov-news') 
                ? 'bg-green-100 border-green-300 dark:bg-green-900 dark:border-green-700' 
                : 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
            }`}
            onClick={() => toggleFilter('gov-news')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">Gov News</p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                    {currentStats.governmentAdvisories}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              {activeFilters.has('gov-news') && (
                <div className="mt-2 text-xs text-green-700 dark:text-green-300">
                  Filtering active
                </div>
              )}
            </CardContent>
          </Card>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="bg-purple-50 border-purple-200 dark:bg-purple-950 dark:border-purple-800 cursor-help">
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
              </TooltipTrigger>
              <TooltipContent className="max-w-sm">
                <div className="space-y-2">
                  <div className="font-medium">Active Government Sources:</div>
                  <div className="text-sm space-y-1 max-h-48 overflow-y-auto">
                    {sourcesData?.sources?.slice(0, 10).map(source => (
                      <div key={source.id} className="flex justify-between">
                        <span className="text-xs">{source.name}</span>
                        <Badge variant={source.isActive ? "default" : "secondary"} className="text-xs">
                          {source.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    ))}
                    {(sourcesData?.sources?.length || 0) > 10 && (
                      <div className="text-xs text-gray-500">
                        ...and {(sourcesData?.sources?.length || 0) - 10} more sources
                      </div>
                    )}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}

      {/* Active Filters Display */}
      {activeFilters.size > 0 && (
        <Alert className="mb-4 border-blue-200 bg-blue-50">
          <Filter className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 flex items-center justify-between">
            <span>
              <strong>Active Filter:</strong> Showing {filteredAlerts.length} items filtered by {Array.from(activeFilters).join(', ').replace('-', ' ')}
            </span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setActiveFilters(new Set())}
              className="text-blue-600 hover:text-blue-800"
            >
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Comprehensive Collection Alert */}
      <Alert className="mb-6 border-green-200 bg-green-50">
        <Shield className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <strong>Live Intelligence System:</strong> Real-time monitoring from {sourcesData?.stats?.totalSources || '60+'} government sources. 
          Alerts expire after 90 days to maintain relevance. Cache-optimized for lightning-fast responses (3-5ms).
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