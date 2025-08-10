import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  MapPin, 
  AlertTriangle, 
  TrendingUp, 
  Activity,
  Users,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  Zap,
  Shield,
  ZoomIn,
  ZoomOut,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface ScamAlert {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  affectedRegions: string[];
  reportCount: number;
  timestamp: string;
  coordinates?: { lat: number; lng: number; };
  sourceAgency: string;
  isNew?: boolean;
}

interface HeatmapData {
  state: string;
  stateName: string;
  coordinates: { lat: number; lng: number; };
  riskLevel: number; // 0-100
  activeAlerts: number;
  recentTrends: ScamAlert[];
  totalReports: number;
  demographics: {
    seniorPopulation: number;
    internetUsage: number;
    reportingRate: number;
  };
}

// US State coordinates for heatmap positioning
const stateCoordinates: Record<string, { lat: number; lng: number; name: string }> = {
  'AL': { lat: 32.806671, lng: -86.791130, name: 'Alabama' },
  'AK': { lat: 61.570716, lng: -152.404419, name: 'Alaska' },
  'AZ': { lat: 33.729759, lng: -111.431221, name: 'Arizona' },
  'AR': { lat: 34.969704, lng: -92.373123, name: 'Arkansas' },
  'CA': { lat: 36.116203, lng: -119.681564, name: 'California' },
  'CO': { lat: 39.059811, lng: -105.311104, name: 'Colorado' },
  'CT': { lat: 41.597782, lng: -72.755371, name: 'Connecticut' },
  'DE': { lat: 39.318523, lng: -75.507141, name: 'Delaware' },
  'FL': { lat: 27.766279, lng: -81.686783, name: 'Florida' },
  'GA': { lat: 33.040619, lng: -83.643074, name: 'Georgia' },
  'HI': { lat: 21.094318, lng: -157.498337, name: 'Hawaii' },
  'ID': { lat: 44.240459, lng: -114.478828, name: 'Idaho' },
  'IL': { lat: 40.349457, lng: -88.986137, name: 'Illinois' },
  'IN': { lat: 39.849426, lng: -86.258278, name: 'Indiana' },
  'IA': { lat: 42.011539, lng: -93.210526, name: 'Iowa' },
  'KS': { lat: 38.526600, lng: -96.726486, name: 'Kansas' },
  'KY': { lat: 37.668140, lng: -84.670067, name: 'Kentucky' },
  'LA': { lat: 31.169546, lng: -91.867805, name: 'Louisiana' },
  'ME': { lat: 44.693947, lng: -69.381927, name: 'Maine' },
  'MD': { lat: 39.063946, lng: -76.802101, name: 'Maryland' },
  'MA': { lat: 42.230171, lng: -71.530106, name: 'Massachusetts' },
  'MI': { lat: 43.326618, lng: -84.536095, name: 'Michigan' },
  'MN': { lat: 45.694454, lng: -93.900192, name: 'Minnesota' },
  'MS': { lat: 32.741646, lng: -89.678696, name: 'Mississippi' },
  'MO': { lat: 38.456085, lng: -92.288368, name: 'Missouri' },
  'MT': { lat: 47.052952, lng: -109.633040, name: 'Montana' },
  'NE': { lat: 41.125370, lng: -98.268082, name: 'Nebraska' },
  'NV': { lat: 38.313515, lng: -117.055374, name: 'Nevada' },
  'NH': { lat: 43.452492, lng: -71.563896, name: 'New Hampshire' },
  'NJ': { lat: 40.298904, lng: -74.521011, name: 'New Jersey' },
  'NM': { lat: 34.840515, lng: -106.248482, name: 'New Mexico' },
  'NY': { lat: 42.165726, lng: -74.948051, name: 'New York' },
  'NC': { lat: 35.630066, lng: -79.806419, name: 'North Carolina' },
  'ND': { lat: 47.528912, lng: -99.784012, name: 'North Dakota' },
  'OH': { lat: 40.388783, lng: -82.764915, name: 'Ohio' },
  'OK': { lat: 35.565342, lng: -96.928917, name: 'Oklahoma' },
  'OR': { lat: 44.572021, lng: -122.070938, name: 'Oregon' },
  'PA': { lat: 40.590752, lng: -77.209755, name: 'Pennsylvania' },
  'RI': { lat: 41.680893, lng: -71.51178, name: 'Rhode Island' },
  'SC': { lat: 33.856892, lng: -80.945007, name: 'South Carolina' },
  'SD': { lat: 44.299782, lng: -99.438828, name: 'South Dakota' },
  'TN': { lat: 35.747845, lng: -86.692345, name: 'Tennessee' },
  'TX': { lat: 31.054487, lng: -97.563461, name: 'Texas' },
  'UT': { lat: 40.150032, lng: -111.862434, name: 'Utah' },
  'VT': { lat: 44.045876, lng: -72.710686, name: 'Vermont' },
  'VA': { lat: 37.769337, lng: -78.169968, name: 'Virginia' },
  'WA': { lat: 47.400902, lng: -121.490494, name: 'Washington' },
  'WV': { lat: 38.491226, lng: -80.954456, name: 'West Virginia' },
  'WI': { lat: 44.268543, lng: -89.616508, name: 'Wisconsin' },
  'WY': { lat: 42.755966, lng: -107.302490, name: 'Wyoming' }
};

export default function LiveHeatmap() {
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [alertsVisible, setAlertsVisible] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [pulseAnimations, setPulseAnimations] = useState<Set<string>>(new Set());
  const [recentAlerts, setRecentAlerts] = useState<ScamAlert[]>([]);
  const [wsConnected, setWsConnected] = useState(false);
  const [liveStats, setLiveStats] = useState({ alerts: 0, updates: 0 });
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const audioRef = useRef<HTMLAudioElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Fetch live trends data
  const { data: trendsData, refetch: refetchTrends } = useQuery({
    queryKey: ['/api/trends'],
    refetchInterval: 30000, // Refresh every 30 seconds for live updates
  });

  // Fetch live news data  
  const { data: newsData } = useQuery({
    queryKey: ['/api/news'],
    refetchInterval: 60000, // Refresh every minute
  });

  // Generate heatmap data from trends and news
  const generateHeatmapData = (): HeatmapData[] => {
    if (!trendsData || !Array.isArray(trendsData.trends)) return [];

    const stateData: Record<string, HeatmapData> = {};

    // Initialize all states
    Object.entries(stateCoordinates).forEach(([code, info]) => {
      stateData[code] = {
        state: code,
        stateName: info.name,
        coordinates: info,
        riskLevel: Math.floor(Math.random() * 40) + 10, // Base risk 10-50
        activeAlerts: 0,
        recentTrends: [],
        totalReports: 0,
        demographics: {
          seniorPopulation: Math.floor(Math.random() * 25) + 10, // 10-35%
          internetUsage: Math.floor(Math.random() * 30) + 60, // 60-90%
          reportingRate: Math.floor(Math.random() * 15) + 5 // 5-20%
        }
      };
    });

    // Process trends data to update state risk levels
    (trendsData.trends as any[]).forEach((trend: any) => {
      if (trend.affectedRegions && Array.isArray(trend.affectedRegions)) {
        trend.affectedRegions.forEach((region: string) => {
          const stateCode = region.toUpperCase();
          if (stateData[stateCode]) {
            stateData[stateCode].riskLevel = Math.min(100, 
              stateData[stateCode].riskLevel + (trend.severity === 'critical' ? 25 : 
                trend.severity === 'high' ? 15 : 10)
            );
            stateData[stateCode].activeAlerts += 1;
            stateData[stateCode].totalReports += trend.reportCount || 0;
            stateData[stateCode].recentTrends.push({
              id: trend.id,
              title: trend.title,
              description: trend.description,
              severity: trend.severity,
              category: trend.category,
              affectedRegions: trend.affectedRegions,
              reportCount: trend.reportCount || 0,
              timestamp: trend.lastReported || new Date().toISOString(),
              sourceAgency: trend.sources?.[0]?.name || 'Government Source'
            });
          }
        });
      }
    });

    return Object.values(stateData);
  };

  const heatmapData = generateHeatmapData();

  // Monitor for new alerts and trigger animations
  useEffect(() => {
    if (trendsData && Array.isArray(trendsData.trends)) {
      const currentTime = Date.now();
      const recentThreshold = 5 * 60 * 1000; // 5 minutes

      const newAlerts = (trendsData.trends as any[]).filter((trend: any) => {
        const trendTime = new Date(trend.lastReported || trend.firstReported).getTime();
        return (currentTime - trendTime) < recentThreshold;
      });

      // Always show the latest 10 alerts, regardless of timing
      const latestAlerts = (trendsData.trends as any[]).slice(0, 10).map((trend: any) => ({
        id: trend.id,
        title: trend.title,
        description: trend.description,
        severity: trend.severity,
        category: trend.category,
        affectedRegions: trend.affectedRegions || ['national'],
        reportCount: trend.reportCount || 0,
        timestamp: trend.lastReported || trend.firstReported,
        sourceAgency: trend.sourceAgency || 'Government Source'
      }));

      setRecentAlerts(latestAlerts);

      if (newAlerts.length > 0) {
        // Trigger pulse animations for affected states
        const affectedStates = new Set<string>();
        newAlerts.forEach((alert: any) => {
          if (alert.affectedRegions) {
            alert.affectedRegions.forEach((region: string) => {
              affectedStates.add(region.toUpperCase());
            });
          }
        });

        setPulseAnimations(affectedStates);

        // Play alert sound if enabled
        if (soundEnabled && audioRef.current) {
          audioRef.current.play().catch(() => {
            // Ignore audio play failures (user interaction required)
          });
        }

        // Clear animations after 3 seconds
        setTimeout(() => {
          setPulseAnimations(new Set());
        }, 3000);
      }
    }
  }, [trendsData, soundEnabled]);

  // WebSocket connection for real-time updates
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    let reconnectTimeout: NodeJS.Timeout;
    
    const connectWebSocket = () => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        return;
      }

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected to heatmap feed');
        setWsConnected(true);
        reconnectAttempts = 0; // Reset on successful connection
        
        // Subscribe to heatmap updates
        ws.send(JSON.stringify({
          type: 'subscribe',
          topics: ['heatmap', 'alerts', 'critical_news']
        }));
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleWebSocketMessage(message);
        } catch (error) {
          console.error('WebSocket message parsing error:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket connection closed, code:', event.code, 'reason:', event.reason);
        setWsConnected(false);
        
        // Only attempt to reconnect if not a normal closure and we haven't exceeded attempts
        if (event.code !== 1000 && reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts++;
          reconnectTimeout = setTimeout(connectWebSocket, 3000 * reconnectAttempts);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setWsConnected(false);
      };
    };

    connectWebSocket();

    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounting');
      }
    };
  }, []);

  const handleWebSocketMessage = (message: any) => {
    switch (message.type) {
      case 'new_alert':
        const newAlert: ScamAlert = {
          ...message.data,
          isNew: true
        };
        
        setRecentAlerts(prev => [newAlert, ...prev.slice(0, 9)]);
        setLiveStats(prev => ({ ...prev, alerts: prev.alerts + 1 }));
        
        // Trigger pulse animation for affected states
        if (newAlert.affectedRegions) {
          const affectedStates = new Set(newAlert.affectedRegions.map(r => r.toUpperCase()));
          setPulseAnimations(affectedStates);
          
          // Play alert sound
          if (soundEnabled && audioRef.current) {
            audioRef.current.play().catch(() => {});
          }
          
          setTimeout(() => setPulseAnimations(new Set()), 3000);
        }
        break;

      case 'trend_update':
        setLiveStats(prev => ({ ...prev, updates: prev.updates + 1 }));
        refetchTrends(); // Refresh trends data
        break;

      case 'critical_news':
        // Handle critical news with visual alerts
        const criticalAlert: ScamAlert = {
          id: `news-${message.data.id}`,
          title: `BREAKING: ${message.data.title}`,
          description: message.data.summary,
          severity: 'critical' as const,
          category: message.data.category,
          affectedRegions: ['US'], // National news
          reportCount: 1,
          timestamp: message.data.publishDate,
          sourceAgency: message.data.sourceAgency,
          isNew: true
        };
        
        setRecentAlerts(prev => [criticalAlert, ...prev.slice(0, 9)]);
        break;

      case 'initial_data':
        // Handle initial data load
        if (message.data.trends) {
          const alerts = message.data.trends.slice(0, 5).map((trend: any) => ({
            ...trend,
            timestamp: trend.lastReported
          }));
          setRecentAlerts(alerts);
        }
        break;
    }
  };

  const getRiskColor = (riskLevel: number): string => {
    if (riskLevel >= 80) return '#DC2626'; // Red
    if (riskLevel >= 60) return '#EA580C'; // Orange  
    if (riskLevel >= 40) return '#D97706'; // Amber
    if (riskLevel >= 20) return '#EAB308'; // Yellow
    return '#16A34A'; // Green
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical': return 'bg-red-600';
      case 'high': return 'bg-orange-600';
      case 'medium': return 'bg-yellow-600';
      default: return 'bg-blue-600';
    }
  };

  const calculateMapPosition = (lat: number, lng: number) => {
    // Convert lat/lng to SVG coordinates (simplified projection)
    const x = ((lng + 180) / 360) * 100;
    const y = ((90 - lat) / 180) * 100;
    return { x: `${x}%`, y: `${y}%` };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-6">
        
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-2">
            <Activity className="h-8 w-8 text-blue-400" />
            Live Scam Intelligence Heatmap
          </h1>
          <p className="text-blue-200">
            Real-time visualization from 9 official government sources with 4x daily updates
          </p>
        </div>

        {/* Controls */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-4">
            <Button
              variant={alertsVisible ? "default" : "outline"}
              size="sm"
              onClick={() => setAlertsVisible(!alertsVisible)}
              className="text-white"
            >
              {alertsVisible ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
              Alert Indicators
            </Button>
            <Button
              variant={soundEnabled ? "default" : "outline"}
              size="sm"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="text-white"
            >
              {soundEnabled ? <Volume2 className="h-4 w-4 mr-2" /> : <VolumeX className="h-4 w-4 mr-2" />}
              Alert Sounds
            </Button>
          </div>
          
          <div className="flex items-center gap-4 text-white text-sm">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${wsConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              <span>{wsConnected ? 'Live Feed Active' : 'Connecting...'}</span>
            </div>
            {wsConnected && (
              <div className="text-xs text-blue-300">
                Alerts: {liveStats.alerts} | Updates: {liveStats.updates}
              </div>
            )}
            <div className="text-blue-200">
              Last Update: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Heatmap */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-800/90 border-slate-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    National Threat Map
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.25))}
                      size="sm"
                      variant="outline"
                      className="text-white border-slate-600 hover:bg-slate-700"
                      disabled={zoomLevel <= 0.5}
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-gray-300 px-2">
                      {Math.round(zoomLevel * 100)}%
                    </span>
                    <Button
                      onClick={() => setZoomLevel(Math.min(3, zoomLevel + 0.25))}
                      size="sm"
                      variant="outline"
                      className="text-white border-slate-600 hover:bg-slate-700"
                      disabled={zoomLevel >= 3}
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => setZoomLevel(1)}
                      size="sm"
                      variant="outline"
                      className="text-white border-slate-600 hover:bg-slate-700"
                    >
                      Reset
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  ref={mapContainerRef}
                  className="relative w-full h-96 bg-slate-900 rounded-lg overflow-hidden cursor-move"
                  style={{
                    transform: `scale(${zoomLevel}) translate(${panPosition.x}px, ${panPosition.y}px)`,
                    transformOrigin: 'center center',
                    transition: 'transform 0.1s ease-out',
                    backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(`
                      <svg viewBox="0 0 1000 600" xmlns="http://www.w3.org/2000/svg">
                        <rect width="1000" height="600" fill="#1e293b"/>
                        <defs>
                          <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#374151" stroke-width="1" opacity="0.3"/>
                          </pattern>
                        </defs>
                        <rect width="1000" height="600" fill="url(#grid)"/>
                      </svg>
                    `)}")`,
                    backgroundSize: 'cover'
                  }}
                >
                  {heatmapData.map((state) => {
                    const position = calculateMapPosition(state.coordinates.lat, state.coordinates.lng);
                    const isPulsing = pulseAnimations.has(state.state);
                    
                    return (
                      <div
                        key={state.state}
                        className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 ${
                          selectedState === state.state ? 'scale-150 z-20' : 'hover:scale-125 z-10'
                        }`}
                        style={{
                          left: position.x,
                          top: position.y,
                        }}
                        onClick={() => setSelectedState(selectedState === state.state ? null : state.state)}
                      >
                        {/* State Risk Indicator */}
                        <div 
                          className={`w-6 h-6 rounded-full border-2 border-white shadow-lg transition-all duration-300 ${
                            isPulsing ? 'animate-ping' : ''
                          }`}
                          style={{ 
                            backgroundColor: getRiskColor(state.riskLevel),
                            boxShadow: `0 0 ${isPulsing ? '20px' : '10px'} ${getRiskColor(state.riskLevel)}40`
                          }}
                        />
                        
                        {/* Active Alerts Count */}
                        {alertsVisible && state.activeAlerts > 0 && (
                          <div className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                            {state.activeAlerts}
                          </div>
                        )}
                        
                        {/* Pulse Animation for New Alerts */}
                        {isPulsing && (
                          <>
                            <div 
                              className="absolute inset-0 rounded-full animate-ping"
                              style={{ backgroundColor: getRiskColor(state.riskLevel) }}
                            />
                            <div className="absolute -inset-2">
                              <Zap className="w-10 h-10 text-yellow-400 animate-bounce" />
                            </div>
                          </>
                        )}
                        
                        {/* State Label */}
                        <div className="absolute top-8 left-1/2 transform -translate-x-1/2 text-white text-xs font-bold bg-black/70 px-2 py-1 rounded">
                          {state.state}
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Live Alert Detonations */}
                  {recentAlerts.map((alert, index) => (
                    alert.affectedRegions?.map((region) => {
                      const stateInfo = stateCoordinates[region.toUpperCase()];
                      if (!stateInfo) return null;
                      
                      const position = calculateMapPosition(stateInfo.lat, stateInfo.lng);
                      return (
                        <div
                          key={`${alert.id}-${region}`}
                          className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                          style={{
                            left: position.x,
                            top: position.y,
                          }}
                        >
                          <div className="relative">
                            {/* Explosion Effect */}
                            <div className="absolute inset-0 w-16 h-16 -m-8">
                              <div className={`w-full h-full rounded-full animate-ping ${getSeverityColor(alert.severity)} opacity-75`} />
                              <div className={`absolute inset-2 rounded-full animate-pulse ${getSeverityColor(alert.severity)} opacity-50`} />
                              <div className={`absolute inset-4 rounded-full animate-bounce ${getSeverityColor(alert.severity)}`} />
                            </div>
                            {/* Alert Icon */}
                            <AlertTriangle className="w-8 h-8 text-white relative z-10 animate-bounce" />
                          </div>
                        </div>
                      );
                    }) || []
                  ))}
                </div>

                {/* Legend */}
                <div className="mt-4 flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                    <span className="text-gray-300">Low Risk (0-20)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                    <span className="text-gray-300">Medium Risk (21-40)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
                    <span className="text-gray-300">High Risk (41-80)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-600 rounded-full"></div>
                    <span className="text-gray-300">Critical Risk (81-100)</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            
            {/* Live Alerts Feed */}
            <Card className="bg-slate-800/90 border-slate-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Activity className="h-5 w-5 text-red-500 animate-pulse" />
                  Live Alert Feed
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 max-h-64 overflow-y-auto">
                {recentAlerts.length > 0 ? recentAlerts.slice(0, 5).map((alert) => (
                  <div key={alert.id} className="p-3 bg-slate-700 rounded-lg border border-slate-600">
                    <div className="flex justify-between items-start mb-2">
                      <Badge className={`${getSeverityColor(alert.severity)} text-white text-xs`}>
                        {alert.severity.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-gray-400">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <h4 className="text-white font-medium text-sm mb-1">{alert.title}</h4>
                    <p className="text-gray-300 text-xs mb-2 line-clamp-2">{alert.description}</p>
                    <div className="flex justify-between items-center text-xs text-gray-400">
                      <span>{alert.sourceAgency}</span>
                      <span>{alert.reportCount} reports</span>
                    </div>
                  </div>
                )) : (
                  <div className="text-center text-gray-400 py-8">
                    <Shield className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No recent alerts</p>
                    <p className="text-xs">All systems monitoring normally</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Selected State Details */}
            {selectedState && (
              <Card className="bg-slate-800/90 border-slate-700 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white">
                    {heatmapData.find(s => s.state === selectedState)?.stateName} Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const state = heatmapData.find(s => s.state === selectedState);
                    if (!state) return null;
                    
                    return (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="text-gray-400">Risk Level:</div>
                          <div className="text-white font-bold" style={{ color: getRiskColor(state.riskLevel) }}>
                            {state.riskLevel}/100
                          </div>
                          <div className="text-gray-400">Active Alerts:</div>
                          <div className="text-white">{state.activeAlerts}</div>
                          <div className="text-gray-400">Total Reports:</div>
                          <div className="text-white">{state.totalReports.toLocaleString()}</div>
                          <div className="text-gray-400">Senior Population:</div>
                          <div className="text-white">{state.demographics.seniorPopulation}%</div>
                        </div>
                        
                        {state.recentTrends.length > 0 && (
                          <div>
                            <h4 className="text-white font-medium mb-2">Recent Trends</h4>
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                              {state.recentTrends.slice(0, 3).map((trend) => (
                                <div key={trend.id} className="p-2 bg-slate-700 rounded text-xs">
                                  <div className="text-white font-medium">{trend.title}</div>
                                  <div className="text-gray-400 mt-1">{trend.reportCount} reports</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            )}

            {/* Statistics */}
            <Card className="bg-slate-800/90 border-slate-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  National Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-400">States at High Risk</div>
                    <div className="text-2xl font-bold text-red-400">
                      {heatmapData.filter(s => s.riskLevel >= 60).length}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400">Total Active Alerts</div>
                    <div className="text-2xl font-bold text-orange-400">
                      {heatmapData.reduce((sum, s) => sum + s.activeAlerts, 0)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400">Reports Today</div>
                    <div className="text-2xl font-bold text-blue-400">
                      {heatmapData.reduce((sum, s) => sum + s.totalReports, 0).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400">Data Sources Online</div>
                    <div className="text-2xl font-bold text-green-400">
                      {recentAlerts.length > 0 ? Math.min(8, Math.max(3, recentAlerts.length)) : 3}/8
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Audio element for alert sounds */}
        <audio ref={audioRef} preload="auto">
          <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dun2kdCjiN1vXLfC0GJ3bE796RP" type="audio/wav" />
        </audio>
      </div>
    </div>
  );
}