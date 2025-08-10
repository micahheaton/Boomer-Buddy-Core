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

const GamificationHub: React.FC<GamificationHubProps> = ({ userStats, onBadgePress }) => {
  const { xp, level, streak, scamsBlocked, badges } = userStats;
  
  const xpForNextLevel = level * 500;
  const xpProgress = (xp % 500) / 500;

  const getBadgeIcon = (badge: string) => {
    switch (badge) {
      case 'First Defense': return '🛡️';
      case 'Week Warrior': return '⚔️';
      case 'Scam Spotter': return '👁️';
      case 'Guardian Angel': return '👼';
      case 'Cyber Shield': return '🔒';
      default: return '🏆';
    }
  };

  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case 'First Defense': return ['#3B82F6', '#1E40AF'];
      case 'Week Warrior': return ['#EF4444', '#B91C1C'];
      case 'Scam Spotter': return ['#10B981', '#047857'];
      case 'Guardian Angel': return ['#F59E0B', '#D97706'];
      case 'Cyber Shield': return ['#8B5CF6', '#6D28D9'];
      default: return ['#6B7280', '#374151'];
    }
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
          <Text style={styles.statNumber}>{streak}</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
          <Text style={styles.statIcon}>🔥</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{scamsBlocked}</Text>
          <Text style={styles.statLabel}>Scams Blocked</Text>
          <Text style={styles.statIcon}>🚫</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{badges.length}</Text>
          <Text style={styles.statLabel}>Badges Earned</Text>
          <Text style={styles.statIcon}>🏅</Text>
        </View>
      </View>

      {/* Badges Collection */}
      <View style={styles.badgesSection}>
        <Text style={styles.sectionTitle}>Recent Achievements</Text>
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
          <View style={[styles.badgeCard, styles.nextBadge]}>
            <View style={styles.nextBadgeContent}>
              <Text style={styles.nextBadgeIcon}>❓</Text>
              <Text style={styles.nextBadgeText}>Next Goal</Text>
              <Text style={styles.nextBadgeDesc}>30 Days Strong</Text>
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
};

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
    marginBottom: 12,
  },
  levelTitle: {
    fontSize: 20,
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
    backgroundColor: 'rgba(255,255,255,0.3)',
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
    textAlign: 'center',
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
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  statIcon: {
    fontSize: 20,
  },
  badgesSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  badgesScroll: {
    paddingVertical: 4,
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
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
  },
  nextBadge: {
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  nextBadgeContent: {
    padding: 16,
    alignItems: 'center',
    minWidth: 100,
    minHeight: 100,
    justifyContent: 'center',
  },
  nextBadgeIcon: {
    fontSize: 24,
    marginBottom: 8,
    opacity: 0.5,
  },
  nextBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 4,
  },
  nextBadgeDesc: {
    fontSize: 10,
    color: '#9CA3AF',
    textAlign: 'center',
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
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  challengeReward: {
    fontSize: 14,
    color: 'white',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  challengeDescription: {
    fontSize: 14,
    color: 'white',
    opacity: 0.9,
    marginBottom: 12,
  },
  challengeProgress: {
    gap: 6,
  },
  challengeProgressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  challengeProgressFill: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 3,
  },
  challengeProgressText: {
    fontSize: 12,
    color: 'white',
    opacity: 0.8,
  },
});

export default GamificationHub;