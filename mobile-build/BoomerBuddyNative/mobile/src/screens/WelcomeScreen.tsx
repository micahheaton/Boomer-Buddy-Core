import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';

interface WelcomeScreenProps {
  onComplete: () => void;
}

const { width } = Dimensions.get('window');

export default function WelcomeScreen({ onComplete }: WelcomeScreenProps) {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Logo Area */}
      <View style={styles.logoContainer}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>🛡️</Text>
        </View>
        <Text style={styles.appName}>Boomer Buddy</Text>
        <Text style={styles.tagline}>Your Personal Scam Shield</Text>
      </View>

      {/* Features */}
      <View style={styles.featuresContainer}>
        <View style={styles.feature}>
          <Text style={styles.featureIcon}>📞</Text>
          <Text style={styles.featureTitle}>Live Call Protection</Text>
          <Text style={styles.featureText}>Real-time transcription and scam detection during phone calls</Text>
        </View>

        <View style={styles.feature}>
          <Text style={styles.featureIcon}>📸</Text>
          <Text style={styles.featureTitle}>Quick Screenshot Analysis</Text>
          <Text style={styles.featureText}>Instantly analyze suspicious emails and text messages</Text>
        </View>

        <View style={styles.feature}>
          <Text style={styles.featureIcon}>👥</Text>
          <Text style={styles.featureTitle}>Community Support</Text>
          <Text style={styles.featureText}>Connect with others and share your safety score</Text>
        </View>
      </View>

      {/* Get Started Button */}
      <TouchableOpacity style={styles.button} onPress={onComplete}>
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>

      <Text style={styles.disclaimer}>
        Your privacy is protected. We never store your personal information.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#17948E',
    paddingHorizontal: 20,
    paddingVertical: 40,
    justifyContent: 'space-between',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoText: {
    fontSize: 40,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 18,
    color: '#B8E6E1',
    textAlign: 'center',
  },
  featuresContainer: {
    flex: 1,
    justifyContent: 'center',
    marginVertical: 40,
  },
  feature: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 30,
    marginBottom: 10,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  featureText: {
    fontSize: 14,
    color: '#B8E6E1',
    textAlign: 'center',
    lineHeight: 20,
  },
  button: {
    backgroundColor: 'white',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 25,
    alignSelf: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#17948E',
    fontSize: 18,
    fontWeight: 'bold',
  },
  disclaimer: {
    fontSize: 12,
    color: '#B8E6E1',
    textAlign: 'center',
    lineHeight: 16,
  },
});