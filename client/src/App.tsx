import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { TranslationStatus } from "@/components/translation-status";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Navigation from "@/components/navigation";
import Report from "@/pages/report";
import EnhancedTrendsPage from "@/pages/enhanced-trends";

import Dashboard from "@/pages/dashboard";
import History from "@/pages/history";
import AdminDashboard from "@/pages/admin";
import CommunityPage from "@/pages/community";
import CommunityEnhanced from "@/pages/community-enhanced";
import FeaturesPage from "@/pages/features";
import About from "@/pages/About";
import VulnerabilityAssessment from "@/pages/VulnerabilityAssessment";
import LiveHeatmapV2 from "@/pages/LiveHeatmapV2";
import ScamTrendsV2 from "@/pages/ScamTrendsV2";
import DataSourcesV2 from "@/pages/DataSourcesV2";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/report/:id" component={Report} />
      <Route path="/trends" component={EnhancedTrendsPage} />
      <Route path="/scam-trends-v2" component={ScamTrendsV2} />
      <Route path="/data-sources-v2" component={DataSourcesV2} />

      <Route path="/dashboard" component={Dashboard} />
      <Route path="/history" component={History} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/community" component={CommunityEnhanced} />
      <Route path="/features" component={FeaturesPage} />
      <Route path="/about" component={About} />
      <Route path="/assessment" component={VulnerabilityAssessment} />
      <Route path="/heatmap" component={LiveHeatmapV2} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
          <TooltipProvider>
            <div className="min-h-screen bg-gray-50">
              <Navigation />
              <main className="pt-0">
                <Router />
              </main>
              <TranslationStatus />
              <Toaster />
            </div>
          </TooltipProvider>
        </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
