import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

interface ThreatShieldAnimationProps {
  isAnalyzing: boolean;
  threatLevel: 'safe' | 'warning' | 'danger';
  size?: number;
}

export default function ThreatShieldAnimation({ 
  isAnalyzing, 
  threatLevel, 
  size = 120 
}: ThreatShieldAnimationProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isAnalyzing) {
      // Scanning animation
      const rotateAnimation = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
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

      rotateAnimation.start();
      pulseAnimation.start();

      return () => {
        rotateAnimation.stop();
        pulseAnimation.stop();
      };
    } else {
      // Threat level animation
      if (threatLevel === 'danger') {
        const alertAnimation = Animated.loop(
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
        );
        alertAnimation.start();
        return () => alertAnimation.stop();
      } else {
        scaleAnim.setValue(1);
        pulseAnim.setValue(1);
        rotateAnim.setValue(0);
      }
    }
  }, [isAnalyzing, threatLevel]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const getShieldColor = () => {
    if (isAnalyzing) return '#3B82F6';
    switch (threatLevel) {
      case 'danger':
        return '#DC2626';
      case 'warning':
        return '#D97706';
      default:
        return '#059669';
    }
  };

  const getShieldIcon = () => {
    if (isAnalyzing) return '🔍';
    switch (threatLevel) {
      case 'danger':
        return '🛡️⚠️';
      case 'warning':
        return '🛡️⚡';
      default:
        return '🛡️✅';
    }
  };

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Outer pulse ring */}
      <Animated.View
        style={[
          styles.pulseRing,
          {
            width: size * 1.4,
            height: size * 1.4,
            borderColor: getShieldColor(),
            opacity: isAnalyzing ? pulseAnim.interpolate({
              inputRange: [1, 1.2],
              outputRange: [0.3, 0.1],
            }) : 0.2,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      />
      
      {/* Main shield */}
      <Animated.View
        style={[
          styles.shield,
          {
            width: size,
            height: size,
            backgroundColor: getShieldColor(),
            transform: [
              { scale: scaleAnim },
              { rotate: isAnalyzing ? rotate : '0deg' },
            ],
          },
        ]}
      >
        <View style={styles.shieldInner}>
          <View style={styles.iconContainer}>
            <Animated.Text style={[styles.shieldIcon, {
              fontSize: size * 0.4,
              transform: [{ scale: pulseAnim }],
            }]}>
              {getShieldIcon()}
            </Animated.Text>
          </View>
          
          {/* Scanning line for analysis */}
          {isAnalyzing && (
            <Animated.View
              style={[
                styles.scanLine,
                {
                  opacity: pulseAnim.interpolate({
                    inputRange: [1, 1.2],
                    outputRange: [0.8, 0.3],
                  }),
                },
              ]}
            />
          )}
        </View>
      </Animated.View>

      {/* Status indicators */}
      {threatLevel === 'danger' && !isAnalyzing && (
        <View style={styles.alertDots}>
          {[0, 1, 2].map((index) => (
            <Animated.View
              key={index}
              style={[
                styles.alertDot,
                {
                  opacity: scaleAnim.interpolate({
                    inputRange: [1, 1.1],
                    outputRange: [0.6, 1],
                  }),
                },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  pulseRing: {
    position: 'absolute',
    borderWidth: 2,
    borderRadius: 1000,
    opacity: 0.3,
  },
  shield: {
    borderRadius: 1000,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  shieldInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  shieldIcon: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  scanLine: {
    position: 'absolute',
    width: '80%',
    height: 2,
    backgroundColor: 'white',
    borderRadius: 1,
  },
  alertDots: {
    position: 'absolute',
    top: -10,
    right: -10,
    flexDirection: 'row',
    gap: 4,
  },
  alertDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FBBF24',
  },
});