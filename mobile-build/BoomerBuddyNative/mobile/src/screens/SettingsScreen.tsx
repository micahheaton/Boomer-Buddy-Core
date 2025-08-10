import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  SafeAreaView,
  Alert,
  Share,
} from 'react-native';
import { StorageService } from '../services/StorageService';
import { ApiService } from '../services/ApiService';

const SettingsScreen = ({ navigation }: any) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [autoAnalyze, setAutoAnalyze] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<any>({ connected: false });
  const [caseCount, setCaseCount] = useState(0);
  const [dataSize, setDataSize] = useState('0');

  useEffect(() => {
    loadSettings();
    checkConnection();
    loadStorageInfo();
  }, []);

  const loadSettings = async () => {
    try {
      const notifications = await StorageService.getSetting('notifications_enabled', true);
      const biometrics = await StorageService.getSetting('biometrics_enabled', false);
      const autoAnalyzeEnabled = await StorageService.getSetting('auto_analyze', true);
      
      setNotificationsEnabled(notifications);
      setBiometricsEnabled(biometrics);
      setAutoAnalyze(autoAnalyzeEnabled);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const checkConnection = async () => {
    try {
      const status = await ApiService.getConnectionStatus();
      setConnectionStatus(status);
    } catch (error) {
      console.error('Failed to check connection:', error);
    }
  };

  const loadStorageInfo = async () => {
    try {
      const cases = await StorageService.getCaseHistory();
      setCaseCount(cases.length);
      
      // Estimate data size (rough calculation)
      const estimatedSize = (cases.length * 2048) / 1024; // Approximate KB
      setDataSize(estimatedSize < 1024 ? `${estimatedSize.toFixed(1)} KB` : `${(estimatedSize / 1024).toFixed(1)} MB`);
    } catch (error) {
      console.error('Failed to load storage info:', error);
    }
  };

  const updateSetting = async (key: string, value: any, setter: (value: any) => void) => {
    try {
      await StorageService.saveSetting(key, value);
      setter(value);
    } catch (error) {
      console.error(`Failed to update ${key}:`, error);
      Alert.alert('Error', 'Failed to save setting. Please try again.');
    }
  };

  const handleExportData = async () => {
    try {
      const cases = await StorageService.getCaseHistory();
      if (cases.length === 0) {
        Alert.alert('No Data', 'You have no analysis history to export.');
        return;
      }

      Alert.alert(
        'Export Analysis History',
        `Export ${cases.length} analysis records for reporting purposes?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Export',
            onPress: async () => {
              try {
                const exportData = await StorageService.exportCaseData(cases.map(c => c.id));
                
                await Share.share({
                  message: 'Boomer Buddy Analysis History',
                  title: 'Analysis History Export',
                  url: `data:application/json;base64,${btoa(exportData)}`,
                });
              } catch (error) {
                console.error('Export failed:', error);
                Alert.alert('Export Failed', 'Unable to export data. Please try again.');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Failed to export data:', error);
      Alert.alert('Error', 'Failed to prepare export. Please try again.');
    }
  };

  const handleClearHistory = () => {
    Alert.alert(
      'Clear Analysis History',
      'This will permanently delete all your analysis history. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await StorageService.clearCaseHistory();
              setCaseCount(0);
              setDataSize('0 KB');
              Alert.alert('Success', 'Analysis history cleared.');
            } catch (error) {
              console.error('Failed to clear history:', error);
              Alert.alert('Error', 'Failed to clear history. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleClearAllData = () => {
    Alert.alert(
      'Reset App Data',
      'This will permanently delete ALL app data including settings, history, and training progress. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset All',
          style: 'destructive',
          onPress: async () => {
            try {
              await StorageService.clearAllData();
              Alert.alert('Reset Complete', 'All app data has been cleared. Please restart the app.');
            } catch (error) {
              console.error('Failed to clear all data:', error);
              Alert.alert('Error', 'Failed to reset app data. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleAbout = () => {
    Alert.alert(
      'About Boomer Buddy',
      'Version 1.0.0\n\nYour Personal Scam Shield\n\nBoomer Buddy helps protect you from scams using AI-powered analysis and real-time government intelligence.\n\n© 2025 Boomer Buddy Team',
      [{ text: 'OK' }]
    );
  };

  const handleSupport = () => {
    Alert.alert(
      'Support & Help',
      'Need help or have questions?\n\n• Check the training modules for guidance\n• Contact support: help@boomerbuddy.app\n• Emergency: Call local authorities',
      [{ text: 'OK' }]
    );
  };

  const SettingRow = ({ 
    title, 
    subtitle, 
    value, 
    onValueChange, 
    type = 'switch',
    onPress 
  }: {
    title: string;
    subtitle?: string;
    value?: boolean;
    onValueChange?: (value: boolean) => void;
    type?: 'switch' | 'button' | 'info';
    onPress?: () => void;
  }) => (
    <TouchableOpacity 
      style={styles.settingRow} 
      onPress={type === 'button' ? onPress : undefined}
      disabled={type === 'info' || type === 'switch'}
    >
      <View style={styles.settingInfo}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {type === 'switch' && (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: '#E5E7EB', true: '#86EFAC' }}
          thumbColor={value ? '#16A34A' : '#9CA3AF'}
        />
      )}
      {type === 'button' && (
        <Text style={styles.settingArrow}>→</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>
            Customize your protection preferences
          </Text>
        </View>

        {/* Connection Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connection Status</Text>
          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { 
                backgroundColor: connectionStatus.connected ? '#16A34A' : '#DC2626'
              }]} />
              <Text style={styles.statusText}>
                {connectionStatus.connected ? 'Connected' : 'Disconnected'}
              </Text>
            </View>
            
            {connectionStatus.connected && (
              <>
                <Text style={styles.statusDetail}>
                  {connectionStatus.sources} government sources active
                </Text>
                <Text style={styles.statusDetail}>
                  Response time: {connectionStatus.latency}ms
                </Text>
              </>
            )}
          </View>
        </View>

        {/* Security & Privacy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security & Privacy</Text>
          
          <SettingRow
            title="Push Notifications"
            subtitle="Receive alerts about new scam threats"
            value={notificationsEnabled}
            onValueChange={(value) => updateSetting('notifications_enabled', value, setNotificationsEnabled)}
          />
          
          <SettingRow
            title="Biometric Protection"
            subtitle="Use fingerprint/face ID to secure app"
            value={biometricsEnabled}
            onValueChange={(value) => updateSetting('biometrics_enabled', value, setBiometricsEnabled)}
          />
          
          <SettingRow
            title="Auto-Analysis"
            subtitle="Automatically analyze suspicious content"
            value={autoAnalyze}
            onValueChange={(value) => updateSetting('auto_analyze', value, setAutoAnalyze)}
          />
        </View>

        {/* Data & Storage */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data & Storage</Text>
          
          <SettingRow
            title="Analysis History"
            subtitle={`${caseCount} records • ${dataSize} used`}
            type="info"
          />
          
          <SettingRow
            title="Export Analysis Data"
            subtitle="Share your analysis history for reporting"
            type="button"
            onPress={handleExportData}
          />
          
          <SettingRow
            title="Clear Analysis History"
            subtitle="Delete all analysis records"
            type="button"
            onPress={handleClearHistory}
          />
        </View>

        {/* Training */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Training</Text>
          
          <SettingRow
            title="View Training History"
            subtitle="See your completed training modules"
            type="button"
            onPress={() => navigation.navigate('Training')}
          />
          
          <SettingRow
            title="Daily Reminders"
            subtitle="Get reminded to practice your skills"
            value={true}
            onValueChange={() => {}}
          />
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <SettingRow
            title="Help & Support"
            subtitle="Get help and contact support"
            type="button"
            onPress={handleSupport}
          />
          
          <SettingRow
            title="About Boomer Buddy"
            subtitle="App version and information"
            type="button"
            onPress={handleAbout}
          />
          
          <SettingRow
            title="Share App"
            subtitle="Recommend Boomer Buddy to others"
            type="button"
            onPress={() => {
              Share.share({
                message: 'Check out Boomer Buddy - Your Personal Scam Shield! It helps protect against scams using AI and government intelligence.',
                title: 'Boomer Buddy - Scam Protection',
              });
            }}
          />
        </View>

        {/* Advanced */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Advanced</Text>
          
          <SettingRow
            title="Reset All App Data"
            subtitle="Clear all data and reset to defaults"
            type="button"
            onPress={handleClearAllData}
          />
        </View>

        {/* Privacy Notice */}
        <View style={styles.privacyNotice}>
          <Text style={styles.privacyTitle}>🔒 Privacy First</Text>
          <Text style={styles.privacyText}>
            Boomer Buddy processes data locally on your device. Personal information never leaves your phone unless you explicitly choose to share analysis results.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#17948E',
    padding: 24,
    paddingTop: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginHorizontal: 20,
    marginBottom: 12,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  statusDetail: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 24,
    marginBottom: 4,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  settingArrow: {
    fontSize: 18,
    color: '#9CA3AF',
  },
  privacyNotice: {
    backgroundColor: '#F0FDF4',
    marginHorizontal: 16,
    marginVertical: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  privacyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#15803D',
    marginBottom: 8,
  },
  privacyText: {
    fontSize: 14,
    color: '#15803D',
    lineHeight: 20,
  },
});

export default SettingsScreen;