import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Linking,
} from 'react-native';
import { StorageService } from '../services/StorageService';

const AnalysisResultScreen = ({ navigation, route }: any) => {
  const { caseId, analysis, emergencyMode } = route.params;
  const [caseData, setCaseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCaseData();
  }, [caseId]);

  const loadCaseData = async () => {
    try {
      const case_data = await StorageService.getCaseById(caseId);
      setCaseData(case_data);
    } catch (error) {
      console.error('Failed to load case data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskLevelInfo = (score: number) => {
    if (score >= 80) {
      return {
        level: 'HIGH RISK',
        color: '#DC2626',
        bgColor: '#FEF2F2',
        borderColor: '#FECACA',
        icon: '🚨',
        description: 'This appears to be a scam. Take immediate action to protect yourself.'
      };
    } else if (score >= 60) {
      return {
        level: 'SUSPICIOUS',
        color: '#D97706',
        bgColor: '#FFFBEB',
        borderColor: '#FDE68A',
        icon: '⚠️',
        description: 'This shows suspicious patterns. Exercise caution and verify independently.'
      };
    } else if (score >= 40) {
      return {
        level: 'MODERATE RISK',
        color: '#0D9488',
        bgColor: '#F0FDFA',
        borderColor: '#A7F3D0',
        icon: '🔍',
        description: 'Some concerning elements detected. Stay alert and verify any requests.'
      };
    } else {
      return {
        level: 'LOW RISK',
        color: '#16A34A',
        bgColor: '#F0FDF4',
        borderColor: '#BBF7D0',
        icon: '✅',
        description: 'This appears to be legitimate, but always stay cautious.'
      };
    }
  };

  const handleUserAction = async (action: 'blocked' | 'reported' | 'ignored') => {
    try {
      // Update case with user action
      if (caseData) {
        await StorageService.saveCaseHistory({
          ...caseData,
          userAction: action
        });
      }

      let message = '';
      switch (action) {
        case 'blocked':
          message = 'Contact blocked and case saved to your history.';
          break;
        case 'reported':
          message = 'Thank you for reporting. This helps protect others too.';
          break;
        case 'ignored':
          message = 'Case saved. Remember to stay vigilant for future contacts.';
          break;
      }

      Alert.alert('Action Recorded', message, [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Failed to record user action:', error);
      Alert.alert('Error', 'Failed to save your action. Please try again.');
    }
  };

  const openReportingLink = (url: string) => {
    Alert.alert(
      'Report to Authorities',
      'This will open the official reporting website in your browser.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Open Link', 
          onPress: () => Linking.openURL(url).catch(err => 
            console.error('Failed to open URL:', err)
          )
        }
      ]
    );
  };

  const shareResults = () => {
    // TODO: Implement sharing functionality
    Alert.alert('Share Results', 'Sharing functionality will be available in a future update.');
  };

  if (loading || !caseData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading analysis results...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const riskInfo = getRiskLevelInfo(analysis.score);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {emergencyMode && (
          <View style={styles.emergencyBanner}>
            <Text style={styles.emergencyText}>Emergency Analysis Complete</Text>
          </View>
        )}

        {/* Risk Level Card */}
        <View style={[styles.riskCard, { 
          backgroundColor: riskInfo.bgColor,
          borderColor: riskInfo.borderColor 
        }]}>
          <View style={styles.riskHeader}>
            <Text style={styles.riskIcon}>{riskInfo.icon}</Text>
            <View style={styles.riskInfo}>
              <Text style={[styles.riskLevel, { color: riskInfo.color }]}>
                {riskInfo.level}
              </Text>
              <Text style={[styles.riskScore, { color: riskInfo.color }]}>
                {analysis.score}% Risk Score
              </Text>
            </View>
          </View>
          <Text style={[styles.riskDescription, { color: riskInfo.color }]}>
            {riskInfo.description}
          </Text>
        </View>

        {/* Analysis Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Analysis Details</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Confidence Level:</Text>
            <Text style={styles.detailValue}>{analysis.confidence.toUpperCase()}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Classification:</Text>
            <Text style={styles.detailValue}>{analysis.label}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Channel:</Text>
            <Text style={styles.detailValue}>{caseData.channel.toUpperCase()}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Analysis Time:</Text>
            <Text style={styles.detailValue}>
              {new Date(caseData.timestamp).toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Warning Signs */}
        {analysis.top_reasons && analysis.top_reasons.length > 0 && (
          <View style={styles.warningCard}>
            <Text style={styles.warningTitle}>🚩 Warning Signs Detected</Text>
            {analysis.top_reasons.map((reason: string, index: number) => (
              <View key={index} style={styles.warningItem}>
                <Text style={styles.warningBullet}>•</Text>
                <Text style={styles.warningText}>{reason}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Recommended Actions */}
        {analysis.recommended_actions && analysis.recommended_actions.length > 0 && (
          <View style={styles.actionsCard}>
            <Text style={styles.actionsTitle}>Recommended Actions</Text>
            {analysis.recommended_actions.map((action: any, index: number) => (
              <View key={index} style={styles.actionSection}>
                <Text style={styles.actionTitle}>{action.title}</Text>
                {action.steps && action.steps.map((step: string, stepIndex: number) => (
                  <View key={stepIndex} style={styles.actionStep}>
                    <Text style={styles.stepNumber}>{stepIndex + 1}.</Text>
                    <Text style={styles.stepText}>{step}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* Reporting Contacts */}
        {analysis.contacts && (
          <View style={styles.contactsCard}>
            <Text style={styles.contactsTitle}>Official Reporting Contacts</Text>
            
            {analysis.contacts.federal && analysis.contacts.federal.length > 0 && (
              <View style={styles.contactSection}>
                <Text style={styles.contactSectionTitle}>Federal Agencies</Text>
                {analysis.contacts.federal.map((contact: any, index: number) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.contactItem}
                    onPress={() => openReportingLink(contact.url)}
                  >
                    <Text style={styles.contactName}>{contact.name}</Text>
                    <Text style={styles.contactLink}>Tap to Report →</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {analysis.contacts.state && analysis.contacts.state.length > 0 && (
              <View style={styles.contactSection}>
                <Text style={styles.contactSectionTitle}>State & Local</Text>
                {analysis.contacts.state.map((contact: any, index: number) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.contactItem}
                    onPress={() => openReportingLink(contact.url)}
                  >
                    <Text style={styles.contactName}>{contact.name}</Text>
                    <Text style={styles.contactLink}>Tap to Report →</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {analysis.score >= 60 && (
            <TouchableOpacity
              style={[styles.actionButton, styles.blockButton]}
              onPress={() => handleUserAction('blocked')}
            >
              <Text style={styles.blockButtonText}>🚫 Block Contact</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionButton, styles.reportButton]}
            onPress={() => handleUserAction('reported')}
          >
            <Text style={styles.reportButtonText}>📝 Mark as Reported</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.ignoreButton]}
            onPress={() => handleUserAction('ignored')}
          >
            <Text style={styles.ignoreButtonText}>✓ Mark as Handled</Text>
          </TouchableOpacity>
        </View>

        {/* Legal Disclaimer */}
        <View style={styles.disclaimerCard}>
          <Text style={styles.disclaimerTitle}>Important Notice</Text>
          <Text style={styles.disclaimerText}>
            {analysis.legal_note || 'This analysis is for informational purposes only and does not constitute legal or financial advice. Always trust your instincts and consult with appropriate authorities when in doubt.'}
          </Text>
        </View>

        {/* Privacy Notice */}
        {analysis.piiScrubbed && (
          <View style={styles.privacyCard}>
            <Text style={styles.privacyTitle}>🔒 Privacy Protected</Text>
            <Text style={styles.privacyText}>
              Personal information was automatically removed from this analysis to protect your privacy.
            </Text>
          </View>
        )}
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
  emergencyBanner: {
    backgroundColor: '#FEF2F2',
    padding: 12,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#FECACA',
  },
  emergencyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#DC2626',
  },
  riskCard: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  riskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  riskIcon: {
    fontSize: 48,
    marginRight: 16,
  },
  riskInfo: {
    flex: 1,
  },
  riskLevel: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  riskScore: {
    fontSize: 18,
    fontWeight: '600',
  },
  riskDescription: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '500',
  },
  detailsCard: {
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
  detailsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  warningCard: {
    backgroundColor: '#FFFBEB',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 12,
  },
  warningItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  warningBullet: {
    fontSize: 16,
    color: '#92400E',
    marginRight: 8,
    marginTop: 2,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },
  actionsCard: {
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
  actionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  actionSection: {
    marginBottom: 16,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  actionStep: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginRight: 8,
    width: 20,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  contactsCard: {
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
  contactsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  contactSection: {
    marginBottom: 16,
  },
  contactSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  contactItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 8,
  },
  contactName: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  contactLink: {
    fontSize: 14,
    color: '#17948E',
    fontWeight: '500',
  },
  actionButtons: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  actionButton: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  blockButton: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  blockButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
  },
  reportButton: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  reportButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D4ED8',
  },
  ignoreButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  ignoreButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  disclaimerCard: {
    backgroundColor: '#F9FAFB',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  disclaimerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  privacyCard: {
    backgroundColor: '#F0FDF4',
    marginHorizontal: 16,
    marginBottom: 32,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  privacyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#15803D',
    marginBottom: 4,
  },
  privacyText: {
    fontSize: 12,
    color: '#15803D',
    lineHeight: 16,
  },
});

export default AnalysisResultScreen;