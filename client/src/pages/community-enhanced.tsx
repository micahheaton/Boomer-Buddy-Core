import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Filter, Plus, Shield, TrendingUp, Users, CheckCircle, AlertTriangle, Clock, Star } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CommunityReport {
  id: string;
  title: string;
  description: string;
  category: string;
  scamType?: string;
  location?: string;
  phoneNumber?: string;
  emailAddress?: string;
  websiteUrl?: string;
  amountLost?: number;
  evidence: string[];
  tags: string[];
  isVerified: boolean;
  verificationStatus: string;
  verificationSource?: string;
  verificationDate?: string;
  moderationStatus: string;
  upvotes: number;
  downvotes: number;
  reportCount: number;
  createdAt: string;
  updatedAt: string;
}

interface CommunityStats {
  totalReports: number;
  verifiedReports: number;
  recentReports: number;
  verificationRate: number;
}

const reportSchema = z.object({
  title: z.string().min(10, "Title must be at least 10 characters").max(200, "Title too long"),
  description: z.string().min(50, "Description must be at least 50 characters").max(2000, "Description too long"),
  category: z.string().min(1, "Category is required"),
  scamType: z.string().optional(),
  location: z.string().optional(),
  phoneNumber: z.string().optional(),
  emailAddress: z.string().email().optional().or(z.literal("")),
  websiteUrl: z.string().url().optional().or(z.literal("")),
  amountLost: z.number().min(0).optional(),
  evidence: z.array(z.string()).optional(),
});

export default function CommunityEnhanced() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [verificationFilter, setVerificationFilter] = useState("all");
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: stats } = useQuery<CommunityStats>({
    queryKey: ["/api/community/stats"],
  });

  const { data: reportsData, isLoading } = useQuery({
    queryKey: ["/api/community/reports", {
      q: searchQuery,
      category: selectedCategory === "all" ? "" : selectedCategory,
      verified: verificationFilter === "all" ? "" : verificationFilter,
      limit: 20,
      offset: currentPage * 20
    }],
    enabled: true
  });

  // Provide default structure for API response
  const reports = reportsData?.reports || [];
  const hasMore = reportsData?.hasMore || false;

  const form = useForm({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      scamType: "",
      location: "",
      phoneNumber: "",
      emailAddress: "",
      websiteUrl: "",
      amountLost: undefined,
      evidence: []
    }
  });

  const submitReportMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', '/api/community/reports', data);
    },
    onSuccess: () => {
      toast({
        title: "Report Submitted",
        description: "Your report has been submitted and is being processed by our automated moderation system.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/community/reports"] });
      queryClient.invalidateQueries({ queryKey: ["/api/community/stats"] });
      form.reset();
      setIsSubmitDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit report. Please try again.",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: any) => {
    submitReportMutation.mutate(data);
  };

  const formatAmount = (cents?: number) => {
    if (!cents) return "No loss reported";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100);
  };

  const getSeverityColor = (reportCount: number, isVerified: boolean) => {
    if (isVerified && reportCount > 50) return "text-red-600 bg-red-50";
    if (isVerified && reportCount > 20) return "text-orange-600 bg-orange-50";
    if (isVerified) return "text-yellow-600 bg-yellow-50";
    return "text-blue-600 bg-blue-50";
  };

  const getVerificationBadge = (report: CommunityReport) => {
    if (report.isVerified) {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Verified{report.verificationSource ? ` by ${report.verificationSource}` : ''}
        </Badge>
      );
    }
    if (report.moderationStatus === 'pending') {
      return (
        <Badge variant="outline" className="text-yellow-600">
          <Clock className="w-3 h-3 mr-1" />
          Under Review
        </Badge>
      );
    }
    return (
      <Badge variant="outline">
        <AlertTriangle className="w-3 h-3 mr-1" />
        Unverified
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Community Reports</h1>
          <p className="text-muted-foreground">
            Real reports from community members, verified against official sources
          </p>
        </div>
        <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Submit Report</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Submit Community Report</DialogTitle>
              <DialogDescription>
                Help protect others by reporting scams you've encountered. All reports are automatically moderated and verified against official sources.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title *</FormLabel>
                      <FormControl>
                        <Input placeholder="Brief description of the scam" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Detailed Description *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Provide detailed information about what happened, how you were contacted, what they asked for, etc."
                          rows={4}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="phone-scam">Phone Scam</SelectItem>
                            <SelectItem value="email-scam">Email Scam</SelectItem>
                            <SelectItem value="sms-scam">Text/SMS Scam</SelectItem>
                            <SelectItem value="online-scam">Online/Website Scam</SelectItem>
                            <SelectItem value="mail-scam">Mail Scam</SelectItem>
                            <SelectItem value="in-person-scam">In-Person Scam</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="scamType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Scam Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="phishing">Phishing</SelectItem>
                            <SelectItem value="romance">Romance Scam</SelectItem>
                            <SelectItem value="investment">Investment Fraud</SelectItem>
                            <SelectItem value="tech-support">Tech Support</SelectItem>
                            <SelectItem value="government-imposter">Government Imposter</SelectItem>
                            <SelectItem value="family-emergency">Family Emergency</SelectItem>
                            <SelectItem value="prize-lottery">Prize/Lottery</SelectItem>
                            <SelectItem value="employment">Job/Employment</SelectItem>
                            <SelectItem value="charity">Fake Charity</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input placeholder="City, State" {...field} />
                        </FormControl>
                        <FormDescription>Help others in your area</FormDescription>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="amountLost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount Lost ($)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            step="0.01" 
                            placeholder="0.00"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number (if applicable)</FormLabel>
                        <FormControl>
                          <Input placeholder="(555) 123-4567" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="emailAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address (if applicable)</FormLabel>
                        <FormControl>
                          <Input placeholder="scammer@example.com" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="websiteUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website URL (if applicable)</FormLabel>
                        <FormControl>
                          <Input placeholder="https://suspicious-site.com" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsSubmitDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitReportMutation.isPending}>
                    {submitReportMutation.isPending ? "Submitting..." : "Submit Report"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Community Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-500" />
                <div>
                  <div className="text-2xl font-bold">{stats.totalReports.toLocaleString()}</div>
                  <p className="text-sm text-muted-foreground">Total Reports</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <div className="text-2xl font-bold">{stats.verifiedReports.toLocaleString()}</div>
                  <p className="text-sm text-muted-foreground">Verified Reports</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-orange-500" />
                <div>
                  <div className="text-2xl font-bold">{stats.recentReports.toLocaleString()}</div>
                  <p className="text-sm text-muted-foreground">Last 30 Days</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Star className="h-5 w-5 text-purple-500" />
                <div>
                  <div className="text-2xl font-bold">{Math.round(stats.verificationRate * 100)}%</div>
                  <p className="text-sm text-muted-foreground">Verification Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>Search & Filter Reports</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <Input
                placeholder="Search reports by title, description, location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="phone-scam">Phone Scams</SelectItem>
                <SelectItem value="email-scam">Email Scams</SelectItem>
                <SelectItem value="online-scam">Online Scams</SelectItem>
                <SelectItem value="sms-scam">Text Scams</SelectItem>
                <SelectItem value="mail-scam">Mail Scams</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={verificationFilter} onValueChange={setVerificationFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Reports" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reports</SelectItem>
                <SelectItem value="true">Verified Only</SelectItem>
                <SelectItem value="false">Unverified Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : reports?.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">No reports found matching your criteria.</p>
            </CardContent>
          </Card>
        ) : (
          reports.map((report: CommunityReport) => (
            <Card key={report.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="text-xl">{report.title}</CardTitle>
                    <div className="flex items-center space-x-4 flex-wrap gap-2">
                      <Badge variant="outline">{report.category.replace('-', ' ')}</Badge>
                      {report.scamType && <Badge variant="secondary">{report.scamType}</Badge>}
                      {getVerificationBadge(report)}
                      {report.reportCount > 1 && (
                        <Badge className={getSeverityColor(report.reportCount, report.isVerified)}>
                          {report.reportCount} similar reports
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <div>{new Date(report.createdAt).toLocaleDateString()}</div>
                    {report.location && <div>{report.location}</div>}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">
                  {report.description}
                </CardDescription>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  {report.phoneNumber && (
                    <div>
                      <span className="font-medium">Phone:</span>
                      <div className="text-red-600 font-mono">{report.phoneNumber}</div>
                    </div>
                  )}
                  {report.emailAddress && (
                    <div>
                      <span className="font-medium">Email:</span>
                      <div className="text-red-600 font-mono">{report.emailAddress}</div>
                    </div>
                  )}
                  {report.websiteUrl && (
                    <div>
                      <span className="font-medium">Website:</span>
                      <div className="text-red-600 font-mono break-all">{report.websiteUrl}</div>
                    </div>
                  )}
                </div>
                
                {report.amountLost !== null && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <span className="font-medium text-red-800">
                        Financial Loss: {formatAmount(report.amountLost)}
                      </span>
                    </div>
                  </div>
                )}
                
                {report.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-4">
                    {report.tags.map((tag: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
                
                <div className="flex items-center justify-between mt-4 text-sm">
                  <div className="flex items-center space-x-4">
                    <span>{report.upvotes} helpful</span>
                    <span>•</span>
                    <span>Report #{report.id.slice(0, 8)}</span>
                  </div>
                  {report.isVerified && report.verificationSource && (
                    <div className="text-green-600">
                      Verified by {report.verificationSource}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {hasMore && (
        <div className="flex justify-center">
          <Button 
            variant="outline" 
            onClick={() => setCurrentPage(prev => prev + 1)}
            disabled={isLoading}
          >
            Load More Reports
          </Button>
        </div>
      )}

      {/* Footer Note */}
      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              All reports are automatically moderated and verified against official government sources
            </p>
            <p className="text-xs text-muted-foreground">
              Verification sources include FTC, FBI, BBB, AARP, and other trusted organizations
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}