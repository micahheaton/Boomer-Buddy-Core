import { StorageService } from './StorageService';

export interface LocationSafetyData {
  latitude: number;
  longitude: number;
  safetyScore: number;
  riskFactors: RiskFactor[];
  reportedIncidents: SafetyIncident[];
  recommendations: string[];
  lastUpdated: number;
  dataSource: string;
}

export interface RiskFactor {
  type: 'fraud_hotspot' | 'elderly_targeting' | 'phone_scam_area' | 'identity_theft' | 'romance_scam';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  frequency: number;
  trendDirection: 'increasing' | 'stable' | 'decreasing';
}

export interface SafetyIncident {
  id: string;
  type: string;
  description: string;
  timestamp: number;
  verified: boolean;
  vicinity: boolean; // Within user's area
  impactScore: number;
}

export interface LocationAlerts {
  immediate: LocationAlert[];
  advisory: LocationAlert[];
  informational: LocationAlert[];
}

export interface LocationAlert {
  id: string;
  title: string;
  message: string;
  severity: 'immediate' | 'advisory' | 'informational';
  radius: number; // meters
  expiresAt: number;
  source: string;
}

export class LocationSafetyService {
  private storageService: StorageService;
  private watchId: number | null = null;
  private currentLocation: { lat: number; lng: number } | null = null;

  constructor() {
    this.storageService = new StorageService();
  }

  /**
   * Initialize location services and start monitoring
   */
  async initializeLocationServices(): Promise<boolean> {
    try {
      const hasPermission = await this.requestLocationPermission();
      if (!hasPermission) {
        console.log('Location permission denied');
        return false;
      }

      await this.startLocationMonitoring();
      return true;
    } catch (error) {
      console.error('Failed to initialize location services:', error);
      return false;
    }
  }

  /**
   * Request location permission from user
   */
  private async requestLocationPermission(): Promise<boolean> {
    try {
      // In a real React Native app, this would use react-native-permissions
      // For now, simulate permission request
      return new Promise((resolve) => {
        // Simulate user granting permission
        setTimeout(() => resolve(true), 1000);
      });
    } catch (error) {
      console.error('Location permission request failed:', error);
      return false;
    }
  }

  /**
   * Start monitoring user location for safety updates
   */
  private async startLocationMonitoring(): Promise<void> {
    try {
      // In React Native, this would use @react-native-community/geolocation
      // Simulate location updates
      this.simulateLocationUpdates();
    } catch (error) {
      console.error('Failed to start location monitoring:', error);
    }
  }

  /**
   * Simulate location updates for development
   */
  private simulateLocationUpdates(): void {
    // Simulate user in a major US city with various safety scenarios
    const locations = [
      { lat: 40.7128, lng: -74.0060 }, // New York City
      { lat: 34.0522, lng: -118.2437 }, // Los Angeles
      { lat: 41.8781, lng: -87.6298 }, // Chicago
      { lat: 29.7604, lng: -95.3698 }, // Houston
      { lat: 33.4484, lng: -112.0740 } // Phoenix
    ];

    let locationIndex = 0;
    
    const updateLocation = async () => {
      this.currentLocation = locations[locationIndex];
      locationIndex = (locationIndex + 1) % locations.length;
      
      await this.updateLocationSafety(this.currentLocation.lat, this.currentLocation.lng);
    };

    // Update location every 30 seconds for demo
    updateLocation();
    setInterval(updateLocation, 30000);
  }

  /**
   * Get safety data for a specific location
   */
  async getLocationSafety(latitude: number, longitude: number): Promise<LocationSafetyData> {
    try {
      // Try to get from server first
      const serverData = await this.fetchLocationSafetyFromServer(latitude, longitude);
      if (serverData) {
        await this.cacheLocationSafety(serverData);
        return serverData;
      }

      // Fallback to cached data
      const cachedData = await this.getCachedLocationSafety(latitude, longitude);
      if (cachedData) {
        return cachedData;
      }

      // Generate mock data for development
      return this.generateMockLocationSafety(latitude, longitude);
    } catch (error) {
      console.error('Failed to get location safety:', error);
      return this.generateMockLocationSafety(latitude, longitude);
    }
  }

  /**
   * Fetch location safety data from government sources
   */
  private async fetchLocationSafetyFromServer(lat: number, lng: number): Promise<LocationSafetyData | null> {
    try {
      const response = await fetch('/api/mobile/v1/location-safety', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude: lat, longitude: lng }),
        timeout: 10000
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.log('Server location data unavailable, using cached data');
    }
    
    return null;
  }

  /**
   * Update safety information when location changes
   */
  private async updateLocationSafety(lat: number, lng: number): Promise<void> {
    try {
      const safetyData = await this.getLocationSafety(lat, lng);
      
      // Check for immediate alerts
      const alerts = await this.checkForLocationAlerts(lat, lng, safetyData);
      
      if (alerts.immediate.length > 0) {
        await this.triggerImmediateAlerts(alerts.immediate);
      }

      // Store current location safety
      await this.storageService.setCurrentLocationSafety({
        latitude: lat,
        longitude: lng,
        safety: safetyData,
        alerts,
        timestamp: Date.now()
      });

    } catch (error) {
      console.error('Failed to update location safety:', error);
    }
  }

  /**
   * Check for location-based alerts
   */
  private async checkForLocationAlerts(lat: number, lng: number, safetyData: LocationSafetyData): Promise<LocationAlerts> {
    const alerts: LocationAlerts = {
      immediate: [],
      advisory: [],
      informational: []
    };

    // Check for critical risk factors
    safetyData.riskFactors.forEach(factor => {
      if (factor.severity === 'critical') {
        alerts.immediate.push({
          id: `alert_${Date.now()}_${factor.type}`,
          title: `Critical Alert: ${factor.type.replace('_', ' ').toUpperCase()}`,
          message: `High risk of ${factor.description} in your current area. Exercise extreme caution.`,
          severity: 'immediate',
          radius: 5000, // 5km
          expiresAt: Date.now() + 24 * 60 * 60 * 1000,
          source: 'AI Safety Analysis'
        });
      } else if (factor.severity === 'high') {
        alerts.advisory.push({
          id: `alert_${Date.now()}_${factor.type}`,
          title: `Safety Advisory: ${factor.type.replace('_', ' ')}`,
          message: factor.description,
          severity: 'advisory',
          radius: 2000, // 2km
          expiresAt: Date.now() + 12 * 60 * 60 * 1000,
          source: 'Location Intelligence'
        });
      }
    });

    // Check recent incidents
    const recentIncidents = safetyData.reportedIncidents.filter(incident => 
      Date.now() - incident.timestamp < 7 * 24 * 60 * 60 * 1000 && incident.vicinity
    );

    if (recentIncidents.length >= 3) {
      alerts.advisory.push({
        id: `incident_cluster_${Date.now()}`,
        title: 'Recent Incident Cluster',
        message: `${recentIncidents.length} scam incidents reported in your area this week. Stay vigilant.`,
        severity: 'advisory',
        radius: 3000,
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
        source: 'Incident Monitoring'
      });
    }

    return alerts;
  }

  /**
   * Trigger immediate alert notifications
   */
  private async triggerImmediateAlerts(alerts: LocationAlert[]): Promise<void> {
    for (const alert of alerts) {
      // In React Native, this would trigger push notifications
      console.log(`🚨 IMMEDIATE ALERT: ${alert.title}`);
      console.log(`📍 ${alert.message}`);
      
      // Store alert for later reference
      await this.storageService.storeLocationAlert(alert);
      
      // In a real app, this would:
      // - Show system notification
      // - Play alert sound
      // - Update app badge
      // - Send to family members if configured
    }
  }

  /**
   * Generate mock location safety data for development
   */
  private generateMockLocationSafety(lat: number, lng: number): LocationSafetyData {
    // Base safety score on location characteristics
    let baseScore = 75 + Math.random() * 20; // 75-95 base score
    
    // Adjust based on coordinates (simulate different city risk profiles)
    if (lat > 40 && lat < 41 && lng > -75 && lng < -73) {
      // NYC area - higher risk
      baseScore -= 10;
    } else if (lat > 33 && lat < 35 && lng > -119 && lng < -117) {
      // LA area - medium risk
      baseScore -= 5;
    }

    const riskFactors: RiskFactor[] = [];
    
    // Generate realistic risk factors
    if (baseScore < 80) {
      riskFactors.push({
        type: 'fraud_hotspot',
        severity: 'high',
        description: 'Elevated reports of phone and email scams targeting seniors',
        frequency: 15 + Math.floor(Math.random() * 10),
        trendDirection: 'increasing'
      });
    }

    if (baseScore < 85) {
      riskFactors.push({
        type: 'elderly_targeting',
        severity: 'medium',
        description: 'Scammers known to target senior communities in this area',
        frequency: 8 + Math.floor(Math.random() * 7),
        trendDirection: 'stable'
      });
    }

    // Generate recent incidents
    const incidents: SafetyIncident[] = [];
    const incidentCount = Math.floor(Math.random() * 5) + 2;
    
    for (let i = 0; i < incidentCount; i++) {
      incidents.push({
        id: `incident_${Date.now()}_${i}`,
        type: ['Phone Scam', 'Email Phishing', 'Romance Scam', 'Tech Support Fraud'][Math.floor(Math.random() * 4)],
        description: 'Reported scam attempt targeting local residents',
        timestamp: Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000, // Last 30 days
        verified: Math.random() > 0.3,
        vicinity: Math.random() > 0.4,
        impactScore: Math.floor(Math.random() * 10) + 1
      });
    }

    return {
      latitude: lat,
      longitude: lng,
      safetyScore: Math.round(baseScore),
      riskFactors,
      reportedIncidents: incidents,
      recommendations: this.generateSafetyRecommendations(riskFactors),
      lastUpdated: Date.now(),
      dataSource: 'AI Safety Analysis'
    };
  }

  /**
   * Generate safety recommendations based on risk factors
   */
  private generateSafetyRecommendations(riskFactors: RiskFactor[]): string[] {
    const recommendations: string[] = [];

    if (riskFactors.some(f => f.type === 'phone_scam_area')) {
      recommendations.push('Be extra cautious with unknown phone calls in this area');
      recommendations.push('Consider using call screening features on your phone');
    }

    if (riskFactors.some(f => f.type === 'fraud_hotspot')) {
      recommendations.push('Verify any suspicious communications before responding');
      recommendations.push('Double-check with family before making any financial decisions');
    }

    if (riskFactors.some(f => f.type === 'elderly_targeting')) {
      recommendations.push('Be aware that scammers may specifically target seniors in this area');
      recommendations.push('Consider traveling with a companion when possible');
    }

    // Default recommendations
    if (recommendations.length === 0) {
      recommendations.push('Stay alert to your surroundings');
      recommendations.push('Trust your instincts about suspicious activity');
    }

    return recommendations;
  }

  /**
   * Get cached location safety data
   */
  private async getCachedLocationSafety(lat: number, lng: number): Promise<LocationSafetyData | null> {
    try {
      return await this.storageService.getCachedLocationSafety(lat, lng);
    } catch (error) {
      console.error('Failed to get cached location safety:', error);
      return null;
    }
  }

  /**
   * Cache location safety data
   */
  private async cacheLocationSafety(data: LocationSafetyData): Promise<void> {
    try {
      await this.storageService.cacheLocationSafety(data);
    } catch (error) {
      console.error('Failed to cache location safety:', error);
    }
  }

  /**
   * Get current location if available
   */
  getCurrentLocation(): { lat: number; lng: number } | null {
    return this.currentLocation;
  }

  /**
   * Manually refresh location safety data
   */
  async refreshLocationSafety(): Promise<LocationSafetyData | null> {
    if (!this.currentLocation) {
      console.log('No current location available');
      return null;
    }

    return await this.getLocationSafety(this.currentLocation.lat, this.currentLocation.lng);
  }

  /**
   * Get safety history for a location
   */
  async getLocationSafetyHistory(lat: number, lng: number, days: number = 30): Promise<LocationSafetyData[]> {
    try {
      return await this.storageService.getLocationSafetyHistory(lat, lng, days);
    } catch (error) {
      console.error('Failed to get location safety history:', error);
      return [];
    }
  }

  /**
   * Report a safety incident at current location
   */
  async reportSafetyIncident(incident: Omit<SafetyIncident, 'id' | 'timestamp' | 'vicinity'>): Promise<boolean> {
    try {
      if (!this.currentLocation) {
        throw new Error('Location not available');
      }

      const fullIncident: SafetyIncident = {
        ...incident,
        id: `user_report_${Date.now()}`,
        timestamp: Date.now(),
        vicinity: true
      };

      await this.storageService.storeUserReportedIncident(
        this.currentLocation.lat,
        this.currentLocation.lng,
        fullIncident
      );

      // In a real app, this would also send to server
      return true;
    } catch (error) {
      console.error('Failed to report safety incident:', error);
      return false;
    }
  }

  /**
   * Stop location monitoring
   */
  stopLocationMonitoring(): void {
    if (this.watchId !== null) {
      // In React Native: Geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  /**
   * Cleanup location services
   */
  destroy(): void {
    this.stopLocationMonitoring();
  }
}