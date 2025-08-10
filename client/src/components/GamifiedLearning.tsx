import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  Star, 
  Target, 
  Zap, 
  Award, 
  ChevronRight,
  Crown,
  Flame,
  Shield
} from 'lucide-react';

interface UserProgress {
  level: number;
  xp: number;
  xpToNext: number;
  streak: number;
  badges: string[];
  completedChallenges: number;
  totalChallenges: number;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  difficulty: 'easy' | 'medium' | 'hard';
  completed: boolean;
  progress: number;
  maxProgress: number;
}

const GamifiedLearning = () => {
  const [userProgress, setUserProgress] = useState<UserProgress>({
    level: 12,
    xp: 2450,
    xpToNext: 500,
    streak: 7,
    badges: ['First Steps', 'Scam Spotter', 'Week Warrior', 'Shield Master'],
    completedChallenges: 23,
    totalChallenges: 30
  });

  const [challenges, setChallenges] = useState<Challenge[]>([
    {
      id: '1',
      title: 'Phone Scam Detector',
      description: 'Identify 5 phone scam tactics correctly',
      xpReward: 150,
      difficulty: 'easy',
      completed: true,
      progress: 5,
      maxProgress: 5
    },
    {
      id: '2',
      title: 'Email Security Expert',
      description: 'Spot suspicious emails in your inbox',
      xpReward: 200,
      difficulty: 'medium',
      completed: false,
      progress: 3,
      maxProgress: 7
    },
    {
      id: '3',
      title: 'Romance Scam Guardian',
      description: 'Complete advanced romance scam training',
      xpReward: 300,
      difficulty: 'hard',
      completed: false,
      progress: 1,
      maxProgress: 10
    }
  ]);

  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [showLevelUp, setShowLevelUp] = useState(false);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const startChallenge = (challenge: Challenge) => {
    if (!challenge.completed) {
      setSelectedChallenge(challenge);
      // Simulate challenge completion for demo
      setTimeout(() => {
        setChallenges(prev => 
          prev.map(c => 
            c.id === challenge.id 
              ? { ...c, completed: true, progress: c.maxProgress }
              : c
          )
        );
        setUserProgress(prev => ({
          ...prev,
          xp: prev.xp + challenge.xpReward,
          completedChallenges: prev.completedChallenges + 1
        }));
        setSelectedChallenge(null);
        setShowLevelUp(true);
        setTimeout(() => setShowLevelUp(false), 3000);
      }, 3000);
    }
  };

  const progressPercentage = (userProgress.xp / (userProgress.xp + userProgress.xpToNext)) * 100;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Level Up Animation */}
      <AnimatePresence>
        {showLevelUp && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gradient-to-r from-yellow-400 to-orange-500 p-8 rounded-2xl text-center"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ type: "spring", damping: 15 }}
            >
              <Crown size={64} className="mx-auto mb-4 text-white" />
              <h2 className="text-3xl font-bold text-white mb-2">Level Up!</h2>
              <p className="text-xl text-white">You reached Level {userProgress.level + 1}!</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Overview */}
      <motion.div
        className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">Scam Shield Academy</h2>
            <p className="opacity-90">Master the art of scam detection</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">Level {userProgress.level}</div>
            <div className="text-sm opacity-90">{userProgress.xp} XP</div>
          </div>
        </div>

        {/* XP Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span>Progress to Level {userProgress.level + 1}</span>
            <span>{userProgress.xpToNext} XP to go</span>
          </div>
          <div className="bg-white bg-opacity-20 rounded-full h-3">
            <motion.div
              className="bg-gradient-to-r from-yellow-400 to-orange-500 h-3 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 1 }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Flame className="mr-1" size={20} />
              <span className="text-2xl font-bold">{userProgress.streak}</span>
            </div>
            <p className="text-sm opacity-90">Day Streak</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Trophy className="mr-1" size={20} />
              <span className="text-2xl font-bold">{userProgress.badges.length}</span>
            </div>
            <p className="text-sm opacity-90">Badges Earned</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Target className="mr-1" size={20} />
              <span className="text-2xl font-bold">{userProgress.completedChallenges}</span>
            </div>
            <p className="text-sm opacity-90">Challenges Done</p>
          </div>
        </div>
      </motion.div>

      {/* Daily Challenges */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          className="bg-white rounded-xl shadow-lg p-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-xl font-bold mb-4 flex items-center">
            <Zap className="mr-2 text-yellow-500" />
            Daily Challenges
          </h3>
          
          <div className="space-y-4">
            {challenges.map((challenge, index) => (
              <motion.div
                key={challenge.id}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  challenge.completed 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-gray-50 border-gray-200 hover:border-blue-300'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => startChallenge(challenge)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">{challenge.title}</h4>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(challenge.difficulty)}`}>
                      {challenge.difficulty}
                    </span>
                    {challenge.completed && <Award className="text-green-500" size={20} />}
                  </div>
                </div>
                
                <p className="text-gray-600 text-sm mb-3">{challenge.description}</p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Star className="text-yellow-500" size={16} />
                    <span className="text-sm font-medium">{challenge.xpReward} XP</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="text-sm text-gray-500">
                      {challenge.progress}/{challenge.maxProgress}
                    </div>
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <motion.div
                        className="bg-blue-500 h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${(challenge.progress / challenge.maxProgress) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Badges & Achievements */}
        <motion.div
          className="bg-white rounded-xl shadow-lg p-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="text-xl font-bold mb-4 flex items-center">
            <Award className="mr-2 text-purple-500" />
            Achievements
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            {userProgress.badges.map((badge, index) => (
              <motion.div
                key={badge}
                className="bg-gradient-to-br from-purple-100 to-blue-100 border border-purple-200 rounded-lg p-4 text-center"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                whileHover={{ scale: 1.05 }}
              >
                <Shield className="mx-auto mb-2 text-purple-600" size={32} />
                <h4 className="font-semibold text-sm text-purple-800">{badge}</h4>
              </motion.div>
            ))}
          </div>

          {/* Next Badge Progress */}
          <motion.div
            className="mt-6 p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <h4 className="font-semibold text-gray-700 mb-2">Next Badge: Social Media Savvy</h4>
            <p className="text-sm text-gray-600 mb-3">Complete 3 social media scam challenges</p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">1/3 completed</span>
              <div className="w-24 bg-gray-200 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full w-1/3" />
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Challenge in Progress Modal */}
      <AnimatePresence>
        {selectedChallenge && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl p-8 max-w-md w-full mx-4"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <div className="text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="inline-block mb-4"
                >
                  <Shield size={64} className="text-blue-500" />
                </motion.div>
                <h3 className="text-xl font-bold mb-2">Challenge in Progress</h3>
                <p className="text-gray-600 mb-4">{selectedChallenge.title}</p>
                <div className="flex justify-center space-x-1">
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 bg-blue-500 rounded-full"
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GamifiedLearning;