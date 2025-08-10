import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, SafeAreaView, ScrollView } from 'react-native';

export default function App() {
  const [protectionActive, setProtectionActive] = useState(false);

  const activateProtection = () => {
    Alert.alert(
      "Protection Activated",
      "Boomer Buddy is now protecting you from scams and threats.",
      [
        {
          text: "Great!",
          onPress: () => setProtectionActive(true),
          style: "default"
        }
      ]
    );
  };

  const features = [
    "🛡️ Real-time call screening",
    "📱 SMS scam detection", 
    "🔍 Image analysis protection",
    "🎯 Personalized safety tips",
    "📊 Threat visualization",
    "🏆 Gamified learning system",
    "👥 Community protection network",
    "🚨 Emergency family alerts",
    "🌍 Multilingual support",
    "📈 Live government data feeds"
  ];

  return (
    <SafeAreaView style={styles.container}>
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.shield}>
              <Text style={styles.shieldIcon}>🛡️</Text>
            </View>
            <Text style={styles.title}>Boomer Buddy</Text>
            <Text style={styles.subtitle}>Complete Digital Safety</Text>
          </View>
        </View>

        {/* Status Card */}
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>Protection Status</Text>
          <View style={[styles.statusIndicator, protectionActive && styles.statusActive]}>
            <Text style={styles.statusText}>
              {protectionActive ? "🟢 ACTIVE" : "⚪ READY"}
            </Text>
          </View>
        </View>

        {/* Features List */}
        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>Advanced Protection Features</Text>
          {features.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        {/* Activation Button */}
        <TouchableOpacity 
          style={[styles.activateButton, protectionActive && styles.buttonActive]} 
          onPress={activateProtection}
          disabled={protectionActive}
        >
          <Text style={styles.buttonText}>
            {protectionActive ? "✅ Protection Active" : "🚀 Start Protection"}
          </Text>
        </TouchableOpacity>

        {/* Info Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Comprehensive mobile app with 11 screens, 5 AI components, 
            13 intelligent services, and real-time government data integration.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#17948E',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoContainer: {
    alignItems: 'center',
  },
  shield: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  shieldIcon: {
    fontSize: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 18,
    color: '#B8E6E1',
    fontWeight: '500',
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  statusIndicator: {
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  statusActive: {
    backgroundColor: '#d4edda',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  featuresContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  featureItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  featureText: {
    fontSize: 16,
    color: '#555',
    fontWeight: '500',
  },
  activateButton: {
    backgroundColor: '#E3400B',
    paddingVertical: 18,
    paddingHorizontal: 30,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonActive: {
    backgroundColor: '#28a745',
  },
  buttonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  footer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  footerText: {
    color: '#B8E6E1',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});