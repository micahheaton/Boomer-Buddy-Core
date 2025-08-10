import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Animated } from 'react-native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 64;

interface SafetyTip {
  id: string;
  category: 'phone' | 'email' | 'financial' | 'online' | 'general';
  title: string;
  description: string;
  icon: string;
  urgency: 'low' | 'medium' | 'high';
}

interface PersonalizedSafetyCarouselProps {
  userVulnerabilities?: string[];
}

export default function PersonalizedSafetyCarousel({ 
  userVulnerabilities = ['phone', 'email', 'financial'] 
}: PersonalizedSafetyCarouselProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const safetyTips: SafetyTip[] = [
    {
      id: '1',
      category: 'phone',
      title: 'Never Give SSN Over Phone',
      description: 'Legitimate organizations already have your Social Security number. They will never call asking for it.',
      icon: '📞',
      urgency: 'high'
    },
    {
      id: '2',
      category: 'email',
      title: 'Check Email Sender Carefully',
      description: 'Scammers use addresses like "amazon-security@gmail.com" instead of official domains.',
      icon: '📧',
      urgency: 'high'
    },
    {
      id: '3',
      category: 'financial',
      title: 'Banks Never Ask for Passwords',
      description: 'Your bank will never call, email, or text asking for your password or PIN.',
      icon: '🏦',
      urgency: 'high'
    },
    {
      id: '4',
      category: 'phone',
      title: 'Hang Up and Call Back',
      description: 'If someone claims to be from a company, hang up and call the official number yourself.',
      icon: '☎️',
      urgency: 'medium'
    },
    {
      id: '5',
      category: 'online',
      title: 'URLs Can Be Misleading',
      description: 'Check the address bar carefully. "microsaft.com" is not "microsoft.com".',
      icon: '🌐',
      urgency: 'medium'
    },
    {
      id: '6',
      category: 'financial',
      title: 'Gift Cards Are Not Payment',
      description: 'No legitimate business accepts iTunes, Google Play, or other gift cards as payment.',
      icon: '🎁',
      urgency: 'high'
    }
  ];

  // Filter and sort tips based on user vulnerabilities
  const personalizedTips = safetyTips
    .filter(tip => userVulnerabilities.includes(tip.category))
    .sort((a, b) => {
      const urgencyOrder = { high: 3, medium: 2, low: 1 };
      return urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
    });

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % personalizedTips.length;
        
        // Animate scroll to next card
        scrollViewRef.current?.scrollTo({
          x: nextIndex * (CARD_WIDTH + 16),
          animated: true,
        });
        
        return nextIndex;
      });
    }, 8000); // Auto-scroll every 8 seconds

    return () => clearInterval(interval);
  }, [personalizedTips.length]);

  const getUrgencyColor = (urgency: 'low' | 'medium' | 'high'): string[] => {
    switch (urgency) {
      case 'high':
        return ['#DC2626', '#B91C1C'];
      case 'medium':
        return ['#D97706', '#B45309'];
      case 'low':
        return ['#059669', '#047857'];
      default:
        return ['#6B7280', '#4B5563'];
    }
  };

  const getUrgencyLabel = (urgency: 'low' | 'medium' | 'high'): string => {
    switch (urgency) {
      case 'high':
        return 'CRITICAL';
      case 'medium':
        return 'IMPORTANT';
      case 'low':
        return 'TIP';
      default:
        return 'INFO';
    }
  };

  if (personalizedTips.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>💡 Safety Tips for You</Text>
      <Text style={styles.subtitle}>
        Based on your vulnerability profile
      </Text>
      
      <Animated.View style={[styles.carouselContainer, { opacity: fadeAnim }]}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          snapToInterval={CARD_WIDTH + 16}
          decelerationRate="fast"
        >
          {personalizedTips.map((tip, index) => (
            <View key={tip.id} style={[styles.tipCard, { backgroundColor: getUrgencyColor(tip.urgency)[0] }]}>
              <View style={styles.tipContent}>
                <View style={styles.tipHeader}>
                  <Text style={styles.tipIcon}>{tip.icon}</Text>
                  <View style={styles.urgencyBadge}>
                    <Text style={styles.urgencyText}>
                      {getUrgencyLabel(tip.urgency)}
                    </Text>
                  </View>
                </View>

                <Text style={styles.tipTitle}>{tip.title}</Text>
                <Text style={styles.tipDescription}>{tip.description}</Text>

                <View style={styles.tipFooter}>
                  <Text style={styles.categoryTag}>
                    {tip.category.charAt(0).toUpperCase() + tip.category.slice(1)} Safety
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      </Animated.View>

      {/* Dot indicators */}
      <View style={styles.dotsContainer}>
        {personalizedTips.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor: index === currentIndex ? '#1F2937' : '#D1D5DB',
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
    paddingHorizontal: 16,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  carouselContainer: {
    marginBottom: 16,
  },
  tipCard: {
    width: CARD_WIDTH,
    marginHorizontal: 8,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  tipContent: {
    padding: 20,
    minHeight: 160,
  },
  tipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tipIcon: {
    fontSize: 32,
  },
  urgencyBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  urgencyText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  tipDescription: {
    fontSize: 14,
    color: 'white',
    opacity: 0.9,
    lineHeight: 20,
    flex: 1,
  },
  tipFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  categoryTag: {
    fontSize: 12,
    color: 'white',
    opacity: 0.8,
    fontWeight: '500',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});