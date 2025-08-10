import { useState } from "react";
import { Shield, Users, AlertTriangle, Send, Eye, CheckCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface CommunityReport {
  id: string;
  type: 'scam_report' | 'trend_warning' | 'safety_tip';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  location?: string;
  scamType?: string;
  timestamp: string;
  status: 'pending' | 'verified' | 'resolved';
  upvotes: number;
  isAnonymous: boolean;
}

interface CommunityStats {
  totalReports: number;
  verifiedReports: number;
  activeThreat: number;
  communityMembers: number;
  reportsThisWeek: number;
}

export default function CommunityProtection() {
  const [reportType, setReportType] = useState<'scam_report' | 'trend_warning' | 'safety_tip'>('scam_report');
  const [reportText, setReportText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: communityReports, isLoading } = useQuery<CommunityReport[]>({
    queryKey: ["/api/community/reports"],
  });

  const { data: stats } = useQuery<CommunityStats>({
    queryKey: ["/api/community/stats"],
  });

  const submitReportMutation = useMutation({
    mutationFn: async (reportData: {
      type: string;
      title: string;
      description: string;
      isAnonymous: boolean;
    }) => {
      const response = await fetch("/api/community/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reportData),
      });
      if (!response.ok) throw new Error("Failed to submit report");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Report Submitted",
        description: "Thank you for helping protect the community. Your report is being reviewed.",
      });
      setReportText('');
      queryClient.invalidateQueries({ queryKey: ["/api/community/reports"] });
    },
    onError: () => {
      toast({
        title: "Submission Failed",
        description: "Unable to submit your report. Please try again.",
        variant: "destructive",
      });
    },
  });

  const upvoteReportMutation = useMutation({
    mutationFn: async (reportId: string) => {
      const response = await fetch(`/api/community/reports/${reportId}/upvote`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to upvote report");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/reports"] });
    },
  });

  const handleSubmitReport = () => {
    if (!reportText.trim()) {
      toast({
        title: "Report Required",
        description: "Please enter details about the scam or threat.",
        variant: "destructive",
      });
      return;
    }

    const title = reportType === 'scam_report' ? 'Scam Report' :
                  reportType === 'trend_warning' ? 'Trend Warning' : 'Safety Tip';

    submitReportMutation.mutate({
      type: reportType,
      title,
      description: reportText,
      isAnonymous,
    });
  };

  // Mock data for demonstration
  const mockStats: CommunityStats = {
    totalReports: 1247,
    verifiedReports: 892,
    activeThreat: 23,
    communityMembers: 8934,
    reportsThisWeek: 67,
  };

  const mockReports: CommunityReport[] = [
    {
      id: '1',
      type: 'scam_report',
      title: 'Fake SSA Phone Call Scam',
      description: 'Received call claiming my Social Security number was suspended. Asked for personal info to "verify" my identity.',
      severity: 'high',
      location: 'California',
      scamType: 'Phone Scam',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      status: 'verified',
      upvotes: 23,
      isAnonymous: true,
    },
    {
      id: '2',
      type: 'trend_warning',
      title: 'AI Voice Cloning Increase',
      description: 'Notice an uptick in scammers using AI to clone family member voices in emergency scams.',
      severity: 'critical',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      status: 'verified',
      upvotes: 45,
      isAnonymous: false,
    },
    {
      id: '3',
      type: 'safety_tip',
      title: 'Verify Emergency Calls',
      description: 'Always hang up and call back using a number you know is correct when family members ask for emergency help.',
      severity: 'medium',
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      status: 'verified',
      upvotes: 67,
      isAnonymous: false,
    },
  ];

  const currentStats = stats || mockStats;
  const reports = communityReports || mockReports;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'scam_report': return <AlertTriangle className="h-4 w-4" />;
      case 'trend_warning': return <Eye className="h-4 w-4" />;
      case 'safety_tip': return <Shield className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Community Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{currentStats.communityMembers.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Community Members</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{currentStats.totalReports.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Total Reports</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{currentStats.verifiedReports.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Verified Reports</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{currentStats.activeThreat}</div>
            <div className="text-sm text-gray-600">Active Threats</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{currentStats.reportsThisWeek}</div>
            <div className="text-sm text-gray-600">This Week</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Submit Report */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Report to Community
            </CardTitle>
            <CardDescription>
              Help protect others by sharing scam encounters or safety tips
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={reportType === 'scam_report' ? 'default' : 'outline'}
                onClick={() => setReportType('scam_report')}
                className="text-xs"
              >
                Report Scam
              </Button>
              <Button
                variant={reportType === 'trend_warning' ? 'default' : 'outline'}
                onClick={() => setReportType('trend_warning')}
                className="text-xs"
              >
                Trend Warning
              </Button>
              <Button
                variant={reportType === 'safety_tip' ? 'default' : 'outline'}
                onClick={() => setReportType('safety_tip')}
                className="text-xs"
              >
                Safety Tip
              </Button>
            </div>

            <Textarea
              placeholder={
                reportType === 'scam_report' ? 'Describe the scam attempt you encountered...' :
                reportType === 'trend_warning' ? 'Describe the new threat pattern you noticed...' :
                'Share a helpful safety tip to protect others...'
              }
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              rows={4}
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="anonymous"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="anonymous" className="text-sm">
                  Submit anonymously
                </label>
              </div>
              <Button 
                onClick={handleSubmitReport}
                disabled={submitReportMutation.isPending || !reportText.trim()}
              >
                <Send className="h-4 w-4 mr-2" />
                Submit Report
              </Button>
            </div>

            {!isAuthenticated && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Sign in to track your reports and earn community protection points.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Recent Reports */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Community Reports</CardTitle>
            <CardDescription>Latest verified threats and safety alerts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {reports.slice(0, 10).map((report) => (
                <div key={report.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(report.type)}
                      <span className="font-medium text-sm">{report.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getSeverityColor(report.severity)}>
                        {report.severity}
                      </Badge>
                      {report.status === 'verified' && (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {report.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{formatDate(report.timestamp)}</span>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => upvoteReportMutation.mutate(report.id)}
                        className="flex items-center gap-1 hover:text-blue-600"
                      >
                        <Shield className="h-3 w-3" />
                        {report.upvotes}
                      </button>
                      <span>{report.isAnonymous ? 'Anonymous' : 'Community Member'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}