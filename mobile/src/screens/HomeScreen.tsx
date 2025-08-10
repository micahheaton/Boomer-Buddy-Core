import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';

// Import components
import CallTranscriptionScreen from './CallTranscriptionScreen';
import ScreenshotAnalysisScreen from './ScreenshotAnalysisScreen';
import ProfileScreen from './ProfileScreen';

type TabType = 'home' | 'call' | 'camera' | 'profile';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('home');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'call':
        return <CallTranscriptionScreen />;
      case 'camera':
        return <ScreenshotAnalysisScreen />;
      case 'profile':
        return <ProfileScreen />;
      default:
        return <HomeContent />;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Boomer Buddy</Text>
        <View style={styles.shieldIcon}>
          <Text style={styles.shieldText}>🛡️</Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {renderTabContent()}
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={[styles.navItem, activeTab === 'home' && styles.activeNavItem]}
          onPress={() => setActiveTab('home')}
        >
          <Text style={[styles.navIcon, activeTab === 'home' && styles.activeNavIcon]}>🏠</Text>
          <Text style={[styles.navText, activeTab === 'home' && styles.activeNavText]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navItem, activeTab === 'call' && styles.activeNavItem]}
          onPress={() => setActiveTab('call')}
        >
          <Text style={[styles.navIcon, activeTab === 'call' && styles.activeNavIcon]}>📞</Text>
          <Text style={[styles.navText, activeTab === 'call' && styles.activeNavText]}>Calls</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navItem, activeTab === 'camera' && styles.activeNavItem]}
          onPress={() => setActiveTab('camera')}
        >
          <Text style={[styles.navIcon, activeTab === 'camera' && styles.activeNavIcon]}>📸</Text>
          <Text style={[styles.navText, activeTab === 'camera' && styles.activeNavText]}>Analyze</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navItem, activeTab === 'profile' && styles.activeNavItem]}
          onPress={() => setActiveTab('profile')}
        >
          <Text style={[styles.navIcon, activeTab === 'profile' && styles.activeNavIcon]}>👤</Text>
          <Text style={[styles.navText, activeTab === 'profile' && styles.activeNavText]}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function HomeContent() {
  return (
    <ScrollView style={styles.homeContent}>
      {/* Safety Score Card */}
      <View style={styles.scoreCard}>
        <Text style={styles.scoreTitle}>Your Safety Score</Text>
        <View style={styles.scoreDisplay}>
          <Text style={styles.scoreNumber}>85</Text>
          <Text style={styles.scoreLabel}>Protected</Text>
        </View>
        <Text style={styles.scoreDescription}>
          Great job! You're staying vigilant against scams.
        </Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>🔍</Text>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Analyze Text Message</Text>
            <Text style={styles.actionDescription}>Take a screenshot of suspicious messages</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>📞</Text>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Monitor Call</Text>
            <Text style={styles.actionDescription}>Live transcription and scam detection</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>📊</Text>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>View Reports</Text>
            <Text style={styles.actionDescription}>See your analysis history</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Recent Activity */}
      <View style={styles.recentActivity}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <Text style={styles.noActivity}>No recent scam attempts detected. Keep it up!</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#17948E',
    paddingTop: 20,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  shieldIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shieldText: {
    fontSize: 20,
  },
  content: {
    flex: 1,
  },
  homeContent: {
    flex: 1,
    padding: 20,
  },
  scoreCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scoreTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  scoreDisplay: {
    alignItems: 'center',
    marginBottom: 15,
  },
  scoreNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#17948E',
  },
  scoreLabel: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  scoreDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  quickActions: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  actionButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    color: '#666',
  },
  recentActivity: {
    marginBottom: 20,
  },
  noActivity: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  bottomNav: {
    backgroundColor: 'white',
    flexDirection: 'row',
    paddingTop: 10,
    paddingBottom: 20,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 5,
  },
  activeNavItem: {
    backgroundColor: 'rgba(23, 148, 142, 0.1)',
    borderRadius: 8,
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  activeNavIcon: {
    opacity: 1,
  },
  navText: {
    fontSize: 12,
    color: '#666',
  },
  activeNavText: {
    color: '#17948E',
    fontWeight: '600',
  },
});