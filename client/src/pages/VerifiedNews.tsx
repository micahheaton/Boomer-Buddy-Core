import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Search, ExternalLink, Clock, Shield, Info, BookOpen } from "lucide-react";

interface NewsItem {
  id: string;
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  agency: string;
  contentType: 'news_update' | 'advisory';
  riskLevel: 'info' | 'low' | 'medium' | 'high' | 'critical';
  elderRelevanceScore: number;
}

export default function VerifiedNews() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: newsData, isLoading } = useQuery<{
    news: NewsItem[];
    lastUpdated: string;
  }>({
    queryKey: ["/api/v2/news"],
    refetchInterval: 300000, // 5 minutes
  });

  const filteredNews = newsData?.news.filter(item =>
    !searchQuery || 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.agency.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'advisory': return <Shield className="h-4 w-4" />;
      case 'news_update': return <BookOpen className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getContentTypeColor = (type: string) => {
    switch (type) {
      case 'advisory': return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900 dark:text-orange-100';
      case 'news_update': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-100';
      default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-100';
    }
  };

  const getAgencyColor = (agency: string) => {
    const colors: Record<string, string> = {
      'FTC': 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300',
      'FBI': 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
      'SSA': 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300',
      'CISA': 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
      'SEC': 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
      'CFPB': 'bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300',
    };
    return colors[agency] || 'bg-gray-50 text-gray-700 dark:bg-gray-900 dark:text-gray-300';
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Verified News</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Latest updates and advisories from government agencies
          </p>
        </div>
        <div className="text-right text-sm text-gray-500">
          <div>Last updated: {newsData?.lastUpdated ? new Date(newsData.lastUpdated).toLocaleString() : 'Loading...'}</div>
          <div className="flex items-center gap-1 mt-1">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            Live monitoring active
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total News Items</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {newsData?.news.length || 0}
                </p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Advisories</p>
                <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                  {newsData?.news.filter(n => n.contentType === 'advisory').length || 0}
                </p>
              </div>
              <Shield className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">Elder-Relevant</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {newsData?.news.filter(n => n.elderRelevanceScore > 50).length || 0}
                </p>
              </div>
              <Info className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search news, advisories, or agencies..."
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

      {/* News Items */}
      <div className="space-y-4">
        {filteredNews?.map((item) => (
          <Card key={item.id} className="hover:shadow-lg transition-shadow border-l-4 border-l-blue-400">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={getContentTypeColor(item.contentType)}>
                      <div className="flex items-center gap-1">
                        {getContentTypeIcon(item.contentType)}
                        {item.contentType === 'advisory' ? 'Advisory' : 'News Update'}
                      </div>
                    </Badge>
                    <Badge className={getAgencyColor(item.agency)}>
                      {item.agency}
                    </Badge>
                    {item.elderRelevanceScore > 70 && (
                      <Badge className="bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900 dark:text-purple-100">
                        Elder-Relevant
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-xl">{item.title}</CardTitle>
                </div>
                <div className="text-right text-sm text-gray-500 ml-4">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(item.publishedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                {item.description}
              </p>

              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>Elder Relevance: {item.elderRelevanceScore}%</span>
                  <span>Type: {item.contentType === 'advisory' ? 'Official Advisory' : 'News Update'}</span>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <a 
                    href={item.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1"
                  >
                    Read Original
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredNews?.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 mb-2">
              {searchQuery ? `No news found matching "${searchQuery}"` : 'No verified news available'}
            </p>
            <p className="text-xs text-gray-400">
              News items are automatically collected from verified government sources
            </p>
          </CardContent>
        </Card>
      )}

      {/* Data Source Note */}
      <Card className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
        <CardContent className="p-4">
          <div className="text-center space-y-2">
            <p className="text-sm font-medium text-green-800 dark:text-green-200">
              All news verified from official government sources
            </p>
            <p className="text-xs text-green-600 dark:text-green-300">
              Automatically collected and filtered for elder relevance from trusted .gov and .us domains
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}