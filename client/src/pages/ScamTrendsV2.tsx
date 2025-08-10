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
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  agency: string;
  riskLevel: 'info' | 'low' | 'medium' | 'high' | 'critical';
  scamTypes: string[] | null;
  targetDemographics: string[] | null;
  affectedStates: string[] | null;
  elderRelevanceScore: number;
}

interface ThreatSummary {
  criticalThreats: number;
  highThreats: number;
  totalThreats: number;
  totalReports: number;
  reportsThisWeek: number;
}

export default function ScamTrendsV2() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: trendsData, isLoading: trendsLoading } = useQuery<{
    trends: ScamTrend[];
    lastUpdated: string;
  }>({
    queryKey: ["/api/v2/scam-trends"],
    refetchInterval: 300000, // 5 minutes
  });

  const { data: threatData, isLoading: threatLoading } = useQuery<{
    threats: any[];
    summary: ThreatSummary;
    lastUpdated: string;
  }>({
    queryKey: ["/api/v2/threat-intelligence"],
    refetchInterval: 300000,
  });

  const filteredTrends = trendsData?.trends.filter(trend =>
    !searchQuery || 
    trend.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    trend.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    trend.agency.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (trend.scamTypes && trend.scamTypes.some(type => 
      type.toLowerCase().includes(searchQuery.toLowerCase())
    ))
  );

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

  if (trendsLoading || threatLoading) {
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Scam Trends</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Live scam alerts and warnings from government sources
          </p>
        </div>
        <div className="text-right text-sm text-gray-500">
          <div>Last updated: {trendsData?.lastUpdated ? new Date(trendsData.lastUpdated).toLocaleString() : 'Loading...'}</div>
          <div className="flex items-center gap-1 mt-1">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            Live monitoring active
          </div>
        </div>
      </div>

      {/* Threat Summary */}
      {threatData?.summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600 dark:text-red-400">Critical Threats</p>
                  <p className="text-2xl font-bold text-red-900 dark:text-red-100">{threatData.summary.criticalThreats}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600 dark:text-orange-400">High Priority</p>
                  <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">{threatData.summary.highThreats}</p>
                </div>
                <Shield className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">This Week</p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{threatData.summary.reportsThisWeek}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">Total Reports</p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                    {threatData.summary.totalReports.toLocaleString()}
                  </p>
                </div>
                <MapPin className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search scam types, agencies, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={() => setSearchQuery("")}>
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* No results message */}
      {filteredTrends?.length === 0 && searchQuery && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            No scam trends found matching "{searchQuery}". Try different keywords or clear your search.
          </AlertDescription>
        </Alert>
      )}

      {/* Scam Trends List */}
      <div className="space-y-4">
        {filteredTrends?.map((trend) => (
          <Card key={trend.id} className="hover:shadow-lg transition-shadow border-l-4 border-l-red-400">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={getRiskColor(trend.riskLevel)}>
                      {trend.riskLevel.toUpperCase()}
                    </Badge>
                    <Badge variant="outline" className="text-blue-600 border-blue-200 dark:text-blue-400">
                      {trend.agency}
                    </Badge>
                    {trend.elderRelevanceScore > 70 && (
                      <Badge className="bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900 dark:text-purple-100">
                        Elder-Targeted
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-xl">{trend.title}</CardTitle>
                </div>
                <div className="text-right text-sm text-gray-500 ml-4">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(trend.publishedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                {trend.description}
              </p>

              {/* Scam Types */}
              {trend.scamTypes && trend.scamTypes.length > 0 && (
                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Scam Types:</p>
                  <div className="flex flex-wrap gap-2">
                    {trend.scamTypes.map((type) => (
                      <Badge key={type} className={getScamTypeColor(type)}>
                        {formatScamType(type)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Target Demographics */}
              {trend.targetDemographics && trend.targetDemographics.length > 0 && (
                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Primary Targets:</p>
                  <div className="flex flex-wrap gap-2">
                    {trend.targetDemographics.map((demo) => (
                      <Badge key={demo} variant="secondary">
                        {demo.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Affected States */}
              {trend.affectedStates && trend.affectedStates.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Affected Areas:</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {trend.affectedStates.join(', ')}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>Elder Relevance: {trend.elderRelevanceScore}%</span>
                  <span>Source: {trend.agency}</span>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <a 
                    href={trend.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1"
                  >
                    View Official Source
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Data Source Note */}
      <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
        <CardContent className="p-4">
          <div className="text-center space-y-2">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Data sourced exclusively from official government agencies
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-300">
              Including FTC, FBI, SSA, CISA, SEC, state attorney generals, and verified nonprofit organizations
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}