/**
 * SMS Overlay Component - Real-time SMS scam detection overlay
 * Displays over messaging apps when potential scams detected
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Modal,
  Alert
} from 'react-native';
import { SmsAnalysisResult, SmsOverlayData } from '../services/SmsInterceptionService';

interface SmsOverlayProps {
  overlayData: SmsOverlayData | null;
  onDismiss: () => void;
  onBlock: () => void;
  onReport: () => void;
  onAnalyzeMore: () => void;
}

export const SmsOverlay: React.FC<SmsOverlayProps> = ({
  overlayData,
  onDismiss,
  onBlock,
  onReport,
  onAnalyzeMore
}) => {
  const [slideAnim] = useState(new Animated.Value(Dimensions.get('window').height));
  const [opacity] = useState(new Animated.Value(0));

  useEffect(() => {
    if (overlayData?.show) {
      // Slide up animation
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      // Slide down animation
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: Dimensions.get('window').height,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [overlayData?.show]);

  if (!overlayData?.show) {
    return null;
  }

  const { analysis, senderInfo } = overlayData;
  const isHighRisk = analysis.recommendedAction === 'danger' || analysis.recommendedAction === 'block';

  const getRiskColor = () => {
    switch (analysis.recommendedAction) {
      case 'block':
      case 'danger':
        return '#DC3545'; // Red
      case 'caution':
        return '#FFC107'; // Yellow
      default:
        return '#28A745'; // Green
    }
  };

  const getRiskIcon = () => {
    switch (analysis.recommendedAction) {
      case 'block':
        return '🚫';
      case 'danger':
        return '⚠️';
      case 'caution':
        return '🟡';
      default:
        return '✅';
    }
  };

  return (
    <Modal
      transparent={true}
      visible={overlayData.show}
      animationType="none"
      onRequestClose={onDismiss}
    >
      <Animated.View style={[styles.overlay, { opacity }]}>
        <Animated.View 
          style={[
            styles.alertContainer,
            { 
              transform: [{ translateY: slideAnim }],
              borderTopColor: getRiskColor()
            }
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { backgroundColor: getRiskColor() }]}>
            <Text style={styles.headerIcon}>{getRiskIcon()}</Text>
            <Text style={styles.headerTitle}>SMS Security Check</Text>
            <TouchableOpacity onPress={onDismiss} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Sender Info */}
          <View style={styles.senderInfo}>
            <Text style={styles.senderLabel}>From:</Text>
            <Text style={styles.senderNumber}>
              {senderInfo.name || senderInfo.number}
            </Text>
            {!senderInfo.isKnownContact && (
              <View style={styles.unknownBadge}>
                <Text style={styles.unknownText}>Unknown Sender</Text>
              </View>
            )}
          </View>

          {/* Risk Assessment */}
          <View style={styles.riskSection}>
            <Text style={styles.warningText}>{analysis.warningText}</Text>
            
            {analysis.threatType.length > 0 && (
              <View style={styles.threatTypes}>
                <Text style={styles.threatLabel}>Detected Threats:</Text>
                {analysis.threatType.map((threat, index) => (
                  <View key={index} style={styles.threatBadge}>
                    <Text style={styles.threatText}>{threat}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.confidenceBar}>
              <Text style={styles.confidenceLabel}>
                Confidence: {analysis.confidence.toUpperCase()}
              </Text>
              <View style={styles.confidenceBarContainer}>
                <View 
                  style={[
                    styles.confidenceBarFill,
                    { 
                      width: `${analysis.scamScore * 100}%`,
                      backgroundColor: getRiskColor()
                    }
                  ]} 
                />
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {isHighRisk && (
              <TouchableOpacity 
                style={[styles.button, styles.blockButton]}
                onPress={() => {
                  Alert.alert(
                    'Block Sender',
                    'This will block future messages from this sender.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Block', style: 'destructive', onPress: onBlock }
                    ]
                  );
                }}
              >
                <Text style={styles.buttonText}>🚫 Block Sender</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              style={[styles.button, styles.reportButton]}
              onPress={onReport}
            >
              <Text style={styles.buttonText}>📊 Report Scam</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.button, styles.analyzeButton]}
              onPress={onAnalyzeMore}
            >
              <Text style={styles.buttonText}>🔍 Full Analysis</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.button, styles.dismissButton]}
              onPress={onDismiss}
            >
              <Text style={[styles.buttonText, styles.dismissText]}>Continue</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Boomer Buddy • Real-time SMS Protection
            </Text>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  alertContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 4,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  headerIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  senderInfo: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  senderLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  senderNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  unknownBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFC107',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  unknownText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  riskSection: {
    padding: 16,
  },
  warningText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
    color: '#333',
  },
  threatTypes: {
    marginBottom: 16,
  },
  threatLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  threatBadge: {
    backgroundColor: '#FFE5E5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  threatText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC3545',
  },
  confidenceBar: {
    marginBottom: 16,
  },
  confidenceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  confidenceBarContainer: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  confidenceBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  actionButtons: {
    padding: 16,
    gap: 12,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  blockButton: {
    backgroundColor: '#DC3545',
  },
  reportButton: {
    backgroundColor: '#007BFF',
  },
  analyzeButton: {
    backgroundColor: '#28A745',
  },
  dismissButton: {
    backgroundColor: '#6C757D',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  dismissText: {
    color: 'white',
  },
  footer: {
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  footerText: {
    fontSize: 12,
    color: '#666',
  },
});