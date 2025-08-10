import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';

export default function CallTranscriptionScreen() {
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [transcript, setTranscript] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [riskLevel, setRiskLevel] = useState<'low' | 'medium' | 'high' | null>(null);

  useEffect(() => {
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync();
      }
    };
  }, [recording]);

  const requestPermissions = async () => {
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please enable microphone access to use call monitoring.');
      return false;
    }
    return true;
  };

  const startRecording = async () => {
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) return;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(newRecording);
      setIsRecording(true);
      setTranscript('Listening...');
      
      // Simulate real-time transcription (in a real app, you'd use speech-to-text service)
      simulateTranscription();
      
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'Failed to start call monitoring');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    setIsRecording(false);
    await recording.stopAndUnloadAsync();
    setRecording(null);
    
    // Analyze the transcript
    analyzeTranscript();
  };

  const simulateTranscription = () => {
    const samplePhrases = [
      "Hello, this is calling from your bank's security department.",
      "We've noticed suspicious activity on your account.",
      "We need to verify your account information immediately.",
      "Please provide your social security number for verification.",
      "If you don't act now, your account will be suspended.",
    ];

    let currentText = '';
    let phraseIndex = 0;

    const interval = setInterval(() => {
      if (phraseIndex < samplePhrases.length && isRecording) {
        currentText += (currentText ? ' ' : '') + samplePhrases[phraseIndex];
        setTranscript(currentText);
        phraseIndex++;
      } else {
        clearInterval(interval);
      }
    }, 3000);
  };

  const analyzeTranscript = async () => {
    setIsAnalyzing(true);
    
    // Simulate analysis delay
    setTimeout(() => {
      // Simple keyword-based analysis for demo
      const suspiciousKeywords = [
        'bank', 'security', 'suspended', 'verify', 'social security', 
        'account', 'immediately', 'urgent', 'gift card', 'wire transfer'
      ];
      
      const keywordCount = suspiciousKeywords.reduce((count, keyword) => {
        return transcript.toLowerCase().includes(keyword) ? count + 1 : count;
      }, 0);

      let risk: 'low' | 'medium' | 'high' = 'low';
      if (keywordCount >= 4) {
        risk = 'high';
      } else if (keywordCount >= 2) {
        risk = 'medium';
      }

      setRiskLevel(risk);
      setIsAnalyzing(false);

      if (risk === 'high') {
        // Alert user of potential scam
        Alert.alert(
          'SCAM ALERT! 🚨',
          'This call shows high risk indicators. Consider hanging up immediately.',
          [
            { text: 'Hang Up', style: 'destructive' },
            { text: 'Keep Monitoring', style: 'cancel' }
          ]
        );
        
        // Optional: Speak alert
        Speech.speak('Warning: This call may be a scam. Consider hanging up.');
      }
    }, 2000);
  };

  const getRiskColor = (level: string | null) => {
    switch (level) {
      case 'high': return '#e74c3c';
      case 'medium': return '#f39c12';
      case 'low': return '#27ae60';
      default: return '#95a5a6';
    }
  };

  const getRiskText = (level: string | null) => {
    switch (level) {
      case 'high': return 'HIGH RISK';
      case 'medium': return 'MEDIUM RISK';
      case 'low': return 'LOW RISK';
      default: return 'ANALYZING...';
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Status Card */}
        <View style={[styles.statusCard, { borderLeftColor: getRiskColor(riskLevel) }]}>
          <Text style={styles.statusTitle}>Call Monitoring</Text>
          <Text style={[styles.riskLevel, { color: getRiskColor(riskLevel) }]}>
            {isAnalyzing ? 'ANALYZING...' : getRiskText(riskLevel)}
          </Text>
        </View>

        {/* Recording Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.recordButton, { backgroundColor: isRecording ? '#e74c3c' : '#17948E' }]}
            onPress={isRecording ? stopRecording : startRecording}
          >
            <Text style={styles.recordButtonText}>
              {isRecording ? '⏹️ Stop Monitoring' : '🎙️ Start Monitoring'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Transcript */}
        <View style={styles.transcriptCard}>
          <Text style={styles.transcriptTitle}>Live Transcript</Text>
          <ScrollView style={styles.transcriptScroll}>
            <Text style={styles.transcriptText}>
              {transcript || 'Tap "Start Monitoring" to begin live transcription...'}
            </Text>
          </ScrollView>
        </View>

        {/* Safety Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>🛡️ Safety Tips</Text>
          <Text style={styles.tip}>• Legitimate companies don't ask for personal info over the phone</Text>
          <Text style={styles.tip}>• Never give out Social Security numbers or passwords</Text>
          <Text style={styles.tip}>• Government agencies don't demand gift card payments</Text>
          <Text style={styles.tip}>• When in doubt, hang up and call back using official numbers</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statusCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  riskLevel: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  controls: {
    marginBottom: 20,
    alignItems: 'center',
  },
  recordButton: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    minWidth: 200,
    alignItems: 'center',
  },
  recordButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  transcriptCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    minHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  transcriptTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  transcriptScroll: {
    maxHeight: 150,
  },
  transcriptText: {
    fontSize: 16,
    lineHeight: 22,
    color: '#333',
  },
  tipsCard: {
    backgroundColor: '#e8f5e8',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d5a2d',
    marginBottom: 15,
  },
  tip: {
    fontSize: 14,
    color: '#2d5a2d',
    marginBottom: 8,
    lineHeight: 18,
  },
});