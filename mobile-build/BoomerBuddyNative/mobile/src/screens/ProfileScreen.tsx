import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { useUser } from '../context/UserContext';

export default function ProfileScreen() {
  const { user } = useUser();

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  const getSafetyScoreColor = (score: number) => {
    if (score >= 80) return '#27ae60';
    if (score >= 60) return '#f39c12';
    return '#e74c3c';
  };

  const getSafetyLevel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    return 'Needs Improvement';
  };

  const openFacebookGroup = () => {
    Linking.openURL('https://facebook.com/groups/boomerbuddy');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>🛡️</Text>
          </View>
          <Text style={styles.userName}>Boomer Buddy User</Text>
          <Text style={styles.memberSince}>Member since {formatDate(user.joinDate)}</Text>
        </View>

        {/* Safety Score Card */}
        <View style={styles.scoreCard}>
          <Text style={styles.cardTitle}>Your Safety Score</Text>
          <View style={styles.scoreDisplay}>
            <Text style={[styles.scoreNumber, { color: getSafetyScoreColor(user.safetyScore) }]}>
              {user.safetyScore}
            </Text>
            <View style={styles.scoreInfo}>
              <Text style={[styles.scoreLevel, { color: getSafetyScoreColor(user.safetyScore) }]}>
                {getSafetyLevel(user.safetyScore)}
              </Text>
              <Text style={styles.scoreDescription}>
                Your safety awareness level based on scam detection and protection habits.
              </Text>
            </View>
          </View>

          {/* Score Breakdown */}
          <View style={styles.scoreBreakdown}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{user.analysisCount}</Text>
              <Text style={styles.statLabel}>Analyses</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{user.scamsDetected}</Text>
              <Text style={styles.statLabel}>Scams Detected</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {user.analysisCount > 0 ? Math.round((user.scamsDetected / user.analysisCount) * 100) : 0}%
              </Text>
              <Text style={styles.statLabel}>Detection Rate</Text>
            </View>
          </View>
        </View>

        {/* Achievement Badges */}
        <View style={styles.achievementsCard}>
          <Text style={styles.cardTitle}>Your Achievements</Text>
          <View style={styles.badgesContainer}>
            {user.analysisCount >= 1 && (
              <View style={styles.badge}>
                <Text style={styles.badgeEmoji}>🔍</Text>
                <Text style={styles.badgeText}>First Analysis</Text>
              </View>
            )}
            {user.scamsDetected >= 1 && (
              <View style={styles.badge}>
                <Text style={styles.badgeEmoji}>🛡️</Text>
                <Text style={styles.badgeText}>Scam Spotter</Text>
              </View>
            )}
            {user.analysisCount >= 10 && (
              <View style={styles.badge}>
                <Text style={styles.badgeEmoji}>🏆</Text>
                <Text style={styles.badgeText}>Safety Expert</Text>
              </View>
            )}
            {user.safetyScore >= 80 && (
              <View style={styles.badge}>
                <Text style={styles.badgeEmoji}>⭐</Text>
                <Text style={styles.badgeText}>Safety Star</Text>
              </View>
            )}
          </View>
        </View>

        {/* Community Section */}
        <View style={styles.communityCard}>
          <Text style={styles.cardTitle}>🤝 Join Our Community</Text>
          <Text style={styles.communityDescription}>
            Connect with other Boomer Buddy users, share experiences, and learn from each other's scam encounters.
          </Text>
          <TouchableOpacity style={styles.facebookButton} onPress={openFacebookGroup}>
            <Text style={styles.facebookButtonText}>📘 Join Facebook Group</Text>
          </TouchableOpacity>
        </View>

        {/* Safety Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.cardTitle}>💡 Daily Safety Tip</Text>
          <View style={styles.tipContainer}>
            <Text style={styles.tipText}>
              "Always verify suspicious calls by hanging up and calling the organization directly using official phone numbers from their website or your account statements."
            </Text>
          </View>
        </View>

        {/* Settings Section */}
        <View style={styles.settingsCard}>
          <Text style={styles.cardTitle}>⚙️ Settings</Text>
          
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingText}>📱 Notification Settings</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingText}>🔒 Privacy Settings</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingText}>📞 Call Monitoring Settings</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingText}>❓ Help & Support</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 50,
    color: '#666',
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#17948E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarText: {
    fontSize: 40,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  memberSince: {
    fontSize: 14,
    color: '#666',
  },
  scoreCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  scoreDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  scoreNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    marginRight: 20,
  },
  scoreInfo: {
    flex: 1,
  },
  scoreLevel: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  scoreDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  scoreBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#17948E',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 10,
  },
  achievementsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  badge: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    minWidth: 80,
  },
  badgeEmoji: {
    fontSize: 24,
    marginBottom: 5,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  communityCard: {
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  communityDescription: {
    fontSize: 14,
    color: '#1565c0',
    marginBottom: 15,
    lineHeight: 18,
  },
  facebookButton: {
    backgroundColor: '#1877f2',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  facebookButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tipsCard: {
    backgroundColor: '#fff3e0',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  tipContainer: {
    backgroundColor: 'rgba(255, 183, 77, 0.1)',
    borderRadius: 8,
    padding: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
  },
  tipText: {
    fontSize: 14,
    color: '#e65100',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  settingsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingText: {
    fontSize: 16,
    color: '#333',
  },
  settingArrow: {
    fontSize: 20,
    color: '#ccc',
  },
});