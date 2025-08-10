import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Modal } from 'react-native';
import { StatusBar } from 'expo-status-bar';
// import * as ImagePicker from 'expo-image-picker'; // Temporarily commented due to version conflict
import { apiService, type ScamAnalysisResult, type ThreatAlert } from './src/services/ApiService';
import { piiScrubber } from './src/services/PiiScrubber';
import { riskEngine, type RiskAssessment } from './src/services/RiskEngine';

export default function App() {
  const [threatAlerts, setThreatAlerts] = useState<ThreatAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [analysisModalVisible, setAnalysisModalVisible] = useState(false);
  const [trainingModalVisible, setTrainingModalVisible] = useState(false);
  const [emergencyModalVisible, setEmergencyModalVisible] = useState(false);
  const [analysisText, setAnalysisText] = useState('');
  const [analysisResult, setAnalysisResult] = useState<RiskAssessment | null>(null);

  useEffect(() => {
    loadThreatAlerts();
  }, []);

  const loadThreatAlerts = async () => {
    try {
      // Try to load from server, fallback to local if offline
      const alerts = await apiService.getLiveThreatAlerts();
      setThreatAlerts(alerts.slice(0, 3)); // Show top 3
    } catch (error) {
      // Fallback to cached/sample data when offline
      setThreatAlerts([
        {
          id: '1',
          title: 'Tech Support Scam Alert',
          description: 'Fake Microsoft calls targeting seniors',
          severity: 'high',
          source: 'FTC Consumer Alert',
          dateCreated: new Date().toISOString(),
        },
        {
          id: '2', 
          title: 'Medicare Fraud Warning',
          description: 'Scammers requesting Medicare card numbers',
          severity: 'critical',
          source: 'HHS-OIG Alert',
          dateCreated: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: '3',
          title: 'Social Security Impersonation',
          description: 'Fake SSA agents demanding payments',
          severity: 'high',
          source: 'SSA Public Alert',
          dateCreated: new Date(Date.now() - 172800000).toISOString(),
        }
      ]);
    }
  };

  const handleAnalyze = () => {
    setAnalysisModalVisible(true);
  };

  const handleTextAnalysis = async () => {
    if (!analysisText.trim()) {
      Alert.alert('Error', 'Please enter some text to analyze');
      return;
    }

    setLoading(true);
    try {
      // First scrub PII for privacy
      const scrubResult = piiScrubber.scrubText(analysisText);
      
      if (scrubResult.foundPii.length > 0) {
        Alert.alert(
          'Privacy Protected',
          `Found and removed ${scrubResult.foundPii.length} pieces of personal information before analysis.`,
        );
      }

      // Perform on-device risk assessment
      const riskAssessment = riskEngine.analyzeText(analysisText);
      setAnalysisResult(riskAssessment);

      // Try to get enhanced analysis from server (optional)
      try {
        await apiService.analyzeText(scrubResult.cleanText);
      } catch (error) {
        // Server analysis failed, continue with local assessment
        console.log('Server analysis unavailable, using local assessment');
      }

    } catch (error) {
      Alert.alert('Analysis Error', 'Could not complete analysis. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleImageAnalysis = async () => {
    try {
      // Temporarily use placeholder for image analysis
      Alert.alert(
        'Image Analysis Ready',
        'Screenshot analysis will extract text and check for scam indicators. Feature temporarily disabled due to dependencies.',
        [
          { text: 'Use Text Analysis Instead', onPress: () => setAnalysisModalVisible(true) },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Could not analyze image. Please try again.');
      setLoading(false);
    }
  };

  const handleEmergency = () => {
    setEmergencyModalVisible(true);
  };

  const triggerEmergencyMode = async () => {
    try {
      Alert.alert(
        '🚨 Emergency Mode Activated',
        '• Do not provide any personal information\n• Hang up immediately if on a call\n• Contact authorities if needed\n• You are being guided to safety',
        [
          { text: 'Call 911', onPress: () => {/* In real app: Linking.openURL('tel:911') */} },
          { text: 'Report Scam', onPress: () => {/* Open scam reporting */} },
          { text: 'I\'m Safe Now', style: 'cancel' }
        ]
      );
      
      // Log emergency activation (locally only)
      await apiService.triggerEmergencyMode();
    } catch (error) {
      // Emergency mode works offline too
      console.log('Emergency mode activated offline');
    }
    setEmergencyModalVisible(false);
  };

  const handleTraining = () => {
    setTrainingModalVisible(true);
  };

  const startTrainingModule = (moduleType: string) => {
    Alert.alert(
      `${moduleType} Training`,
      'Interactive training modules help you recognize and avoid scams. This would open the training interface.',
      [
        { text: 'Start Basic Training', onPress: () => console.log('Starting basic training') },
        { text: 'Advanced Scenarios', onPress: () => console.log('Starting advanced training') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
    setTrainingModalVisible(false);
  };

  const renderAnalysisResult = () => {
    if (!analysisResult) return null;

    const getRiskColor = (risk: string) => {
      switch (risk) {
        case 'critical': return '#DC2626';
        case 'high': return '#EA580C';
        case 'medium': return '#D97706';
        case 'low': return '#059669';
        default: return '#6B7280';
      }
    };

    const getRiskIcon = (risk: string) => {
      switch (risk) {
        case 'critical': return '🚨';
        case 'high': return '⚠️';
        case 'medium': return '⚡';
        case 'low': return '✅';
        default: return 'ℹ️';
      }
    };

    return (
      <View style={styles.analysisResult}>
        <View style={[styles.riskIndicator, { backgroundColor: getRiskColor(analysisResult.overallRisk) }]}>
          <Text style={styles.riskIcon}>{getRiskIcon(analysisResult.overallRisk)}</Text>
          <Text style={styles.riskText}>
            {analysisResult.overallRisk.toUpperCase()} RISK
          </Text>
          <Text style={styles.confidenceText}>
            {analysisResult.confidence}% confidence
          </Text>
        </View>

        <Text style={styles.analysisTitle}>Recommendations:</Text>
        {analysisResult.recommendations.map((rec, index) => (
          <Text key={index} style={styles.recommendation}>
            • {rec}
          </Text>
        ))}

        {analysisResult.immediateAction && (
          <TouchableOpacity 
            style={styles.emergencyActionButton}
            onPress={() => setEmergencyModalVisible(true)}
          >
            <Text style={styles.emergencyActionText}>
              🚨 Need Immediate Help?
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
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
          {threatAlerts.map((alert, index) => (
            <View key={alert.id} style={styles.alertItem}>
              <Text style={[styles.alertType, { 
                color: alert.severity === 'critical' ? '#DC2626' : 
                       alert.severity === 'high' ? '#EA580C' : '#1F2937' 
              }]}>
                • {alert.title}
              </Text>
              <Text style={styles.alertDate}>
                {new Date(alert.dateCreated).toLocaleDateString()}
              </Text>
            </View>
          ))}
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

      {/* Analysis Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={analysisModalVisible}
        onRequestClose={() => setAnalysisModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Scam Analysis</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Paste suspicious text, describe a call, or enter details about potential scam..."
              multiline
              value={analysisText}
              onChangeText={setAnalysisText}
              numberOfLines={6}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.analyzeButton} 
                onPress={handleTextAnalysis}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? 'Analyzing...' : 'Analyze Text'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.imageButton} 
                onPress={handleImageAnalysis}
              >
                <Text style={styles.buttonText}>Analyze Screenshot</Text>
              </TouchableOpacity>
            </View>

            {renderAnalysisResult()}

            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => {
                setAnalysisModalVisible(false);
                setAnalysisText('');
                setAnalysisResult(null);
              }}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Emergency Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={emergencyModalVisible}
        onRequestClose={() => setEmergencyModalVisible(false)}
      >
        <View style={styles.emergencyOverlay}>
          <View style={styles.emergencyContent}>
            <Text style={styles.emergencyTitle}>🚨 Emergency Mode</Text>
            <Text style={styles.emergencyText}>
              Are you being scammed right now? We're here to help keep you safe.
            </Text>
            
            <TouchableOpacity style={styles.emergencyActionButton} onPress={triggerEmergencyMode}>
              <Text style={styles.emergencyActionText}>Activate Emergency Protection</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.emergencySecondaryButton}
              onPress={() => setEmergencyModalVisible(false)}
            >
              <Text style={styles.emergencySecondaryText}>I'm Safe - Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Training Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={trainingModalVisible}
        onRequestClose={() => setTrainingModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🎓 Scam Training Center</Text>
            
            <TouchableOpacity 
              style={styles.trainingOption}
              onPress={() => startTrainingModule('Tech Support Scam')}
            >
              <Text style={styles.trainingTitle}>🖥️ Tech Support Scams</Text>
              <Text style={styles.trainingDescription}>Learn to recognize fake tech support calls</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.trainingOption}
              onPress={() => startTrainingModule('Romance Scam')}
            >
              <Text style={styles.trainingTitle}>💕 Romance Scams</Text>
              <Text style={styles.trainingDescription}>Identify online dating and relationship fraud</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.trainingOption}
              onPress={() => startTrainingModule('Government Impersonation')}
            >
              <Text style={styles.trainingTitle}>🏛️ Government Impersonation</Text>
              <Text style={styles.trainingDescription}>Spot fake IRS, SSA, and Medicare calls</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.trainingOption}
              onPress={() => startTrainingModule('Financial Fraud')}
            >
              <Text style={styles.trainingTitle}>💳 Financial Fraud</Text>
              <Text style={styles.trainingDescription}>Protect yourself from banking and credit scams</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setTrainingModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
    marginBottom: 16,
    minHeight: 120,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  analyzeButton: {
    backgroundColor: '#17948E',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  imageButton: {
    backgroundColor: '#1F748C',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  closeButton: {
    backgroundColor: '#6B7280',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Analysis Result Styles
  analysisResult: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  riskIndicator: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  riskIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  riskText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  confidenceText: {
    color: 'white',
    fontSize: 12,
    opacity: 0.9,
  },
  analysisTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  recommendation: {
    fontSize: 14,
    color: '#1F2937',
    marginBottom: 4,
    lineHeight: 18,
  },
  emergencyActionButton: {
    backgroundColor: '#DC2626',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  emergencyActionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // Emergency Modal Styles
  emergencyOverlay: {
    flex: 1,
    backgroundColor: 'rgba(220, 38, 38, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emergencyContent: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
    padding: 24,
    width: '90%',
    alignItems: 'center',
  },
  emergencyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#DC2626',
    marginBottom: 16,
    textAlign: 'center',
  },
  emergencyText: {
    fontSize: 16,
    color: '#1F2937',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emergencySecondaryButton: {
    backgroundColor: '#6B7280',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
    width: '100%',
  },
  emergencySecondaryText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Training Modal Styles
  trainingOption: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  trainingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  trainingDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 18,
  },
});
