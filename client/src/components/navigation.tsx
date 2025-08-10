import { Shield, User, LogOut, TrendingUp, BarChart3, History, Users, Settings, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Logo from "@/components/logo";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { LanguageSelector } from "@/components/language-selector";

export default function Navigation() {
  const { user, isAuthenticated, loginWithGoogle, logout } = useAuth();
  const [location, setLocation] = useLocation();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase();
  };

  const safetyScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Logo size="sm" />
            
            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-6">
              <button
                onClick={() => setLocation("/")}
                className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                  location === "/" ? "text-boomer-navy" : "text-gray-600 hover:text-boomer-navy"
                }`}
              >
                <Shield className="w-4 h-4" />
                Analyze
              </button>
              
              <button
                onClick={() => setLocation("/scam-trends-v2")}
                className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                  location === "/scam-trends-v2" ? "text-boomer-navy" : "text-gray-600 hover:text-boomer-navy"
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                Scam Trends
              </button>
              


              <button
                onClick={() => setLocation("/about")}
                className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                  location === "/about" ? "text-boomer-navy" : "text-gray-600 hover:text-boomer-navy"
                }`}
              >
                <Shield className="w-4 h-4" />
                About
              </button>

              <button
                onClick={() => setLocation("/community")}
                className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                  location === "/community" ? "text-boomer-navy" : "text-gray-600 hover:text-boomer-navy"
                }`}
              >
                <Users className="w-4 h-4" />
                Community
              </button>

              <button
                onClick={() => setLocation("/features")}
                className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                  location === "/features" ? "text-boomer-navy" : "text-gray-600 hover:text-boomer-navy"
                }`}
              >
                <Settings className="w-4 h-4" />
                Features
              </button>

              <button
                onClick={() => setLocation("/assessment")}
                className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                  location === "/assessment" ? "text-boomer-navy" : "text-gray-600 hover:text-boomer-navy"
                }`}
              >
                <Shield className="w-4 h-4" />
                Risk Assessment
              </button>

              <button
                onClick={() => setLocation("/heatmap")}
                className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                  location === "/heatmap" ? "text-boomer-navy" : "text-gray-600 hover:text-boomer-navy"
                }`}
              >
                <Activity className="w-4 h-4" />
                Live Heatmap
              </button>

              {isAuthenticated && (
                <>
                  <button
                    onClick={() => setLocation("/dashboard")}
                    className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                      location === "/dashboard" ? "text-boomer-navy" : "text-gray-600 hover:text-boomer-navy"
                    }`}
                  >
                    <BarChart3 className="w-4 h-4" />
                    Dashboard
                  </button>
                  
                  <button
                    onClick={() => setLocation("/history")}
                    className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                      location === "/history" ? "text-boomer-navy" : "text-gray-600 hover:text-boomer-navy"
                    }`}
                  >
                    <History className="w-4 h-4" />
                    History
                  </button>
                </>
              )}
            </nav>
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            <LanguageSelector />
            {isAuthenticated && user ? (
              <div className="flex items-center gap-4">
                {/* Safety Score Badge */}
                <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100">
                  <Shield className={`w-4 h-4 ${safetyScoreColor(user.safetyScore)}`} />
                  <span className={`text-sm font-medium ${safetyScoreColor(user.safetyScore)}`}>
                    {Math.round(user.safetyScore)}
                  </span>
                </div>

                {/* User Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10">
                        <AvatarImage 
                          src={user.profileImage} 
                          alt={user.name || user.email} 
                        />
                        <AvatarFallback>
                          {user.name ? getInitials(user.name) : user.email.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end">
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium">{user.name || "User"}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem onClick={() => setLocation("/dashboard")}>
                      <BarChart3 className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem onClick={() => setLocation("/history")}>
                      <History className="mr-2 h-4 w-4" />
                      <span>Analysis History</span>
                    </DropdownMenuItem>
                    
                    {(user?.email?.includes('admin') || user?.email?.includes('support')) && (
                      <DropdownMenuItem onClick={() => setLocation("/admin")}>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Admin Dashboard</span>
                      </DropdownMenuItem>
                    )}
                    
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem onClick={logout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <Button 
                onClick={loginWithGoogle}
                className="bg-boomer-navy hover:bg-boomer-teal text-white"
              >
                <User className="w-4 h-4 mr-2" />
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}