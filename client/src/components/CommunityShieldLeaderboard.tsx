import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Crown, 
  Trophy, 
  Medal, 
  Shield, 
  TrendingUp, 
  Star,
  Users,
  Zap,
  Award,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

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
}

interface CommunityStats {
  totalMembers: number;
  scamsBlocked: number;
  totalProtectionScore: number;
  newMembersToday: number;
}

const CommunityShieldLeaderboard = () => {
  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'all'>('week');
  const [selectedCategory, setSelectedCategory] = useState<'overall' | 'blocks' | 'help'>('overall');
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [communityStats, setCommunityStats] = useState<CommunityStats>({
    totalMembers: 12847,
    scamsBlocked: 8924,
    totalProtectionScore: 87,
    newMembersToday: 23
  });

  useEffect(() => {
    // Mock data - in real app this would come from API
    const mockData: LeaderboardEntry[] = [
      {
        id: '1',
        username: 'SafetyFirst_Betty',
        protectionScore: 98,
        scamsBlocked: 47,
        communityHelp: 156,
        streak: 28,
        badge: 'Guardian Elite',
        level: 15,
        avatar: '👵',
        rank: 1,
        rankChange: 'same'
      },
      {
        id: '2',
        username: 'WiseOwl_Robert',
        protectionScore: 96,
        scamsBlocked: 42,
        communityHelp: 134,
        streak: 21,
        badge: 'Scam Hunter',
        level: 14,
        avatar: '👴',
        rank: 2,
        rankChange: 'up'
      },
      {
        id: '3',
        username: 'ProtectorMary',
        protectionScore: 94,
        scamsBlocked: 38,
        communityHelp: 98,
        streak: 19,
        badge: 'Shield Master',
        level: 13,
        avatar: '👩',
        rank: 3,
        rankChange: 'down'
      },
      {
        id: '4',
        username: 'GuardianJoe',
        protectionScore: 92,
        scamsBlocked: 35,
        communityHelp: 87,
        streak: 16,
        badge: 'Alert Warrior',
        level: 12,
        avatar: '👨',
        rank: 4,
        rankChange: 'up'
      },
      {
        id: '5',
        username: 'SafeHarbor_Linda',
        protectionScore: 90,
        scamsBlocked: 31,
        communityHelp: 76,
        streak: 14,
        badge: 'Community Helper',
        level: 11,
        avatar: '👵',
        rank: 5,
        rankChange: 'same'
      },
      {
        id: '6',
        username: 'You',
        protectionScore: 87,
        scamsBlocked: 12,
        communityHelp: 23,
        streak: 7,
        badge: 'Rising Shield',
        level: 8,
        avatar: '🛡️',
        rank: 12,
        rankChange: 'up',
        isCurrentUser: true
      }
    ];

    setLeaderboardData(mockData);
  }, [timeFilter, selectedCategory]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="text-yellow-500" size={24} />;
      case 2:
        return <Trophy className="text-gray-400" size={24} />;
      case 3:
        return <Medal className="text-orange-500" size={24} />;
      default:
        return <span className="text-lg font-bold text-gray-600">#{rank}</span>;
    }
  };

  const getRankChangeIcon = (change: string) => {
    switch (change) {
      case 'up':
        return <ChevronUp className="text-green-500" size={16} />;
      case 'down':
        return <ChevronDown className="text-red-500" size={16} />;
      default:
        return <div className="w-4 h-4" />;
    }
  };

  const getScoreForCategory = (entry: LeaderboardEntry) => {
    switch (selectedCategory) {
      case 'blocks':
        return entry.scamsBlocked;
      case 'help':
        return entry.communityHelp;
      default:
        return entry.protectionScore;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Community Stats Header */}
      <motion.div
        className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-3xl font-bold mb-4 flex items-center">
          <Shield className="mr-3" size={32} />
          Community Shield Network
        </h2>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            className="text-center"
            whileHover={{ scale: 1.05 }}
          >
            <Users size={32} className="mx-auto mb-2" />
            <div className="text-2xl font-bold">{communityStats.totalMembers.toLocaleString()}</div>
            <div className="text-sm opacity-90">Active Members</div>
          </motion.div>
          
          <motion.div
            className="text-center"
            whileHover={{ scale: 1.05 }}
          >
            <Shield size={32} className="mx-auto mb-2" />
            <div className="text-2xl font-bold">{communityStats.scamsBlocked.toLocaleString()}</div>
            <div className="text-sm opacity-90">Scams Blocked</div>
          </motion.div>
          
          <motion.div
            className="text-center"
            whileHover={{ scale: 1.05 }}
          >
            <Star size={32} className="mx-auto mb-2" />
            <div className="text-2xl font-bold">{communityStats.totalProtectionScore}%</div>
            <div className="text-sm opacity-90">Avg Protection</div>
          </motion.div>
          
          <motion.div
            className="text-center"
            whileHover={{ scale: 1.05 }}
          >
            <TrendingUp size={32} className="mx-auto mb-2" />
            <div className="text-2xl font-bold">+{communityStats.newMembersToday}</div>
            <div className="text-sm opacity-90">New Today</div>
          </motion.div>
        </div>
      </motion.div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 space-y-4 sm:space-y-0">
          <h3 className="text-xl font-bold">Protection Leaders</h3>
          
          <div className="flex space-x-4">
            {/* Time Filter */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              {['week', 'month', 'all'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setTimeFilter(filter as any)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    timeFilter === filter 
                      ? 'bg-blue-500 text-white shadow-lg' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>

            {/* Category Filter */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              {[
                { key: 'overall', label: 'Overall', icon: Star },
                { key: 'blocks', label: 'Blocks', icon: Shield },
                { key: 'help', label: 'Help', icon: Users }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setSelectedCategory(key as any)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all flex items-center space-x-1 ${
                    selectedCategory === key 
                      ? 'bg-purple-500 text-white shadow-lg' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Icon size={16} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="space-y-3">
          <AnimatePresence>
            {leaderboardData.map((entry, index) => (
              <motion.div
                key={entry.id}
                className={`relative p-4 rounded-xl border transition-all ${
                  entry.isCurrentUser 
                    ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200' 
                    : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02 }}
              >
                {entry.isCurrentUser && (
                  <motion.div
                    className="absolute -top-2 -right-2 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    YOU
                  </motion.div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Rank */}
                    <div className="flex items-center space-x-2">
                      {getRankIcon(entry.rank)}
                      {getRankChangeIcon(entry.rankChange)}
                    </div>

                    {/* Avatar & Info */}
                    <div className="flex items-center space-x-3">
                      <div className="text-3xl">{entry.avatar}</div>
                      <div>
                        <h4 className="font-semibold text-gray-800">{entry.username}</h4>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Award size={14} />
                          <span>{entry.badge}</span>
                          <span>•</span>
                          <span>Level {entry.level}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {getScoreForCategory(entry)}
                        {selectedCategory === 'overall' && '%'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {selectedCategory === 'overall' && 'Protection'}
                        {selectedCategory === 'blocks' && 'Blocks'}
                        {selectedCategory === 'help' && 'Helps'}
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="flex items-center text-orange-500">
                        <Zap size={16} className="mr-1" />
                        <span className="font-bold">{entry.streak}</span>
                      </div>
                      <div className="text-xs text-gray-500">Streak</div>
                    </div>
                  </div>
                </div>

                {/* Progress Bar for Current User */}
                {entry.isCurrentUser && (
                  <motion.div
                    className="mt-4 pt-4 border-t border-blue-200"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ delay: 0.4 }}
                  >
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Progress to next rank</span>
                      <span>3 more blocks needed</span>
                    </div>
                    <div className="bg-gray-200 rounded-full h-2">
                      <motion.div
                        className="bg-blue-500 h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: '75%' }}
                        transition={{ delay: 0.5, duration: 1 }}
                      />
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Join Community CTA */}
        <motion.div
          className="mt-6 p-4 bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl border border-purple-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="text-center">
            <h4 className="font-semibold text-purple-800 mb-2">
              Climb the Rankings!
            </h4>
            <p className="text-sm text-purple-700 mb-3">
              Help others avoid scams and earn community points. Every blocked scam makes us all safer.
            </p>
            <button className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-lg font-medium transition-colors">
              Join Community Forum
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CommunityShieldLeaderboard;