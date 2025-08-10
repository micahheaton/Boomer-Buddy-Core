import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar, FileText, TrendingUp, AlertTriangle, Shield, Clock, BarChart3 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

interface ArchiveData {
  operationalSince: string;
  monthsOperational: number;
  summary: {
    totalTrends: number;
    totalNews: number;
    totalReports: number;
    averageTrendsPerMonth: number;
    averageNewsPerMonth: number;
  };
  trendsByMonth: { [key: string]: any[] };
  newsByMonth: { [key: string]: any[] };
  availableMonths: string[];
}

export default function Archives() {
  const [selectedMonth, setSelectedMonth] = useState<string>("");

  const { data: archiveData, isLoading } = useQuery<ArchiveData>({
    queryKey: ["/api/archives"],
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!archiveData) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Unable to load archive data.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const operationalDate = new Date(archiveData.operationalSince);
  const selectedTrends = selectedMonth ? (archiveData.trendsByMonth[selectedMonth] || []) : [];
  const selectedNews = selectedMonth ? (archiveData.newsByMonth[selectedMonth] || []) : [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Boomer Buddy Archives</h1>
          <p className="text-muted-foreground">
            Official government data collection since summer {operationalDate.getFullYear()} launch
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Shield className="h-8 w-8 text-blue-600" />
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{archiveData.monthsOperational}</div>
            <div className="text-sm text-muted-foreground">Months Operational</div>
          </div>
        </div>
      </div>

      {/* Operational Summary */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{archiveData.monthsOperational}</div>
                <p className="text-sm text-muted-foreground">Months Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <div className="text-2xl font-bold">{archiveData.summary.totalTrends.toLocaleString()}</div>
                <p className="text-sm text-muted-foreground">Scam Trends</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{archiveData.summary.totalNews.toLocaleString()}</div>
                <p className="text-sm text-muted-foreground">News Articles</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              <div>
                <div className="text-2xl font-bold">{archiveData.summary.totalReports.toLocaleString()}</div>
                <p className="text-sm text-muted-foreground">Total Reports</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">{archiveData.summary.averageTrendsPerMonth}</div>
                <p className="text-sm text-muted-foreground">Avg/Month</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Archive Navigator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Historical Data Browser</span>
          </CardTitle>
          <CardDescription>
            Browse {archiveData.monthsOperational} months of official government data from 9 verified sources (.gov/.us domains only)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Select onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select month to view" />
              </SelectTrigger>
              <SelectContent>
                {archiveData.availableMonths.map((month) => (
                  <SelectItem key={month} value={month}>
                    {new Date(month + '-01').toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long' 
                    })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selectedMonth && (
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <span>{selectedTrends.length} scam trends</span>
                <span>•</span>
                <span>{selectedNews.length} news articles</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Archive View */}
      {selectedMonth && (
        <Tabs defaultValue="trends" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="trends">
              Scam Trends ({selectedTrends.length})
            </TabsTrigger>
            <TabsTrigger value="news">
              Verified News ({selectedNews.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="trends" className="space-y-4">
            {selectedTrends.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">No scam trends recorded for this month.</p>
                </CardContent>
              </Card>
            ) : (
              selectedTrends.map((trend) => (
                <Card key={trend.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <CardTitle className="text-xl">{trend.title}</CardTitle>
                        <div className="flex items-center space-x-4">
                          <Badge 
                            variant={
                              trend.severity === 'critical' ? 'destructive' : 
                              trend.severity === 'high' ? 'default' : 'secondary'
                            }
                          >
                            {trend.severity.toUpperCase()}
                          </Badge>
                          <Badge variant="outline">{trend.category}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {(trend.reportCount || 0).toLocaleString()} reports
                          </span>
                        </div>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <div>First reported</div>
                        <div>{new Date(trend.firstReported).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="mb-4">
                      {trend.description}
                    </CardDescription>
                    
                    {trend.tags && trend.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {trend.tags.map((tag: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">Source:</span>
                        <span>{trend.sourceAgency}</span>
                      </div>
                      {trend.sourceUrl && (
                        <a 
                          href={trend.sourceUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          View Original Source
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
          
          <TabsContent value="news" className="space-y-4">
            {selectedNews.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">No verified news recorded for this month.</p>
                </CardContent>
              </Card>
            ) : (
              selectedNews.map((article) => (
                <Card key={article.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <CardTitle className="text-xl">{article.title}</CardTitle>
                        <div className="flex items-center space-x-4">
                          <Badge variant="secondary">{article.category}</Badge>
                          <span className="text-sm font-medium">{article.sourceAgency}</span>
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm text-green-600">
                              {Math.round(article.reliability * 100)}% reliable
                            </span>
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
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">Source:</span>
                        <span>{article.sourceName}</span>
                      </div>
                      {article.sourceUrl && (
                        <a 
                          href={article.sourceUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Read Full Article
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Footer Note */}
      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Boomer Buddy has been protecting seniors from scams since {operationalDate.toLocaleDateString()}
            </p>
            <p className="text-xs text-muted-foreground">
              All data sourced from verified government agencies including FTC, FBI, SSA, SEC, and trusted security organizations
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}