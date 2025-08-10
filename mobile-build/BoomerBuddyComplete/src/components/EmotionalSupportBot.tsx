import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, Animated, Keyboard } from 'react-native';
import { StorageService } from '../services/StorageService';

interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  message: string;
  timestamp: Date;
  emotion?: 'supportive' | 'concerned' | 'celebratory' | 'informative';
  actions?: ChatAction[];
  metadata?: {
    confidence?: number;
    responseTime?: number;
    category?: string;
  };
}

interface ChatAction {
  id: string;
  label: string;
  type: 'resource' | 'emergency' | 'report' | 'learn' | 'navigation';
  action: () => void;
  style?: 'primary' | 'secondary' | 'warning' | 'success';
}

interface EmotionalSupportBotProps {
  isVisible: boolean;
  onClose: () => void;
  onNavigateToResource?: (resource: string) => void;
  onEmergencyAction?: (actionType: string) => void;
  initialContext?: 'general' | 'scam_victim' | 'confused' | 'verification';
}

export const EmotionalSupportBot: React.FC<EmotionalSupportBotProps> = ({
  isVisible,
  onClose,
  onNavigateToResource,
  onEmergencyAction,
  initialContext = 'general'
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [userMood, setUserMood] = useState<'calm' | 'worried' | 'confused' | 'upset'>('calm');
  const [sessionId] = useState(() => `session_${Date.now()}`);
  
  // Animations
  const [slideAnim] = useState(new Animated.Value(0));
  const [messageAnimations] = useState<Map<string, Animated.Value>>(new Map());
  const [typingDotsAnim] = useState(new Animated.Value(0));
  
  const scrollViewRef = useRef<ScrollView>(null);
  const storageService = new StorageService();

  useEffect(() => {
    if (isVisible) {
      showBot();
      initializeConversation();
    } else {
      hideBot();
    }
  }, [isVisible]);

  useEffect(() => {
    if (isTyping) {
      animateTypingDots();
    }
  }, [isTyping]);

  const showBot = () => {
    Animated.spring(slideAnim, {
      toValue: 1,
      tension: 50,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const hideBot = () => {
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 50,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const animateTypingDots = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(typingDotsAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(typingDotsAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const initializeConversation = async () => {
    const welcomeMessage = await generateWelcomeMessage(initialContext);
    await addBotMessage(welcomeMessage.message, welcomeMessage.emotion, welcomeMessage.actions);
  };

  const generateWelcomeMessage = async (context: string) => {
    const userHistory = await storageService.getUserAnalysisHistory();
    const recentVictimizations = userHistory.filter(h => 
      h.result.level === 'danger' && 
      Date.now() - h.timestamp < 24 * 60 * 60 * 1000
    );

    switch (context) {
      case 'scam_victim':
        return {
          message: "I'm so sorry this happened to you. You're not alone, and what happened is not your fault. I'm here to help you through this. Take a deep breath - you've taken the right step by reaching out. How are you feeling right now?",
          emotion: 'concerned' as const,
          actions: [
            {
              id: 'immediate_help',
              label: 'I need immediate help',
              type: 'emergency' as const,
              action: () => handleEmergencyHelp(),
              style: 'warning' as const
            },
            {
              id: 'report_scam',
              label: 'Help me report this',
              type: 'report' as const,
              action: () => handleReportScam(),
              style: 'primary' as const
            },
            {
              id: 'emotional_support',
              label: 'I just need to talk',
              type: 'resource' as const,
              action: () => handleEmotionalSupport(),
              style: 'secondary' as const
            }
          ]
        };

      case 'confused':
        return {
          message: "I understand that dealing with potential scams can be confusing and overwhelming. That's completely normal, and you're being smart by staying alert. I'm here to help you make sense of things. What's concerning you?",
          emotion: 'supportive' as const,
          actions: [
            {
              id: 'analyze_suspicious',
              label: 'Analyze something suspicious',
              type: 'resource' as const,
              action: () => navigateToAnalysis(),
              style: 'primary' as const
            },
            {
              id: 'safety_tips',
              label: 'Show me safety tips',
              type: 'learn' as const,
              action: () => showSafetyTips(),
              style: 'secondary' as const
            },
            {
              id: 'talk_through',
              label: 'Talk through my concerns',
              type: 'resource' as const,
              action: () => handleConcernDiscussion(),
              style: 'secondary' as const
            }
          ]
        };

      case 'verification':
        return {
          message: "Great thinking asking for verification! This shows you're being appropriately cautious. I can help you determine if something is legitimate or suspicious. What would you like me to help you verify?",
          emotion: 'supportive' as const,
          actions: [
            {
              id: 'verify_caller',
              label: 'Verify a phone call',
              type: 'learn' as const,
              action: () => handleCallerVerification(),
              style: 'primary' as const
            },
            {
              id: 'verify_email',
              label: 'Check an email',
              type: 'learn' as const,
              action: () => handleEmailVerification(),
              style: 'primary' as const
            },
            {
              id: 'verify_website',
              label: 'Verify a website',
              type: 'learn' as const,
              action: () => handleWebsiteVerification(),
              style: 'primary' as const
            }
          ]
        };

      default:
        if (recentVictimizations.length > 0) {
          return {
            message: "Hello! I'm Buddy, your personal safety companion. I noticed you've had some recent encounters with potential scams. I'm here to provide support and help you feel more secure. How are you feeling today?",
            emotion: 'concerned' as const,
            actions: [
              {
                id: 'feeling_shaken',
                label: 'I\'m feeling shaken',
                type: 'resource' as const,
                action: () => handleUserMood('upset'),
                style: 'warning' as const
              },
              {
                id: 'want_prevention',
                label: 'Help me prevent future scams',
                type: 'learn' as const,
                action: () => handlePreventionFocus(),
                style: 'primary' as const
              },
              {
                id: 'feeling_better',
                label: 'I\'m feeling more confident',
                type: 'resource' as const,
                action: () => handleUserMood('calm'),
                style: 'success' as const
              }
            ]
          };
        } else {
          return {
            message: "Hello! I'm Buddy, your personal safety companion. I'm here to help you feel safe and supported in your digital life. How are you feeling today?",
            emotion: 'supportive' as const,
            actions: [
              {
                id: 'feeling_safe',
                label: 'I feel safe and protected',
                type: 'resource' as const,
                action: () => handleUserMood('calm'),
                style: 'success' as const
              },
              {
                id: 'feeling_worried',
                label: 'I\'m worried about something',
                type: 'resource' as const,
                action: () => handleUserMood('worried'),
                style: 'warning' as const
              },
              {
                id: 'need_help',
                label: 'I need help with something',
                type: 'resource' as const,
                action: () => handleGeneralHelp(),
                style: 'primary' as const
              }
            ]
          };
        }
    }
  };

  const addBotMessage = async (message: string, emotion?: ChatMessage['emotion'], actions?: ChatAction[]) => {
    const messageId = `bot_${Date.now()}`;
    const botMessage: ChatMessage = {
      id: messageId,
      type: 'bot',
      message,
      timestamp: new Date(),
      emotion,
      actions,
      metadata: {
        responseTime: Math.random() * 1000 + 500, // Simulate realistic response time
        confidence: 0.9 + Math.random() * 0.1
      }
    };

    setMessages(prev => [...prev, botMessage]);
    animateMessage(messageId);
    await storageService.storeChatMessage(sessionId, botMessage);
    scrollToBottom();
  };

  const addUserMessage = async (message: string) => {
    const messageId = `user_${Date.now()}`;
    const userMessage: ChatMessage = {
      id: messageId,
      type: 'user',
      message,
      timestamp: new Date(),
      metadata: {
        confidence: 1.0
      }
    };

    setMessages(prev => [...prev, userMessage]);
    animateMessage(messageId);
    await storageService.storeChatMessage(sessionId, userMessage);
    scrollToBottom();
  };

  const animateMessage = (messageId: string) => {
    const animation = new Animated.Value(0);
    messageAnimations.set(messageId, animation);
    
    Animated.spring(animation, {
      toValue: 1,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage = inputText.trim();
    setInputText('');
    Keyboard.dismiss();

    await addUserMessage(userMessage);
    setIsTyping(true);

    // Process user message and generate response
    setTimeout(async () => {
      const response = await generateContextualResponse(userMessage);
      setIsTyping(false);
      await addBotMessage(response.message, response.emotion, response.actions);
    }, 1000 + Math.random() * 2000); // Realistic response time
  };

  const generateContextualResponse = async (userMessage: string): Promise<{
    message: string;
    emotion: ChatMessage['emotion'];
    actions?: ChatAction[];
  }> => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Analyze emotional content
    if (lowerMessage.includes('scared') || lowerMessage.includes('afraid') || lowerMessage.includes('terrified')) {
      return {
        message: "It's completely normal and understandable to feel scared when dealing with potential scams. Your feelings are valid, and being scared actually shows you're being appropriately cautious. You're taking all the right steps by being vigilant and reaching out for support. Remember, you have tools and knowledge to stay safe, and you're not alone in this.",
        emotion: 'supportive',
        actions: [
          {
            id: 'breathing_exercise',
            label: 'Guided breathing exercise',
            type: 'resource',
            action: () => startBreathingExercise(),
            style: 'secondary'
          },
          {
            id: 'safety_reminders',
            label: 'Show my protection tools',
            type: 'resource',
            action: () => showProtectionTools(),
            style: 'primary'
          }
        ]
      };
    }

    if (lowerMessage.includes('thank') || lowerMessage.includes('grateful')) {
      return {
        message: "You're so welcome! It truly warms my heart to be able to help you feel more secure and confident. Remember, you're doing an amazing job protecting yourself, and you should feel proud of your vigilance. I'm here whenever you need support, guidance, or just someone to talk through your concerns with.",
        emotion: 'celebratory'
      };
    }

    if (lowerMessage.includes('money') || lowerMessage.includes('lost') || lowerMessage.includes('gave')) {
      return {
        message: "I understand this must be incredibly distressing. If you've lost money to a scam, please know that this happens to many smart, careful people - scammers are becoming very sophisticated. The most important thing right now is to take protective steps and know that you can get through this.",
        emotion: 'concerned',
        actions: [
          {
            id: 'financial_recovery',
            label: 'Financial recovery steps',
            type: 'emergency',
            action: () => handleFinancialRecovery(),
            style: 'warning'
          },
          {
            id: 'report_fraud',
            label: 'Report the fraud',
            type: 'report',
            action: () => handleFraudReporting(),
            style: 'primary'
          },
          {
            id: 'emotional_support',
            label: 'I need emotional support',
            type: 'resource',
            action: () => handleEmotionalSupport(),
            style: 'secondary'
          }
        ]
      };
    }

    if (lowerMessage.includes('suspicious') || lowerMessage.includes('not sure') || lowerMessage.includes('legitimate')) {
      return {
        message: "Your instincts to question something suspicious are excellent! This kind of healthy skepticism is your best defense. I can help you analyze what you've encountered and determine if it's legitimate or something to avoid.",
        emotion: 'supportive',
        actions: [
          {
            id: 'analyze_content',
            label: 'Analyze the suspicious content',
            type: 'resource',
            action: () => navigateToAnalysis(),
            style: 'primary'
          },
          {
            id: 'verification_guide',
            label: 'Verification guide',
            type: 'learn',
            action: () => showVerificationGuide(),
            style: 'secondary'
          }
        ]
      };
    }

    // Default supportive response
    return {
      message: "I hear you, and I want you to know that whatever you're going through, your feelings are valid and you're taking the right steps by being cautious and seeking guidance. Would you like me to help you with analyzing something specific, or would you prefer some general safety tips?",
      emotion: 'supportive',
      actions: [
        {
          id: 'analyze_something',
          label: 'Analyze something suspicious',
          type: 'resource',
          action: () => navigateToAnalysis(),
          style: 'primary'
        },
        {
          id: 'safety_tips',
          label: 'Show me safety tips',
          type: 'learn',
          action: () => showSafetyTips(),
          style: 'secondary'
        },
        {
          id: 'continue_talking',
          label: 'Continue our conversation',
          type: 'resource',
          action: () => {},
          style: 'secondary'
        }
      ]
    };
  };

  // Handler functions for various actions
  const handleUserMood = (mood: typeof userMood) => {
    setUserMood(mood);
    // Generate appropriate response based on mood
  };

  const handleEmergencyHelp = () => {
    onEmergencyAction?.('immediate_help');
  };

  const handleReportScam = () => {
    onNavigateToResource?.('report');
  };

  const handleEmotionalSupport = () => {
    // Continue conversation with emotional support focus
  };

  const navigateToAnalysis = () => {
    onNavigateToResource?.('analysis');
  };

  const showSafetyTips = () => {
    onNavigateToResource?.('safety_tips');
  };

  const handleConcernDiscussion = () => {
    // Continue conversation to discuss concerns
  };

  const handleCallerVerification = () => {
    onNavigateToResource?.('caller_verification');
  };

  const handleEmailVerification = () => {
    onNavigateToResource?.('email_verification');
  };

  const handleWebsiteVerification = () => {
    onNavigateToResource?.('website_verification');
  };

  const handlePreventionFocus = () => {
    onNavigateToResource?.('prevention_tips');
  };

  const handleGeneralHelp = () => {
    // Show general help options
  };

  const startBreathingExercise = () => {
    onNavigateToResource?.('breathing_exercise');
  };

  const showProtectionTools = () => {
    onNavigateToResource?.('protection_tools');
  };

  const handleFinancialRecovery = () => {
    onNavigateToResource?.('financial_recovery');
  };

  const handleFraudReporting = () => {
    onNavigateToResource?.('fraud_reporting');
  };

  const showVerificationGuide = () => {
    onNavigateToResource?.('verification_guide');
  };

  const getEmotionStyle = (emotion?: ChatMessage['emotion']) => {
    switch (emotion) {
      case 'supportive':
        return { backgroundColor: '#E0F2FE', borderColor: '#0EA5E9' };
      case 'concerned':
        return { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' };
      case 'celebratory':
        return { backgroundColor: '#DCFCE7', borderColor: '#22C55E' };
      case 'informative':
        return { backgroundColor: '#F3E8FF', borderColor: '#A855F7' };
      default:
        return { backgroundColor: '#F3F4F6', borderColor: '#D1D5DB' };
    }
  };

  const getActionButtonStyle = (style?: ChatAction['style']) => {
    switch (style) {
      case 'primary':
        return { backgroundColor: '#3B82F6', color: 'white' };
      case 'warning':
        return { backgroundColor: '#EF4444', color: 'white' };
      case 'success':
        return { backgroundColor: '#10B981', color: 'white' };
      default:
        return { backgroundColor: '#F3F4F6', color: '#374151' };
    }
  };

  const renderMessage = (message: ChatMessage) => {
    const animation = messageAnimations.get(message.id) || new Animated.Value(1);
    const isBot = message.type === 'bot';
    const emotionStyle = isBot ? getEmotionStyle(message.emotion) : {};

    return (
      <Animated.View
        key={message.id}
        style={{
          marginVertical: 4,
          marginHorizontal: 16,
          flexDirection: isBot ? 'row' : 'row-reverse',
          opacity: animation,
          transform: [{
            translateY: animation.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0],
            })
          }],
        }}
      >
        {/* Avatar */}
        <View style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: isBot ? '#3B82F6' : '#6B7280',
          justifyContent: 'center',
          alignItems: 'center',
          marginHorizontal: 8,
        }}>
          <View style={{
            fontSize: 20,
            color: 'white',
          }}>
            {isBot ? '🤖' : '👤'}
          </View>
        </View>

        {/* Message Content */}
        <View style={{
          flex: 1,
          maxWidth: '80%',
        }}>
          <View style={{
            backgroundColor: isBot ? emotionStyle.backgroundColor || '#F3F4F6' : '#3B82F6',
            borderRadius: 16,
            padding: 12,
            borderWidth: isBot ? 1 : 0,
            borderColor: isBot ? emotionStyle.borderColor || '#D1D5DB' : 'transparent',
          }}>
            <View style={{
              fontSize: 16,
              color: isBot ? '#374151' : 'white',
              lineHeight: 22,
            }}>
              {message.message}
            </View>
          </View>

          {/* Action Buttons */}
          {message.actions && message.actions.length > 0 && (
            <View style={{
              marginTop: 8,
              gap: 6,
            }}>
              {message.actions.map((action) => {
                const buttonStyle = getActionButtonStyle(action.style);
                return (
                  <View
                    key={action.id}
                    style={{
                      backgroundColor: buttonStyle.backgroundColor,
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                      borderRadius: 8,
                      alignItems: 'center',
                    }}
                    onTouchEnd={action.action}
                  >
                    <View style={{
                      fontSize: 14,
                      color: buttonStyle.color,
                      fontWeight: '500',
                    }}>
                      {action.label}
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Timestamp */}
          <View style={{
            fontSize: 12,
            color: '#9CA3AF',
            marginTop: 4,
            textAlign: isBot ? 'left' : 'right',
          }}>
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderTypingIndicator = () => {
    if (!isTyping) return null;

    return (
      <Animated.View
        style={{
          marginVertical: 4,
          marginHorizontal: 16,
          flexDirection: 'row',
          opacity: typingDotsAnim,
        }}
      >
        <View style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: '#3B82F6',
          justifyContent: 'center',
          alignItems: 'center',
          marginHorizontal: 8,
        }}>
          <View style={{
            fontSize: 20,
            color: 'white',
          }}>
            🤖
          </View>
        </View>

        <View style={{
          backgroundColor: '#F3F4F6',
          borderRadius: 16,
          padding: 12,
          borderWidth: 1,
          borderColor: '#D1D5DB',
        }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
          }}>
            <View style={{
              fontSize: 14,
              color: '#6B7280',
              marginRight: 8,
            }}>
              Buddy is typing
            </View>
            {[0, 1, 2].map((i) => (
              <Animated.View
                key={i}
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: '#6B7280',
                  marginHorizontal: 1,
                  transform: [{
                    translateY: typingDotsAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -4],
                    })
                  }],
                }}
              />
            ))}
          </View>
        </View>
      </Animated.View>
    );
  };

  if (!isVisible) return null;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
        transform: [{
          translateY: slideAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [1000, 0],
          })
        }],
      }}
    >
      <View style={{
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '90%',
        minHeight: '60%',
      }}>
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 16,
          borderBottomWidth: 1,
          borderBottomColor: '#E5E7EB',
        }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
          }}>
            <View style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: '#3B82F6',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 12,
            }}>
              <View style={{
                fontSize: 20,
                color: 'white',
              }}>
                💙
              </View>
            </View>
            <View>
              <View style={{
                fontSize: 18,
                fontWeight: 'bold',
                color: '#1F2937',
              }}>
                Buddy Support
              </View>
              <View style={{
                fontSize: 14,
                color: '#6B7280',
              }}>
                Always here to help
              </View>
            </View>
          </View>
          
          <View
            style={{
              padding: 8,
              borderRadius: 20,
              backgroundColor: '#F3F4F6',
            }}
            onTouchEnd={onClose}
          >
            <View style={{
              fontSize: 20,
              color: '#6B7280',
            }}>
              ✕
            </View>
          </View>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: 8 }}
        >
          {messages.map(renderMessage)}
          {renderTypingIndicator()}
        </ScrollView>

        {/* Input */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: 16,
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
        }}>
          <View style={{
            flex: 1,
            borderWidth: 1,
            borderColor: '#D1D5DB',
            borderRadius: 20,
            paddingHorizontal: 16,
            paddingVertical: 8,
            marginRight: 12,
            backgroundColor: 'white',
          }}>
            {/* Text input would be implemented here with TextInput */}
            <View style={{
              fontSize: 16,
              color: inputText ? '#374151' : '#9CA3AF',
            }}>
              {inputText || 'Type your message...'}
            </View>
          </View>
          
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: inputText.trim() ? '#3B82F6' : '#D1D5DB',
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onTouchEnd={handleSendMessage}
          >
            <View style={{
              fontSize: 20,
              color: 'white',
            }}>
              ➤
            </View>
          </View>
        </View>
      </View>
    </Animated.View>
  );
};