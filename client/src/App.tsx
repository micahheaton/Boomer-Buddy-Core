import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Report from "@/pages/report";
import EnhancedTrendsPage from "@/pages/enhanced-trends";
import Archives from "@/pages/archives";
import Dashboard from "@/pages/dashboard";
import History from "@/pages/history";
import AdminDashboard from "@/pages/admin";
import CommunityPage from "@/pages/community";
import FeaturesPage from "@/pages/features";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/report/:id" component={Report} />
      <Route path="/trends" component={EnhancedTrendsPage} />
      <Route path="/archives" component={Archives} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/history" component={History} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/community" component={CommunityPage} />
      <Route path="/features" component={FeaturesPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
