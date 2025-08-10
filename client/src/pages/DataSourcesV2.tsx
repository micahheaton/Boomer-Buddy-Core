import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  RefreshCw, 
  Globe, 
  Building, 
  Heart,
  Database,
  Activity,
  Clock
} from "lucide-react";

interface DataSource {
  id: string;
  name: string;
  agency: string;
  sourceType: 'federal' | 'state' | 'nonprofit';
  isActive: boolean;
  lastChecked: string | null;
  lastSuccessful: string | null;
  itemCount: number;
  errorCount: number;
}

interface SourceSummary {
  totalSources: number;
  activeSources: number;
  onlineSources: number;
  totalItems: number;
  lastUpdate: string;
}

export default function DataSourcesV2() {
  const { data: sourcesData, isLoading, refetch } = useQuery<{
    sources: DataSource[];
    summary: SourceSummary;
  }>({
    queryKey: ["/api/v2/data-sources"],
    refetchInterval: 60000, // 1 minute
  });

  const getSourceTypeIcon = (type: string) => {
    switch (type) {
      case 'federal': return <Shield className="h-5 w-5" />;
      case 'state': return <Building className="h-5 w-5" />;
      case 'nonprofit': return <Heart className="h-5 w-5" />;
      default: return <Globe className="h-5 w-5" />;
    }
  };

  const getSourceTypeColor = (type: string) => {
    switch (type) {
      case 'federal': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-100';
      case 'state': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-100';
      case 'nonprofit': return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900 dark:text-purple-100';
      default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-100';
    }
  };

  const getStatusIcon = (source: DataSource) => {
    if (!source.isActive) return <XCircle className="h-4 w-4 text-gray-400" />;
    if (source.errorCount > 5) return <XCircle className="h-4 w-4 text-red-500" />;
    if (source.errorCount > 0) return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    if (source.lastSuccessful) return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <Clock className="h-4 w-4 text-gray-400" />;
  };

  const getStatusText = (source: DataSource) => {
    if (!source.isActive) return { text: 'Inactive', color: 'text-gray-500' };
    if (source.errorCount > 5) return { text: 'Offline', color: 'text-red-500' };
    if (source.errorCount > 0) return { text: 'Issues', color: 'text-yellow-500' };
    if (source.lastSuccessful) return { text: 'Online', color: 'text-green-500' };
    return { text: 'Pending', color: 'text-gray-500' };
  };

  const formatLastSeen = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Data Sources</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Official government and verified nonprofit RSS feeds
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => refetch()}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Status
        </Button>
      </div>

      {/* Summary Statistics */}
      {sourcesData?.summary && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Sources</p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {sourcesData.summary.totalSources}
                  </p>
                </div>
                <Database className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">Online</p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                    {sourcesData.summary.onlineSources}
                  </p>
                </div>
                <Activity className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Active</p>
                  <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                    {sourcesData.summary.activeSources}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 border-purple-200 dark:bg-purple-950 dark:border-purple-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Total Items</p>
                  <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                    {sourcesData.summary.totalItems.toLocaleString()}
                  </p>
                </div>
                <Globe className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-50 border-gray-200 dark:bg-gray-950 dark:border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Updated</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {formatLastSeen(sourcesData.summary.lastUpdate)}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-gray-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Federal Sources */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-500" />
          Federal Agencies
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sourcesData?.sources
            .filter(source => source.sourceType === 'federal')
            .map((source) => (
              <Card key={source.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{source.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={getSourceTypeColor(source.sourceType)}>
                          <div className="flex items-center gap-1">
                            {getSourceTypeIcon(source.sourceType)}
                            {source.agency}
                          </div>
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(source)}
                      <span className={`text-sm font-medium ${getStatusText(source).color}`}>
                        {getStatusText(source).text}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Items Collected</p>
                      <p className="font-semibold">{source.itemCount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Error Count</p>
                      <p className="font-semibold">{source.errorCount}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Last Checked</p>
                      <p className="font-semibold">{formatLastSeen(source.lastChecked)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Last Success</p>
                      <p className="font-semibold">{formatLastSeen(source.lastSuccessful)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      </div>

      {/* State Sources */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Building className="h-5 w-5 text-green-500" />
          State Agencies
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sourcesData?.sources
            .filter(source => source.sourceType === 'state')
            .map((source) => (
              <Card key={source.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{source.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={getSourceTypeColor(source.sourceType)}>
                          <div className="flex items-center gap-1">
                            {getSourceTypeIcon(source.sourceType)}
                            {source.agency}
                          </div>
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(source)}
                      <span className={`text-sm font-medium ${getStatusText(source).color}`}>
                        {getStatusText(source).text}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Items Collected</p>
                      <p className="font-semibold">{source.itemCount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Error Count</p>
                      <p className="font-semibold">{source.errorCount}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Last Checked</p>
                      <p className="font-semibold">{formatLastSeen(source.lastChecked)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Last Success</p>
                      <p className="font-semibold">{formatLastSeen(source.lastSuccessful)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      </div>

      {/* Nonprofit Sources */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Heart className="h-5 w-5 text-purple-500" />
          Trusted Nonprofits
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sourcesData?.sources
            .filter(source => source.sourceType === 'nonprofit')
            .map((source) => (
              <Card key={source.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{source.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={getSourceTypeColor(source.sourceType)}>
                          <div className="flex items-center gap-1">
                            {getSourceTypeIcon(source.sourceType)}
                            {source.agency}
                          </div>
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(source)}
                      <span className={`text-sm font-medium ${getStatusText(source).color}`}>
                        {getStatusText(source).text}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Items Collected</p>
                      <p className="font-semibold">{source.itemCount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Error Count</p>
                      <p className="font-semibold">{source.errorCount}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Last Checked</p>
                      <p className="font-semibold">{formatLastSeen(source.lastChecked)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Last Success</p>
                      <p className="font-semibold">{formatLastSeen(source.lastSuccessful)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      </div>

      {/* Footer Note */}
      <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
        <CardContent className="p-4">
          <div className="text-center space-y-2">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
              All data sources verified and monitored 24/7
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-300">
              Automatic collection runs every 6 hours from official government and trusted nonprofit RSS feeds
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}