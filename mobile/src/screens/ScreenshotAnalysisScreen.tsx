import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useUser } from '../context/UserContext';

interface AnalysisResult {
  riskScore: number;
  riskLevel: string;
  signals: string[];
  explanation: string;
}

export default function ScreenshotAnalysisScreen() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const { incrementAnalysisCount, incrementScamsDetected } = useUser();

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please enable photo access to analyze screenshots.');
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      setAnalysisResult(null);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please enable camera access to take screenshots.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      setAnalysisResult(null);
    }
  };

  const analyzeImage = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    incrementAnalysisCount();

    // Simulate OCR and analysis
    setTimeout(() => {
      // Simulate different analysis results
      const mockResults = [
        {
          riskScore: 92,
          riskLevel: 'HIGH RISK',
          signals: [
            'Urgent language detected',
            'Request for personal information',
            'Suspicious sender domain',
            'Threats of account closure'
          ],
          explanation: 'This message shows multiple red flags typical of phishing scams. The urgent language and request for personal information are major warning signs.'
        },
        {
          riskScore: 15,
          riskLevel: 'LOW RISK',
          signals: [
            'Legitimate company branding',
            'Official domain verified',
            'Standard business language'
          ],
          explanation: 'This appears to be a legitimate business communication with proper branding and official contact information.'
        },
        {
          riskScore: 67,
          riskLevel: 'MEDIUM RISK',
          signals: [
            'Generic greeting',
            'Unusual payment method mentioned',
            'Limited time offer'
          ],
          explanation: 'While not definitively a scam, this message contains some concerning elements. Verify through official channels before taking action.'
        }
      ];

      const result = mockResults[Math.floor(Math.random() * mockResults.length)];
      
      if (result.riskScore >= 70) {
        incrementScamsDetected();
      }

      setAnalysisResult(result);
      setIsAnalyzing(false);
    }, 3000);
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'HIGH RISK': return '#e74c3c';
      case 'MEDIUM RISK': return '#f39c12';
      case 'LOW RISK': return '#27ae60';
      default: return '#95a5a6';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>📸 Screenshot Analysis</Text>
          <Text style={styles.instructionsText}>
            Take a photo or select an image of suspicious emails, text messages, or social media posts for instant scam analysis.
          </Text>
        </View>

        {/* Image Selection */}
        <View style={styles.imageSection}>
          {selectedImage ? (
            <View style={styles.imageContainer}>
              <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
              <TouchableOpacity style={styles.changeImageButton} onPress={pickImage}>
                <Text style={styles.changeImageText}>Change Image</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.placeholderText}>No image selected</Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={takePhoto}>
            <Text style={styles.actionButtonText}>📷 Take Photo</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={pickImage}>
            <Text style={styles.actionButtonText}>🖼️ Choose from Gallery</Text>
          </TouchableOpacity>
        </View>

        {/* Analyze Button */}
        {selectedImage && (
          <TouchableOpacity 
            style={[styles.analyzeButton, { opacity: isAnalyzing ? 0.6 : 1 }]}
            onPress={analyzeImage}
            disabled={isAnalyzing}
          >
            <Text style={styles.analyzeButtonText}>
              {isAnalyzing ? '🔍 Analyzing...' : '🔍 Analyze for Scams'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Analysis Results */}
        {analysisResult && (
          <View style={styles.resultsCard}>
            <View style={styles.riskHeader}>
              <Text style={styles.riskScore}>{analysisResult.riskScore}%</Text>
              <Text style={[styles.riskLevel, { color: getRiskColor(analysisResult.riskLevel) }]}>
                {analysisResult.riskLevel}
              </Text>
            </View>

            <Text style={styles.explanation}>{analysisResult.explanation}</Text>

            <View style={styles.signals}>
              <Text style={styles.signalsTitle}>Warning Signs Detected:</Text>
              {analysisResult.signals.map((signal, index) => (
                <View key={index} style={styles.signalItem}>
                  <Text style={styles.signalBullet}>⚠️</Text>
                  <Text style={styles.signalText}>{signal}</Text>
                </View>
              ))}
            </View>

            {analysisResult.riskScore >= 70 && (
              <View style={styles.actionAlert}>
                <Text style={styles.actionAlertTitle}>🚨 Recommended Action</Text>
                <Text style={styles.actionAlertText}>
                  Do not respond to this message. Delete it immediately and report to the appropriate authorities.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Safety Reminder */}
        <View style={styles.reminderCard}>
          <Text style={styles.reminderTitle}>🛡️ Remember</Text>
          <Text style={styles.reminderText}>
            When in doubt, always verify suspicious communications through official channels. Never provide personal information based on unsolicited messages.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  instructionsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instructionsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  instructionsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  imageSection: {
    marginBottom: 20,
  },
  imageContainer: {
    alignItems: 'center',
  },
  selectedImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 10,
  },
  changeImageButton: {
    backgroundColor: '#17948E',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  changeImageText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  imagePlaceholder: {
    height: 200,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  placeholderText: {
    color: '#999',
    fontSize: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: 'white',
    flex: 0.48,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  analyzeButton: {
    backgroundColor: '#17948E',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 20,
  },
  analyzeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  resultsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  riskHeader: {
    alignItems: 'center',
    marginBottom: 15,
  },
  riskScore: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#333',
  },
  riskLevel: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 5,
  },
  explanation: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
    marginBottom: 20,
  },
  signals: {
    marginBottom: 20,
  },
  signalsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  signalItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  signalBullet: {
    fontSize: 14,
    marginRight: 8,
    marginTop: 2,
  },
  signalText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    lineHeight: 18,
  },
  actionAlert: {
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    padding: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  actionAlertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 8,
  },
  actionAlertText: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 18,
  },
  reminderCard: {
    backgroundColor: '#e8f5e8',
    borderRadius: 12,
    padding: 20,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d5a2d',
    marginBottom: 8,
  },
  reminderText: {
    fontSize: 14,
    color: '#2d5a2d',
    lineHeight: 18,
  },
});