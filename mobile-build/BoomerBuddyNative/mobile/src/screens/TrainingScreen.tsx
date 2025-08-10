import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Dimensions,
} from 'react-native';
import { StorageService } from '../services/StorageService';

interface TrainingPack {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  totalCards: number;
  completedCards: number;
  targets: string[];
  estimatedTime: string;
}

const TrainingScreen = ({ navigation }: any) => {
  const [trainingPacks, setTrainingPacks] = useState<TrainingPack[]>([]);
  const [userProgress, setUserProgress] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [streakDays, setStreakDays] = useState(0);

  useEffect(() => {
    loadTrainingData();
  }, []);

  const loadTrainingData = async () => {
    try {
      // Load user progress from local storage
      const progress = await StorageService.getTrainingProgress();
      setUserProgress(progress);

      // Load user profile for streak info
      const profile = await StorageService.getUserProfile();
      setStreakDays(profile?.trainingProgress?.streakDays || 0);

      // Mock training packs (in real app, these would come from API)
      const mockPacks: TrainingPack[] = [
        {
          id: 'basics',
          title: 'Scam Basics',
          description: 'Learn to identify common scam tactics and red flags',
          difficulty: 'easy',
          totalCards: 15,
          completedCards: progress.basics?.completedCards?.length || 0,
          targets: ['sms', 'calls', 'email'],
          estimatedTime: '10 minutes'
        },
        {
          id: 'phone-scams',
          title: 'Phone Call Protection',
          description: 'Recognize and handle suspicious phone calls',
          difficulty: 'easy',
          totalCards: 12,
          completedCards: progress['phone-scams']?.completedCards?.length || 0,
          targets: ['calls'],
          estimatedTime: '8 minutes'
        },
        {
          id: 'tech-support',
          title: 'Tech Support Scams',
          description: 'Spot fake technical support and computer scams',
          difficulty: 'medium',
          totalCards: 18,
          completedCards: progress['tech-support']?.completedCards?.length || 0,
          targets: ['calls', 'web', 'email'],
          estimatedTime: '15 minutes'
        },
        {
          id: 'romance-scams',
          title: 'Romance & Dating Safety',
          description: 'Protect yourself from online dating and romance fraud',
          difficulty: 'medium',
          totalCards: 20,
          completedCards: progress['romance-scams']?.completedCards?.length || 0,
          targets: ['social', 'email', 'web'],
          estimatedTime: '18 minutes'
        },
        {
          id: 'financial',
          title: 'Financial Fraud Protection',
          description: 'Advanced tactics for investment and banking scams',
          difficulty: 'hard',
          totalCards: 25,
          completedCards: progress.financial?.completedCards?.length || 0,
          targets: ['calls', 'email', 'web', 'letter'],
          estimatedTime: '25 minutes'
        },
        {
          id: 'identity-theft',
          title: 'Identity Protection',
          description: 'Prevent identity theft and personal information fraud',
          difficulty: 'hard',
          totalCards: 22,
          completedCards: progress['identity-theft']?.completedCards?.length || 0,
          targets: ['all'],
          estimatedTime: '20 minutes'
        }
      ];

      setTrainingPacks(mockPacks);
    } catch (error) {
      console.error('Failed to load training data:', error);
      Alert.alert('Error', 'Failed to load training data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const startTrainingPack = async (pack: TrainingPack) => {
    try {
      Alert.alert(
        pack.title,
        `Ready to start training?\n\n${pack.description}\n\nEstimated time: ${pack.estimatedTime}`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Start Training', 
            onPress: () => {
              // TODO: Navigate to training session
              Alert.alert('Coming Soon', 'Training sessions will be available in the next update!');
            }
          }
        ]
      );
    } catch (error) {
      console.error('Failed to start training:', error);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '#16A34A';
      case 'medium': return '#D97706';
      case 'hard': return '#DC2626';
      default: return '#6B7280';
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '🟢';
      case 'medium': return '🟡';
      case 'hard': return '🔴';
      default: return '⚪';
    }
  };

  const getProgressPercentage = (completed: number, total: number) => {
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const getTargetIcons = (targets: string[]) => {
    const iconMap: { [key: string]: string } = {
      'sms': '💬',
      'calls': '📞',
      'email': '📧',
      'web': '🌐',
      'social': '👥',
      'letter': '✉️',
      'all': '🛡️'
    };
    
    return targets.map(target => iconMap[target] || '❓').join(' ');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading training programs...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Protection Training</Text>
          <Text style={styles.headerSubtitle}>
            Build your scam defense skills with interactive training
          </Text>
        </View>

        {/* Progress Overview */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <View>
              <Text style={styles.progressTitle}>Your Progress</Text>
              <Text style={styles.streakText}>🔥 {streakDays} day streak</Text>
            </View>
            <View style={styles.overallProgress}>
              <Text style={styles.overallPercentage}>
                {Math.round(
                  trainingPacks.reduce((acc, pack) => acc + getProgressPercentage(pack.completedCards, pack.totalCards), 0) / 
                  trainingPacks.length
                )}%
              </Text>
              <Text style={styles.overallLabel}>Overall</Text>
            </View>
          </View>
          
          <Text style={styles.progressDescription}>
            Complete training modules to strengthen your protection against scams
          </Text>
        </View>

        {/* Training Packs */}
        <View style={styles.packsContainer}>
          <Text style={styles.packsTitle}>Training Programs</Text>
          
          {trainingPacks.map((pack) => {
            const progressPercentage = getProgressPercentage(pack.completedCards, pack.totalCards);
            const isCompleted = progressPercentage === 100;
            
            return (
              <TouchableOpacity
                key={pack.id}
                style={[styles.packCard, isCompleted && styles.packCardCompleted]}
                onPress={() => startTrainingPack(pack)}
              >
                <View style={styles.packHeader}>
                  <View style={styles.packTitleRow}>
                    <Text style={styles.packTitle}>{pack.title}</Text>
                    {isCompleted && <Text style={styles.completedIcon}>✅</Text>}
                  </View>
                  
                  <View style={styles.packMeta}>
                    <View style={styles.difficultyBadge}>
                      <Text style={styles.difficultyIcon}>
                        {getDifficultyIcon(pack.difficulty)}
                      </Text>
                      <Text style={[styles.difficultyText, { color: getDifficultyColor(pack.difficulty) }]}>
                        {pack.difficulty.toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.timeEstimate}>{pack.estimatedTime}</Text>
                  </View>
                </View>

                <Text style={styles.packDescription}>{pack.description}</Text>

                <View style={styles.packProgress}>
                  <View style={styles.progressBarContainer}>
                    <View 
                      style={[styles.progressBar, { 
                        width: `${progressPercentage}%`,
                        backgroundColor: getDifficultyColor(pack.difficulty)
                      }]} 
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {pack.completedCards}/{pack.totalCards} cards
                  </Text>
                </View>

                <View style={styles.packFooter}>
                  <View style={styles.targetsContainer}>
                    <Text style={styles.targetsLabel}>Covers: </Text>
                    <Text style={styles.targetsIcons}>{getTargetIcons(pack.targets)}</Text>
                  </View>
                  
                  <TouchableOpacity 
                    style={[styles.startButton, isCompleted && styles.reviewButton]}
                    onPress={() => startTrainingPack(pack)}
                  >
                    <Text style={[styles.startButtonText, isCompleted && styles.reviewButtonText]}>
                      {isCompleted ? 'Review' : progressPercentage > 0 ? 'Continue' : 'Start'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Daily Challenge */}
        <View style={styles.challengeCard}>
          <Text style={styles.challengeTitle}>🎯 Daily Challenge</Text>
          <Text style={styles.challengeDescription}>
            Complete one training card each day to maintain your streak and improve your protection skills.
          </Text>
          <TouchableOpacity 
            style={styles.challengeButton}
            onPress={() => {
              // Find a pack with incomplete cards
              const incompletePack = trainingPacks.find(pack => pack.completedCards < pack.totalCards);
              if (incompletePack) {
                startTrainingPack(incompletePack);
              } else {
                Alert.alert('Congratulations!', 'You\'ve completed all available training! Check back for new content.');
              }
            }}
          >
            <Text style={styles.challengeButtonText}>Start Daily Challenge</Text>
          </TouchableOpacity>
        </View>

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Training Tips</Text>
          <Text style={styles.tipsText}>
            • Start with "Scam Basics" if you're new{'\n'}
            • Practice regularly to build muscle memory{'\n'}
            • Review completed modules periodically{'\n'}
            • Share knowledge with family and friends
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
  progressCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  streakText: {
    fontSize: 14,
    color: '#D97706',
    fontWeight: '500',
  },
  overallProgress: {
    alignItems: 'center',
  },
  overallPercentage: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#17948E',
  },
  overallLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  progressDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  packsContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  packsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  packCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  packCardCompleted: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  packHeader: {
    marginBottom: 12,
  },
  packTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  packTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  completedIcon: {
    fontSize: 20,
    marginLeft: 8,
  },
  packMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  difficultyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  difficultyIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  timeEstimate: {
    fontSize: 12,
    color: '#6B7280',
  },
  packDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  packProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressBarContainer: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginRight: 12,
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  packFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  targetsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  targetsLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  targetsIcons: {
    fontSize: 12,
  },
  startButton: {
    backgroundColor: '#17948E',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  reviewButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  reviewButtonText: {
    color: '#374151',
  },
  challengeCard: {
    backgroundColor: '#FEF3C7',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  challengeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 8,
  },
  challengeDescription: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
    marginBottom: 16,
  },
  challengeButton: {
    backgroundColor: '#D97706',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  challengeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  tipsCard: {
    backgroundColor: '#F3F4F6',
    marginHorizontal: 16,
    marginBottom: 32,
    padding: 20,
    borderRadius: 12,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  tipsText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
});

export default TrainingScreen;