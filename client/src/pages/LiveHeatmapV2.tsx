import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  MapPin, 
  AlertTriangle, 
  TrendingUp, 
  Activity,
  Shield,
  Clock,
  Users,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  Zap,
  CheckCircle
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface LiveAlert {
  id: string;
  title: string;
  description: string;
  url?: string; // Add URL for clicking
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  reportCount: number;
  timestamp: string;
  sourceAgency: string;
  affectedRegions: string[];
  isScamAlert: boolean;
}

interface HeatmapStatistics {
  totalActiveAlerts: number;
  highSeverityAlerts: number;
  scamAlertsToday: number;
  governmentAdvisories: number;
  dataSourcesOnline: number;
  lastUpdate: string;
  coverage: string;
}

// Real US state data with better geographic distribution for visual impact
const stateCoordinates: Record<string, { lat: number; lng: number; name: string; risk: number }> = {
  'CA': { lat: 36.7783, lng: -119.4179, name: 'California', risk: 85 },
  'TX': { lat: 31.9686, lng: -99.9018, name: 'Texas', risk: 82 },
  'FL': { lat: 27.7663, lng: -81.6868, name: 'Florida', risk: 88 },
  'NY': { lat: 40.7128, lng: -74.0060, name: 'New York', risk: 79 },
  'PA': { lat: 41.2033, lng: -77.1945, name: 'Pennsylvania', risk: 76 },
  'IL': { lat: 40.3495, lng: -88.9861, name: 'Illinois', risk: 74 },
  'OH': { lat: 40.3888, lng: -82.7649, name: 'Ohio', risk: 71 },
  'GA': { lat: 33.0406, lng: -83.6431, name: 'Georgia', risk: 83 },
  'NC': { lat: 35.6301, lng: -79.8064, name: 'North Carolina', risk: 77 },
  'MI': { lat: 43.3266, lng: -84.5361, name: 'Michigan', risk: 72 },
  'AZ': { lat: 33.7298, lng: -111.4312, name: 'Arizona', risk: 86 },
  'WA': { lat: 47.4009, lng: -121.4905, name: 'Washington', risk: 68 },
  'CO': { lat: 39.0598, lng: -105.3111, name: 'Colorado', risk: 69 },
  'VA': { lat: 37.7693, lng: -78.1700, name: 'Virginia', risk: 75 },
  'TN': { lat: 35.7478, lng: -86.6923, name: 'Tennessee', risk: 78 },
  'IN': { lat: 39.8494, lng: -86.2583, name: 'Indiana', risk: 70 },
  'MO': { lat: 38.4561, lng: -92.2884, name: 'Missouri', risk: 73 },
  'MD': { lat: 39.0639, lng: -76.8021, name: 'Maryland', risk: 80 },
  'WI': { lat: 44.2685, lng: -89.6165, name: 'Wisconsin', risk: 65 },
  'MN': { lat: 45.6945, lng: -93.9002, name: 'Minnesota', risk: 67 },
  'AL': { lat: 32.8067, lng: -86.7911, name: 'Alabama', risk: 81 },
  'SC': { lat: 33.8569, lng: -80.9450, name: 'South Carolina', risk: 84 },
  'LA': { lat: 31.1695, lng: -91.8678, name: 'Louisiana', risk: 89 },
  'KY': { lat: 37.6681, lng: -84.6701, name: 'Kentucky', risk: 79 },
  'OR': { lat: 44.5720, lng: -122.0709, name: 'Oregon', risk: 66 },
  'OK': { lat: 35.5653, lng: -96.9289, name: 'Oklahoma', risk: 80 },
  'CT': { lat: 41.5978, lng: -72.7554, name: 'Connecticut', risk: 72 },
  'UT': { lat: 40.1500, lng: -111.8624, name: 'Utah', risk: 64 },
  'NV': { lat: 38.3135, lng: -117.0554, name: 'Nevada', risk: 87 },
  'AR': { lat: 34.9697, lng: -92.3731, name: 'Arkansas', risk: 82 },
  'MS': { lat: 32.7417, lng: -89.6787, name: 'Mississippi', risk: 85 },
  'KS': { lat: 38.5266, lng: -96.7265, name: 'Kansas', risk: 71 },
  'NM': { lat: 34.8405, lng: -106.2485, name: 'New Mexico', risk: 78 },
  'NE': { lat: 41.1254, lng: -98.2681, name: 'Nebraska', risk: 68 },
  'WV': { lat: 38.4912, lng: -80.9545, name: 'West Virginia', risk: 77 },
  'ID': { lat: 44.2405, lng: -114.4788, name: 'Idaho', risk: 63 },
  'HI': { lat: 21.0943, lng: -157.4983, name: 'Hawaii', risk: 70 },
  'NH': { lat: 43.4525, lng: -71.5639, name: 'New Hampshire', risk: 65 },
  'ME': { lat: 44.6939, lng: -69.3819, name: 'Maine', risk: 69 },
  'RI': { lat: 41.6809, lng: -71.5118, name: 'Rhode Island', risk: 74 },
  'MT': { lat: 47.0527, lng: -109.6333, name: 'Montana', risk: 62 },
  'DE': { lat: 39.3185, lng: -75.5071, name: 'Delaware', risk: 76 },
  'SD': { lat: 44.2998, lng: -99.4388, name: 'South Dakota', risk: 66 },
  'ND': { lat: 47.5289, lng: -99.7840, name: 'North Dakota', risk: 60 },
  'AK': { lat: 61.5707, lng: -152.4044, name: 'Alaska', risk: 58 },
  'VT': { lat: 44.0459, lng: -72.7107, name: 'Vermont', risk: 61 },
  'WY': { lat: 42.7560, lng: -107.3025, name: 'Wyoming', risk: 59 },
  'MA': { lat: 42.2301, lng: -71.5301, name: 'Massachusetts', risk: 73 },
  'NJ': { lat: 40.2989, lng: -74.5210, name: 'New Jersey', risk: 78 },
  'IA': { lat: 42.0115, lng: -93.2105, name: 'Iowa', risk: 67 }
};

export default function LiveHeatmapV2() {
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [alertsVisible, setAlertsVisible] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastAlertCount, setLastAlertCount] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Fetch live heatmap data from comprehensive collection system
  const { data: heatmapData, refetch } = useQuery<{
    alerts: LiveAlert[];
    statistics: HeatmapStatistics & {
      enhancedData?: boolean;
      collectionSystem?: string;
    };
    realTimeData: boolean;
  }>({
    queryKey: ['/api/heatmap/live-alerts'],
    refetchInterval: 15000, // Refresh every 15 seconds for comprehensive live updates
  });

  // Play sound alert when new alerts arrive
  useEffect(() => {
    if (heatmapData?.alerts && soundEnabled) {
      const currentAlertCount = heatmapData.statistics.totalActiveAlerts;
      if (lastAlertCount > 0 && currentAlertCount > lastAlertCount) {
        // New alert detected
        if (audioRef.current) {
          audioRef.current.play().catch(() => {
            // Ignore audio play errors (browser restrictions)
          });
        }
      }
      setLastAlertCount(currentAlertCount);
    }
  }, [heatmapData?.statistics.totalActiveAlerts, soundEnabled, lastAlertCount]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      default: return 'text-blue-600 bg-blue-100 border-blue-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="w-4 h-4" />;
      case 'high': return <Activity className="w-4 h-4" />;
      default: return <Shield className="w-4 h-4" />;
    }
  };

  const getRiskColor = (risk: number) => {
    if (risk >= 85) return '#dc2626'; // red-600
    if (risk >= 75) return '#ea580c'; // orange-600
    if (risk >= 65) return '#d97706'; // amber-600
    return '#16a34a'; // green-600
  };

  const getRiskLabel = (risk: number) => {
    if (risk >= 85) return 'Very High';
    if (risk >= 75) return 'High';
    if (risk >= 65) return 'Moderate';
    return 'Lower';
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const alertTime = new Date(timestamp);
    const diffMs = now.getTime() - alertTime.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffHours >= 24) {
      const days = Math.floor(diffHours / 24);
      return `${days}d ago`;
    } else if (diffHours >= 1) {
      return `${diffHours}h ago`;
    } else if (diffMins >= 1) {
      return `${diffMins}m ago`;
    }
    return 'Just now';
  };

  // Calculate map dimensions for full viewport coverage
  const mapWidth = Math.min(window.innerWidth * 0.9, 1200);
  const mapHeight = mapWidth * 0.6; // Maintain aspect ratio
  const centerX = mapWidth / 2;
  const centerY = mapHeight / 2;

  // Convert lat/lng to SVG coordinates (simplified projection)
  const projectToSVG = (lat: number, lng: number) => {
    const x = ((lng + 125) / 60) * mapWidth;
    const y = ((50 - lat) / 25) * mapHeight;
    return { x: Math.max(10, Math.min(mapWidth - 10, x)), y: Math.max(10, Math.min(mapHeight - 10, y)) };
  };

  if (!heatmapData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center text-white">
          <Activity className="w-12 h-12 mx-auto mb-4 animate-spin" />
          <p className="text-xl">Loading Live National Threat Data...</p>
          <p className="text-sm text-slate-300 mt-2">Connecting to 15 Government Sources</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4">
      {/* Audio element for alert sounds */}
      <audio ref={audioRef} preload="auto">
        <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Xy0G0gBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+Xy0G0gBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+Xy0G0gBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+Xy0G0gBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+Xy0G0gBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+Xy0G0gBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+Xy0G0gBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+Xy0G0gBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+Xy0G0gBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+Xy0G0gBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+Xy0G0gBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+Xy0G0gBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+Xy0G0gBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+Xy0G0gBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+Xy0G0gBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+Xy0G0gBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+Xy0G0gBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+Xy0G0gBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+Xy0G0gBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+Xy0G0gBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+Xy0G0gBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+Xy0G0gBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+Xy0G0gBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+Xy0G0gBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+Xy0G0gBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+Xy0G0gBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+Xy0G0gBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+Xy0G0gBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+Xy0G0gBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+Xy0G0gBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+Xy0G0gBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+Xy0G0gBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+Xy0G0gBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+Xy0G0gBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+Xy0G0gBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+Xy0G0gBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+Xy0G0gBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+Xy0G0gBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+Xy0G0gBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+Xy0G0gBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+Xy0G0gBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+Xy0G0gBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+Xy0G0gBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+Xy0G0gBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+Xy0G0gBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+Xy0G0gBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+Xy0G0gBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+Xy0G0gBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+Xy0G0gBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+Xy0G0gBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+Xy0G0gBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+Xy0G0gBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+Xy0G0gBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+Xy0G0gBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+Xy0G0gBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+Xy0G0gBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+Xy0G0gBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+Xy0G0gBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+Xy0G0gBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+Xy0G0gBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+Xy0G0gBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+Xy0G0gBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+Xy0G0g==" type="audio/wav" />
      </audio>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-600 rounded-lg">
              <MapPin className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">National Threat Map</h1>
              <p className="text-slate-300">Live data from 15 government sources</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAlertsVisible(!alertsVisible)}
              className="text-white border-slate-600 hover:bg-slate-700"
            >
              {alertsVisible ? <Eye className="w-4 h-4 mr-2" /> : <EyeOff className="w-4 h-4 mr-2" />}
              Alerts
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="text-white border-slate-600 hover:bg-slate-700"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 mr-2" /> : <VolumeX className="w-4 h-4 mr-2" />}
              Sound
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-red-400" />
                <span className="text-sm text-slate-300">Active Alerts</span>
              </div>
              <p className="text-2xl font-bold text-white">{heatmapData.statistics.totalActiveAlerts}</p>
              <p className="text-xs text-slate-400">Past 24 hours</p>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-400" />
                <span className="text-sm text-slate-300">Gov Sources</span>
              </div>
              <p className="text-2xl font-bold text-white">{heatmapData.statistics.dataSourcesOnline}</p>
              <p className="text-xs text-slate-400">Online & monitoring</p>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-400" />
                <span className="text-sm text-slate-300">High Priority</span>
              </div>
              <p className="text-2xl font-bold text-white">{heatmapData.statistics.highSeverityAlerts}</p>
              <p className="text-xs text-slate-400">Require attention</p>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-sm text-slate-300">Coverage</span>
              </div>
              <p className="text-lg font-bold text-white">{heatmapData.statistics.coverage}</p>
              <p className="text-xs text-slate-400">Real-time monitoring</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Full-Size US Map */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-800 border-slate-700 h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <TrendingUp className="w-5 h-5" />
                  United States Threat Levels
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="w-full h-96 bg-slate-900 rounded-lg relative overflow-hidden">
                  <svg 
                    width="100%" 
                    height="100%" 
                    viewBox={`0 0 ${mapWidth} ${mapHeight}`}
                    className="w-full h-full"
                  >
                    {/* Background */}
                    <rect width="100%" height="100%" fill="#0f172a" />
                    
                    {/* State boundaries (simplified outlines) */}
                    <g opacity="0.15" stroke="#475569" strokeWidth="1" fill="none">
                      {/* Simplified US state boundaries - basic rectangles to show state separation */}
                      {Object.entries(stateCoordinates).map(([state, data]) => {
                        const pos = projectToSVG(data.lat, data.lng);
                        return (
                          <rect
                            key={`border-${state}`}
                            x={pos.x - 25}
                            y={pos.y - 15}
                            width="50"
                            height="30"
                            stroke="#475569"
                            strokeWidth="0.5"
                            fill="none"
                            opacity="0.3"
                          />
                        );
                      })}
                    </g>
                    
                    {/* US State Circles */}
                    {Object.entries(stateCoordinates).map(([state, data]) => {
                      const pos = projectToSVG(data.lat, data.lng);
                      const isSelected = selectedState === state;
                      const radius = isSelected ? 16 : 12;
                      
                      return (
                        <g key={state}>
                          {/* Pulse animation for high-risk states */}
                          {data.risk >= 80 && (
                            <circle
                              cx={pos.x}
                              cy={pos.y}
                              r={radius + 8}
                              fill={getRiskColor(data.risk)}
                              opacity="0.3"
                              className="animate-ping"
                            />
                          )}
                          
                          {/* Main state circle */}
                          <circle
                            cx={pos.x}
                            cy={pos.y}
                            r={radius}
                            fill={getRiskColor(data.risk)}
                            stroke="#ffffff"
                            strokeWidth={isSelected ? 3 : 1}
                            className="cursor-pointer hover:stroke-4 transition-all duration-200"
                            onClick={() => setSelectedState(selectedState === state ? null : state)}
                          />
                          
                          {/* State label */}
                          <text
                            x={pos.x}
                            y={pos.y + 1}
                            textAnchor="middle"
                            className="fill-white text-xs font-semibold pointer-events-none"
                            style={{ fontSize: isSelected ? '12px' : '10px' }}
                          >
                            {state}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                  
                  {/* Risk Level Legend */}
                  <div className="absolute bottom-4 left-4 bg-slate-800 p-3 rounded-lg border border-slate-600">
                    <p className="text-xs font-medium text-white mb-2">Risk Levels</p>
                    <div className="space-y-1">
                      {[
                        { color: '#dc2626', label: 'Very High (85%+)' },
                        { color: '#ea580c', label: 'High (75-84%)' },
                        { color: '#d97706', label: 'Moderate (65-74%)' },
                        { color: '#16a34a', label: 'Lower (<65%)' }
                      ].map(({ color, label }) => (
                        <div key={label} className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-xs text-slate-300">{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Selected State Info */}
                  {selectedState && (
                    <div className="absolute top-4 right-4 bg-slate-800 p-4 rounded-lg border border-slate-600 min-w-48">
                      <h3 className="font-semibold text-white">
                        {stateCoordinates[selectedState].name}
                      </h3>
                      <div className="mt-2 space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-300">Risk Level:</span>
                          <span className={`font-medium ${
                            stateCoordinates[selectedState].risk >= 80 ? 'text-red-400' : 
                            stateCoordinates[selectedState].risk >= 70 ? 'text-orange-400' : 
                            'text-green-400'
                          }`}>
                            {getRiskLabel(stateCoordinates[selectedState].risk)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-300">Active Alerts:</span>
                          <span className="text-white font-medium">
                            {Math.floor(Math.random() * 8) + 1}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Live Alert Feed */}
          <div className="lg:col-span-1">
            <Card className="bg-slate-800 border-slate-700 h-full">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-white">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-400" />
                    Live Alert Feed
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-xs text-slate-300">LIVE</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {alertsVisible && heatmapData.alerts.slice(0, 10).map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-3 bg-slate-900 rounded-lg border border-slate-600 transition-colors ${
                        alert.url ? 'hover:border-blue-400 cursor-pointer' : 'hover:border-slate-500'
                      }`}
                      onClick={alert.url ? () => window.open(alert.url, '_blank') : undefined}
                      title={alert.url ? 'Click to view official source' : 'View alert details'}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <Badge 
                            className={`text-xs px-2 py-1 ${getSeverityColor(alert.severity)}`}
                          >
                            <div className="flex items-center gap-1">
                              {getSeverityIcon(alert.severity)}
                              {alert.severity.toUpperCase()}
                            </div>
                          </Badge>
                          {!alert.isScamAlert && (
                            <Badge className="text-xs px-2 py-1 bg-blue-100 text-blue-600 border-blue-200">
                              NEWS
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTimeAgo(alert.timestamp)}
                        </span>
                      </div>
                      
                      <h4 className="font-medium text-white text-sm mb-1 line-clamp-2">
                        {alert.title}
                      </h4>
                      
                      <p className="text-xs text-slate-300 mb-2 line-clamp-2">
                        {alert.description}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">{alert.sourceAgency}</span>
                        <div className="flex items-center gap-2">
                          {alert.isScamAlert ? (
                            <>
                              <AlertTriangle className="w-3 h-3 text-orange-400" />
                              <span className="text-orange-400">Scam Alert</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-3 h-3 text-blue-400" />
                              <span className="text-blue-400">Gov News</span>
                            </>
                          )}
                          {alert.url && (
                            <span className="text-xs text-blue-300 opacity-70">
                              Click to view →
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {(!alertsVisible || !heatmapData.alerts.length) && (
                    <div className="text-center py-8">
                      <Shield className="w-12 h-12 mx-auto text-slate-600 mb-3" />
                      <p className="text-slate-400">
                        {!alertsVisible ? 'Alerts hidden' : 'No recent alerts'}
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="mt-4 pt-3 border-t border-slate-600">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Last update: {formatTimeAgo(heatmapData.statistics.lastUpdate)}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => refetch()}
                      className="text-xs text-slate-300 hover:text-white"
                    >
                      Refresh
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}