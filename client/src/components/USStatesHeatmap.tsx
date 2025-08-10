import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, MapPin, AlertTriangle, Activity } from 'lucide-react';

interface StateData {
  abbreviation: string;
  name: string;
  alertCount: number;
  highPriorityCount: number;
  scamCount: number;
  lastUpdated: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface USStatesHeatmapProps {
  data: any[];
  selectedState?: string;
  onStateSelect: (state: string | null) => void;
}

// US states with their simplified rectangular positions for better interactivity
const US_STATES = {
  'AL': { name: 'Alabama', x: 540, y: 280, width: 40, height: 60 },
  'AK': { name: 'Alaska', x: 80, y: 350, width: 80, height: 50 },
  'AZ': { name: 'Arizona', x: 180, y: 240, width: 60, height: 80 },
  'AR': { name: 'Arkansas', x: 460, y: 240, width: 50, height: 60 },
  'CA': { name: 'California', x: 80, y: 180, width: 60, height: 120 },
  'CO': { name: 'Colorado', x: 300, y: 200, width: 70, height: 60 },
  'CT': { name: 'Connecticut', x: 680, y: 180, width: 25, height: 20 },
  'DE': { name: 'Delaware', x: 660, y: 210, width: 15, height: 30 },
  'FL': { name: 'Florida', x: 580, y: 320, width: 80, height: 80 },
  'GA': { name: 'Georgia', x: 560, y: 250, width: 50, height: 70 },
  'HI': { name: 'Hawaii', x: 200, y: 380, width: 40, height: 20 },
  'ID': { name: 'Idaho', x: 240, y: 120, width: 40, height: 100 },
  'IL': { name: 'Illinois', x: 460, y: 180, width: 40, height: 80 },
  'IN': { name: 'Indiana', x: 510, y: 180, width: 40, height: 70 },
  'IA': { name: 'Iowa', x: 400, y: 170, width: 50, height: 50 },
  'KS': { name: 'Kansas', x: 340, y: 210, width: 60, height: 50 },
  'KY': { name: 'Kentucky', x: 520, y: 220, width: 80, height: 40 },
  'LA': { name: 'Louisiana', x: 420, y: 290, width: 50, height: 60 },
  'ME': { name: 'Maine', x: 680, y: 100, width: 30, height: 80 },
  'MD': { name: 'Maryland', x: 640, y: 200, width: 50, height: 25 },
  'MA': { name: 'Massachusetts', x: 670, y: 160, width: 50, height: 25 },
  'MI': { name: 'Michigan', x: 520, y: 140, width: 50, height: 80 },
  'MN': { name: 'Minnesota', x: 400, y: 120, width: 50, height: 80 },
  'MS': { name: 'Mississippi', x: 480, y: 260, width: 40, height: 70 },
  'MO': { name: 'Missouri', x: 420, y: 190, width: 60, height: 60 },
  'MT': { name: 'Montana', x: 280, y: 100, width: 120, height: 60 },
  'NE': { name: 'Nebraska', x: 340, y: 170, width: 80, height: 40 },
  'NV': { name: 'Nevada', x: 160, y: 160, width: 60, height: 80 },
  'NH': { name: 'New Hampshire', x: 660, y: 140, width: 25, height: 40 },
  'NJ': { name: 'New Jersey', x: 650, y: 190, width: 25, height: 50 },
  'NM': { name: 'New Mexico', x: 260, y: 240, width: 60, height: 80 },
  'NY': { name: 'New York', x: 600, y: 140, width: 80, height: 60 },
  'NC': { name: 'North Carolina', x: 580, y: 220, width: 80, height: 40 },
  'ND': { name: 'North Dakota', x: 340, y: 100, width: 60, height: 40 },
  'OH': { name: 'Ohio', x: 560, y: 170, width: 50, height: 60 },
  'OK': { name: 'Oklahoma', x: 340, y: 240, width: 80, height: 50 },
  'OR': { name: 'Oregon', x: 120, y: 120, width: 60, height: 60 },
  'PA': { name: 'Pennsylvania', x: 580, y: 170, width: 70, height: 50 },
  'RI': { name: 'Rhode Island', x: 700, y: 170, width: 15, height: 20 },
  'SC': { name: 'South Carolina', x: 580, y: 240, width: 40, height: 40 },
  'SD': { name: 'South Dakota', x: 340, y: 140, width: 60, height: 40 },
  'TN': { name: 'Tennessee', x: 520, y: 240, width: 80, height: 35 },
  'TX': { name: 'Texas', x: 280, y: 260, width: 100, height: 100 },
  'UT': { name: 'Utah', x: 240, y: 180, width: 50, height: 70 },
  'VT': { name: 'Vermont', x: 650, y: 140, width: 20, height: 40 },
  'VA': { name: 'Virginia', x: 600, y: 200, width: 70, height: 40 },
  'WA': { name: 'Washington', x: 120, y: 80, width: 80, height: 50 },
  'WV': { name: 'West Virginia', x: 580, y: 190, width: 40, height: 50 },
  'WI': { name: 'Wisconsin', x: 460, y: 120, width: 50, height: 80 },
  'WY': { name: 'Wyoming', x: 280, y: 140, width: 60, height: 60 }
};

export function USStatesHeatmap({ data, selectedState, onStateSelect }: USStatesHeatmapProps) {
  const [stateData, setStateData] = useState<Record<string, StateData>>({});
  const [hoveredState, setHoveredState] = useState<string | null>(null);

  // Process data to extract state-specific information
  useEffect(() => {
    const processedData: Record<string, StateData> = {};
    
    // Initialize all states
    Object.entries(US_STATES).forEach(([abbr, info]) => {
      processedData[abbr] = {
        abbreviation: abbr,
        name: info.name,
        alertCount: 0,
        highPriorityCount: 0,
        scamCount: 0,
        lastUpdated: new Date(),
        severity: 'low'
      };
    });

    // Count alerts by state with improved detection
    data.forEach(alert => {
      // Enhanced state detection from multiple sources
      let detectedStates: string[] = [];
      
      // Check source agency for state patterns
      const agencyStateMatch = alert.sourceAgency?.match(/\b([A-Z]{2})\b/g);
      if (agencyStateMatch) detectedStates.push(...agencyStateMatch);
      
      // Check for state names in source agency
      Object.entries(US_STATES).forEach(([abbr, info]) => {
        if (alert.sourceAgency?.toLowerCase().includes(info.name.toLowerCase()) ||
            alert.description?.toLowerCase().includes(info.name.toLowerCase()) ||
            alert.title?.toLowerCase().includes(info.name.toLowerCase())) {
          detectedStates.push(abbr);
        }
      });
      
      // Check for common federal agencies that affect all states
      const federalAgencies = ['FTC', 'FBI', 'SSA', 'HHS', 'CISA', 'SEC', 'DOJ'];
      const isFederal = federalAgencies.some(agency => 
        alert.sourceAgency?.includes(agency) || alert.title?.includes(agency)
      );
      
      // If federal alert, distribute to all states with lower weight
      if (isFederal && detectedStates.length === 0) {
        Object.keys(processedData).forEach(state => {
          processedData[state].alertCount += 0.1; // Fractional count for federal alerts
        });
      } else {
        // Process detected states
        [...new Set(detectedStates)].forEach(state => {
          if (processedData[state]) {
            processedData[state].alertCount++;
            
            if (alert.severity === 'high' || alert.severity === 'critical') {
              processedData[state].highPriorityCount++;
            }
            
            if (alert.isScamAlert) {
              processedData[state].scamCount++;
            }
            
            // Update severity based on highest alert severity
            if (alert.severity === 'critical') {
              processedData[state].severity = 'critical';
            } else if (alert.severity === 'high' && processedData[state].severity !== 'critical') {
              processedData[state].severity = 'high';
            } else if (alert.severity === 'medium' && !['critical', 'high'].includes(processedData[state].severity)) {
              processedData[state].severity = 'medium';
            }
          }
        });
      }
    });

    // Round fractional counts
    Object.values(processedData).forEach(state => {
      state.alertCount = Math.round(state.alertCount);
    });

    setStateData(processedData);
  }, [data]);

  const getStateColor = (state: StateData) => {
    if (state.alertCount === 0) return '#e5e7eb'; // gray-200
    
    switch (state.severity) {
      case 'critical': return '#dc2626'; // red-600
      case 'high': return '#ea580c'; // orange-600
      case 'medium': return '#d97706'; // amber-600
      default: return '#16a34a'; // green-600
    }
  };

  const getStateOpacity = (state: StateData) => {
    if (selectedState && selectedState !== state.abbreviation) return 0.3;
    if (hoveredState && hoveredState !== state.abbreviation) return 0.7;
    return 1.0;
  };

  const handleStateClick = (stateAbbr: string) => {
    if (selectedState === stateAbbr) {
      onStateSelect(null); // Deselect if already selected
    } else {
      onStateSelect(stateAbbr);
    }
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              US States Threat Overview
            </h3>
            <p className="text-sm text-gray-600">
              Click states to filter data. Color intensity shows threat level.
            </p>
          </div>
          {selectedState && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onStateSelect(null)}
              className="flex items-center gap-2"
            >
              <X className="h-3 w-3" />
              Clear Selection
            </Button>
          )}
        </div>

        {/* Heatmap SVG */}
        <div className="relative bg-gray-50 rounded-lg p-4 mb-4">
          <svg
            viewBox="0 0 800 450"
            className="w-full h-auto max-h-96"
          >
            {Object.entries(US_STATES).map(([stateAbbr, stateInfo]) => {
              const data = stateData[stateAbbr];
              if (!data) return null;

              return (
                <g key={stateAbbr}>
                  <rect
                    x={stateInfo.x}
                    y={stateInfo.y}
                    width={stateInfo.width}
                    height={stateInfo.height}
                    fill={getStateColor(data)}
                    fillOpacity={getStateOpacity(data)}
                    stroke="#374151"
                    strokeWidth="1"
                    rx="3"
                    className="cursor-pointer transition-all duration-200 hover:stroke-2 hover:stroke-blue-500"
                    onClick={() => handleStateClick(stateAbbr)}
                    onMouseEnter={() => setHoveredState(stateAbbr)}
                    onMouseLeave={() => setHoveredState(null)}
                  />
                  {/* State label */}
                  <text
                    x={stateInfo.x + stateInfo.width / 2}
                    y={stateInfo.y + stateInfo.height / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-white text-xs font-bold pointer-events-none"
                    style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
                  >
                    {stateAbbr}
                  </text>
                  {/* Alert count badge for states with data */}
                  {data.alertCount > 0 && (
                    <circle
                      cx={stateInfo.x + stateInfo.width - 8}
                      cy={stateInfo.y + 8}
                      r="6"
                      fill="#dc2626"
                      className="pointer-events-none"
                    />
                  )}
                </g>
              );
            })}
          </svg>

          {/* Legend */}
          <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-3 space-y-2">
            <div className="text-xs font-medium text-gray-700">Threat Level</div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 bg-red-600 rounded"></div>
                <span>Critical</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 bg-orange-600 rounded"></div>
                <span>High</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 bg-amber-600 rounded"></div>
                <span>Medium</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 bg-green-600 rounded"></div>
                <span>Low</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 bg-gray-200 rounded"></div>
                <span>No Data</span>
              </div>
            </div>
          </div>
        </div>

        {/* State Information Panel */}
        {(selectedState || hoveredState) && (
          <div className="bg-blue-50 rounded-lg p-4">
            {(() => {
              const state = stateData[selectedState || hoveredState!];
              return (
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-blue-900">
                      {state?.name} ({selectedState || hoveredState})
                    </h4>
                    <div className="flex items-center gap-4 mt-2 text-sm text-blue-700">
                      <span className="flex items-center gap-1">
                        <Activity className="h-3 w-3" />
                        {state?.alertCount || 0} alerts
                      </span>
                      <span className="flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {state?.highPriorityCount || 0} high priority
                      </span>
                      <Badge variant={state?.severity === 'critical' ? 'destructive' : 'secondary'}>
                        {state?.severity || 'low'} threat
                      </Badge>
                    </div>
                  </div>
                  {selectedState && (
                    <div className="text-xs text-blue-600">
                      Data filtered to show {state?.name} only
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

