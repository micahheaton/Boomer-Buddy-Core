import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  Animated,
  Dimensions,
  DeviceEventEmitter,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import { apiService, type ScamAnalysisResult, type ThreatAlert } from './src/services/ApiService';
import { piiScrubber } from './src/services/PiiScrubber';
import { riskEngine, type RiskAssessment } from './src/services/RiskEngine';
import ThreatShieldAnimation from './src/components/ThreatShieldAnimation';
import GamificationHub from './src/components/GamificationHub';
import PersonalizedSafetyCarousel from './src/components/PersonalizedSafetyCarousel';
import NativeCallScreening from './src/services/NativeCallScreening';

const { width, height } = Dimensions.get('window');

export default function App() {
  const [threatAlerts, setThreatAlerts] = useState<ThreatAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [analysisModalVisible, setAnalysisModalVisible] = useState(false);
  const [trainingModalVisible, setTrainingModalVisible] = useState(false);
  const [emergencyModalVisible, setEmergencyModalVisible] = useState(false);
  const [analysisText, setAnalysisText] = useState('');
  const [analysisResult, setAnalysisResult] = useState<RiskAssessment | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [shieldAnimation] = useState(new Animated.Value(0));
  const [userStats, setUserStats] = useState({
    xp: 1250,
    level: 5,
    streak: 12,
    scamsBlocked: 27,
    badges: ['First Defense', 'Week Warrior', 'Scam Spotter']
  });

  useEffect(() => {
    initializeNativeServices();
    setupThreatListeners();
    loadThreatAlerts();
  }, []);

  const initializeNativeServices = async () => {
    try {
      // Request all necessary permissions
      if (Platform.OS === 'android') {
        const permissions = [
          PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
          PermissionsAndroid.PERMISSIONS.READ_SMS,
          PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
          PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        ];

        const granted = await PermissionsAndroid.requestMultiple(permissions);
        
        console.log('Permissions granted:', granted);
        
        // Initialize native call screening service
        await NativeCallScreening.initialize();
        
        Alert.alert(
          'Protection Activated',
          'Boomer Buddy is now actively monitoring for threats. You will receive real-time alerts for suspicious calls and messages.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Failed to initialize native services:', error);
      Alert.alert(
        'Setup Error',
        'Some protection features may not work properly. Please check app permissions in settings.',
        [{ text: 'OK' }]
      );
    }
  };

  const setupThreatListeners = () => {
    // Listen for native threat alerts
    const threatListener = DeviceEventEmitter.addListener(
      'THREAT_DETECTED',
      (threat) => {
        console.log('Threat detected:', threat);
        setThreatAlerts(prev => [threat, ...prev.slice(0, 49)]); // Keep last 50
        
        // Update user stats
        setUserStats(prev => ({
          ...prev,
          scamsBlocked: prev.scamsBlocked + 1,
          xp: prev.xp + 50
        }));

        // Show immediate alert for high-risk threats
        if (threat.riskLevel === 'high' || threat.riskLevel === 'critical') {
          Alert.alert(
            '🚨 THREAT BLOCKED',
            `Blocked ${threat.type} from ${threat.source}\n\nRisk: ${threat.riskLevel.toUpperCase()}\nReasons: ${threat.threats.join(', ')}`,
            [
              { text: 'View Details', onPress: () => setEmergencyModalVisible(true) },
              { text: 'OK' }
            ]
          );
        }
      }
    );

    const warningListener = DeviceEventEmitter.addListener(
      'THREAT_WARNING',
      (warning) => {
        console.log('Threat warning:', warning);
        Alert.alert(
          '⚠️ Suspicious Activity',
          `Potential threat detected from ${warning.source}\n\nBe cautious and verify before taking any action.`,
          [{ text: 'OK' }]
        );
      }
    );

    return () => {
      threatListener.remove();
      warningListener.remove();
    };
  };

  const loadThreatAlerts = async () => {
    try {
      const alerts = await apiService.getThreatAlerts();
      setThreatAlerts(alerts);
    } catch (error) {
      console.log('Using cached threat data');
    }
  };

  const handleAnalyzePress = () => {
    setAnalysisText('');
    setAnalysisResult(null);
    setAnalysisModalVisible(true);
  };

  const handleTextAnalysis = async () => {
    if (!analysisText.trim()) {
      Alert.alert('Error', 'Please enter some text to analyze');
      return;
    }

    setIsAnalyzing(true);
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

      // Show analysis animation for 3 seconds
      setTimeout(() => {
        setIsAnalyzing(false);
        
        // Perform on-device risk assessment
        const riskAssessment = riskEngine.analyzeText(analysisText);
        setAnalysisResult(riskAssessment);

        // Update user stats based on analysis
        if (riskAssessment.overallRisk === 'critical' || riskAssessment.overallRisk === 'high') {
          setUserStats(prev => ({
            ...prev,
            scamsBlocked: prev.scamsBlocked + 1,
            xp: prev.xp + 25
          }));
        }
      }, 3000);

      // Try to get enhanced analysis from server (optional)
      try {
        await apiService.analyzeText(scrubResult.cleanText);
      } catch (error) {
        // Server analysis failed, continue with local assessment
        console.log('Server analysis unavailable, using local assessment');
      }

    } catch (error) {
      Alert.alert('Analysis Error', 'Could not complete analysis. Please try again.');
      setIsAnalyzing(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>🛡️ Boomer Buddy</Text>
          <Text style={styles.subtitle}>Your Digital Safety Companion</Text>
          <Text style={styles.version}>Native Protection System • v2.0</Text>
        </View>

        {/* Threat Shield Animation */}
        <View style={styles.shieldContainer}>
          <ThreatShieldAnimation 
            isAnalyzing={isAnalyzing}
            threatLevel={analysisResult ? 
              (analysisResult.overallRisk === 'critical' || analysisResult.overallRisk === 'high' ? 'danger' : 
               analysisResult.overallRisk === 'medium' ? 'warning' : 'safe') : 'safe'
            }
          />
          <Text style={styles.shieldStatus}>
            {isAnalyzing ? 'Analyzing threat...' : 
             analysisResult ? `${analysisResult.overallRisk.toUpperCase()} RISK DETECTED` : 
             'Active Protection Enabled'}
          </Text>
          <Text style={styles.protectionDetails}>
            Call & SMS monitoring active • {threatAlerts.length} threats blocked today
          </Text>
        </View>

        {/* Gamification Hub */}
        <GamificationHub 
          userStats={userStats}
          onBadgePress={(badge) => Alert.alert('Achievement Unlocked!', `${badge}: Great job staying protected!`)}
        />

        {/* Personalized Safety Carousel */}
        <PersonalizedSafetyCarousel 
          userVulnerabilities={['phone', 'email', 'financial']}
        />

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.analyzeButton]} 
            onPress={handleAnalyzePress}
          >
            <Text style={styles.actionButtonText}>🔍 Analyze Message</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.emergencyButton]} 
            onPress={() => setEmergencyModalVisible(true)}
          >
            <Text style={styles.actionButtonText}>🆘 Report Scam</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.trainingButton]} 
            onPress={() => setTrainingModalVisible(true)}
          >
            <Text style={styles.actionButtonText}>🎯 Practice Mode</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Threat Alerts */}
        {threatAlerts.length > 0 && (
          <View style={styles.alertsSection}>
            <Text style={styles.sectionTitle}>Recent Protection Activity</Text>
            {threatAlerts.slice(0, 3).map((alert, index) => (
              <View key={index} style={styles.alertCard}>
                <View style={styles.alertHeader}>
                  <Text style={styles.alertType}>{alert.type?.toUpperCase()}</Text>
                  <Text style={styles.alertTime}>
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </Text>
                </View>
                <Text style={styles.alertDescription}>
                  Blocked {alert.source} • Risk: {alert.riskLevel}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Analysis Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={analysisModalVisible}
        onRequestClose={() => setAnalysisModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Analyze Suspicious Content</Text>
            <TouchableOpacity onPress={() => setAnalysisModalVisible(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.inputLabel}>Enter text, email, or message to analyze:</Text>
            <TextInput
              style={styles.textInput}
              multiline
              placeholder="Paste suspicious message here..."
              value={analysisText}
              onChangeText={setAnalysisText}
              maxLength={2000}
            />

            <TouchableOpacity 
              style={[styles.analyzeButtonModal, loading && styles.buttonDisabled]}
              onPress={handleTextAnalysis}
              disabled={loading}
            >
              <Text style={styles.analyzeButtonText}>
                {loading ? 'Analyzing...' : 'Analyze for Threats'}
              </Text>
            </TouchableOpacity>

            {analysisResult && (
              <View style={styles.resultContainer}>
                <Text style={styles.resultTitle}>Analysis Results:</Text>
                <View style={[styles.riskBadge, { 
                  backgroundColor: analysisResult.overallRisk === 'critical' || analysisResult.overallRisk === 'high' ? '#DC2626' : 
                                  analysisResult.overallRisk === 'medium' ? '#D97706' : '#059669' 
                }]}>
                  <Text style={styles.riskText}>
                    {analysisResult.overallRisk.toUpperCase()} RISK
                  </Text>
                </View>
                {analysisResult.threats.length > 0 && (
                  <View style={styles.threatsContainer}>
                    <Text style={styles.threatsTitle}>Threats Detected:</Text>
                    {analysisResult.threats.map((threat, index) => (
                      <Text key={index} style={styles.threatItem}>• {threat}</Text>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    backgroundColor: '#17948E',
    padding: 24,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
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
  shieldContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#F8FAFC',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  shieldStatus: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    textAlign: 'center',
  },
  protectionDetails: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  actionButtons: {
    paddingHorizontal: 16,
    marginTop: 16,
    gap: 12,
  },
  actionButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  analyzeButton: {
    backgroundColor: '#3B82F6',
  },
  emergencyButton: {
    backgroundColor: '#DC2626',
  },
  trainingButton: {
    backgroundColor: '#059669',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  alertsSection: {
    margin: 16,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  alertCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  alertType: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#DC2626',
  },
  alertTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  alertDescription: {
    fontSize: 14,
    color: '#374151',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  closeButton: {
    fontSize: 18,
    color: '#6B7280',
    padding: 8,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  analyzeButtonModal: {
    backgroundColor: '#3B82F6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  analyzeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  resultContainer: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  riskBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  riskText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  threatsContainer: {
    marginTop: 8,
  },
  threatsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  threatItem: {
    fontSize: 14,
    color: '#DC2626',
    marginBottom: 4,
  },
});