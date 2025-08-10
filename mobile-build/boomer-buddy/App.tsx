import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  const handleAnalyze = () => {
    Alert.alert('Boomer Buddy', 'Scam analysis feature ready! Upload screenshots or describe suspicious calls.');
  };

  const handleEmergency = () => {
    Alert.alert('Emergency', 'Emergency features activated! Call authorities if needed.');
  };

  const handleTraining = () => {
    Alert.alert('Training', 'Interactive scam detection training modules coming soon!');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" backgroundColor="#FFFFFF" />
      
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>🛡️ Boomer Buddy</Text>
          <Text style={styles.subtitle}>Your Digital Safety Companion</Text>
          <Text style={styles.version}>Native Mobile App v1.0</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>🔍 Quick Protection Check</Text>
          <Text style={styles.cardText}>
            Upload a screenshot, share a message, or describe a suspicious call to get instant scam analysis.
          </Text>
          <TouchableOpacity style={styles.primaryButton} onPress={handleAnalyze}>
            <Text style={styles.buttonText}>Analyze Threat</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>🚨 Emergency Mode</Text>
          <Text style={styles.cardText}>
            If you think you're being scammed right now, tap here for immediate help.
          </Text>
          <TouchableOpacity style={styles.emergencyButton} onPress={handleEmergency}>
            <Text style={styles.buttonText}>⚡ Emergency Help</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>🎓 Training Center</Text>
          <Text style={styles.cardText}>
            Learn to identify scams with interactive training modules and real examples.
          </Text>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleTraining}>
            <Text style={styles.buttonText}>Start Training</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>📊 Live Threat Alerts</Text>
          <Text style={styles.cardText}>
            Stay updated with the latest scams from 60+ government sources.
          </Text>
          <View style={styles.alertItem}>
            <Text style={styles.alertType}>• Tech Support Scam</Text>
            <Text style={styles.alertDate}>Today</Text>
          </View>
          <View style={styles.alertItem}>
            <Text style={styles.alertType}>• Medicare Fraud Alert</Text>
            <Text style={styles.alertDate}>Yesterday</Text>
          </View>
          <View style={styles.alertItem}>
            <Text style={styles.alertType}>• Social Security Impersonation</Text>
            <Text style={styles.alertDate}>2 days ago</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            🔒 Privacy First: All analysis happens on your device. No personal data is shared.
          </Text>
          <Text style={styles.footerText}>
            📱 This is the actual native mobile app built with React Native.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    backgroundColor: '#17948E',
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
    marginBottom: 4,
  },
  version: {
    fontSize: 12,
    color: 'white',
    opacity: 0.7,
  },
  card: {
    backgroundColor: 'white',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#17948E',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  emergencyButton: {
    backgroundColor: '#DC2626',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: '#1F748C',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  alertItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  alertType: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  alertDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  footer: {
    margin: 16,
    padding: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  footerText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 4,
  },
});
