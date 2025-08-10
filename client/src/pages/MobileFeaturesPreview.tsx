import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Smartphone, 
  Shield, 
  Play, 
  Pause,
  RotateCcw
} from 'lucide-react';
import ThreatDetectionVisualization from '../components/ThreatDetectionVisualization';
import GamifiedLearning from '../components/GamifiedLearning';
import SafetyTipsCarousel from '../components/SafetyTipsCarousel';
import CommunityShieldLeaderboard from '../components/CommunityShieldLeaderboard';
import EmotionalSupportChatbot from '../components/EmotionalSupportChatbot';

const MobileFeaturesPreview = () => {
  const [activeDemo, setActiveDemo] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const features = [
    {
      id: 'threat-detection',
      title: 'Animated Threat Detection Visualization',
      description: 'Real-time visual feedback showing protection status with animated shield graphics',
      component: ThreatDetectionVisualization,
      demoData: {
        threatData: {
          level: 'danger' as const,
          score: 15,
          threats: ['Phishing attempt', 'Suspicious caller ID', 'Request for personal info'],
          timestamp: Date.now()
        }
      }
    },
    {
      id: 'gamified-learning',
      title: 'Gamified Learning Experience',
      description: 'Interactive challenges, XP system, badges, and streak tracking to make safety learning engaging',
      component: GamifiedLearning,
      demoData: {}
    },
    {
      id: 'safety-tips',
      title: 'Personalized Safety Tips Carousel',
      description: 'Dynamic carousel showing personalized safety tips based on user vulnerability patterns',
      component: SafetyTipsCarousel,
      demoData: {
        userVulnerabilities: ['phone', 'email', 'financial']
      }
    },
    {
      id: 'leaderboard',
      title: 'Community Shield Leaderboard',
      description: 'Social protection rankings showing community members helping each other stay safe',
      component: CommunityShieldLeaderboard,
      demoData: {}
    },
    {
      id: 'chatbot',
      title: 'Emotional Support Chatbot Integration',
      description: 'AI-powered emotional support for users who may be vulnerable or confused',
      component: EmotionalSupportChatbot,
      demoData: {}
    }
  ];

  const startThreatDemo = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
    }, 4000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center">
            <motion.div
              className="flex justify-center mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="bg-white bg-opacity-20 p-4 rounded-2xl">
                <Smartphone size={48} />
              </div>
            </motion.div>
            
            <motion.h1
              className="text-4xl font-bold mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              Mobile Features Preview
            </motion.h1>
            
            <motion.p
              className="text-xl opacity-90 max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Experience the advanced features that will be available in the Boomer Buddy mobile app. 
              These web previews showcase the mobile experience and functionality.
            </motion.p>
          </div>
        </div>
      </div>

      {/* Feature Navigation */}
      <div className="bg-white shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-1 overflow-x-auto py-4">
            {features.map((feature) => (
              <button
                key={feature.id}
                onClick={() => setActiveDemo(activeDemo === feature.id ? null : feature.id)}
                className={`whitespace-nowrap px-6 py-3 rounded-lg font-medium transition-all ${
                  activeDemo === feature.id
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {feature.title}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Feature Showcase */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {!activeDemo ? (
          <motion.div
            className="text-center py-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Shield size={64} className="mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Select a Feature to Preview
            </h2>
            <p className="text-gray-600">
              Click on any feature above to see it in action
            </p>
          </motion.div>
        ) : (
          <motion.div
            key={activeDemo}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {features.map((feature) => {
              if (feature.id !== activeDemo) return null;
              
              const Component = feature.component;
              
              return (
                <div key={feature.id} className="space-y-6">
                  {/* Feature Info */}
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">
                          {feature.title}
                        </h3>
                        <p className="text-gray-600">
                          {feature.description}
                        </p>
                      </div>
                      
                      {/* Special controls for threat detection */}
                      {feature.id === 'threat-detection' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={startThreatDemo}
                            disabled={isAnalyzing}
                            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                          >
                            {isAnalyzing ? <Pause size={16} /> : <Play size={16} />}
                            <span>{isAnalyzing ? 'Analyzing...' : 'Start Demo'}</span>
                          </button>
                          
                          <button
                            onClick={() => window.location.reload()}
                            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                          >
                            <RotateCcw size={16} />
                            <span>Reset</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Feature Component */}
                  <div className="bg-white rounded-xl shadow-lg p-6 min-h-96">
                    {feature.id === 'threat-detection' ? (
                      <Component 
                        isAnalyzing={isAnalyzing}
                        threatData={!isAnalyzing ? feature.demoData.threatData : undefined}
                      />
                    ) : (
                      <Component {...feature.demoData} />
                    )}
                  </div>

                  {/* Mobile Context Note */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <div className="flex items-start space-x-3">
                      <Smartphone className="text-blue-500 mt-1" size={20} />
                      <div>
                        <h4 className="font-semibold text-blue-800 mb-2">
                          Mobile App Context
                        </h4>
                        <p className="text-blue-700 text-sm leading-relaxed">
                          {getMobileContext(feature.id)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </div>

      {/* Implementation Status */}
      <div className="bg-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-6">Implementation Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-green-900 p-6 rounded-lg">
                <h3 className="font-semibold mb-2">✅ Phase 1 Complete</h3>
                <p className="text-sm opacity-90">
                  Mobile foundation with 6 core screens, zero-PII architecture, and API endpoints
                </p>
              </div>
              <div className="bg-blue-900 p-6 rounded-lg">
                <h3 className="font-semibold mb-2">🔄 Phase 2 Ready</h3>
                <p className="text-sm opacity-90">
                  Advanced features previewed here, ready for mobile implementation
                </p>
              </div>
              <div className="bg-purple-900 p-6 rounded-lg">
                <h3 className="font-semibold mb-2">🚀 Future Phases</h3>
                <p className="text-sm opacity-90">
                  Native iOS/Android optimizations, offline capabilities, and ML enhancements
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const getMobileContext = (featureId: string): string => {
  switch (featureId) {
    case 'threat-detection':
      return 'In the mobile app, this visualization appears during real-time analysis of suspicious texts, calls, or emails. The animated shield provides immediate visual feedback while the AI processes the content, helping users understand their protection status at a glance.';
    case 'gamified-learning':
      return 'The mobile app includes these gamification elements integrated throughout the user experience. Users earn XP for correctly identifying scams, maintaining protection streaks, and completing daily challenges. Badge notifications appear as push notifications.';
    case 'safety-tips':
      return 'This carousel appears on the mobile home screen and adapts based on the user\'s recent scam encounters and vulnerability assessments. Tips are personalized using on-device ML to avoid sending personal data to servers.';
    case 'leaderboard':
      return 'The community leaderboard encourages users to help others while maintaining privacy. Rankings are based on anonymous contributions like scam reports and community assistance, fostering a supportive environment.';
    case 'chatbot':
      return 'The emotional support chatbot is always accessible via a floating button in the mobile app. It provides immediate comfort and guidance for users who may be scared, confused, or have fallen victim to scams, with built-in crisis resources.';
    default:
      return 'This feature will be optimized for mobile touch interactions and integrated seamlessly into the native app experience.';
  }
};

export default MobileFeaturesPreview;