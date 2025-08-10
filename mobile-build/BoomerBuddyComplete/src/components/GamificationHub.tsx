import React, { useState, useEffect } from 'react';
import { View, ScrollView, Animated, Easing } from 'react-native';
import { StorageService } from '../services/StorageService';
import { GamificationUpdate } from '../services/AdvancedAnalysisEngine';

interface UserProgress {
  level: number;
  xp: number;
  xpToNext: number;
  totalXp: number;
  streak: number;
  badges: Badge[];
  activeChallenges: Challenge[];
  completedChallenges: number;
  lastActivity: number;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt: number;
}

interface Challenge {
  id: string;
  name: string;
  description: string;
  type: 'daily' | 'weekly' | 'achievement';
  progress: number;
  target: number;
  xpReward: number;
  expiresAt?: number;
  completed: boolean;
}

interface GamificationHubProps {
  onChallengeComplete?: (challenge: Challenge) => void;
  onLevelUp?: (newLevel: number) => void;
  onBadgeUnlocked?: (badge: Badge) => void;
}

export const GamificationHub: React.FC<GamificationHubProps> = ({
  onChallengeComplete,
  onLevelUp,
  onBadgeUnlocked
}) => {
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'challenges' | 'badges'>('overview');
  
  // Animations
  const [xpBarAnim] = useState(new Animated.Value(0));
  const [streakFlameAnim] = useState(new Animated.Value(0));
  const [badgeGlowAnim] = useState(new Animated.Value(0));

  const storageService = new StorageService();

  useEffect(() => {
    loadUserProgress();
    startAnimations();
  }, []);

  const loadUserProgress = async () => {
    try {
      const progress = await storageService.getUserProgress();
      setUserProgress(progress);
      
      // Animate XP bar
      const xpPercentage = progress.xp / (progress.xp + progress.xpToNext);
      Animated.timing(xpBarAnim, {
        toValue: xpPercentage,
        duration: 1000,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }).start();
      
    } catch (error) {
      console.error('Failed to load user progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const startAnimations = () => {
    // Streak flame animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(streakFlameAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(streakFlameAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Badge glow animation
    Animated.loop(
      Animated.timing(badgeGlowAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      })
    ).start();
  };

  const updateProgress = async (update: GamificationUpdate) => {
    if (!userProgress) return;

    const newProgress = { ...userProgress };
    
    // Update XP and level
    newProgress.xp += update.xpGained;
    newProgress.totalXp += update.xpGained;
    
    if (update.levelUp) {
      newProgress.level = Math.floor(newProgress.totalXp / 100);
      newProgress.xpToNext = 100 - (newProgress.totalXp % 100);
      onLevelUp?.(newProgress.level);
    }

    // Update badges
    if (update.newBadges.length > 0) {
      update.newBadges.forEach(badgeName => {
        const newBadge: Badge = {
          id: `badge_${Date.now()}_${badgeName}`,
          name: badgeName,
          description: getBadgeDescription(badgeName),
          icon: getBadgeIcon(badgeName),
          rarity: getBadgeRarity(badgeName),
          unlockedAt: Date.now()
        };
        newProgress.badges.push(newBadge);
        onBadgeUnlocked?.(newBadge);
      });
    }

    // Update streak
    if (update.streakMaintained) {
      newProgress.streak += 1;
    } else {
      newProgress.streak = 1;
    }

    // Update challenges
    if (update.challengeCompleted) {
      const challengeIndex = newProgress.activeChallenges.findIndex(
        c => c.name === update.challengeCompleted
      );
      if (challengeIndex >= 0) {
        newProgress.activeChallenges[challengeIndex].completed = true;
        newProgress.completedChallenges += 1;
        onChallengeComplete?.(newProgress.activeChallenges[challengeIndex]);
      }
    }

    newProgress.lastActivity = Date.now();
    
    setUserProgress(newProgress);
    await storageService.updateUserProgress(newProgress);
  };

  const getBadgeDescription = (badgeName: string): string => {
    const descriptions: { [key: string]: string } = {
      'First Analysis': 'Completed your first scam analysis',
      'Detection Novice': 'Analyzed 10 potential threats',
      'Scam Spotter': 'Identified 50 suspicious activities',
      'Protection Expert': 'Analyzed 100+ potential scams',
      'Week Warrior': 'Maintained a 7-day streak',
      'Month Master': 'Maintained a 30-day streak',
      'Community Helper': 'Helped 10 community members',
      'Threat Hunter': 'Identified 20 confirmed threats',
    };
    return descriptions[badgeName] || 'Special achievement unlocked';
  };

  const getBadgeIcon = (badgeName: string): string => {
    const icons: { [key: string]: string } = {
      'First Analysis': '🛡️',
      'Detection Novice': '🔍',
      'Scam Spotter': '👁️',
      'Protection Expert': '🏆',
      'Week Warrior': '🔥',
      'Month Master': '👑',
      'Community Helper': '🤝',
      'Threat Hunter': '🎯',
    };
    return icons[badgeName] || '⭐';
  };

  const getBadgeRarity = (badgeName: string): Badge['rarity'] => {
    const rarities: { [key: string]: Badge['rarity'] } = {
      'First Analysis': 'common',
      'Detection Novice': 'common',
      'Scam Spotter': 'rare',
      'Protection Expert': 'epic',
      'Week Warrior': 'rare',
      'Month Master': 'epic',
      'Community Helper': 'rare',
      'Threat Hunter': 'legendary',
    };
    return rarities[badgeName] || 'common';
  };

  const generateDailyChallenges = (): Challenge[] => {
    const now = Date.now();
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    return [
      {
        id: 'daily_analysis',
        name: 'Daily Vigilance',
        description: 'Analyze 3 suspicious messages or calls',
        type: 'daily',
        progress: 0,
        target: 3,
        xpReward: 50,
        expiresAt: endOfDay.getTime(),
        completed: false
      },
      {
        id: 'daily_tips',
        name: 'Knowledge Seeker',
        description: 'Read 5 safety tips',
        type: 'daily',
        progress: 0,
        target: 5,
        xpReward: 30,
        expiresAt: endOfDay.getTime(),
        completed: false
      },
      {
        id: 'daily_share',
        name: 'Community Guardian',
        description: 'Share a scam alert with family or friends',
        type: 'daily',
        progress: 0,
        target: 1,
        xpReward: 40,
        expiresAt: endOfDay.getTime(),
        completed: false
      }
    ];
  };

  const renderOverview = () => {
    if (!userProgress) return null;

    const xpProgress = userProgress.xp / (userProgress.xp + userProgress.xpToNext);
    
    return (
      <ScrollView style={{ flex: 1, padding: 20 }}>
        {/* Level and XP Display */}
        <View style={{
          backgroundColor: '#4F46E5',
          borderRadius: 16,
          padding: 24,
          marginBottom: 20,
        }}>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}>
            <View>
              <View style={{
                fontSize: 32,
                fontWeight: 'bold',
                color: 'white',
              }}>
                Level {userProgress.level}
              </View>
              <View style={{
                fontSize: 16,
                color: 'rgba(255, 255, 255, 0.8)',
              }}>
                Scam Shield Guardian
              </View>
            </View>
            <View style={{
              alignItems: 'center',
            }}>
              <View style={{
                fontSize: 24,
                fontWeight: 'bold',
                color: 'white',
              }}>
                {userProgress.xp}
              </View>
              <View style={{
                fontSize: 14,
                color: 'rgba(255, 255, 255, 0.8)',
              }}>
                XP
              </View>
            </View>
          </View>

          {/* XP Progress Bar */}
          <View style={{
            height: 8,
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: 4,
            overflow: 'hidden',
          }}>
            <Animated.View style={{
              height: '100%',
              backgroundColor: '#10B981',
              width: xpBarAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            }} />
          </View>
          
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: 8,
          }}>
            <View style={{
              fontSize: 12,
              color: 'rgba(255, 255, 255, 0.8)',
            }}>
              Current Level
            </View>
            <View style={{
              fontSize: 12,
              color: 'rgba(255, 255, 255, 0.8)',
            }}>
              {userProgress.xpToNext} XP to next level
            </View>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 20,
        }}>
          <View style={{
            flex: 1,
            backgroundColor: 'white',
            borderRadius: 12,
            padding: 16,
            marginRight: 8,
            alignItems: 'center',
          }}>
            <Animated.View style={{
              fontSize: 32,
              marginBottom: 8,
              transform: [{
                scale: streakFlameAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.2],
                })
              }],
            }}>
              🔥
            </Animated.View>
            <View style={{
              fontSize: 24,
              fontWeight: 'bold',
              color: '#1F2937',
            }}>
              {userProgress.streak}
            </View>
            <View style={{
              fontSize: 12,
              color: '#6B7280',
            }}>
              Day Streak
            </View>
          </View>

          <View style={{
            flex: 1,
            backgroundColor: 'white',
            borderRadius: 12,
            padding: 16,
            marginLeft: 8,
            alignItems: 'center',
          }}>
            <View style={{
              fontSize: 32,
              marginBottom: 8,
            }}>
              🏆
            </View>
            <View style={{
              fontSize: 24,
              fontWeight: 'bold',
              color: '#1F2937',
            }}>
              {userProgress.badges.length}
            </View>
            <View style={{
              fontSize: 12,
              color: '#6B7280',
            }}>
              Badges Earned
            </View>
          </View>
        </View>

        {/* Recent Badges */}
        <View style={{
          backgroundColor: 'white',
          borderRadius: 12,
          padding: 16,
        }}>
          <View style={{
            fontSize: 18,
            fontWeight: 'bold',
            color: '#1F2937',
            marginBottom: 12,
          }}>
            Recent Achievements
          </View>
          {userProgress.badges.slice(-3).map((badge, index) => (
            <View key={badge.id} style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 8,
              borderBottomWidth: index < 2 ? 1 : 0,
              borderBottomColor: '#F3F4F6',
            }}>
              <Animated.View style={{
                fontSize: 24,
                marginRight: 12,
                transform: [{
                  scale: badgeGlowAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.1],
                  })
                }],
              }}>
                {badge.icon}
              </Animated.View>
              <View style={{ flex: 1 }}>
                <View style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: '#1F2937',
                }}>
                  {badge.name}
                </View>
                <View style={{
                  fontSize: 14,
                  color: '#6B7280',
                }}>
                  {badge.description}
                </View>
              </View>
              <View style={{
                paddingHorizontal: 8,
                paddingVertical: 4,
                backgroundColor: getRarityColor(badge.rarity),
                borderRadius: 6,
              }}>
                <View style={{
                  fontSize: 12,
                  color: 'white',
                  fontWeight: '600',
                }}>
                  {badge.rarity.toUpperCase()}
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  const getRarityColor = (rarity: Badge['rarity']): string => {
    switch (rarity) {
      case 'common': return '#6B7280';
      case 'rare': return '#3B82F6';
      case 'epic': return '#8B5CF6';
      case 'legendary': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  if (loading) {
    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <View style={{
          fontSize: 16,
          color: '#6B7280',
        }}>
          Loading your progress...
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      {/* Tab Navigation */}
      <View style={{
        flexDirection: 'row',
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
      }}>
        {['overview', 'challenges', 'badges'].map((tab) => (
          <View
            key={tab}
            style={{
              flex: 1,
              paddingVertical: 16,
              alignItems: 'center',
              borderBottomWidth: selectedTab === tab ? 2 : 0,
              borderBottomColor: '#4F46E5',
            }}
            onTouchEnd={() => setSelectedTab(tab as any)}
          >
            <View style={{
              fontSize: 16,
              fontWeight: selectedTab === tab ? '600' : 'normal',
              color: selectedTab === tab ? '#4F46E5' : '#6B7280',
            }}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </View>
          </View>
        ))}
      </View>

      {/* Tab Content */}
      {selectedTab === 'overview' && renderOverview()}
      {selectedTab === 'challenges' && <View style={{ flex: 1 }} />}
      {selectedTab === 'badges' && <View style={{ flex: 1 }} />}
    </View>
  );
};