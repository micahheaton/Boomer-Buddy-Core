import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Search, Shield, ExternalLink, Clock, MapPin, TrendingUp } from "lucide-react";

interface ScamTrend {
  id: string;
  type: 'scam-alert' | 'news';
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  agency: string;
  riskLevel: 'info' | 'low' | 'medium' | 'high' | 'critical';
  scamTypes?: string[] | null;
  targetDemographics?: string[] | null;
  affectedStates?: string[] | null;
  elderRelevanceScore?: number;
  reportCount?: number;
  reliability?: number;
  simplifiedLanguage?: string;
  actionableSteps?: string[];
  authorityBadge?: string;
  geographicRelevance?: string[];
  category?: string;
  tags?: string[];
  enhancedData?: boolean;
}

interface ThreatSummary {
  criticalThreats: number;
  highThreats: number;
  totalThreats: number;
  totalReports: number;
  reportsThisWeek: number;
  comprehensiveCollection?: boolean;
  sourcesCovered?: string;
  enhancedData?: boolean;
}

export default function ScamTrendsV2() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<'all' | 'scam-alert' | 'news'>('all');

  const { data: trendsData, isLoading: trendsLoading } = useQuery<{
    trends: ScamTrend[];
    metadata: {
      total: number;
      scamTrends: number;
      newsItems: number;
      lastUpdated: string;
      sourceType: string;
      criticalAlerts?: number;
      highAlerts?: number;
      coverage?: string;
    };
  }>({
    queryKey: ["/api/trends"], // Use the enhanced trends endpoint
    refetchInterval: 300000, // 5 minutes
  });

  const { data: sourcesData } = useQuery<{
    sources: any[];
    stats: any;
    comprehensiveCollection?: boolean;
    totalSources?: number;
  }>({
    queryKey: ["/api/v2/data-sources"],
    refetchInterval: 300000,
  });

  const filteredTrends = trendsData?.trends.filter(trend => {
    const matchesSearch = !searchQuery || 
      trend.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trend.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trend.agency.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (trend.scamTypes && trend.scamTypes.some(type => 
        type.toLowerCase().includes(searchQuery.toLowerCase())
      ));
    
    const matchesType = selectedType === 'all' || trend.type === selectedType;
    
    return matchesSearch && matchesType;
  });

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-100';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900 dark:text-orange-100';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-100';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-100';
      default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-100';
    }
  };

  const getScamTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      phone: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300',
      email: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
      medicare: 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
      social_security: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
      investment: 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300',
      romance: 'bg-pink-50 text-pink-700 dark:bg-pink-950 dark:text-pink-300',
    };
    return colors[type] || 'bg-gray-50 text-gray-700 dark:bg-gray-900 dark:text-gray-300';
  };

  const formatScamType = (type: string) => {
    const formats: Record<string, string> = {
      phone: 'Phone Scam',
      email: 'Email/Phishing',
      medicare: 'Medicare Fraud',
      social_security: 'Social Security',
      investment: 'Investment Fraud',
      romance: 'Romance Scam',
      tech_support: 'Tech Support',
      family_emergency: 'Family Emergency',
    };
    return formats[type] || type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (trendsLoading) {
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Scam Trends & News</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Comprehensive data from {sourcesData?.stats?.totalSources || '60+'} government sources across all 50 states (2024-2025)
          </p>
        </div>
        <div className="text-right text-sm text-gray-500">
          <div>Last updated: {trendsData?.metadata?.lastUpdated ? new Date(trendsData.metadata.lastUpdated).toLocaleString() : 'Loading...'}</div>
          <div className="flex items-center gap-1 mt-1">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            {sourcesData?.stats?.totalSources || 15}+ government sources active
          </div>
        </div>
      </div>

      {/* Data Summary */}
      {trendsData?.metadata && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Total Items</p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {trendsData.metadata.total}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">Scam Alerts</p>
                  <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                    {trendsData.metadata.scamTrends}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">News Items</p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                    {trendsData.metadata.newsItems}
                  </p>
                </div>
                <Shield className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-purple-50 border-purple-200 dark:bg-purple-950 dark:border-purple-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-800 dark:text-purple-200">Data Sources</p>
                  <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                    {sourcesData?.stats?.totalSources || '15+'}
                  </p>
                </div>
                <MapPin className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

        </div>
      )}

      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search alerts, news, agencies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={selectedType === 'all' ? 'default' : 'outline'}
            onClick={() => setSelectedType('all')}
            size="sm"
          >
            All ({trendsData?.metadata?.total || 0})
          </Button>
          <Button
            variant={selectedType === 'scam-alert' ? 'default' : 'outline'}
            onClick={() => setSelectedType('scam-alert')}
            size="sm"
          >
            Alerts ({trendsData?.metadata?.scamTrends || 0})
          </Button>
          <Button
            variant={selectedType === 'news' ? 'default' : 'outline'}
            onClick={() => setSelectedType('news')}
            size="sm"
          >
            News ({trendsData?.metadata?.newsItems || 0})
          </Button>
        </div>
      </div>

      {/* Historical Data Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredTrends?.map((trend) => (
          <Card key={trend.id} className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getRiskColor(trend.riskLevel)}>
                      {trend.riskLevel.toUpperCase()}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {trend.type === 'scam-alert' ? 'ALERT' : 'NEWS'}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg leading-tight">{trend.title}</CardTitle>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
                {trend.description}
              </p>
              
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(trend.publishedAt).toLocaleDateString()}
                </div>
                <span>{trend.agency}</span>
              </div>
              
              {trend.scamTypes && trend.scamTypes.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {trend.scamTypes.slice(0, 2).map((type) => (
                    <Badge key={type} className={getScamTypeColor(type)} variant="secondary">
                      {formatScamType(type)}
                    </Badge>
                  ))}
                  {trend.scamTypes.length > 2 && (
                    <Badge variant="secondary" className="text-xs">
                      +{trend.scamTypes.length - 2} more
                    </Badge>
                  )}
                </div>
              )}
              
              {trend.elderRelevanceScore && trend.elderRelevanceScore > 70 && (
                <div className="flex items-center gap-1 text-amber-600">
                  <AlertTriangle className="h-3 w-3" />
                  <span className="text-xs font-medium">High Elder Risk</span>
                </div>
              )}
              
              <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => window.open(trend.url, '_blank')}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  View Official Source
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {filteredTrends?.length === 0 && (
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

      {/* Data Authenticity Notice */}
      <Alert className="mt-8">
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Comprehensive Government Collection:</strong> Enhanced system now monitoring {sourcesData?.stats?.totalSources || '60+'} sources from all 50 states plus federal agencies. 
          Intelligent triage distinguishes between scam alerts and government news. Updated 4x daily from verified .gov/.us domains.
        </AlertDescription>
      </Alert>
    </div>
  );
}