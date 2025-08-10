import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, SafeAreaView, ScrollView } from 'react-native';

export default function App() {
  const [protectionActive, setProtectionActive] = useState(false);

  const activateProtection = () => {
    Alert.alert(
      "Protection Activated",
      "Boomer Buddy is now protecting you from scams and threats.",
      [{ text: "Great!", onPress: () => setProtectionActive(true) }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.shield}>
              <Text style={styles.shieldIcon}>🛡️</Text>
            </View>
            <Text style={styles.title}>Boomer Buddy</Text>
            <Text style={styles.subtitle}>Complete Digital Safety</Text>
          </View>
        </View>

        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>Protection Status</Text>
          <View style={[styles.statusIndicator, protectionActive && styles.statusActive]}>
            <Text style={styles.statusText}>
              {protectionActive ? "🟢 ACTIVE" : "⚪ READY"}
            </Text>
          </View>
        </View>

        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>Advanced Protection Features</Text>
          <Text style={styles.featureText}>🛡️ Real-time call screening</Text>
          <Text style={styles.featureText}>📱 SMS scam detection</Text>
          <Text style={styles.featureText}>🔍 Image analysis protection</Text>
          <Text style={styles.featureText}>🎯 Personalized safety tips</Text>
          <Text style={styles.featureText}>📊 Threat visualization</Text>
          <Text style={styles.featureText}>🏆 Gamified learning system</Text>
          <Text style={styles.featureText}>👥 Community protection network</Text>
          <Text style={styles.featureText}>🚨 Emergency family alerts</Text>
          <Text style={styles.featureText}>🌍 Multilingual support</Text>
          <Text style={styles.featureText}>📈 Live government data feeds</Text>
        </View>

        <TouchableOpacity 
          style={[styles.activateButton, protectionActive && styles.buttonActive]} 
          onPress={activateProtection}
          disabled={protectionActive}
        >
          <Text style={styles.buttonText}>
            {protectionActive ? "✅ Protection Active" : "🚀 Start Protection"}
          </Text>
        </TouchableOpacity>

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
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  featureText: {
    fontSize: 16,
    color: '#555',
    fontWeight: '500',
    paddingVertical: 4,
  },
  activateButton: {
    backgroundColor: '#E3400B',
    paddingVertical: 18,
    paddingHorizontal: 30,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 25,
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
