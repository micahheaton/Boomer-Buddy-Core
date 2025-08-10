import React, { useState, useEffect } from 'react';
import { View, Animated, Easing } from 'react-native';
import Svg, { Circle, Path, G, Defs, RadialGradient, Stop } from 'react-native-svg';
import { ThreatVisualizationData, AnalysisStep } from '../services/AdvancedAnalysisEngine';

interface ThreatVisualizationProps {
  data?: ThreatVisualizationData;
  isAnalyzing: boolean;
  onAnalysisComplete?: () => void;
}

export const ThreatVisualization: React.FC<ThreatVisualizationProps> = ({
  data,
  isAnalyzing,
  onAnalysisComplete
}) => {
  const [pulseAnim] = useState(new Animated.Value(0));
  const [scanRotation] = useState(new Animated.Value(0));
  const [shieldScale] = useState(new Animated.Value(1));
  const [threatIndicators] = useState(new Animated.Value(0));

  useEffect(() => {
    if (isAnalyzing) {
      startAnalysisAnimation();
    } else {
      stopAnalysisAnimation();
      if (data) {
        startResultAnimation();
      }
    }
  }, [isAnalyzing, data]);

  const startAnalysisAnimation = () => {
    // Pulsing effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Scanning rotation
    Animated.loop(
      Animated.timing(scanRotation, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  };

  const stopAnalysisAnimation = () => {
    pulseAnim.stopAnimation();
    scanRotation.stopAnimation();
  };

  const startResultAnimation = () => {
    if (!data) return;

    // Shield response animation
    const targetScale = data.level === 'danger' ? 1.2 : data.level === 'warning' ? 1.1 : 1.0;
    
    Animated.spring(shieldScale, {
      toValue: targetScale,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();

    // Threat indicators animation
    if (data.threats.length > 0) {
      Animated.stagger(200, 
        data.threats.slice(0, 4).map(() =>
          Animated.spring(threatIndicators, {
            toValue: 1,
            tension: 80,
            friction: 8,
            useNativeDriver: true,
          })
        )
      ).start();
    }

    if (onAnalysisComplete) {
      setTimeout(onAnalysisComplete, 1000);
    }
  };

  const getShieldColor = () => {
    if (!data || isAnalyzing) return '#3B82F6'; // Blue for analyzing
    
    switch (data.level) {
      case 'danger': return '#DC2626'; // Red
      case 'warning': return '#D97706'; // Orange
      case 'safe': return '#16A34A'; // Green
      default: return '#3B82F6'; // Blue
    }
  };

  const getScanOpacity = () => {
    return isAnalyzing ? 0.7 : 0;
  };

  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.1],
  });

  const scanRotate = scanRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const renderShield = () => {
    const shieldPath = "M150 50 L120 70 L120 130 C120 160 135 185 150 200 C165 185 180 160 180 130 L180 70 Z";
    const color = getShieldColor();

    return (
      <Svg width="300" height="300" viewBox="0 0 300 300">
        <Defs>
          <RadialGradient id="shieldGradient" cx="50%" cy="30%">
            <Stop offset="0%" stopColor={color} stopOpacity="0.8" />
            <Stop offset="100%" stopColor={color} stopOpacity="0.3" />
          </RadialGradient>
        </Defs>
        
        {/* Outer ring */}
        <Circle
          cx="150"
          cy="150"
          r="140"
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeOpacity="0.3"
        />
        
        {/* Middle ring */}
        <Circle
          cx="150"
          cy="150"
          r="120"
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeOpacity="0.5"
        />
        
        {/* Scanning beam */}
        {isAnalyzing && (
          <G origin="150,150">
            <Path
              d="M150 150 L150 30 L155 30 L150 150 Z"
              fill={color}
              fillOpacity={getScanOpacity()}
            />
          </G>
        )}
        
        {/* Main shield */}
        <Path
          d={shieldPath}
          fill="url(#shieldGradient)"
          stroke={color}
          strokeWidth="3"
        />
        
        {/* Inner glow effect for analysis */}
        {isAnalyzing && (
          <Circle
            cx="150"
            cy="150"
            r="100"
            fill={color}
            fillOpacity="0.1"
          />
        )}
      </Svg>
    );
  };

  const renderThreatIndicators = () => {
    if (!data || !data.threats.length) return null;

    const positions = [
      { x: 220, y: 80 },   // Top right
      { x: 80, y: 80 },    // Top left  
      { x: 220, y: 220 },  // Bottom right
      { x: 80, y: 220 },   // Bottom left
    ];

    return data.threats.slice(0, 4).map((threat, index) => {
      const pos = positions[index];
      
      return (
        <Animated.View
          key={`threat-${index}`}
          style={{
            position: 'absolute',
            left: pos.x - 15,
            top: pos.y - 15,
            width: 30,
            height: 30,
            backgroundColor: '#DC2626',
            borderRadius: 15,
            justifyContent: 'center',
            alignItems: 'center',
            transform: [{ scale: threatIndicators }],
          }}
        >
          {/* Threat indicator icon would go here */}
        </Animated.View>
      );
    });
  };

  const renderAnalysisSteps = () => {
    if (!isAnalyzing || !data?.analysisSteps) return null;

    return (
      <View style={{
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 10,
        padding: 15,
      }}>
        {data.analysisSteps.map((step, index) => (
          <View key={index} style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 8,
          }}>
            <View style={{
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: step.status === 'complete' ? '#16A34A' : 
                              step.status === 'processing' ? '#D97706' : '#6B7280',
              marginRight: 10,
            }} />
            <View style={{ flex: 1 }}>
              <View style={{ 
                fontSize: 14, 
                fontWeight: '500',
                color: '#374151' 
              }}>
                {step.step}
              </View>
              {step.result && (
                <View style={{ 
                  fontSize: 12, 
                  color: '#6B7280',
                  marginTop: 2 
                }}>
                  {step.result}
                </View>
              )}
            </View>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={{
      width: 350,
      height: 350,
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
    }}>
      <Animated.View
        style={{
          transform: [
            { scale: isAnalyzing ? pulseScale : shieldScale },
            ...(isAnalyzing ? [{ rotate: scanRotate }] : []),
          ],
        }}
      >
        {renderShield()}
      </Animated.View>
      
      {renderThreatIndicators()}
      {renderAnalysisSteps()}
      
      {/* Status display */}
      <View style={{
        position: 'absolute',
        bottom: 100,
        alignItems: 'center',
      }}>
        <View style={{
          fontSize: 24,
          fontWeight: 'bold',
          color: getShieldColor(),
          marginBottom: 8,
        }}>
          {isAnalyzing ? 'Analyzing...' : 
           data ? `${data.score}% Safe` : 'Ready'}
        </View>
        
        {data && !isAnalyzing && (
          <View style={{
            fontSize: 16,
            color: '#6B7280',
          }}>
            Confidence: {Math.round(data.confidence * 100)}%
          </View>
        )}
      </View>
    </View>
  );
};