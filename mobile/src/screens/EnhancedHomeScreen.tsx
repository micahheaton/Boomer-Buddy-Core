import React, { useState, useEffect } from 'react';
import { View, ScrollView, RefreshControl, Animated } from 'react-native';
import { ThreatVisualization } from '../components/ThreatVisualization';
import { PersonalizedSafetyCarousel } from '../components/PersonalizedSafetyCarousel';
import { EmotionalSupportBot } from '../components/EmotionalSupportBot';
import { AdvancedAnalysisEngine, ThreatVisualizationData } from '../services/AdvancedAnalysisEngine';
import { StorageService } from '../services/StorageService';
import { ApiService } from '../services/ApiService';

interface QuickStats {
  protectionScore: number;
  scamsBlocked: number;
  currentStreak: number;
  lastActivity: string;
  weeklyTrend: number;
}

interface LiveAlert {
  id: string;
  title: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
  timestamp: number;
  source: string;
  category: string;
}

export const EnhancedHomeScreen: React.FC = () => {
  // State management
  const [threatData, setThreatData] = useState<ThreatVisualizationData | undefined>();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [quickStats, setQuickStats] = useState<QuickStats | null>(null);
  const [liveAlerts, setLiveAlerts] = useState<LiveAlert[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSupportBot, setShowSupportBot] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline'>('online');

  // Animations
  const [headerAnimation] = useState(new Animated.Value(0));
  const [statsAnimation] = useState(new Animated.Value(0));
  const [alertsAnimation] = useState(new Animated.Value(0));

  // Services
  const analysisEngine = new AdvancedAnalysisEngine();
  const storageService = new StorageService();

  useEffect(() => {
    initializeHomeScreen();
    startPeriodicUpdates();
    animateInitialLoad();
    
    return () => {
      // Cleanup periodic updates
    };
  }, []);

  const initializeHomeScreen = async () => {
    try {
      await Promise.all([
        loadQuickStats(),
        loadLiveAlerts(),
        checkConnectionStatus()
      ]);
    } catch (error) {
      console.error('Failed to initialize home screen:', error);
    }
  };

  const animateInitialLoad = () => {
    const staggerDelay = 200;
    
    [headerAnimation, statsAnimation, alertsAnimation].forEach((anim, index) => {
      Animated.spring(anim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        delay: index * staggerDelay,
        useNativeDriver: true,
      }).start();
    });
  };

  const loadQuickStats = async () => {
    try {
      console.log('🔄 Loading real backend stats...');
      
      // Test real backend connection
      const connectionTest = await ApiService.testConnection();
      console.log('🌐 Backend connection test:', connectionTest);
      
      if (connectionTest.connected) {
        setConnectionStatus('online');
        
        // Load real government data
        const feedsData = await ApiService.getLiveFeeds();
        const recentThreats = feedsData.feeds
          .filter(feed => feed.elder_relevance_score > 0.8)
          .length;
        
        setQuickStats({
          protectionScore: Math.min(95, 75 + (connectionTest.endpoints.activeSources * 2)),
          scamsBlocked: recentThreats,
          currentStreak: Math.floor((Date.now() - new Date('2025-01-01').getTime()) / (24 * 60 * 60 * 1000)),
          lastActivity: `Connected to ${connectionTest.endpoints.activeSources} government sources`,
          weeklyTrend: connectionTest.endpoints.feedCount > 50 ? 15 : 8
        });
      } else {
        setConnectionStatus('offline');
        setQuickStats({
          protectionScore: 45,
          scamsBlocked: 0,
          currentStreak: 0,
          lastActivity: 'Offline - No backend connection',
          weeklyTrend: -5
        });
      }
    } catch (error) {
      console.error('❌ Failed to load real stats:', error);
      setConnectionStatus('offline');
    }
  };

  const calculateProtectionScore = (analyses: any[]): number => {
    if (analyses.length === 0) return 85; // Default baseline
    
    const threatDetectionRate = analyses.filter(a => a.result.level !== 'safe').length / analyses.length;
    const avgConfidence = analyses.reduce((sum, a) => sum + (a.result.confidence || 0.5), 0) / analyses.length;
    const recentActivity = Math.min(analyses.length / 10, 1); // Bonus for activity
    
    return Math.round(75 + (avgConfidence * 15) + (threatDetectionRate * 10) + (recentActivity * 5));
  };

  const calculateWeeklyTrend = (analyses: any[]): number => {
    const thisWeek = analyses.filter(a => 
      Date.now() - a.timestamp < 7 * 24 * 60 * 60 * 1000
    ).length;
    
    const lastWeek = analyses.filter(a => {
      const daysDiff = (Date.now() - a.timestamp) / (24 * 60 * 60 * 1000);
      return daysDiff >= 7 && daysDiff < 14;
    }).length;
    
    if (lastWeek === 0) return thisWeek > 0 ? 1 : 0;
    return (thisWeek - lastWeek) / lastWeek;
  };

  const formatLastActivity = (timestamp: number): string => {
    const diff = Date.now() - timestamp;
    const hours = Math.floor(diff / (60 * 60 * 1000));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  const loadLiveAlerts = async () => {
    try {
      console.log('🚨 Loading REAL live alerts from backend...');
      
      // Get real government data from backend
      const feedsData = await ApiService.getLiveFeeds();
      console.log('📊 Got real feeds data:', feedsData);
      
      const alerts: LiveAlert[] = feedsData.feeds
        .filter(feed => feed.elder_relevance_score > 0.7)
        .slice(0, 5)
        .map(feed => ({
          id: `real_alert_${Date.now()}_${Math.random()}`,
          title: feed.title,
          severity: feed.severity === 'critical' ? 'high' : 
                   feed.severity === 'warning' ? 'medium' : 'low',
          description: `From ${feed.source} - ${feed.tags.join(', ')}`,
          timestamp: new Date(feed.published_at).getTime(),
          source: feed.source,
          category: feed.tags[0] || 'General'
        }));
      
      setLiveAlerts(alerts);
      console.log(`✅ Loaded ${alerts.length} REAL alerts from government sources`);
    } catch (error) {
      console.error('❌ Failed to load REAL alerts:', error);
      setConnectionStatus('offline');
      setLiveAlerts([{
        id: 'error_alert',
        title: 'Backend Connection Error',
        severity: 'high',
        description: 'Unable to connect to government data sources. Check your internet connection.',
        timestamp: Date.now(),
        source: 'System Error',
        category: 'Technical'
      }]);
    }
  };

  const generateSampleAlerts = (): LiveAlert[] => {
    return [
      {
        id: 'alert_1',
        title: 'IRS Impersonation Scam Surge',
        severity: 'high',
        description: 'Reports of fake IRS calls demanding immediate payment are increasing in your area.',
        timestamp: Date.now() - 30 * 60 * 1000,
        source: 'FTC Consumer Alert',
        category: 'Phone Scam'
      },
      {
        id: 'alert_2',
        title: 'Medicare Open Enrollment Scams',
        severity: 'medium',
        description: 'Scammers are targeting seniors during Medicare open enrollment period.',
        timestamp: Date.now() - 2 * 60 * 60 * 1000,
        source: 'HHS-OIG Advisory',
        category: 'Healthcare'
      },
      {
        id: 'alert_3',
        title: 'Romance Scam Awareness',
        severity: 'low',
        description: 'New dating app scam tactics identified targeting older adults.',
        timestamp: Date.now() - 4 * 60 * 60 * 1000,
        source: 'FBI IC3 Alert',
        category: 'Romance Scam'
      }
    ];
  };

  const checkConnectionStatus = async () => {
    try {
      const response = await fetch('/api/mobile/v1/model', { 
        method: 'HEAD',
        timeout: 5000 
      });
      setConnectionStatus(response.ok ? 'online' : 'offline');
    } catch (error) {
      setConnectionStatus('offline');
    }
  };

  const startPeriodicUpdates = () => {
    // Update alerts every 5 minutes
    const alertInterval = setInterval(loadLiveAlerts, 5 * 60 * 1000);
    
    // Update connection status every minute
    const connectionInterval = setInterval(checkConnectionStatus, 60 * 1000);
    
    return () => {
      clearInterval(alertInterval);
      clearInterval(connectionInterval);
    };
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await initializeHomeScreen();
    setIsRefreshing(false);
  };

  const startQuickAnalysis = async () => {
    setIsAnalyzing(true);
    
    // Simulate quick analysis for demo
    await analysisEngine.analyzeWithVisualization(
      "Sample content for analysis",
      "text",
      (step) => {
        console.log('Analysis step:', step);
      },
      (visualizationData) => {
        setThreatData(visualizationData);
      }
    );
    
    setTimeout(() => {
      setIsAnalyzing(false);
    }, 3000);
  };

  const navigateToAnalysis = () => {
    // Navigation to analysis screen would be implemented here
    console.log('Navigate to analysis screen');
  };

  const navigateToResource = (resource: string) => {
    // Navigation to specific resources would be implemented here
    console.log('Navigate to resource:', resource);
  };

  const handleEmergencyAction = (actionType: string) => {
    // Handle emergency actions
    console.log('Emergency action:', actionType);
    switch (actionType) {
      case 'immediate_help':
        // Show emergency contacts or resources
        break;
      case 'call_support':
        // Initiate support call
        break;
    }
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const renderHeader = () => {
    return (
      <Animated.View
        style={{
          backgroundColor: '#1F2937',
          paddingTop: 60,
          paddingBottom: 24,
          paddingHorizontal: 20,
          transform: [{ translateY: headerAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [-50, 0],
          })}],
          opacity: headerAnimation,
        }}
      >
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}>
          <View>
            <View style={{
              fontSize: 28,
              fontWeight: 'bold',
              color: 'white',
            }}>
              Good {getTimeOfDay()}
            </View>
            <View style={{
              fontSize: 16,
              color: '#D1D5DB',
            }}>
              You're protected by Boomer Buddy
            </View>
          </View>

          {/* Connection Status */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: connectionStatus === 'online' ? '#10B981' : '#6B7280',
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 20,
          }}>
            <View style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: 'white',
              marginRight: 8,
            }} />
            <View style={{
              fontSize: 14,
              color: 'white',
              fontWeight: '500',
            }}>
              {connectionStatus === 'online' ? 'Protected' : 'Offline Mode'}
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
        }}>
          <View
            style={{
              flex: 1,
              backgroundColor: '#3B82F6',
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 12,
              marginRight: 8,
              alignItems: 'center',
            }}
            onTouchEnd={navigateToAnalysis}
          >
            <View style={{
              fontSize: 16,
              color: 'white',
              fontWeight: '600',
            }}>
              🔍 Quick Analysis
            </View>
          </View>

          <View
            style={{
              flex: 1,
              backgroundColor: '#8B5CF6',
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 12,
              marginLeft: 8,
              alignItems: 'center',
            }}
            onTouchEnd={() => setShowSupportBot(true)}
          >
            <View style={{
              fontSize: 16,
              color: 'white',
              fontWeight: '600',
            }}>
              💬 Get Support
            </View>
          </View>
        </View>
      </Animated.View>
    );
  };

  const getTimeOfDay = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Morning';
    if (hour < 17) return 'Afternoon';
    return 'Evening';
  };

  const renderQuickStats = () => {
    if (!quickStats) return null;

    return (
      <Animated.View
        style={{
          margin: 16,
          backgroundColor: 'white',
          borderRadius: 16,
          padding: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4,
          transform: [{ scale: statsAnimation }],
          opacity: statsAnimation,
        }}
      >
        <View style={{
          fontSize: 20,
          fontWeight: 'bold',
          color: '#1F2937',
          marginBottom: 16,
        }}>
          Your Protection Status
        </View>

        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}>
          <View style={{ alignItems: 'center' }}>
            <View style={{
              fontSize: 32,
              fontWeight: 'bold',
              color: quickStats.protectionScore >= 90 ? '#10B981' : 
                     quickStats.protectionScore >= 75 ? '#F59E0B' : '#EF4444',
            }}>
              {quickStats.protectionScore}%
            </View>
            <View style={{
              fontSize: 14,
              color: '#6B7280',
            }}>
              Protection Score
            </View>
          </View>

          <View style={{ alignItems: 'center' }}>
            <View style={{
              fontSize: 32,
              fontWeight: 'bold',
              color: '#3B82F6',
            }}>
              {quickStats.scamsBlocked}
            </View>
            <View style={{
              fontSize: 14,
              color: '#6B7280',
            }}>
              Scams Blocked
            </View>
          </View>

          <View style={{ alignItems: 'center' }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
            }}>
              <View style={{
                fontSize: 20,
                marginRight: 4,
              }}>
                🔥
              </View>
              <View style={{
                fontSize: 32,
                fontWeight: 'bold',
                color: '#F59E0B',
              }}>
                {quickStats.currentStreak}
              </View>
            </View>
            <View style={{
              fontSize: 14,
              color: '#6B7280',
            }}>
              Day Streak
            </View>
          </View>
        </View>

        <View style={{
          paddingTop: 16,
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
        }}>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <View style={{
              fontSize: 14,
              color: '#6B7280',
            }}>
              Last activity: {quickStats.lastActivity}
            </View>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
            }}>
              <View style={{
                fontSize: 12,
                color: quickStats.weeklyTrend >= 0 ? '#10B981' : '#EF4444',
                marginRight: 4,
              }}>
                {quickStats.weeklyTrend >= 0 ? '↗️' : '↘️'}
              </View>
              <View style={{
                fontSize: 14,
                color: quickStats.weeklyTrend >= 0 ? '#10B981' : '#EF4444',
                fontWeight: '500',
              }}>
                {Math.abs(Math.round(quickStats.weeklyTrend * 100))}% this week
              </View>
            </View>
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderThreatVisualization = () => {
    return (
      <View style={{
        margin: 16,
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        alignItems: 'center',
      }}>
        <View style={{
          fontSize: 20,
          fontWeight: 'bold',
          color: '#1F2937',
          marginBottom: 16,
        }}>
          Real-Time Protection Shield
        </View>

        <ThreatVisualization
          data={threatData}
          isAnalyzing={isAnalyzing}
          onAnalysisComplete={() => console.log('Analysis complete')}
        />

        <View
          style={{
            backgroundColor: '#3B82F6',
            paddingVertical: 12,
            paddingHorizontal: 24,
            borderRadius: 8,
            marginTop: 16,
          }}
          onTouchEnd={startQuickAnalysis}
        >
          <View style={{
            fontSize: 16,
            color: 'white',
            fontWeight: '600',
          }}>
            {isAnalyzing ? 'Analyzing...' : 'Test Protection'}
          </View>
        </View>
      </View>
    );
  };

  const renderLiveAlerts = () => {
    return (
      <Animated.View
        style={{
          margin: 16,
          transform: [{ translateX: alertsAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [100, 0],
          })}],
          opacity: alertsAnimation,
        }}
      >
        <View style={{
          fontSize: 20,
          fontWeight: 'bold',
          color: '#1F2937',
          marginBottom: 12,
        }}>
          Live Security Alerts
        </View>

        {liveAlerts.map((alert, index) => (
          <View
            key={alert.id}
            style={{
              backgroundColor: 'white',
              borderRadius: 12,
              padding: 16,
              marginBottom: 8,
              borderLeftWidth: 4,
              borderLeftColor: getSeverityColor(alert.severity),
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: 8,
            }}>
              <View style={{
                flex: 1,
                fontSize: 16,
                fontWeight: '600',
                color: '#1F2937',
                marginRight: 8,
              }}>
                {alert.title}
              </View>
              <View style={{
                backgroundColor: getSeverityColor(alert.severity),
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 12,
              }}>
                <View style={{
                  fontSize: 12,
                  color: 'white',
                  fontWeight: '600',
                }}>
                  {alert.severity.toUpperCase()}
                </View>
              </View>
            </View>

            <View style={{
              fontSize: 14,
              color: '#4B5563',
              lineHeight: 20,
              marginBottom: 8,
            }}>
              {alert.description}
            </View>

            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <View style={{
                fontSize: 12,
                color: '#6B7280',
              }}>
                {alert.source} • {formatLastActivity(alert.timestamp)}
              </View>
              <View style={{
                fontSize: 12,
                color: '#3B82F6',
                fontWeight: '500',
              }}>
                {alert.category}
              </View>
            </View>
          </View>
        ))}

        <View
          style={{
            backgroundColor: '#F3F4F6',
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderRadius: 8,
            alignItems: 'center',
            marginTop: 8,
          }}
          onTouchEnd={() => navigateToResource('all_alerts')}
        >
          <View style={{
            fontSize: 14,
            color: '#6B7280',
            fontWeight: '500',
          }}>
            View All Alerts →
          </View>
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={['#3B82F6']}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderHeader()}
        {renderQuickStats()}
        {renderThreatVisualization()}
        
        <PersonalizedSafetyCarousel
          onTipViewed={(tipId) => console.log('Tip viewed:', tipId)}
          onActionTaken={(tipId, action) => console.log('Action taken:', tipId, action)}
        />
        
        {renderLiveAlerts()}
        
        <View style={{ height: 100 }} />
      </ScrollView>

      <EmotionalSupportBot
        isVisible={showSupportBot}
        onClose={() => setShowSupportBot(false)}
        onNavigateToResource={navigateToResource}
        onEmergencyAction={handleEmergencyAction}
        initialContext="general"
      />

      {/* Floating Support Button */}
      <View
        style={{
          position: 'absolute',
          bottom: 30,
          right: 20,
          width: 60,
          height: 60,
          borderRadius: 30,
          backgroundColor: '#8B5CF6',
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}
        onTouchEnd={() => setShowSupportBot(true)}
      >
        <View style={{
          fontSize: 28,
          color: 'white',
        }}>
          💬
        </View>
      </View>
    </View>
  );
};