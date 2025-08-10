import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Filter, MapPin, AlertTriangle, TrendingUp, Eye, Calendar, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

interface FilterOptions {
  category?: string[];
  severity?: string[];
  agency?: string[];
  searchQuery?: string;
  sortBy?: string;
  sortOrder?: string;
}

interface TrendItem {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: string;
  reportCount: number;
  affectedRegions: string[];
  tags: string[];
  sources: Array<{
    name: string;
    url: string;
    reliability: number;
  }>;
  firstReported: string;
  lastReported: string;
}

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  source: {
    name: string;
    agency: string;
    url: string;
    reliability: number;
  };
  publishDate: string;
}

interface Statistics {
  trends: {
    total: number;
    critical: number;
    high: number;
    totalReports: number;
    byAgency: { [key: string]: number };
    byCategory: { [key: string]: number };
  };
  news: {
    total: number;
    byAgency: { [key: string]: number };
    averageReliability: number;
  };
}

const SeverityBadge = ({ severity }: { severity: string }) => {
  const colors = {
    critical: 'bg-red-100 text-red-800 border-red-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-green-100 text-green-800 border-green-200'
  };
  
  return (
    <Badge variant="outline" className={colors[severity] || colors.low}>
      {severity.toUpperCase()}
    </Badge>
  );
};

const ReliabilityIndicator = ({ reliability }: { reliability: number }) => {
  const percentage = Math.round(reliability * 100);
  const color = percentage >= 95 ? 'text-green-600' : percentage >= 85 ? 'text-yellow-600' : 'text-red-600';
  
  return (
    <span className={`text-sm font-medium ${color}`}>
      {percentage}% reliable
    </span>
  );
};

export default function EnhancedTrends() {
  const [filters, setFilters] = useState<FilterOptions>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("trends");

  // Fetch filter options
  const { data: filterOptions } = useQuery({
    queryKey: ["/api/filter/options"],
  });

  // Fetch filtered trends
  const { data: trendsData, isLoading: trendsLoading } = useQuery({
    queryKey: ["/api/filter/trends", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (filters.category?.length) params.set('category', filters.category.join(','));
      if (filters.severity?.length) params.set('severity', filters.severity.join(','));
      if (filters.agency?.length) params.set('agency', filters.agency.join(','));
      if (filters.searchQuery) params.set('q', filters.searchQuery);
      if (filters.sortBy) params.set('sortBy', filters.sortBy);
      if (filters.sortOrder) params.set('sortOrder', filters.sortOrder);
      
      const response = await fetch(`/api/filter/trends?${params}`);
      return response.json();
    },
  });

  // Fetch filtered news
  const { data: newsData, isLoading: newsLoading } = useQuery({
    queryKey: ["/api/filter/news", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (filters.category?.length) params.set('category', filters.category.join(','));
      if (filters.agency?.length) params.set('agency', filters.agency.join(','));
      if (filters.searchQuery) params.set('q', filters.searchQuery);
      if (filters.sortBy) params.set('sortBy', filters.sortBy);
      if (filters.sortOrder) params.set('sortOrder', filters.sortOrder);
      
      const response = await fetch(`/api/filter/news?${params}`);
      return response.json();
    },
  });

  const handleSearch = () => {
    setFilters(prev => ({ ...prev, searchQuery: searchTerm }));
  };

  const handleFilterChange = (key: string, value: string | string[]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm("");
  };

  const trends: TrendItem[] = trendsData?.trends || [];
  const news: NewsItem[] = newsData?.news || [];
  const statistics: Statistics = trendsData?.statistics || newsData?.statistics || {
    trends: { total: 0, critical: 0, high: 0, totalReports: 0, byAgency: {}, byCategory: {} },
    news: { total: 0, byAgency: {}, averageReliability: 0 }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Live Scam Intelligence Center</h1>
          <p className="text-muted-foreground">Real-time scam trends and verified news from trusted sources</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-green-600 font-medium">Live Data Sources Active</span>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <div className="text-2xl font-bold text-red-600">{statistics.trends.critical}</div>
                <p className="text-sm text-muted-foreground">Critical Threats</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              <div>
                <div className="text-2xl font-bold">{statistics.trends.totalReports.toLocaleString()}</div>
                <p className="text-sm text-muted-foreground">Total Reports</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Eye className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{statistics.news.total}</div>
                <p className="text-sm text-muted-foreground">Verified News</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">24/7</div>
                <p className="text-sm text-muted-foreground">Monitoring</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter Bar */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 flex space-x-2">
              <Input
                placeholder="Search trends, categories, or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch} size="icon">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <Select onValueChange={(value) => handleFilterChange('category', [value])}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  {filterOptions?.categories?.all?.map((cat: string) => (
                    <SelectItem key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select onValueChange={(value) => handleFilterChange('agency', [value])}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="All Agencies" />
                </SelectTrigger>
                <SelectContent>
                  {filterOptions?.agencies?.all?.map((agency: string) => (
                    <SelectItem key={agency} value={agency}>
                      {agency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {activeTab === 'trends' && (
                <Select onValueChange={(value) => handleFilterChange('severity', [value])}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="All Severities" />
                  </SelectTrigger>
                  <SelectContent>
                    {filterOptions?.severities?.map((severity: string) => (
                      <SelectItem key={severity} value={severity}>
                        {severity.charAt(0).toUpperCase() + severity.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              
              <Select onValueChange={(value) => handleFilterChange('sortBy', value)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort by Date" />
                </SelectTrigger>
                <SelectContent>
                  {filterOptions?.sortOptions?.map((option: any) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button variant="outline" onClick={clearFilters}>
                <Filter className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends">Live Trends</TabsTrigger>
          <TabsTrigger value="news">Verified News</TabsTrigger>
          <TabsTrigger value="map">National Heatmap</TabsTrigger>
          <TabsTrigger value="sources">Data Sources</TabsTrigger>
        </TabsList>
        
        <TabsContent value="trends" className="space-y-4">
          {trendsLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : trends.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No trends match your current filters.</p>
              </CardContent>
            </Card>
          ) : (
            trends.map((trend) => (
              <Card key={trend.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-xl">{trend.title}</CardTitle>
                      <div className="flex items-center space-x-4">
                        <SeverityBadge severity={trend.severity} />
                        <Badge variant="secondary">{trend.category}</Badge>
                        <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                          <AlertTriangle className="h-4 w-4" />
                          <span>{trend.reportCount} reports</span>
                        </div>
                        {trend.affectedRegions.length > 0 && (
                          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>Active in {trend.affectedRegions.length} regions</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <div>Last updated</div>
                      <div>{new Date(trend.lastReported).toLocaleDateString()}</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4">
                    {trend.description}
                  </CardDescription>
                  
                  {trend.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {trend.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {trend.sources.map((source, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Building className="h-4 w-4" />
                          <span className="text-sm font-medium">{source.name}</span>
                          <ReliabilityIndicator reliability={source.reliability} />
                        </div>
                      ))}
                    </div>
                    <div className="flex space-x-2">
                      {trend.sources.map((source, index) => (
                        <Button key={index} variant="outline" size="sm" asChild>
                          <a href={source.url} target="_blank" rel="noopener noreferrer">
                            View Source
                          </a>
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
        
        <TabsContent value="news" className="space-y-4">
          {newsLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : news.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No news articles match your current filters.</p>
              </CardContent>
            </Card>
          ) : (
            news.map((article) => (
              <Card key={article.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-xl">{article.title}</CardTitle>
                      <div className="flex items-center space-x-4">
                        <Badge variant="secondary">{article.category}</Badge>
                        <div className="flex items-center space-x-2">
                          <Building className="h-4 w-4" />
                          <span className="text-sm font-medium">{article.source.agency}</span>
                          <ReliabilityIndicator reliability={article.source.reliability} />
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <div>Published</div>
                      <div>{new Date(article.publishDate).toLocaleDateString()}</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4">
                    {article.summary}
                  </CardDescription>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Source: {article.source.name}
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a href={article.source.url} target="_blank" rel="noopener noreferrer">
                        Read Full Article
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
        
        <TabsContent value="map" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>National Scam Activity Heatmap</CardTitle>
              <CardDescription>
                Real-time visualization of active scam campaigns across the United States
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96 bg-gradient-to-br from-blue-50 to-green-50 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                <div className="text-center space-y-2">
                  <MapPin className="h-12 w-12 mx-auto text-blue-500" />
                  <h3 className="text-lg font-semibold">Interactive Heatmap</h3>
                  <p className="text-muted-foreground max-w-md">
                    Live map showing scam activity intensity by region. Areas with higher activity 
                    are highlighted in red, with real-time updates from verified sources.
                  </p>
                  <div className="flex justify-center space-x-4 mt-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-green-500 rounded"></div>
                      <span className="text-sm">Low Activity</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                      <span className="text-sm">Moderate Activity</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-red-500 rounded"></div>
                      <span className="text-sm">High Activity</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="sources" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filterOptions?.agencies?.all?.map((agency: string) => {
              const trendCount = statistics.trends.byAgency[agency] || 0;
              const newsCount = statistics.news.byAgency[agency] || 0;
              
              return (
                <Card key={agency}>
                  <CardHeader>
                    <CardTitle className="text-lg">{agency}</CardTitle>
                    <div className="flex items-center space-x-2">
                      <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-green-600">Active</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Active Trends:</span>
                        <span className="text-sm font-medium">{trendCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">News Articles:</span>
                        <span className="text-sm font-medium">{newsCount}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="text-sm">Reliability:</span>
                        <ReliabilityIndicator reliability={0.93} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}