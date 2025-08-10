import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { ApiService } from '../services/ApiService';
import { StorageService } from '../services/StorageService';

const HomeScreen = ({ navigation }: any) => {
  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean;
    latency?: number;
    sources?: number;
    lastUpdate?: string;
  }>({ connected: false });
  
  const [recentCases, setRecentCases] = useState<number>(0);
  const [protectionScore, setProtectionScore] = useState<number>(85);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeHomeScreen();
  }, []);

  const initializeHomeScreen = async () => {
    try {
      // Check backend connection
      const status = await ApiService.getConnectionStatus();
      setConnectionStatus(status);

      // Get local case history count
      const cases = await StorageService.getCaseHistory();
      setRecentCases(cases.length);

      // Calculate protection score based on recent activity
      const score = calculateProtectionScore(cases);
      setProtectionScore(score);
    } catch (error) {
      console.error('Failed to initialize home screen:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateProtectionScore = (cases: any[]): number => {
    // Base score of 75
    let score = 75;
    
    // Increase score for recent blocking activity
    const recentCases = cases.filter(c => {
      const caseDate = new Date(c.timestamp);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return caseDate > weekAgo;
    });
    
    // Add points for each blocked scam
    const blockedScams = recentCases.filter(c => c.userAction === 'blocked' || c.riskScore >= 70);
    score += Math.min(blockedScams.length * 3, 20);
    
    return Math.min(score, 100);
  };

  const formatLastUpdate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#16A34A';
    if (score >= 75) return '#D97706';
    return '#DC2626';
  };

  const handleQuickScan = () => {
    navigation.navigate('Report');
  };

  const handleViewAlerts = () => {
    navigation.navigate('Alerts');
  };

  const handleTraining = () => {
    navigation.navigate('Training');
  };

  const handleEmergencyReport = () => {
    Alert.alert(
      'Emergency Report',
      'Are you currently being contacted by a suspected scammer?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Yes, Help Me', 
          style: 'destructive',
          onPress: () => {
            // TODO: Launch emergency flow
            navigation.navigate('Report', { emergency: true });
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading Boomer Buddy...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Welcome to</Text>
          <Text style={styles.appTitle}>Boomer Buddy</Text>
          <Text style={styles.subtitle}>Your Personal Scam Shield</Text>
        </View>

        {/* Protection Score Card */}
        <View style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>Protection Score</Text>
          <Text style={[styles.scoreValue, { color: getScoreColor(protectionScore) }]}>
            {protectionScore}%
          </Text>
          <Text style={styles.scoreDescription}>
            {protectionScore >= 90 ? 'Excellent protection' :
             protectionScore >= 75 ? 'Good protection' : 'Needs improvement'}
          </Text>
        </View>

        {/* Connection Status */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Text style={styles.statusTitle}>Live Intelligence</Text>
            <View style={[styles.statusDot, { 
              backgroundColor: connectionStatus.connected ? '#16A34A' : '#DC2626'
            }]} />
          </View>
          
          {connectionStatus.connected ? (
            <>
              <Text style={styles.statusText}>
                Connected to {connectionStatus.sources} government sources
              </Text>
              <Text style={styles.statusTime}>
                Last update: {formatLastUpdate(connectionStatus.lastUpdate)}
              </Text>
              {connectionStatus.latency && (
                <Text style={styles.latencyText}>
                  Response time: {connectionStatus.latency}ms
                </Text>
              )}
            </>
          ) : (
            <Text style={styles.statusTextError}>
              Unable to connect to protection services
            </Text>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <Text style={styles.actionsTitle}>Quick Actions</Text>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.emergencyButton]}
            onPress={handleEmergencyReport}
          >
            <Text style={styles.emergencyButtonText}>🚨 Emergency Report</Text>
            <Text style={styles.emergencyButtonSubtext}>
              Being contacted right now?
            </Text>
          </TouchableOpacity>

          <View style={styles.actionGrid}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={handleQuickScan}
            >
              <Text style={styles.actionIcon}>🔍</Text>
              <Text style={styles.actionTitle}>Quick Scan</Text>
              <Text style={styles.actionSubtitle}>Check text or call</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={handleViewAlerts}
            >
              <Text style={styles.actionIcon}>⚠️</Text>
              <Text style={styles.actionTitle}>Live Alerts</Text>
              <Text style={styles.actionSubtitle}>Latest threats</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={handleTraining}
            >
              <Text style={styles.actionIcon}>🎓</Text>
              <Text style={styles.actionTitle}>Training</Text>
              <Text style={styles.actionSubtitle}>Learn protection</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('Settings')}
            >
              <Text style={styles.actionIcon}>⚙️</Text>
              <Text style={styles.actionTitle}>Settings</Text>
              <Text style={styles.actionSubtitle}>Customize app</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activity */}
        {recentCases > 0 && (
          <View style={styles.activityCard}>
            <Text style={styles.activityTitle}>Recent Activity</Text>
            <Text style={styles.activityText}>
              You've analyzed {recentCases} potential threats
            </Text>
            <TouchableOpacity 
              style={styles.viewHistoryButton}
              onPress={() => navigation.navigate('Settings')}
            >
              <Text style={styles.viewHistoryText}>View History</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Safety Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>Daily Safety Tip</Text>
          <Text style={styles.tipsText}>
            Never give out personal information over the phone unless you initiated the call to a verified number.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#17948E',
    padding: 24,
    paddingTop: 16,
  },
  welcomeText: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginVertical: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  scoreCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  scoreLabel: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 8,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  scoreDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  statusTextError: {
    fontSize: 14,
    color: '#DC2626',
  },
  statusTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  latencyText: {
    fontSize: 12,
    color: '#6B7280',
  },
  actionsContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  actionsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  actionButton: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  emergencyButton: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  emergencyButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#DC2626',
    textAlign: 'center',
  },
  emergencyButtonSubtext: {
    fontSize: 14,
    color: '#7F1D1D',
    textAlign: 'center',
    marginTop: 4,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    backgroundColor: '#FFFFFF',
    width: '48%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIcon: {
    fontSize: 32,
    textAlign: 'center',
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  activityCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  activityTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  activityText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 12,
  },
  viewHistoryButton: {
    backgroundColor: '#F3F4F6',
    padding: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  viewHistoryText: {
    fontSize: 14,
    color: '#17948E',
    fontWeight: '500',
  },
  tipsCard: {
    backgroundColor: '#FEF3C7',
    marginHorizontal: 16,
    marginBottom: 32,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },
});

export default HomeScreen;