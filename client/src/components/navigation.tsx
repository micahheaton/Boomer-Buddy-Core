import { Button } from "@/components/ui/button";
import { Shield, History, TrendingUp, Home } from "lucide-react";
import { Link, useLocation } from "wouter";
import Logo from "./logo";

export default function Navigation() {
  const [location] = useLocation();

  return (
    <div className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <Logo className="h-10 w-10" />
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Boomer Buddy</h1>
              <p className="text-sm text-slate-600">AI-Powered Scam Protection</p>
            </div>
          </Link>
          
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button 
                variant={location === '/' ? 'default' : 'ghost'} 
                size="sm" 
                className="text-slate-600 hover:text-slate-900"
              >
                <Home className="h-4 w-4 mr-2" />
                Analyze
              </Button>
            </Link>
            
            <Link href="/trends">
              <Button 
                variant={location === '/trends' ? 'default' : 'ghost'} 
                size="sm" 
                className="text-slate-600 hover:text-slate-900"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Scam Trends
              </Button>
            </Link>
            
            <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900">
              <History className="h-4 w-4 mr-2" />
              Reports
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}