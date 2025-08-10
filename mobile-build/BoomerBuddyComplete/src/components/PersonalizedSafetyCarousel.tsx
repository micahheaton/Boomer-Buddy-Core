import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, Animated, Dimensions, PanGestureHandler } from 'react-native';
import { PersonalizedTip } from '../services/AdvancedAnalysisEngine';
import { StorageService } from '../services/StorageService';

interface SafetyCarouselProps {
  tips?: PersonalizedTip[];
  onTipViewed?: (tipId: string) => void;
  onActionTaken?: (tipId: string, action: string) => void;
}

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = screenWidth - 40;
const CARD_SPACING = 20;

export const PersonalizedSafetyCarousel: React.FC<SafetyCarouselProps> = ({
  tips: externalTips,
  onTipViewed,
  onActionTaken
}) => {
  const [tips, setTips] = useState<PersonalizedTip[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const scrollViewRef = useRef<ScrollView>(null);
  const [cardAnimations] = useState(() => 
    Array.from({ length: 10 }, () => new Animated.Value(0))
  );
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(true);
  const autoPlayTimer = useRef<NodeJS.Timeout>();

  const storageService = new StorageService();

  useEffect(() => {
    if (externalTips) {
      setTips(externalTips);
      setLoading(false);
    } else {
      loadPersonalizedTips();
    }
  }, [externalTips]);

  useEffect(() => {
    if (tips.length > 0) {
      animateCards();
      if (autoPlayEnabled) {
        startAutoPlay();
      }
    }
    
    return () => {
      if (autoPlayTimer.current) {
        clearInterval(autoPlayTimer.current);
      }
    };
  }, [tips, currentIndex, autoPlayEnabled]);

  const loadPersonalizedTips = async () => {
    try {
      // Load user's vulnerability pattern and history
      const userHistory = await storageService.getUserAnalysisHistory();
      const userPreferences = await storageService.getUserPreferences();
      
      // Generate personalized tips based on user data
      const personalizedTips = await generatePersonalizedTips(userHistory, userPreferences);
      setTips(personalizedTips);
    } catch (error) {
      console.error('Failed to load personalized tips:', error);
      // Fallback to default tips
      setTips(getDefaultTips());
    } finally {
      setLoading(false);
    }
  };

  const generatePersonalizedTips = async (history: any[], preferences: any): Promise<PersonalizedTip[]> => {
    // Analyze user's recent interactions to determine vulnerabilities
    const vulnerabilities = analyzeVulnerabilities(history);
    const tipPool = getAllAvailableTips();
    
    // Score and rank tips based on user's specific needs
    const scoredTips = tipPool.map(tip => ({
      ...tip,
      relevanceScore: calculateRelevanceScore(tip, vulnerabilities, preferences)
    }));
    
    // Sort by relevance and return top tips
    return scoredTips
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 8)
      .map(({ relevanceScore, ...tip }) => tip);
  };

  const analyzeVulnerabilities = (history: any[]): any => {
    const recentAnalyses = history.slice(-20); // Last 20 analyses
    
    return {
      phoneScamsSusceptibility: calculatePhoneScamSusceptibility(recentAnalyses),
      emailThreatExposure: calculateEmailThreatExposure(recentAnalyses),
      financialScamRisk: calculateFinancialScamRisk(recentAnalyses),
      urgencyManipulationVulnerability: calculateUrgencyVulnerability(recentAnalyses),
      authorityImpersonationRisk: calculateAuthorityRisk(recentAnalyses),
      timeOfDayPatterns: calculateTimePatterns(recentAnalyses),
      emotionalStateIndicators: calculateEmotionalIndicators(recentAnalyses)
    };
  };

  const calculatePhoneScamSusceptibility = (analyses: any[]): number => {
    const phoneAnalyses = analyses.filter(a => a.type === 'call');
    const suspiciousPhoneCalls = phoneAnalyses.filter(a => a.result.level !== 'safe');
    
    if (phoneAnalyses.length === 0) return 0.3; // Default moderate risk
    
    const suspiciousRatio = suspiciousPhoneCalls.length / phoneAnalyses.length;
    const recentSuspiciousCount = suspiciousPhoneCalls.filter(a => 
      Date.now() - a.timestamp < 7 * 24 * 60 * 60 * 1000 // Last 7 days
    ).length;
    
    return Math.min(suspiciousRatio + (recentSuspiciousCount * 0.1), 1.0);
  };

  const calculateEmailThreatExposure = (analyses: any[]): number => {
    const emailAnalyses = analyses.filter(a => a.type === 'email');
    const phishingAttempts = emailAnalyses.filter(a => 
      a.result.threats?.some((t: string) => 
        t.toLowerCase().includes('phishing') || t.toLowerCase().includes('link')
      )
    );
    
    return emailAnalyses.length > 0 ? phishingAttempts.length / emailAnalyses.length : 0.2;
  };

  const calculateFinancialScamRisk = (analyses: any[]): number => {
    const financialThreats = analyses.filter(a =>
      a.result.threats?.some((t: string) =>
        t.toLowerCase().includes('payment') || 
        t.toLowerCase().includes('money') ||
        t.toLowerCase().includes('bank')
      )
    );
    
    return Math.min(financialThreats.length * 0.15, 1.0);
  };

  const calculateUrgencyVulnerability = (analyses: any[]): number => {
    const urgencyThreats = analyses.filter(a =>
      a.result.threats?.some((t: string) =>
        t.toLowerCase().includes('urgent') || 
        t.toLowerCase().includes('immediate') ||
        t.toLowerCase().includes('expires')
      )
    );
    
    return Math.min(urgencyThreats.length * 0.12, 1.0);
  };

  const calculateAuthorityRisk = (analyses: any[]): number => {
    const authorityImpersonation = analyses.filter(a =>
      a.result.threats?.some((t: string) =>
        t.toLowerCase().includes('government') || 
        t.toLowerCase().includes('irs') ||
        t.toLowerCase().includes('social security')
      )
    );
    
    return Math.min(authorityImpersonation.length * 0.2, 1.0);
  };

  const calculateTimePatterns = (analyses: any[]): any => {
    const timeDistribution = analyses.reduce((acc, a) => {
      const hour = new Date(a.timestamp).getHours();
      const timeSlot = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
      acc[timeSlot] = (acc[timeSlot] || 0) + 1;
      return acc;
    }, {});
    
    return timeDistribution;
  };

  const calculateEmotionalIndicators = (analyses: any[]): any => {
    // Analyze patterns that might indicate emotional vulnerability
    const stressIndicators = analyses.filter(a =>
      a.result.confidence < 0.7 || // User seemed uncertain
      a.timestamp % (24 * 60 * 60 * 1000) > 22 * 60 * 60 * 1000 // Late night analyses
    );
    
    return {
      stressLevel: Math.min(stressIndicators.length / Math.max(analyses.length, 1), 1.0),
      uncertaintyLevel: analyses.filter(a => a.result.confidence < 0.5).length / Math.max(analyses.length, 1)
    };
  };

  const calculateRelevanceScore = (tip: PersonalizedTip, vulnerabilities: any, preferences: any): number => {
    let score = 0;
    
    // Base priority score
    switch (tip.priority) {
      case 'high': score += 3; break;
      case 'medium': score += 2; break;
      case 'low': score += 1; break;
    }
    
    // Vulnerability-specific scoring
    switch (tip.category) {
      case 'phone':
        score += vulnerabilities.phoneScamsSusceptibility * 5;
        break;
      case 'email':
        score += vulnerabilities.emailThreatExposure * 5;
        break;
      case 'financial':
        score += vulnerabilities.financialScamRisk * 6;
        break;
      case 'general':
        score += vulnerabilities.urgencyManipulationVulnerability * 4;
        break;
    }
    
    // Time-of-day relevance
    const currentHour = new Date().getHours();
    if (tip.category === 'phone' && currentHour >= 9 && currentHour <= 17) {
      score += 1; // Phone scams often during business hours
    }
    
    // User preferences
    if (preferences?.preferredCategories?.includes(tip.category)) {
      score += 2;
    }
    
    return score;
  };

  const getAllAvailableTips = (): PersonalizedTip[] => {
    return [
      {
        id: 'phone_verification',
        category: 'phone',
        title: 'Caller Verification Protocol',
        content: 'When someone calls claiming to be from a legitimate organization, never give personal information immediately. Legitimate companies will understand if you want to verify their identity.',
        actionable: 'Ask for their name, department, and a callback number. Then hang up and call the organization directly using a number you find independently.',
        priority: 'high',
        personalizedReason: 'Based on your phone interaction patterns'
      },
      {
        id: 'email_link_safety',
        category: 'email',
        title: 'Link Verification Technique',
        content: 'Hover over links in emails to see the actual destination URL before clicking. Scammers often use misleading link text that appears legitimate.',
        actionable: 'Instead of clicking links in emails, manually type the website address in your browser or use a bookmark.',
        priority: 'high',
        personalizedReason: 'You\'ve received several suspicious emails recently'
      },
      {
        id: 'payment_red_flags',
        category: 'financial',
        title: 'Payment Method Warning Signs',
        content: 'Legitimate organizations never ask for payment via gift cards, wire transfers, or cryptocurrency. These are always signs of a scam.',
        actionable: 'If someone requests these payment methods, immediately end the conversation and report it as a scam.',
        priority: 'high',
        personalizedReason: 'Financial scam attempts targeting your demographic are increasing'
      },
      {
        id: 'urgency_resistance',
        category: 'general',
        title: 'Urgency Pressure Tactics',
        content: 'Scammers create false urgency to prevent you from thinking clearly or consulting others. Legitimate issues rarely require immediate action.',
        actionable: 'When faced with urgent demands, take a break, think it over, and consult with someone you trust before taking any action.',
        priority: 'medium',
        personalizedReason: 'You\'ve encountered several urgency-based manipulation attempts'
      },
      {
        id: 'authority_impersonation',
        category: 'general',
        title: 'Government Impersonation Red Flags',
        content: 'Government agencies like the IRS, Social Security Administration, and Medicare rarely initiate contact by phone. They typically communicate through official mail.',
        actionable: 'If someone claims to be from a government agency, hang up and contact the agency directly using official phone numbers from their website.',
        priority: 'high',
        personalizedReason: 'Government impersonation scams are targeting people in your area'
      },
      {
        id: 'romance_scam_awareness',
        category: 'romance',
        title: 'Online Relationship Safety',
        content: 'Be cautious of online relationships that progress very quickly to declarations of love, especially if the person asks for money or refuses to meet in person.',
        actionable: 'Never send money to someone you\'ve never met in person. Use reverse image search to check if their photos appear elsewhere online.',
        priority: 'medium',
        personalizedReason: 'Romance scams often target people seeking companionship'
      },
      {
        id: 'social_media_privacy',
        category: 'online',
        title: 'Social Media Information Security',
        content: 'Scammers gather personal information from social media profiles to make their scams more convincing and personalized.',
        actionable: 'Review your privacy settings regularly and limit what personal information is visible to strangers.',
        priority: 'medium',
        personalizedReason: 'Your online presence may be providing information to scammers'
      },
      {
        id: 'trust_instincts',
        category: 'general',
        title: 'Trusting Your Gut Feelings',
        content: 'If something feels too good to be true or makes you uncomfortable, trust that feeling. Your instincts are often right about potential threats.',
        actionable: 'When in doubt, step back, take time to research, and ask for advice from family or friends you trust.',
        priority: 'medium',
        personalizedReason: 'Building confidence in your natural protective instincts'
      }
    ];
  };

  const getDefaultTips = (): PersonalizedTip[] => {
    return getAllAvailableTips().slice(0, 5);
  };

  const animateCards = () => {
    cardAnimations.forEach((anim, index) => {
      const delay = index * 100;
      
      Animated.spring(anim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        delay,
        useNativeDriver: true,
      }).start();
    });
  };

  const startAutoPlay = () => {
    if (autoPlayTimer.current) {
      clearInterval(autoPlayTimer.current);
    }
    
    autoPlayTimer.current = setInterval(() => {
      if (tips.length > 1) {
        const nextIndex = (currentIndex + 1) % tips.length;
        goToTip(nextIndex);
      }
    }, 5000);
  };

  const stopAutoPlay = () => {
    if (autoPlayTimer.current) {
      clearInterval(autoPlayTimer.current);
    }
    setAutoPlayEnabled(false);
  };

  const goToTip = (index: number) => {
    setCurrentIndex(index);
    
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        x: index * (CARD_WIDTH + CARD_SPACING),
        animated: true,
      });
    }
    
    // Track tip view
    if (onTipViewed && tips[index]) {
      onTipViewed(tips[index].id);
    }
  };

  const handleScroll = (event: any) => {
    const scrollX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(scrollX / (CARD_WIDTH + CARD_SPACING));
    
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < tips.length) {
      setCurrentIndex(newIndex);
      
      if (onTipViewed && tips[newIndex]) {
        onTipViewed(tips[newIndex].id);
      }
    }
  };

  const handleActionPress = (tipId: string, action: string) => {
    if (onActionTaken) {
      onActionTaken(tipId, action);
    }
    
    // You could implement specific actions here
    switch (action) {
      case 'bookmark':
        // Save tip for later
        break;
      case 'share':
        // Share tip with family/friends
        break;
      case 'more_info':
        // Navigate to detailed explanation
        break;
    }
  };

  const renderTipCard = (tip: PersonalizedTip, index: number) => {
    const cardAnimation = cardAnimations[index] || new Animated.Value(1);
    
    return (
      <Animated.View
        key={tip.id}
        style={{
          width: CARD_WIDTH,
          marginHorizontal: CARD_SPACING / 2,
          backgroundColor: 'white',
          borderRadius: 16,
          padding: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4,
          transform: [{
            scale: cardAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [0.8, 1],
            })
          }, {
            translateY: cardAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [50, 0],
            })
          }],
          opacity: cardAnimation,
        }}
      >
        {/* Priority Indicator */}
        <View style={{
          position: 'absolute',
          top: 16,
          right: 16,
          paddingHorizontal: 8,
          paddingVertical: 4,
          backgroundColor: tip.priority === 'high' ? '#DC2626' : 
                          tip.priority === 'medium' ? '#D97706' : '#16A34A',
          borderRadius: 12,
        }}>
          <View style={{
            fontSize: 12,
            color: 'white',
            fontWeight: '600',
          }}>
            {tip.priority.toUpperCase()}
          </View>
        </View>

        {/* Category Icon */}
        <View style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: getCategoryColor(tip.category),
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 16,
        }}>
          <View style={{
            fontSize: 24,
          }}>
            {getCategoryIcon(tip.category)}
          </View>
        </View>

        {/* Content */}
        <View style={{
          fontSize: 20,
          fontWeight: 'bold',
          color: '#1F2937',
          marginBottom: 12,
        }}>
          {tip.title}
        </View>

        <View style={{
          fontSize: 16,
          color: '#4B5563',
          lineHeight: 24,
          marginBottom: 16,
        }}>
          {tip.content}
        </View>

        {/* Actionable Advice */}
        <View style={{
          backgroundColor: '#F3F4F6',
          borderRadius: 8,
          padding: 12,
          marginBottom: 16,
        }}>
          <View style={{
            fontSize: 14,
            fontWeight: '600',
            color: '#374151',
            marginBottom: 4,
          }}>
            What to do:
          </View>
          <View style={{
            fontSize: 14,
            color: '#4B5563',
            lineHeight: 20,
          }}>
            {tip.actionable}
          </View>
        </View>

        {/* Personalization Note */}
        <View style={{
          fontSize: 12,
          color: '#6B7280',
          fontStyle: 'italic',
          marginBottom: 16,
        }}>
          {tip.personalizedReason}
        </View>

        {/* Action Buttons */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
        }}>
          <View
            style={{
              flex: 1,
              marginRight: 8,
              paddingVertical: 8,
              backgroundColor: '#F3F4F6',
              borderRadius: 8,
              alignItems: 'center',
            }}
            onTouchEnd={() => handleActionPress(tip.id, 'bookmark')}
          >
            <View style={{
              fontSize: 14,
              color: '#4B5563',
              fontWeight: '500',
            }}>
              Save for Later
            </View>
          </View>
          
          <View
            style={{
              flex: 1,
              marginLeft: 8,
              paddingVertical: 8,
              backgroundColor: '#3B82F6',
              borderRadius: 8,
              alignItems: 'center',
            }}
            onTouchEnd={() => handleActionPress(tip.id, 'share')}
          >
            <View style={{
              fontSize: 14,
              color: 'white',
              fontWeight: '500',
            }}>
              Share Tip
            </View>
          </View>
        </View>
      </Animated.View>
    );
  };

  const getCategoryColor = (category: string): string => {
    const colors: { [key: string]: string } = {
      phone: '#EF4444',
      email: '#3B82F6',
      financial: '#10B981',
      romance: '#F59E0B',
      general: '#6B7280',
      online: '#8B5CF6',
    };
    return colors[category] || '#6B7280';
  };

  const getCategoryIcon = (category: string): string => {
    const icons: { [key: string]: string } = {
      phone: '📞',
      email: '📧',
      financial: '💳',
      romance: '💕',
      general: '🛡️',
      online: '🌐',
    };
    return icons[category] || '⚠️';
  };

  if (loading) {
    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
      }}>
        <View style={{
          fontSize: 16,
          color: '#6B7280',
        }}>
          Personalizing your safety tips...
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Header */}
      <View style={{
        padding: 20,
        backgroundColor: 'white',
      }}>
        <View style={{
          fontSize: 24,
          fontWeight: 'bold',
          color: '#1F2937',
          marginBottom: 4,
        }}>
          Your Safety Tips
        </View>
        <View style={{
          fontSize: 16,
          color: '#6B7280',
        }}>
          Personalized protection insights
        </View>
      </View>

      {/* Carousel */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + CARD_SPACING}
        snapToAlignment="start"
        contentInset={{ left: 20, right: 20 }}
        contentContainerStyle={{ paddingHorizontal: 10 }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onTouchStart={stopAutoPlay}
      >
        {tips.map((tip, index) => renderTipCard(tip, index))}
      </ScrollView>

      {/* Page Indicators */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 20,
      }}>
        {tips.map((_, index) => (
          <View
            key={index}
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: index === currentIndex ? '#3B82F6' : '#D1D5DB',
              marginHorizontal: 4,
            }}
            onTouchEnd={() => goToTip(index)}
          />
        ))}
      </View>

      {/* Auto-play Toggle */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 20,
      }}>
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 8,
            backgroundColor: autoPlayEnabled ? '#3B82F6' : '#6B7280',
            borderRadius: 20,
          }}
          onTouchEnd={() => {
            setAutoPlayEnabled(!autoPlayEnabled);
            if (!autoPlayEnabled) {
              startAutoPlay();
            }
          }}
        >
          <View style={{
            fontSize: 14,
            color: 'white',
            fontWeight: '500',
          }}>
            {autoPlayEnabled ? 'Auto-play On' : 'Auto-play Off'}
          </View>
        </View>
      </View>
    </View>
  );
};