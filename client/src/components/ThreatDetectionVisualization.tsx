import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, AlertTriangle, CheckCircle, Zap } from 'lucide-react';

interface ThreatData {
  level: 'safe' | 'warning' | 'danger';
  score: number;
  threats: string[];
  timestamp: number;
}

const ThreatDetectionVisualization = ({ 
  threatData, 
  isAnalyzing = false 
}: { 
  threatData?: ThreatData; 
  isAnalyzing?: boolean;
}) => {
  const [pulseIntensity, setPulseIntensity] = useState(0);
  const [scanningAngle, setScanningAngle] = useState(0);

  useEffect(() => {
    if (isAnalyzing) {
      const interval = setInterval(() => {
        setScanningAngle(prev => (prev + 10) % 360);
        setPulseIntensity(prev => Math.sin(Date.now() / 200) * 0.5 + 0.5);
      }, 50);
      return () => clearInterval(interval);
    }
  }, [isAnalyzing]);

  const getVisualizationConfig = () => {
    if (!threatData || isAnalyzing) {
      return {
        color: '#3B82F6',
        bgColor: 'rgba(59, 130, 246, 0.1)',
        icon: Shield,
        status: 'Analyzing...'
      };
    }

    switch (threatData.level) {
      case 'danger':
        return {
          color: '#DC2626',
          bgColor: 'rgba(220, 38, 38, 0.1)',
          icon: AlertTriangle,
          status: 'High Risk Detected'
        };
      case 'warning':
        return {
          color: '#D97706',
          bgColor: 'rgba(217, 119, 6, 0.1)',
          icon: AlertTriangle,
          status: 'Suspicious Activity'
        };
      case 'safe':
        return {
          color: '#16A34A',
          bgColor: 'rgba(22, 163, 74, 0.1)',
          icon: CheckCircle,
          status: 'Protected'
        };
      default:
        return {
          color: '#3B82F6',
          bgColor: 'rgba(59, 130, 246, 0.1)',
          icon: Shield,
          status: 'Ready'
        };
    }
  };

  const config = getVisualizationConfig();
  const IconComponent = config.icon;

  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* Main Shield Visualization */}
      <div className="relative w-80 h-80 mx-auto">
        {/* Outer Rings */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute inset-0 rounded-full border-2"
            style={{
              borderColor: config.color,
              transform: `scale(${1 + i * 0.1})`,
            }}
            animate={{
              opacity: isAnalyzing ? [0.3, 0.7, 0.3] : 0.3,
              scale: isAnalyzing ? [1 + i * 0.1, 1.1 + i * 0.1, 1 + i * 0.1] : 1 + i * 0.1,
            }}
            transition={{
              duration: 2,
              repeat: isAnalyzing ? Infinity : 0,
              delay: i * 0.2,
            }}
          />
        ))}

        {/* Scanning Beam */}
        {isAnalyzing && (
          <motion.div
            className="absolute inset-0"
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          >
            <div
              className="absolute w-1 h-40 bg-gradient-to-t from-transparent via-blue-400 to-transparent"
              style={{
                left: '50%',
                top: '50%',
                transformOrigin: 'bottom center',
                transform: 'translateX(-50%) translateY(-100%)',
              }}
            />
          </motion.div>
        )}

        {/* Central Shield */}
        <motion.div
          className="absolute inset-16 rounded-full flex items-center justify-center"
          style={{ backgroundColor: config.bgColor }}
          animate={{
            scale: isAnalyzing ? [1, 1.05, 1] : 1,
            boxShadow: isAnalyzing 
              ? [`0 0 20px ${config.color}40`, `0 0 40px ${config.color}60`, `0 0 20px ${config.color}40`]
              : `0 0 20px ${config.color}40`,
          }}
          transition={{
            duration: 1.5,
            repeat: isAnalyzing ? Infinity : 0,
          }}
        >
          <motion.div
            animate={{
              rotate: isAnalyzing ? 360 : 0,
            }}
            transition={{
              duration: 4,
              repeat: isAnalyzing ? Infinity : 0,
              ease: "linear",
            }}
          >
            <IconComponent 
              size={80} 
              color={config.color}
              className="drop-shadow-lg"
            />
          </motion.div>
        </motion.div>

        {/* Threat Indicators */}
        {threatData && threatData.threats.length > 0 && (
          <AnimatePresence>
            {threatData.threats.slice(0, 4).map((threat, index) => (
              <motion.div
                key={threat}
                className="absolute w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold"
                style={{
                  left: `${50 + 35 * Math.cos((index * 90) * Math.PI / 180)}%`,
                  top: `${50 + 35 * Math.sin((index * 90) * Math.PI / 180)}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Zap size={16} />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Status Display */}
      <motion.div
        className="text-center mt-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h3 
          className="text-2xl font-bold mb-2"
          style={{ color: config.color }}
        >
          {config.status}
        </h3>
        
        {threatData && (
          <motion.div
            className="text-4xl font-bold mb-2"
            style={{ color: config.color }}
            animate={{
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
          >
            {threatData.score}% Safe
          </motion.div>
        )}

        {isAnalyzing && (
          <motion.div
            className="flex justify-center space-x-1 mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-blue-500 rounded-full"
                animate={{
                  y: [0, -10, 0],
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </motion.div>
        )}
      </motion.div>

      {/* Threat Details */}
      {threatData && threatData.threats.length > 0 && (
        <motion.div
          className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <h4 className="font-semibold text-red-800 mb-2">Detected Threats:</h4>
          <ul className="list-disc list-inside text-red-700 text-sm space-y-1">
            {threatData.threats.map((threat, index) => (
              <motion.li
                key={threat}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + index * 0.1 }}
              >
                {threat}
              </motion.li>
            ))}
          </ul>
        </motion.div>
      )}
    </div>
  );
};

export default ThreatDetectionVisualization;