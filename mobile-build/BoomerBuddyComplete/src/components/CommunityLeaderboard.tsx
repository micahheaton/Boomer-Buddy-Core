import React, { useState, useEffect } from 'react';
import { View, ScrollView, Animated, RefreshControl } from 'react-native';
import { StorageService } from '../services/StorageService';

interface LeaderboardEntry {
  id: string;
  username: string;
  protectionScore: number;
  scamsBlocked: number;
  communityHelp: number;
  streak: number;
  badge: string;
  level: number;
  avatar: string;
  isCurrentUser?: boolean;
  rank: number;
  rankChange: 'up' | 'down' | 'same';
  lastActivity: number;
}

interface CommunityStats {
  totalMembers: number;
  scamsBlocked: number;
  totalProtectionScore: number;
  newMembersToday: number;
  weeklyTrend: number;
}

interface CommunityLeaderboardProps {
  onUserRankChange?: (newRank: number, change: number) => void;
  onCommunityMilestone?: (milestone: string) => void;
}

export const CommunityLeaderboard: React.FC<CommunityLeaderboardProps> = ({
  onUserRankChange,
  onCommunityMilestone
}) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [communityStats, setCommunityStats] = useState<CommunityStats | null>(null);
  const [currentUserRank, setCurrentUserRank] = useState<number>(0);
  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'all'>('week');
  const [category, setCategory] = useState<'overall' | 'blocks' | 'help'>('overall');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Animations
  const [rankAnimations] = useState(() => 
    Array.from({ length: 10 }, () => new Animated.Value(0))
  );
  const [statsAnimation] = useState(new Animated.Value(0));
  const [userHighlightAnim] = useState(new Animated.Value(0));

  const storageService = new StorageService();

  useEffect(() => {
    loadLeaderboardData();
    animateInitialLoad();
  }, [timeFilter, category]);

  const loadLeaderboardData = async () => {
    try {
      setLoading(true);
      
      // Load community stats and leaderboard
      const [stats, entries] = await Promise.all([
        loadCommunityStats(),
        loadLeaderboardEntries()
      ]);
      
      setCommunityStats(stats);
      setLeaderboard(entries);
      
      // Find current user rank
      const userEntry = entries.find(entry => entry.isCurrentUser);
      if (userEntry) {
        const previousRank = currentUserRank;
        setCurrentUserRank(userEntry.rank);
        
        if (previousRank > 0 && onUserRankChange) {
          onUserRankChange(userEntry.rank, previousRank - userEntry.rank);
        }
      }
      
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCommunityStats = async (): Promise<CommunityStats> => {
    try {
      const response = await fetch('/api/mobile/v1/community/stats');
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.log('Using offline community stats');
    }
    
    // Fallback to local data
    const localStats = await storageService.getCommunityStats();
    return localStats || generateMockStats();
  };

  const loadLeaderboardEntries = async (): Promise<LeaderboardEntry[]> => {
    try {
      const response = await fetch(`/api/mobile/v1/community/leaderboard?period=${timeFilter}&category=${category}`);
      if (response.ok) {
        const data = await response.json();
        return data.entries;
      }
    } catch (error) {
      console.log('Using offline leaderboard data');
    }
    
    // Fallback to local/mock data
    return generateMockLeaderboard();
  };

  const generateMockStats = (): CommunityStats => {
    return {
      totalMembers: 12847 + Math.floor(Math.random() * 100),
      scamsBlocked: 8924 + Math.floor(Math.random() * 50),
      totalProtectionScore: 87 + Math.floor(Math.random() * 5),
      newMembersToday: 23 + Math.floor(Math.random() * 10),
      weeklyTrend: Math.random() * 0.1 + 0.05 // 5-15% growth
    };
  };

  const generateMockLeaderboard = (): LeaderboardEntry[] => {
    const mockUsers = [
      { username: 'SafetyFirst_Betty', avatar: '👵', badge: 'Guardian Elite' },
      { username: 'WiseOwl_Robert', avatar: '👴', badge: 'Scam Hunter' },
      { username: 'ProtectorMary', avatar: '👩', badge: 'Shield Master' },
      { username: 'GuardianJoe', avatar: '👨', badge: 'Alert Warrior' },
      { username: 'SafeHarbor_Linda', avatar: '👵', badge: 'Community Helper' },
      { username: 'CyberGuard_Frank', avatar: '👴', badge: 'Tech Protector' },
      { username: 'AlertAngel_Susan', avatar: '👩', badge: 'Vigilant Watcher' },
      { username: 'You', avatar: '🛡️', badge: 'Rising Shield', isCurrentUser: true }
    ];

    return mockUsers.map((user, index) => ({
      id: `user_${index}`,
      username: user.username,
      protectionScore: 98 - index * 2 - Math.floor(Math.random() * 3),
      scamsBlocked: 47 - index * 3 - Math.floor(Math.random() * 5),
      communityHelp: 156 - index * 10 - Math.floor(Math.random() * 15),
      streak: 28 - index * 2 - Math.floor(Math.random() * 3),
      badge: user.badge,
      level: 15 - index,
      avatar: user.avatar,
      isCurrentUser: user.isCurrentUser || false,
      rank: index + 1,
      rankChange: Math.random() > 0.5 ? 'up' : Math.random() > 0.3 ? 'down' : 'same',
      lastActivity: Date.now() - Math.floor(Math.random() * 24 * 60 * 60 * 1000)
    }));
  };

  const animateInitialLoad = () => {
    // Stats animation
    Animated.spring(statsAnimation, {
      toValue: 1,
      tension: 50,
      friction: 8,
      useNativeDriver: true,
    }).start();

    // Staggered rank animations
    const staggerDelay = 100;
    rankAnimations.forEach((anim, index) => {
      Animated.spring(anim, {
        toValue: 1,
        tension: 60,
        friction: 8,
        delay: index * staggerDelay,
        useNativeDriver: true,
      }).start();
    });
  };

  const animateUserHighlight = () => {
    Animated.sequence([
      Animated.timing(userHighlightAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(userHighlightAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLeaderboardData();
    setRefreshing(false);
  };

  const getScoreForCategory = (entry: LeaderboardEntry): number => {
    switch (category) {
      case 'blocks': return entry.scamsBlocked;
      case 'help': return entry.communityHelp;
      default: return entry.protectionScore;
    }
  };

  const getCategoryLabel = (): string => {
    switch (category) {
      case 'blocks': return 'Scams Blocked';
      case 'help': return 'Community Helps';
      default: return 'Protection Score';
    }
  };

  const renderRankIcon = (rank: number) => {
    const iconSize = 24;
    
    switch (rank) {
      case 1:
        return <View style={{ fontSize: iconSize, color: '#F59E0B' }}>👑</View>;
      case 2:
        return <View style={{ fontSize: iconSize, color: '#6B7280' }}>🥈</View>;
      case 3:
        return <View style={{ fontSize: iconSize, color: '#CD7C2F' }}>🥉</View>;
      default:
        return (
          <View style={{
            width: iconSize,
            height: iconSize,
            borderRadius: iconSize / 2,
            backgroundColor: '#E5E7EB',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <View style={{
              fontSize: 12,
              fontWeight: 'bold',
              color: '#6B7280',
            }}>
              {rank}
            </View>
          </View>
        );
    }
  };

  const renderRankChangeIcon = (change: string) => {
    switch (change) {
      case 'up':
        return <View style={{ fontSize: 16, color: '#10B981' }}>⬆️</View>;
      case 'down':
        return <View style={{ fontSize: 16, color: '#EF4444' }}>⬇️</View>;
      default:
        return <View style={{ width: 16, height: 16 }} />;
    }
  };

  const renderCommunityStats = () => {
    if (!communityStats) return null;

    return (
      <Animated.View
        style={{
          backgroundColor: '#4F46E5',
          borderRadius: 16,
          padding: 20,
          margin: 16,
          transform: [{ scale: statsAnimation }],
          opacity: statsAnimation,
        }}
      >
        <View style={{
          fontSize: 24,
          fontWeight: 'bold',
          color: 'white',
          marginBottom: 16,
          textAlign: 'center',
        }}>
          Community Shield Network
        </View>

        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-around',
        }}>
          {[
            { label: 'Members', value: communityStats.totalMembers.toLocaleString(), icon: '👥' },
            { label: 'Scams Blocked', value: communityStats.scamsBlocked.toLocaleString(), icon: '🛡️' },
            { label: 'Avg Protection', value: `${communityStats.totalProtectionScore}%`, icon: '⭐' },
            { label: 'New Today', value: `+${communityStats.newMembersToday}`, icon: '📈' },
          ].map((stat, index) => (
            <Animated.View
              key={stat.label}
              style={{
                alignItems: 'center',
                transform: [{
                  translateY: statsAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  })
                }],
              }}
            >
              <View style={{
                fontSize: 24,
                marginBottom: 4,
              }}>
                {stat.icon}
              </View>
              <View style={{
                fontSize: 18,
                fontWeight: 'bold',
                color: 'white',
              }}>
                {stat.value}
              </View>
              <View style={{
                fontSize: 12,
                color: 'rgba(255, 255, 255, 0.8)',
                textAlign: 'center',
              }}>
                {stat.label}
              </View>
            </Animated.View>
          ))}
        </View>
      </Animated.View>
    );
  };

  const renderFilterTabs = () => {
    return (
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        marginBottom: 16,
      }}>
        {/* Time Filter */}
        <View style={{
          flexDirection: 'row',
          backgroundColor: '#F3F4F6',
          borderRadius: 8,
          padding: 2,
        }}>
          {(['week', 'month', 'all'] as const).map((filter) => (
            <View
              key={filter}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 6,
                backgroundColor: timeFilter === filter ? '#3B82F6' : 'transparent',
              }}
              onTouchEnd={() => setTimeFilter(filter)}
            >
              <View style={{
                fontSize: 14,
                fontWeight: '500',
                color: timeFilter === filter ? 'white' : '#6B7280',
              }}>
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </View>
            </View>
          ))}
        </View>

        {/* Category Filter */}
        <View style={{
          flexDirection: 'row',
          backgroundColor: '#F3F4F6',
          borderRadius: 8,
          padding: 2,
        }}>
          {([
            { key: 'overall', label: 'Overall' },
            { key: 'blocks', label: 'Blocks' },
            { key: 'help', label: 'Helps' }
          ] as const).map(({ key, label }) => (
            <View
              key={key}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 6,
                backgroundColor: category === key ? '#8B5CF6' : 'transparent',
              }}
              onTouchEnd={() => setCategory(key)}
            >
              <View style={{
                fontSize: 14,
                fontWeight: '500',
                color: category === key ? 'white' : '#6B7280',
              }}>
                {label}
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderLeaderboardEntry = (entry: LeaderboardEntry, index: number) => {
    const animation = rankAnimations[index] || new Animated.Value(1);
    const isCurrentUser = entry.isCurrentUser;

    return (
      <Animated.View
        key={entry.id}
        style={{
          marginHorizontal: 16,
          marginBottom: 8,
          backgroundColor: isCurrentUser ? '#EBF4FF' : 'white',
          borderRadius: 12,
          padding: 16,
          borderWidth: isCurrentUser ? 2 : 1,
          borderColor: isCurrentUser ? '#3B82F6' : '#E5E7EB',
          transform: [{
            scale: animation.interpolate({
              inputRange: [0, 1],
              outputRange: [0.9, 1],
            })
          }],
          opacity: animation,
        }}
      >
        {isCurrentUser && (
          <Animated.View
            style={{
              position: 'absolute',
              top: -8,
              right: 8,
              backgroundColor: '#3B82F6',
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 12,
              transform: [{ scale: userHighlightAnim }],
            }}
          >
            <View style={{
              fontSize: 12,
              color: 'white',
              fontWeight: 'bold',
            }}>
              YOU
            </View>
          </Animated.View>
        )}

        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          {/* Left side: Rank and User Info */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            flex: 1,
          }}>
            {/* Rank */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginRight: 12,
            }}>
              {renderRankIcon(entry.rank)}
              {renderRankChangeIcon(entry.rankChange)}
            </View>

            {/* Avatar and Info */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              flex: 1,
            }}>
              <View style={{
                fontSize: 32,
                marginRight: 12,
              }}>
                {entry.avatar}
              </View>
              
              <View style={{ flex: 1 }}>
                <View style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: '#1F2937',
                }}>
                  {entry.username}
                </View>
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginTop: 2,
                }}>
                  <View style={{
                    fontSize: 12,
                    color: '#6B7280',
                  }}>
                    {entry.badge} • Level {entry.level}
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Right side: Stats */}
          <View style={{
            alignItems: 'flex-end',
          }}>
            <View style={{
              fontSize: 20,
              fontWeight: 'bold',
              color: '#3B82F6',
            }}>
              {getScoreForCategory(entry)}
              {category === 'overall' && '%'}
            </View>
            <View style={{
              fontSize: 12,
              color: '#6B7280',
            }}>
              {getCategoryLabel()}
            </View>
            
            {/* Streak indicator */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginTop: 4,
            }}>
              <View style={{
                fontSize: 12,
                marginRight: 2,
              }}>
                🔥
              </View>
              <View style={{
                fontSize: 12,
                color: '#F59E0B',
                fontWeight: '600',
              }}>
                {entry.streak}
              </View>
            </View>
          </View>
        </View>

        {/* Progress indicator for current user */}
        {isCurrentUser && (
          <View style={{
            marginTop: 12,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: '#E5E7EB',
          }}>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}>
              <View style={{
                fontSize: 14,
                color: '#6B7280',
              }}>
                Progress to rank {Math.max(1, entry.rank - 1)}
              </View>
              <View style={{
                fontSize: 14,
                color: '#6B7280',
              }}>
                {Math.max(0, getScoreForCategory(leaderboard[Math.max(0, entry.rank - 2)]) - getScoreForCategory(entry))} points needed
              </View>
            </View>
            <View style={{
              height: 4,
              backgroundColor: '#E5E7EB',
              borderRadius: 2,
              overflow: 'hidden',
            }}>
              <View style={{
                height: '100%',
                backgroundColor: '#3B82F6',
                width: '75%',
                borderRadius: 2,
              }} />
            </View>
          </View>
        )}
      </Animated.View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#3B82F6']}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderCommunityStats()}
        {renderFilterTabs()}
        
        <View style={{ paddingBottom: 20 }}>
          {leaderboard.map((entry, index) => renderLeaderboardEntry(entry, index))}
        </View>

        {/* Community Engagement CTA */}
        <View style={{
          margin: 16,
          padding: 16,
          backgroundColor: 'white',
          borderRadius: 12,
          borderWidth: 1,
          borderColor: '#E5E7EB',
        }}>
          <View style={{
            fontSize: 18,
            fontWeight: 'bold',
            color: '#1F2937',
            textAlign: 'center',
            marginBottom: 8,
          }}>
            Climb the Rankings! 🚀
          </View>
          <View style={{
            fontSize: 14,
            color: '#6B7280',
            textAlign: 'center',
            lineHeight: 20,
            marginBottom: 16,
          }}>
            Help others avoid scams and earn community points. Every blocked scam makes us all safer.
          </View>
          <View style={{
            backgroundColor: '#3B82F6',
            paddingVertical: 12,
            paddingHorizontal: 24,
            borderRadius: 8,
            alignItems: 'center',
          }}>
            <View style={{
              fontSize: 16,
              color: 'white',
              fontWeight: '600',
            }}>
              Join Community Forum
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};