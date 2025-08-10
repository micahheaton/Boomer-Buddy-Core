import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Shield, 
  TrendingUp, 
  Users, 
  AlertTriangle, 
  BarChart3, 
  Settings,
  Eye,
  Play,
  Pause,
  RefreshCw,
  Download,
  Upload
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";

interface AdminStats {
  totalUsers: number;
  totalAnalyses: number;
  totalScamsDetected: number;
  activeAlerts: number;
  systemHealth: number;
  mlModelAccuracy: number;
  trendsMonitored: number;
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
    severity: string;
  }>;
}

interface SystemAlert {
  id: string;
  type: 'security' | 'performance' | 'trend' | 'model';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  timestamp: string;
  resolved: boolean;
}

export default function AdminDashboard() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedTab, setSelectedTab] = useState("overview");
  const queryClient = useQueryClient();

  // Check admin access (for demo, checking if user email contains 'admin')
  const isAdmin = user?.email?.includes('admin') || user?.email?.includes('support');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/");
    }
    if (!authLoading && isAuthenticated && !isAdmin) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, authLoading, isAdmin, setLocation]);

  const { data: adminStats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    enabled: isAuthenticated && isAdmin,
  });

  const { data: systemAlerts, isLoading: alertsLoading } = useQuery<SystemAlert[]>({
    queryKey: ["/api/admin/alerts"],
    enabled: isAuthenticated && isAdmin,
  });

  const restartMLModelMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/admin/ml/restart", { method: "POST" });
      if (!response.ok) throw new Error("Failed to restart ML model");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
  });

  const updateTrendsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/admin/trends/update", { method: "POST" });
      if (!response.ok) throw new Error("Failed to update trends");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
  });

  if (authLoading || statsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-boomer-navy mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="text-center">
            <Shield className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to access the admin dashboard.</p>
          </div>
        </div>
      </div>
    );
  }

  const mockAdminStats: AdminStats = {
    totalUsers: 12847,
    totalAnalyses: 45623,
    totalScamsDetected: 18934,
    activeAlerts: 3,
    systemHealth: 94,
    mlModelAccuracy: 91.2,
    trendsMonitored: 24,
    recentActivity: [
      {
        id: '1',
        type: 'trend_alert',
        description: 'New AI voice cloning scam trend detected',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        severity: 'high'
      },
      {
        id: '2',
        type: 'model_update',
        description: 'ML pattern recognition model retrained with 500 new samples',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        severity: 'medium'
      },
      {
        id: '3',
        type: 'user_milestone',
        description: '10,000+ users protected from scams this month',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        severity: 'low'
      }
    ]
  };

  const mockAlerts: SystemAlert[] = [
    {
      id: '1',
      type: 'trend',
      severity: 'high',
      title: 'New Scam Pattern Detected',
      description: 'AI voice cloning scams increased by 340% in the last 48 hours',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      resolved: false
    },
    {
      id: '2',
      type: 'performance',
      severity: 'medium',
      title: 'Model Performance Drop',
      description: 'ML accuracy decreased to 89.1% - consider retraining',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      resolved: false
    },
    {
      id: '3',
      type: 'security',
      severity: 'low',
      title: 'Unusual Traffic Pattern',
      description: 'Increased API requests from specific region - monitoring',
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      resolved: true
    }
  ];

  const stats = adminStats || mockAdminStats;
  const alerts = systemAlerts || mockAlerts;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Monitor system health, manage detection models, and track trends</p>
        </div>

        {/* Active Alerts */}
        {alerts.filter(alert => !alert.resolved).length > 0 && (
          <div className="mb-6">
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertTitle className="text-yellow-800">Active System Alerts</AlertTitle>
              <AlertDescription className="text-yellow-700">
                {alerts.filter(alert => !alert.resolved).length} unresolved alert(s) require attention
              </AlertDescription>
            </Alert>
          </div>
        )}

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="detection">Detection</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* System Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Protected seniors</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Analyses</CardTitle>
                  <BarChart3 className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalAnalyses.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Content analyzed</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Scams Detected</CardTitle>
                  <Shield className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{stats.totalScamsDetected.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Threats prevented</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">System Health</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.systemHealth}%</div>
                  <Progress value={stats.systemHealth} className="mt-2" />
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent System Activity</CardTitle>
                <CardDescription>Latest system events and alerts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.description}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(activity.timestamp)}</p>
                      </div>
                      <Badge variant={getSeverityColor(activity.severity)}>
                        {activity.severity}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="detection" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    ML Model Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Model Accuracy</span>
                    <Badge variant="secondary">{stats.mlModelAccuracy}%</Badge>
                  </div>
                  <Progress value={stats.mlModelAccuracy} />
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => restartMLModelMutation.mutate()}
                      disabled={restartMLModelMutation.isPending}
                      size="sm"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retrain Model
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export Data
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Alerts</CardTitle>
                  <CardDescription>{alerts.filter(a => !a.resolved).length} active alerts</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {alerts.slice(0, 5).map((alert) => (
                      <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                        <AlertTriangle className={`h-4 w-4 mt-0.5 ${
                          alert.severity === 'critical' || alert.severity === 'high' ? 'text-red-500' :
                          alert.severity === 'medium' ? 'text-yellow-500' : 'text-blue-500'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">{alert.title}</p>
                            <Badge variant={getSeverityColor(alert.severity)} className="text-xs">
                              {alert.severity}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">{alert.description}</p>
                          <p className="text-xs text-gray-500 mt-1">{formatDate(alert.timestamp)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Trend Monitoring</span>
                  <Button 
                    onClick={() => updateTrendsMutation.mutate()}
                    disabled={updateTrendsMutation.isPending}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Update Trends
                  </Button>
                </CardTitle>
                <CardDescription>Real-time scam trend monitoring and analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{stats.trendsMonitored}</div>
                    <div className="text-sm text-gray-600">Active Trends</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">12</div>
                    <div className="text-sm text-gray-600">High Risk</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">98.7%</div>
                    <div className="text-sm text-gray-600">Detection Rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Monitor user activity and safety metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Active Users (24h)</span>
                      <Badge variant="secondary">8,234</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">New Registrations</span>
                      <Badge variant="secondary">127</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Average Safety Score</span>
                      <Badge variant="secondary">73.2</Badge>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <Button className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Export User Data
                    </Button>
                    <Button variant="outline" className="w-full">
                      <Eye className="h-4 w-4 mr-2" />
                      View Analytics
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}