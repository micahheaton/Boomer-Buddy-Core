import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

interface ThreatShieldAnimationProps {
  isAnalyzing: boolean;
  threatLevel: 'safe' | 'warning' | 'danger';
}

const ThreatShieldAnimation: React.FC<ThreatShieldAnimationProps> = ({ 
  isAnalyzing, 
  threatLevel 
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isAnalyzing) {
      // Scanning animation
      const scanAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );

      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );

      scanAnimation.start();
      pulseAnimation.start();

      return () => {
        scanAnimation.stop();
        pulseAnimation.stop();
      };
    } else {
      // Threat level animation
      const alertAnimation = threatLevel === 'danger' 
        ? Animated.loop(
            Animated.sequence([
              Animated.timing(scaleAnim, {
                toValue: 1.1,
                duration: 300,
                useNativeDriver: true,
              }),
              Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
              }),
            ])
          )
        : Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          });

      const glowAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      );

      alertAnimation.start();
      if (threatLevel !== 'safe') {
        glowAnimation.start();
      }

      return () => {
        alertAnimation.stop();
        glowAnimation.stop();
      };
    }
  }, [isAnalyzing, threatLevel]);

  const getShieldColor = () => {
    switch (threatLevel) {
      case 'safe': return '#10B981';
      case 'warning': return '#F59E0B';
      case 'danger': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getGlowColor = () => {
    switch (threatLevel) {
      case 'safe': return 'rgba(16, 185, 129, 0.5)';
      case 'warning': return 'rgba(245, 158, 11, 0.5)';
      case 'danger': return 'rgba(239, 68, 68, 0.5)';
      default: return 'rgba(107, 114, 128, 0.5)';
    }
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      {/* Outer glow effect */}
      <Animated.View
        style={[
          styles.glow,
          {
            opacity: glowAnim,
            backgroundColor: getGlowColor(),
            transform: [{ scale: scaleAnim }],
          },
        ]}
      />
      
      {/* Main shield */}
      <Animated.View
        style={[
          styles.shield,
          {
            backgroundColor: getShieldColor(),
            transform: [
              { scale: pulseAnim },
              { rotate: spin },
            ],
          },
        ]}
      >
        {/* Shield pattern */}
        <View style={styles.shieldPattern}>
          <View style={[styles.shieldLine, { backgroundColor: 'rgba(255,255,255,0.3)' }]} />
          <View style={[styles.shieldLine, { backgroundColor: 'rgba(255,255,255,0.2)' }]} />
          <View style={[styles.shieldLine, { backgroundColor: 'rgba(255,255,255,0.1)' }]} />
        </View>
        
        {/* Center icon */}
        <View style={styles.centerIcon}>
          <View style={styles.checkmark} />
        </View>
      </Animated.View>

      {/* Scanning lines (only when analyzing) */}
      {isAnalyzing && (
        <Animated.View
          style={[
            styles.scanLine,
            {
              transform: [{ rotate: spin }],
            },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  glow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  shield: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  shieldPattern: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shieldLine: {
    width: '80%',
    height: 2,
    marginVertical: 2,
    borderRadius: 1,
  },
  centerIcon: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    width: 20,
    height: 10,
    borderLeftWidth: 3,
    borderBottomWidth: 3,
    borderColor: 'white',
    transform: [{ rotate: '-45deg' }],
    marginTop: -5,
  },
  scanLine: {
    position: 'absolute',
    width: 2,
    height: 60,
    backgroundColor: '#60A5FA',
    opacity: 0.8,
  },
});

export default ThreatShieldAnimation;