import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Filter, Calendar, FileText, Camera, Shield } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";

interface Analysis {
  id: string;
  inputType: string;
  text?: string;
  imagePath?: string;
  state?: string;
  phoneNumber?: string;
  emailFrom?: string;
  channel?: string;
  createdAt: string;
  resultJson: {
    scam_score: number;
    confidence: string;
    label: string;
    top_signals: string[];
    explanation: string;
    recommended_actions?: Array<{
      title: string;
      steps: string[];
      when: string;
    }>;
  };
}

interface HistoryData {
  analyses: Analysis[];
  page: number;
  hasMore: boolean;
}

export default function History() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterRisk, setFilterRisk] = useState("all");
  const [selectedAnalysis, setSelectedAnalysis] = useState<Analysis | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, authLoading, setLocation]);

  const { data: historyData, isLoading } = useQuery<HistoryData>({
    queryKey: ["/api/user/history"],
    enabled: isAuthenticated,
  });

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-boomer-navy mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading your analysis history...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!historyData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="text-center">
            <p className="text-gray-600">Unable to load history data.</p>
          </div>
        </div>
      </div>
    );
  }

  const { analyses } = historyData;

  // Filter analyses based on search and filters
  const filteredAnalyses = analyses.filter(analysis => {
    const matchesSearch = searchTerm === "" || 
      (analysis.text && analysis.text.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (analysis.emailFrom && analysis.emailFrom.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (analysis.phoneNumber && analysis.phoneNumber.includes(searchTerm));

    const matchesType = filterType === "all" || analysis.inputType === filterType;

    const matchesRisk = filterRisk === "all" || 
      (filterRisk === "high" && analysis.resultJson.scam_score > 70) ||
      (filterRisk === "medium" && analysis.resultJson.scam_score >= 30 && analysis.resultJson.scam_score <= 70) ||
      (filterRisk === "low" && analysis.resultJson.scam_score < 30);

    return matchesSearch && matchesType && matchesRisk;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getScamBadgeColor = (score: number) => {
    if (score > 70) return "destructive";
    if (score >= 30) return "secondary";
    return "outline";
  };

  const getRiskLevel = (score: number) => {
    if (score > 70) return "High Risk";
    if (score >= 30) return "Medium Risk";
    return "Low Risk";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analysis History</h1>
          <p className="text-gray-600">
            Review all your past scam analyses and safety checks
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Filter & Search</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search analyses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="Content Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterRisk} onValueChange={setFilterRisk}>
                <SelectTrigger>
                  <SelectValue placeholder="Risk Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Risks</SelectItem>
                  <SelectItem value="high">High Risk</SelectItem>
                  <SelectItem value="medium">Medium Risk</SelectItem>
                  <SelectItem value="low">Low Risk</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center text-sm text-gray-600">
                <Filter className="h-4 w-4 mr-2" />
                {filteredAnalyses.length} of {analyses.length} results
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Analysis List */}
          <div className="space-y-4">
            {filteredAnalyses.length > 0 ? (
              filteredAnalyses.map((analysis) => (
                <Card 
                  key={analysis.id} 
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedAnalysis?.id === analysis.id ? 'ring-2 ring-boomer-navy' : ''
                  }`}
                  onClick={() => setSelectedAnalysis(analysis)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {analysis.inputType === "image" ? (
                          <Camera className="h-4 w-4 text-blue-600" />
                        ) : (
                          <FileText className="h-4 w-4 text-green-600" />
                        )}
                        <Badge variant={getScamBadgeColor(analysis.resultJson.scam_score)}>
                          {getRiskLevel(analysis.resultJson.scam_score)}
                        </Badge>
                      </div>
                      <span className="text-sm text-gray-500">
                        {formatDate(analysis.createdAt)}
                      </span>
                    </div>
                    
                    <div className="mb-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          Scam Score: {analysis.resultJson.scam_score}/100
                        </span>
                        <Badge variant="outline">
                          {analysis.resultJson.confidence} confidence
                        </Badge>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 line-clamp-2">
                      {analysis.inputType === "image" ? "Image analysis" : 
                       analysis.text ? `"${analysis.text.substring(0, 80)}..."` : "Text analysis"}
                    </p>

                    {(analysis.emailFrom || analysis.phoneNumber) && (
                      <div className="mt-2 flex gap-4">
                        {analysis.emailFrom && (
                          <span className="text-xs text-gray-500">From: {analysis.emailFrom}</span>
                        )}
                        {analysis.phoneNumber && (
                          <span className="text-xs text-gray-500">Phone: {analysis.phoneNumber}</span>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Shield className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No analyses found</h3>
                  <p className="text-gray-500">
                    {searchTerm || filterType !== "all" || filterRisk !== "all" 
                      ? "Try adjusting your filters or search terms." 
                      : "Start analyzing content to build your history!"
                    }
                  </p>
                  {(!searchTerm && filterType === "all" && filterRisk === "all") && (
                    <Button 
                      onClick={() => setLocation("/")}
                      className="mt-4 bg-boomer-navy hover:bg-boomer-teal"
                    >
                      Analyze Content
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Analysis Details */}
          <div className="lg:sticky lg:top-24">
            {selectedAnalysis ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      {selectedAnalysis.inputType === "image" ? (
                        <Camera className="h-5 w-5 text-blue-600" />
                      ) : (
                        <FileText className="h-5 w-5 text-green-600" />
                      )}
                      Analysis Details
                    </CardTitle>
                    <Badge variant={getScamBadgeColor(selectedAnalysis.resultJson.scam_score)}>
                      {selectedAnalysis.resultJson.label}
                    </Badge>
                  </div>
                  <CardDescription>
                    {formatDate(selectedAnalysis.createdAt)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Risk Assessment</h4>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span>Scam Score:</span>
                        <span className="font-bold">{selectedAnalysis.resultJson.scam_score}/100</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            selectedAnalysis.resultJson.scam_score > 70 ? 'bg-red-500' :
                            selectedAnalysis.resultJson.scam_score >= 30 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${selectedAnalysis.resultJson.scam_score}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {selectedAnalysis.resultJson.top_signals && selectedAnalysis.resultJson.top_signals.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Warning Signs</h4>
                      <ul className="space-y-1">
                        {selectedAnalysis.resultJson.top_signals.map((signal, index) => (
                          <li key={index} className="text-sm bg-red-50 text-red-700 px-2 py-1 rounded">
                            • {signal}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div>
                    <h4 className="font-medium mb-2">Explanation</h4>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                      {selectedAnalysis.resultJson.explanation}
                    </p>
                  </div>

                  {selectedAnalysis.text && (
                    <div>
                      <h4 className="font-medium mb-2">Analyzed Content</h4>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {selectedAnalysis.text}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Select an Analysis
                  </h3>
                  <p className="text-gray-500">
                    Click on an analysis from the list to view detailed results
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}