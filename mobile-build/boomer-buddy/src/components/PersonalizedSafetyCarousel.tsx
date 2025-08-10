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

const PersonalizedSafetyCarousel: React.FC<PersonalizedSafetyCarouselProps> = ({ 
  userVulnerabilities = ['phone', 'email', 'financial'] 
}) => {
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

  // Personalize tips based on user vulnerabilities
  const personalizedTips = safetyTips.filter(tip => 
    userVulnerabilities.includes(tip.category)
  ).sort((a, b) => {
    const urgencyOrder = { high: 3, medium: 2, low: 1 };
    return urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
  });

  useEffect(() => {
    // Auto-advance carousel every 8 seconds
    const interval = setInterval(() => {
      const nextIndex = (currentIndex + 1) % personalizedTips.length;
      setCurrentIndex(nextIndex);
      
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({
          x: nextIndex * (CARD_WIDTH + 16),
          animated: true
        });
      }

      // Fade animation for smooth transition
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0.7,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }, 8000);

    return () => clearInterval(interval);
  }, [currentIndex, personalizedTips.length]);

  const onScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(contentOffsetX / (CARD_WIDTH + 16));
    setCurrentIndex(newIndex);
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return ['#EF4444', '#DC2626'];
      case 'medium': return ['#F59E0B', '#D97706'];
      case 'low': return ['#10B981', '#059669'];
      default: return ['#6B7280', '#4B5563'];
    }
  };

  const getUrgencyLabel = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'Critical';
      case 'medium': return 'Important';
      case 'low': return 'Helpful';
      default: return 'Info';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🎯 Personalized Safety Tips</Text>
        <Text style={styles.subtitle}>
          Based on your recent activity patterns
        </Text>
      </View>

      <Animated.View style={{ opacity: fadeAnim }}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled={false}
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          contentContainerStyle={styles.scrollContent}
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

      {/* Pagination Dots */}
      <View style={styles.pagination}>
        {personalizedTips.map((_, index) => (
          <View
            key={index}
            style={[
              styles.paginationDot,
              {
                backgroundColor: index === currentIndex ? '#4F46E5' : '#D1D5DB',
                transform: [{ scale: index === currentIndex ? 1.2 : 1 }],
              },
            ]}
          />
        ))}
      </View>

      {/* Vulnerability Focus */}
      <View style={styles.focusSection}>
        <Text style={styles.focusTitle}>Your Protection Focus Areas</Text>
        <View style={styles.vulnerabilityTags}>
          {userVulnerabilities.map((vulnerability) => (
            <View key={vulnerability} style={styles.vulnerabilityTag}>
              <Text style={styles.vulnerabilityText}>
                {vulnerability.charAt(0).toUpperCase() + vulnerability.slice(1)}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
  },
  header: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  tipCard: {
    width: CARD_WIDTH,
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
    alignItems: 'center',
    marginBottom: 12,
  },
  tipIcon: {
    fontSize: 32,
  },
  urgencyBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  urgencyText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  tipTitle: {
    fontSize: 18,
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
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  categoryTag: {
    fontSize: 12,
    color: 'white',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    fontWeight: '500',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  focusSection: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  focusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  vulnerabilityTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  vulnerabilityTag: {
    backgroundColor: '#EBF8FF',
    borderColor: '#60A5FA',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  vulnerabilityText: {
    fontSize: 12,
    color: '#1E40AF',
    fontWeight: '500',
  },
});

export default PersonalizedSafetyCarousel;