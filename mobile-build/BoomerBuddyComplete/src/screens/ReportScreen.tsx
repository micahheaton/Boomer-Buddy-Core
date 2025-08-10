import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { PiiScrubber } from '../services/PiiScrubber';
import { RiskEngine } from '../services/RiskEngine';
import { ApiService } from '../services/ApiService';
import { StorageService } from '../services/StorageService';

const ReportScreen = ({ navigation, route }: any) => {
  const [inputText, setInputText] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<'sms' | 'call' | 'voicemail' | 'email' | 'web' | 'letter'>('sms');
  const [loading, setLoading] = useState(false);
  const [emergencyMode] = useState(route?.params?.emergency || false);

  const channels = [
    { id: 'sms', label: 'Text Message', icon: '💬' },
    { id: 'call', label: 'Phone Call', icon: '📞' },
    { id: 'voicemail', label: 'Voicemail', icon: '🎙️' },
    { id: 'email', label: 'Email', icon: '📧' },
    { id: 'web', label: 'Website', icon: '🌐' },
    { id: 'letter', label: 'Mail/Letter', icon: '✉️' },
  ];

  const analyzeContent = async () => {
    if (!inputText.trim()) {
      Alert.alert('Missing Information', 'Please enter the message or content to analyze.');
      return;
    }

    setLoading(true);

    try {
      // Step 1: Scrub PII client-side
      const scrubResult = PiiScrubber.scrubText(inputText);
      
      if (scrubResult.blockedTypes.includes('SSN_OR_CREDIT_CARD')) {
        Alert.alert(
          'Sensitive Information Detected',
          'Your message contains sensitive personal information. For your protection, this content cannot be analyzed. Please remove any SSN, credit card numbers, or similar data and try again.',
          [{ text: 'OK' }]
        );
        setLoading(false);
        return;
      }

      // Step 2: Create feature vector (no PII)
      const featureVector = PiiScrubber.createFeatureVector(
        inputText,
        selectedChannel,
        'WA' // TODO: Get user's state from settings
      );

      // Step 3: Run local risk assessment
      const localRisk = RiskEngine.assessRisk(scrubResult.scrubbedText, selectedChannel, phoneNumber);

      // Step 4: Send feature vector to backend for analysis (no PII transmitted)
      const backendAnalysis = await ApiService.analyzeFeatureVector(featureVector);

      // Step 5: Combine results
      const finalAnalysis = {
        ...backendAnalysis.analysis,
        localRiskScore: localRisk.score,
        localReasons: localRisk.reasons,
        piiScrubbed: scrubResult.hasPii,
        blockedTypes: scrubResult.blockedTypes,
      };

      // Step 6: Save to local encrypted storage
      const caseId = await StorageService.saveCaseHistory({
        channel: selectedChannel,
        content: scrubResult.scrubbedText, // Only save scrubbed content
        analysis: finalAnalysis,
        phoneNumber: phoneNumber || undefined,
        riskScore: Math.max(localRisk.score, backendAnalysis.analysis.score),
        userAction: undefined, // Will be set when user takes action
      });

      console.log(`✅ Case ${caseId} saved with ${scrubResult.hasPii ? 'PII-scrubbed' : 'clean'} content`);

      // Navigate to results screen
      navigation.navigate('AnalysisResult', {
        caseId,
        analysis: finalAnalysis,
        emergencyMode,
      });

    } catch (error) {
      console.error('Analysis failed:', error);
      
      if (error.message === 'HARD_BLOCK_SENSITIVE_PII') {
        Alert.alert(
          'Blocked for Protection',
          'Sensitive personal information detected. Content blocked to protect your privacy.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Analysis Failed',
          'Unable to analyze the content. Please check your connection and try again.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const quickScanPhone = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Missing Information', 'Please enter a phone number to scan.');
      return;
    }

    const quickResult = RiskEngine.quickAssessCall(phoneNumber);
    
    Alert.alert(
      'Quick Phone Scan',
      quickResult.shouldWarn 
        ? `⚠️ ${quickResult.label}\n\nThis number shows patterns associated with scam calls. Exercise caution.`
        : '✅ No immediate red flags detected for this number.',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} keyboardDismissMode="on-drag">
        {emergencyMode && (
          <View style={styles.emergencyHeader}>
            <Text style={styles.emergencyText}>🚨 Emergency Mode Active</Text>
            <Text style={styles.emergencySubtext}>
              Take your time. We're here to help you stay safe.
            </Text>
          </View>
        )}

        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {emergencyMode ? 'Emergency Analysis' : 'Analyze Suspicious Content'}
          </Text>
          <Text style={styles.headerSubtitle}>
            Check texts, calls, emails, or any suspicious communication
          </Text>
        </View>

        {/* Channel Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Type of Communication</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.channelScroll}>
            {channels.map((channel) => (
              <TouchableOpacity
                key={channel.id}
                style={[
                  styles.channelButton,
                  selectedChannel === channel.id && styles.channelButtonSelected
                ]}
                onPress={() => setSelectedChannel(channel.id as any)}
              >
                <Text style={styles.channelIcon}>{channel.icon}</Text>
                <Text style={[
                  styles.channelLabel,
                  selectedChannel === channel.id && styles.channelLabelSelected
                ]}>
                  {channel.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Phone Number Input */}
        {(selectedChannel === 'call' || selectedChannel === 'sms' || selectedChannel === 'voicemail') && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Phone Number (Optional)</Text>
            <View style={styles.phoneInputContainer}>
              <TextInput
                style={styles.phoneInput}
                placeholder="(555) 123-4567"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                maxLength={20}
              />
              <TouchableOpacity 
                style={styles.quickScanButton}
                onPress={quickScanPhone}
                disabled={!phoneNumber.trim()}
              >
                <Text style={styles.quickScanText}>Quick Scan</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Content Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {selectedChannel === 'call' ? 'What did they say?' : 'Message Content'}
          </Text>
          <TextInput
            style={styles.textInput}
            placeholder={getPlaceholderText(selectedChannel)}
            value={inputText}
            onChangeText={setInputText}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            maxLength={2000}
          />
          <Text style={styles.characterCount}>{inputText.length}/2000</Text>
        </View>

        {/* Privacy Notice */}
        <View style={styles.privacyNotice}>
          <Text style={styles.privacyTitle}>🔒 Privacy Protected</Text>
          <Text style={styles.privacyText}>
            Your personal information is automatically removed before analysis. 
            No sensitive data leaves your device.
          </Text>
        </View>

        {/* Analyze Button */}
        <TouchableOpacity
          style={[styles.analyzeButton, loading && styles.analyzeButtonDisabled]}
          onPress={analyzeContent}
          disabled={loading || !inputText.trim()}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.analyzeButtonText}>
              {emergencyMode ? '🛡️ Emergency Analysis' : '🔍 Analyze Content'}
            </Text>
          )}
        </TouchableOpacity>

        {/* Help Text */}
        <View style={styles.helpSection}>
          <Text style={styles.helpTitle}>How it works:</Text>
          <Text style={styles.helpText}>
            1. Your content is scanned for personal information{'\n'}
            2. Private details are removed automatically{'\n'}
            3. Anonymous patterns are analyzed for threats{'\n'}
            4. You get a safety assessment and recommendations
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const getPlaceholderText = (channel: string): string => {
  switch (channel) {
    case 'sms':
      return 'Paste the text message you received here...';
    case 'call':
      return 'Describe what the caller said, what they asked for, or any details you remember...';
    case 'voicemail':
      return 'What did the voicemail say? Include any details you remember...';
    case 'email':
      return 'Copy and paste the email content here...';
    case 'web':
      return 'Describe what you saw on the website, any pop-ups, or suspicious content...';
    case 'letter':
      return 'Type the content of the letter or mail you received...';
    default:
      return 'Enter the suspicious content here...';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  emergencyHeader: {
    backgroundColor: '#FEF2F2',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#FECACA',
  },
  emergencyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#DC2626',
    textAlign: 'center',
  },
  emergencySubtext: {
    fontSize: 14,
    color: '#7F1D1D',
    textAlign: 'center',
    marginTop: 4,
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 12,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  channelScroll: {
    marginHorizontal: -8,
  },
  channelButton: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    minWidth: 80,
  },
  channelButtonSelected: {
    borderColor: '#17948E',
    backgroundColor: '#F0FDFA',
  },
  channelIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  channelLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  channelLabelSelected: {
    color: '#17948E',
    fontWeight: '500',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  phoneInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    marginRight: 12,
  },
  quickScanButton: {
    backgroundColor: '#17948E',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  quickScanText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    minHeight: 120,
  },
  characterCount: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'right',
    marginTop: 8,
  },
  privacyNotice: {
    backgroundColor: '#F0FDF4',
    marginTop: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#16A34A',
  },
  privacyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#15803D',
    marginBottom: 4,
  },
  privacyText: {
    fontSize: 14,
    color: '#15803D',
    lineHeight: 20,
  },
  analyzeButton: {
    backgroundColor: '#17948E',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  analyzeButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  analyzeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  helpSection: {
    backgroundColor: '#F3F4F6',
    margin: 20,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
});

export default ReportScreen;