import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  Phone, 
  Mail, 
  CreditCard, 
  Shield, 
  AlertTriangle,
  Heart,
  Globe,
  Lock
} from 'lucide-react';

interface SafetyTip {
  id: string;
  category: 'phone' | 'email' | 'financial' | 'romance' | 'general' | 'online';
  title: string;
  tip: string;
  action: string;
  priority: 'high' | 'medium' | 'low';
  icon: React.ComponentType<{ size?: number; className?: string }>;
  bgColor: string;
  textColor: string;
}

const SafetyTipsCarousel = ({ userVulnerabilities }: { userVulnerabilities?: string[] }) => {
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const allTips: SafetyTip[] = [
    {
      id: '1',
      category: 'phone',
      title: 'Unknown Caller Alert',
      tip: 'Never give personal information to unsolicited callers, even if they claim to be from legitimate organizations.',
      action: 'Ask for their name, company, and callback number. Hang up and call the official number yourself.',
      priority: 'high',
      icon: Phone,
      bgColor: 'from-red-500 to-pink-500',
      textColor: 'text-white'
    },
    {
      id: '2',
      category: 'email',
      title: 'Suspicious Email Links',
      tip: 'Hover over links to see the actual destination before clicking. Scammers often use fake URLs.',
      action: 'Type the website address directly in your browser instead of clicking suspicious links.',
      priority: 'high',
      icon: Mail,
      bgColor: 'from-blue-500 to-cyan-500',
      textColor: 'text-white'
    },
    {
      id: '3',
      category: 'financial',
      title: 'Payment Method Red Flag',
      tip: 'Legitimate organizations never request payment via gift cards, wire transfers, or cryptocurrency.',
      action: 'If someone asks for these payment methods, it\'s definitely a scam. Report it immediately.',
      priority: 'high',
      icon: CreditCard,
      bgColor: 'from-green-500 to-emerald-500',
      textColor: 'text-white'
    },
    {
      id: '4',
      category: 'romance',
      title: 'Online Romance Safety',
      tip: 'Be cautious of people who quickly profess love and ask for money or refuse to video chat.',
      action: 'Never send money to someone you haven\'t met in person. Use reverse image search on their photos.',
      priority: 'medium',
      icon: Heart,
      bgColor: 'from-purple-500 to-violet-500',
      textColor: 'text-white'
    },
    {
      id: '5',
      category: 'online',
      title: 'Social Media Privacy',
      tip: 'Scammers gather personal information from your social media profiles to make scams more convincing.',
      action: 'Review your privacy settings and limit what strangers can see about you.',
      priority: 'medium',
      icon: Globe,
      bgColor: 'from-orange-500 to-amber-500',
      textColor: 'text-white'
    },
    {
      id: '6',
      category: 'general',
      title: 'Trust Your Instincts',
      tip: 'If something feels too good to be true or makes you uncomfortable, trust that feeling.',
      action: 'Take time to think and research. Scammers often create urgency to prevent you from thinking clearly.',
      priority: 'medium',
      icon: Shield,
      bgColor: 'from-teal-500 to-cyan-500',
      textColor: 'text-white'
    },
    {
      id: '7',
      category: 'financial',
      title: 'Government Impersonation',
      tip: 'The IRS, Social Security, and other agencies don\'t call to demand immediate payment or threaten arrest.',
      action: 'Hang up and contact the agency directly using their official phone number.',
      priority: 'high',
      icon: AlertTriangle,
      bgColor: 'from-red-600 to-rose-600',
      textColor: 'text-white'
    },
    {
      id: '8',
      category: 'online',
      title: 'Password Protection',
      tip: 'Use unique, strong passwords for each account and enable two-factor authentication when available.',
      action: 'Consider using a password manager to generate and store secure passwords.',
      priority: 'medium',
      icon: Lock,
      bgColor: 'from-indigo-500 to-blue-500',
      textColor: 'text-white'
    }
  ];

  // Personalize tips based on user vulnerabilities
  const personalizedTips = userVulnerabilities?.length 
    ? allTips.filter(tip => userVulnerabilities.includes(tip.category))
    : allTips;

  const tips = personalizedTips.length > 0 ? personalizedTips : allTips;

  useEffect(() => {
    if (isAutoPlaying) {
      const interval = setInterval(() => {
        setCurrentTipIndex((prev) => (prev + 1) % tips.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isAutoPlaying, tips.length]);

  const nextTip = () => {
    setCurrentTipIndex((prev) => (prev + 1) % tips.length);
  };

  const prevTip = () => {
    setCurrentTipIndex((prev) => (prev - 1 + tips.length) % tips.length);
  };

  const goToTip = (index: number) => {
    setCurrentTipIndex(index);
  };

  const currentTip = tips[currentTipIndex];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Personalized Safety Tips
        </h2>
        <p className="text-gray-600">
          Daily protection insights tailored for you
        </p>
      </div>

      {/* Main Carousel */}
      <div 
        className="relative overflow-hidden rounded-2xl shadow-2xl h-96"
        onMouseEnter={() => setIsAutoPlaying(false)}
        onMouseLeave={() => setIsAutoPlaying(true)}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTip.id}
            className={`absolute inset-0 bg-gradient-to-br ${currentTip.bgColor} ${currentTip.textColor} p-8 flex flex-col justify-between`}
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -300 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <motion.div
                  className="bg-white bg-opacity-20 p-3 rounded-full"
                  whileHover={{ scale: 1.1, rotate: 10 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <currentTip.icon size={32} />
                </motion.div>
                <div>
                  <h3 className="text-2xl font-bold">{currentTip.title}</h3>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mt-1 ${
                    currentTip.priority === 'high' 
                      ? 'bg-red-500 bg-opacity-20' 
                      : currentTip.priority === 'medium'
                      ? 'bg-yellow-500 bg-opacity-20'
                      : 'bg-green-500 bg-opacity-20'
                  }`}>
                    {currentTip.priority.toUpperCase()} PRIORITY
                  </span>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1">
              <motion.div
                className="mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h4 className="text-lg font-semibold mb-3 opacity-90">What to Know:</h4>
                <p className="text-lg leading-relaxed">{currentTip.tip}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h4 className="text-lg font-semibold mb-3 opacity-90">What to Do:</h4>
                <p className="text-lg leading-relaxed bg-white bg-opacity-10 p-4 rounded-lg">
                  {currentTip.action}
                </p>
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows */}
        <button
          onClick={prevTip}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 p-2 rounded-full transition-all duration-200"
          aria-label="Previous tip"
        >
          <ChevronLeft size={24} className="text-white" />
        </button>
        
        <button
          onClick={nextTip}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 p-2 rounded-full transition-all duration-200"
          aria-label="Next tip"
        >
          <ChevronRight size={24} className="text-white" />
        </button>
      </div>

      {/* Dots Indicator */}
      <div className="flex justify-center space-x-2 mt-6">
        {tips.map((_, index) => (
          <button
            key={index}
            onClick={() => goToTip(index)}
            className={`w-3 h-3 rounded-full transition-all duration-200 ${
              index === currentTipIndex 
                ? 'bg-blue-500 scale-125' 
                : 'bg-gray-300 hover:bg-gray-400'
            }`}
            aria-label={`Go to tip ${index + 1}`}
          />
        ))}
      </div>

      {/* Progress Bar */}
      <div className="mt-4 bg-gray-200 rounded-full h-1 overflow-hidden">
        <motion.div
          className="h-full bg-blue-500"
          initial={{ width: "0%" }}
          animate={{ width: `${((currentTipIndex + 1) / tips.length) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Auto-play Toggle */}
      <div className="text-center mt-4">
        <button
          onClick={() => setIsAutoPlaying(!isAutoPlaying)}
          className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
        >
          {isAutoPlaying ? 'Pause' : 'Resume'} auto-play
        </button>
      </div>
    </div>
  );
};

export default SafetyTipsCarousel;