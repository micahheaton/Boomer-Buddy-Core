import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  MapPin, 
  ExternalLink, 
  Search, 
  Calendar,
  Database,
  Globe,
  Shield,
  RefreshCw,
  BarChart3,
  Users,
  FileText
} from "lucide-react";

interface LiveTrend {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  firstReported: string;
  lastUpdated: string;
  reportCount: number;
  affectedRegions: string[];
  sources: {
    name: string;
    url: string;
    publishDate: string;
    reliability: number;
  }[];
  tags: string[];
  isActive: boolean;
}

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  content: string;
  publishDate: string;
  source: {
    name: string;
    url: string;
    reliability: number;
  };
  category: string;
  relatedTrends: string[];
  isVerified: boolean;
}

export default function EnhancedTrendsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  
  const { data: trendsData, isLoading: trendsLoading, error: trendsError } = useQuery({
    queryKey: ["/api/trends"],
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  const { data: newsData, isLoading: newsLoading } = useQuery({
    queryKey: ["/api/news"],
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
  });

  const { data: archiveData } = useQuery({
    queryKey: ["/api/trends/archive"],
    refetchInterval: 60 * 60 * 1000, // Refetch every hour
  });

  const trends: LiveTrend[] = (trendsData as any)?.trends || [];
  const news: NewsItem[] = (newsData as any)?.news || [];
  const lastUpdate = (trendsData as any)?.lastUpdate ? new Date((trendsData as any).lastUpdate) : null;
  const nextUpdate = (trendsData as any)?.nextUpdate ? new Date((trendsData as any).nextUpdate) : null;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return '🔴';
      case 'high': return '🟠';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  const getReliabilityColor = (reliability: number) => {
    if (reliability >= 0.9) return 'text-green-600';
    if (reliability >= 0.8) return 'text-blue-600';
    if (reliability >= 0.7) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks}w ago`;
  };

  const filteredTrends = trends.filter(trend => {
    const matchesSearch = searchQuery === "" || 
      trend.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trend.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trend.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === "all" || trend.category.toLowerCase().includes(selectedCategory.toLowerCase());
    
    return matchesSearch && matchesCategory;
  });

  const categories = ["all", ...Array.from(new Set(trends.map(trend => trend.category)))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Header with Live Status */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <Database className="h-8 w-8 text-boomer-navy" />
                Live Scam Intelligence Center
              </h1>
              <p className="text-gray-600">
                Real-time scam trends and verified news from trusted sources
              </p>
            </div>
            
            {/* System Status */}
            <div className="text-right">
              <div className="flex items-center gap-2 text-sm text-green-600 mb-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Live Data Sources Active</span>
              </div>
              {lastUpdate && (
                <div className="text-xs text-gray-500">
                  Last update: {formatTimeAgo(lastUpdate.toISOString())}
                </div>
              )}
              {nextUpdate && (
                <div className="text-xs text-gray-500">
                  Next update: {formatTimeAgo(nextUpdate.toISOString())}
                </div>
              )}
            </div>
          </div>

          {/* Key Stats */}
          {trendsData && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card className="p-4">
                <div className="text-2xl font-bold text-boomer-navy">{trends.length}</div>
                <div className="text-sm text-gray-600">Active Threats</div>
              </Card>
              <Card className="p-4">
                <div className="text-2xl font-bold text-red-600">{((trendsData as any)?.totalReports || 0).toLocaleString()}</div>
                <div className="text-sm text-gray-600">Total Reports</div>
              </Card>
              <Card className="p-4">
                <div className="text-2xl font-bold text-green-600">{news.length}</div>
                <div className="text-sm text-gray-600">Verified News</div>
              </Card>
              <Card className="p-4">
                <div className="text-2xl font-bold text-blue-600">24/7</div>
                <div className="text-sm text-gray-600">Monitoring</div>
              </Card>
            </div>
          )}
        </div>

        <Tabs defaultValue="trends" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="trends">Live Trends</TabsTrigger>
            <TabsTrigger value="news">Verified News</TabsTrigger>
            <TabsTrigger value="archive">Archives</TabsTrigger>
            <TabsTrigger value="sources">Data Sources</TabsTrigger>
          </TabsList>

          {/* Live Trends Tab */}
          <TabsContent value="trends" className="space-y-6">
            {/* Search and Filters */}
            <div className="flex gap-4 flex-wrap">
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search trends, categories, or tags..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                {categories.map((category, index) => (
                  <option key={`${category}-${index}`} value={category}>
                    {category === "all" ? "All Categories" : category}
                  </option>
                ))}
              </select>
            </div>

            {/* Trends Grid */}
            {trendsLoading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-200 rounded"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : trendsError ? (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Unable to load live trends data. Please check your connection and try again.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredTrends.map((trend) => (
                  <Card key={trend.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg flex items-center gap-2 mb-2">
                            <span>{getSeverityIcon(trend.severity)}</span>
                            {trend.title}
                          </CardTitle>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getSeverityColor(trend.severity)}>
                              {trend.severity?.toUpperCase() || 'UNKNOWN'}
                            </Badge>
                            <Badge variant="outline">{trend.category}</Badge>
                          </div>
                        </div>
                      </div>
                      <CardDescription>{trend.description}</CardDescription>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      {/* Statistics */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-red-500" />
                          <span>{(trend.reportCount || 0).toLocaleString()} reports</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span>{formatTimeAgo(trend.lastUpdated)}</span>
                        </div>
                      </div>

                      {/* Affected Regions */}
                      <div>
                        <div className="flex items-center gap-2 text-sm font-medium mb-2">
                          <MapPin className="h-4 w-4 text-blue-500" />
                          Affected Regions
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {trend.affectedRegions.slice(0, 3).map(region => (
                            <Badge key={region} variant="outline" className="text-xs">
                              {region}
                            </Badge>
                          ))}
                          {trend.affectedRegions.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{trend.affectedRegions.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Sources */}
                      <div>
                        <div className="flex items-center gap-2 text-sm font-medium mb-2">
                          <Shield className="h-4 w-4 text-green-500" />
                          Verified Sources ({trend.sources.length})
                        </div>
                        <div className="space-y-1">
                          {trend.sources.slice(0, 2).map((source, idx) => (
                            <div key={idx} className="flex items-center justify-between">
                              <a 
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                              >
                                {source.name}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                              <span className={`text-xs ${getReliabilityColor(source.reliability)}`}>
                                {Math.round(source.reliability * 100)}% reliable
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1">
                        {trend.tags.slice(0, 4).map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Verified News Tab */}
          <TabsContent value="news" className="space-y-6">
            {newsLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-3 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                {news.map((item) => (
                  <Card key={item.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-xl mb-2">{item.title}</CardTitle>
                          <div className="flex items-center gap-3 text-sm text-gray-600 mb-3">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {formatTimeAgo(item.publishDate)}
                            </div>
                            <Badge className="bg-green-100 text-green-800">
                              {item.category}
                            </Badge>
                            {item.isVerified && (
                              <Badge className="bg-blue-100 text-blue-800">
                                <Shield className="h-3 w-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <CardDescription className="text-base">{item.summary}</CardDescription>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <p className="text-gray-700">{item.content}</p>
                      
                      <div className="flex items-center justify-between border-t pt-4">
                        <div className="flex items-center gap-2">
                          <a 
                            href={item.source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline font-medium flex items-center gap-1"
                          >
                            {item.source.name}
                            <ExternalLink className="h-4 w-4" />
                          </a>
                          <span className={`text-sm ${getReliabilityColor(item.source.reliability)}`}>
                            ({Math.round(item.source.reliability * 100)}% reliable)
                          </span>
                        </div>
                        
                        {item.relatedTrends.length > 0 && (
                          <Badge variant="outline">
                            Related to {item.relatedTrends.length} trend(s)
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Archive Tab */}
          <TabsContent value="archive" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Weekly Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(archiveData as any)?.weekly && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-2xl font-bold text-red-600">
                            {((archiveData as any).weekly.totalScams || 0).toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-600">Total Scams</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-blue-600">
                            {(archiveData as any).weekly.newTrends || 0}
                          </div>
                          <div className="text-sm text-gray-600">New Trends</div>
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium mb-1">Top Category</div>
                        <Badge>{(archiveData as any).weekly.topCategory || 'Unknown'}</Badge>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Monthly Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(archiveData as any)?.monthly && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-2xl font-bold text-red-600">
                            {((archiveData as any).monthly.totalScams || 0).toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-600">Total Scams</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-blue-600">
                            {(archiveData as any).monthly.newTrends || 0}
                          </div>
                          <div className="text-sm text-gray-600">New Trends</div>
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium mb-1">Top Category</div>
                        <Badge>{(archiveData as any).monthly.topCategory || 'Unknown'}</Badge>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Data Sources Tab */}
          <TabsContent value="sources" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  name: "Federal Trade Commission",
                  type: "Government Agency",
                  reliability: 0.96,
                  description: "Consumer Sentinel Network data and consumer alerts",
                  url: "https://consumer.ftc.gov",
                  updateFrequency: "Daily"
                },
                {
                  name: "FBI Internet Crime Complaint Center",
                  type: "Law Enforcement",
                  reliability: 0.97,
                  description: "Internet crime reports and public service announcements",
                  url: "https://www.ic3.gov",
                  updateFrequency: "Real-time"
                },
                {
                  name: "Better Business Bureau",
                  type: "Consumer Protection",
                  reliability: 0.93,
                  description: "Scam tracker and business reliability reports",
                  url: "https://www.bbb.org",
                  updateFrequency: "Hourly"
                },
                {
                  name: "AARP Fraud Watch",
                  type: "Senior Protection",
                  reliability: 0.94,
                  description: "Fraud alerts and prevention resources for seniors",
                  url: "https://www.aarp.org/money/scams-fraud/",
                  updateFrequency: "Daily"
                }
              ].map((source, idx) => (
                <Card key={idx}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {source.name}
                      <Badge className={getReliabilityColor(source.reliability)}>
                        {Math.round(source.reliability * 100)}%
                      </Badge>
                    </CardTitle>
                    <CardDescription>{source.type}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm">{source.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        Updates: {source.updateFrequency}
                      </span>
                      <a 
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1"
                      >
                        Visit Source
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}