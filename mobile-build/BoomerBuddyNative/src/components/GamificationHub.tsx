import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

interface GamificationHubProps {
  userStats: {
    xp: number;
    level: number;
    streak: number;
    scamsBlocked: number;
    badges: string[];
  };
  onBadgePress?: (badge: string) => void;
}

export default function GamificationHub({ userStats, onBadgePress }: GamificationHubProps) {
  const { xp, level, streak, scamsBlocked, badges } = userStats;

  // Calculate XP progress to next level
  const xpForCurrentLevel = (level - 1) * 500;
  const xpForNextLevel = level * 500;
  const xpProgress = (xp - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel);

  const getBadgeIcon = (badge: string): string => {
    const badgeIcons: { [key: string]: string } = {
      'First Defense': '🛡️',
      'Week Warrior': '⚔️',
      'Scam Spotter': '👁️',
      'Master Guardian': '🏆',
      'Streak Keeper': '🔥',
      'Threat Hunter': '🎯',
    };
    return badgeIcons[badge] || '🏅';
  };

  const getBadgeColor = (badge: string): string[] => {
    const badgeColors: { [key: string]: string[] } = {
      'First Defense': ['#3B82F6', '#1D4ED8'],
      'Week Warrior': ['#DC2626', '#991B1B'],
      'Scam Spotter': ['#059669', '#047857'],
      'Master Guardian': ['#7C3AED', '#5B21B6'],
      'Streak Keeper': ['#EA580C', '#C2410C'],
      'Threat Hunter': ['#0891B2', '#0E7490'],
    };
    return badgeColors[badge] || ['#6B7280', '#4B5563'];
  };

  return (
    <View style={styles.container}>
      {/* Level and XP Progress */}
      <View style={styles.levelCard}>
        <View style={styles.levelHeader}>
          <Text style={styles.levelTitle}>Level {level} Guardian</Text>
          <Text style={styles.xpText}>{xp} XP</Text>
        </View>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[styles.progressFill, { width: `${xpProgress * 100}%` }]}
            />
          </View>
          <Text style={styles.progressText}>
            {Math.round((1 - xpProgress) * 500)} XP to Level {level + 1}
          </Text>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{scamsBlocked}</Text>
          <Text style={styles.statLabel}>Scams Blocked</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{streak}</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>
      </View>

      {/* Badges Section */}
      <View style={styles.badgesSection}>
        <Text style={styles.sectionTitle}>🏆 Achievements</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.badgesScroll}
        >
          {badges.map((badge, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.badgeCard, { backgroundColor: getBadgeColor(badge)[0] }]}
              onPress={() => onBadgePress?.(badge)}
            >
              <View style={styles.badgeContent}>
                <Text style={styles.badgeIcon}>{getBadgeIcon(badge)}</Text>
                <Text style={styles.badgeName}>{badge}</Text>
              </View>
            </TouchableOpacity>
          ))}
          
          {/* Next Badge Preview */}
          <View style={[styles.badgeCard, styles.nextBadgeCard]}>
            <View style={styles.badgeContent}>
              <Text style={styles.badgeIcon}>🔒</Text>
              <Text style={styles.nextBadgeText}>Next Badge</Text>
              <Text style={styles.nextBadgeHint}>50 more blocks</Text>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Daily Challenge */}
      <View style={styles.challengeCard}>
        <View style={styles.challengeHeader}>
          <Text style={styles.challengeTitle}>🎯 Daily Challenge</Text>
          <Text style={styles.challengeReward}>+50 XP</Text>
        </View>
        <Text style={styles.challengeDescription}>
          Identify 3 red flags in suspicious messages
        </Text>
        <View style={styles.challengeProgress}>
          <View style={styles.challengeProgressBar}>
            <View style={[styles.challengeProgressFill, { width: '66%' }]} />
          </View>
          <Text style={styles.challengeProgressText}>2/3 completed</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  levelCard: {
    backgroundColor: '#4F46E5',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  levelTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  xpText: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
  },
  progressContainer: {
    gap: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: 'white',
    opacity: 0.8,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  badgesSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  badgesScroll: {
    flexDirection: 'row',
  },
  badgeCard: {
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  badgeContent: {
    padding: 16,
    alignItems: 'center',
    minWidth: 100,
    minHeight: 100,
    justifyContent: 'center',
  },
  badgeIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  badgeName: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  nextBadgeCard: {
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
  },
  nextBadgeText: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  nextBadgeHint: {
    fontSize: 8,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 2,
  },
  challengeCard: {
    backgroundColor: '#059669',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  challengeTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
  challengeReward: {
    fontSize: 12,
    color: 'white',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  challengeDescription: {
    fontSize: 12,
    color: 'white',
    marginBottom: 12,
  },
  challengeProgress: {
    gap: 4,
  },
  challengeProgressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  challengeProgressFill: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 3,
  },
  challengeProgressText: {
    fontSize: 10,
    color: 'white',
    opacity: 0.8,
  },
});