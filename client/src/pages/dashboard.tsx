import { useQuery } from "@tanstack/react-query";
import { Shield, BarChart3, TrendingUp, Clock, Award, Target } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";

interface DashboardData {
  user: {
    id: string;
    name: string;
    email: string;
    safetyScore: number;
    totalAnalyses: number;
    scamsDetected: number;
    createdAt: string;
  };
  stats: {
    totalAnalyses: number;
    scamsDetected: number;
    safetyScore: number;
    recentActivities: Array<{
      id: string;
      activityType: string;
      description: string;
      points: number;
      createdAt: string;
    }>;
  };
  recentAnalyses: Array<{
    id: string;
    inputType: string;
    text?: string;
    createdAt: string;
    resultJson: {
      scam_score: number;
      label: string;
      confidence: string;
    };
  }>;
}

export default function Dashboard() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, authLoading, setLocation]);

  const { data: dashboardData, isLoading } = useQuery<DashboardData>({
    queryKey: ["/api/user/dashboard"],
    enabled: isAuthenticated,
  });

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-boomer-navy mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading your dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="text-center">
            <p className="text-gray-600">Unable to load dashboard data.</p>
          </div>
        </div>
      </div>
    );
  }

  const { user: userData, stats, recentAnalyses } = dashboardData;

  const getSafetyScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getSafetyLevel = (score: number) => {
    if (score >= 80) return { level: "Expert", color: "bg-green-100 text-green-800" };
    if (score >= 60) return { level: "Vigilant", color: "bg-yellow-100 text-yellow-800" };
    if (score >= 40) return { level: "Learning", color: "bg-blue-100 text-blue-800" };
    return { level: "Beginner", color: "bg-gray-100 text-gray-800" };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const safetyLevel = getSafetyLevel(stats.safetyScore);
  const nextMilestone = Math.ceil(stats.safetyScore / 10) * 10;
  const progress = ((stats.safetyScore % 10) / 10) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {userData.name || 'User'}
          </h1>
          <p className="text-gray-600">
            Your personal safety dashboard and scam protection overview
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Safety Score</CardTitle>
              <Shield className={`h-4 w-4 ${getSafetyScoreColor(stats.safetyScore)}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <span className={getSafetyScoreColor(stats.safetyScore)}>
                  {Math.round(stats.safetyScore)}
                </span>
                <span className="text-gray-400">/100</span>
              </div>
              <Badge variant="secondary" className={safetyLevel.color}>
                {safetyLevel.level}
              </Badge>
              <Progress value={progress} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {nextMilestone - Math.round(stats.safetyScore)} points to next level
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Analyses</CardTitle>
              <BarChart3 className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAnalyses}</div>
              <p className="text-xs text-muted-foreground">
                Content pieces analyzed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Scams Detected</CardTitle>
              <Target className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.scamsDetected}</div>
              <p className="text-xs text-muted-foreground">
                Threats avoided
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <Award className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.totalAnalyses > 0 ? Math.round((stats.scamsDetected / stats.totalAnalyses) * 100) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                Detection accuracy
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>Your latest safety actions and achievements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.recentActivities.length > 0 ? (
                  stats.recentActivities.slice(0, 8).map((activity) => (
                    <div key={activity.id} className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(activity.createdAt)}
                        </p>
                      </div>
                      {activity.points > 0 && (
                        <Badge variant="outline" className="ml-2 text-green-600">
                          +{activity.points}
                        </Badge>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No recent activity. Start analyzing content to build your safety score!
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Analyses */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Recent Analyses
              </CardTitle>
              <CardDescription>Your latest scam detection results</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentAnalyses.length > 0 ? (
                  recentAnalyses.slice(0, 5).map((analysis) => (
                    <div key={analysis.id} className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge 
                            variant={analysis.resultJson.scam_score > 70 ? "destructive" : "secondary"}
                          >
                            {analysis.resultJson.label}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Score: {analysis.resultJson.scam_score}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {analysis.inputType === "image" ? "Image analysis" : 
                           analysis.text ? `"${analysis.text.substring(0, 50)}..."` : "Text analysis"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(analysis.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No analyses yet. Start protecting yourself by analyzing suspicious content!
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}