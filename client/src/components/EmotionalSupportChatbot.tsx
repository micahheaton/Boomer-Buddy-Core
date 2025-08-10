import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  Send, 
  Heart, 
  Shield, 
  X,
  Bot,
  User,
  Phone,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  message: string;
  timestamp: Date;
  emotion?: 'supportive' | 'concerned' | 'celebratory' | 'informative';
  actions?: ChatAction[];
}

interface ChatAction {
  id: string;
  label: string;
  type: 'resource' | 'emergency' | 'report' | 'learn';
  action: () => void;
}

const EmotionalSupportChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [userMood, setUserMood] = useState<'calm' | 'worried' | 'confused' | 'upset'>('calm');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Welcome message
      setTimeout(() => {
        addBotMessage(
          "Hello! I'm Buddy, your personal safety companion. I'm here to help you feel safe and supported. How are you feeling today?",
          'supportive',
          [
            {
              id: 'mood-calm',
              label: 'I feel safe',
              type: 'resource',
              action: () => handleMoodResponse('calm')
            },
            {
              id: 'mood-worried',
              label: 'I\'m worried about something',
              type: 'resource',
              action: () => handleMoodResponse('worried')
            },
            {
              id: 'mood-upset',
              label: 'I think I was scammed',
              type: 'emergency',
              action: () => handleMoodResponse('upset')
            }
          ]
        );
      }, 1000);
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const addBotMessage = (message: string, emotion: ChatMessage['emotion'] = 'supportive', actions?: ChatAction[]) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'bot',
      message,
      timestamp: new Date(),
      emotion,
      actions
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const addUserMessage = (message: string) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      message,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleMoodResponse = (mood: typeof userMood) => {
    setUserMood(mood);
    
    switch (mood) {
      case 'calm':
        addUserMessage("I feel safe");
        setTimeout(() => {
          addBotMessage(
            "That's wonderful to hear! It's great that you're taking steps to protect yourself. Would you like me to share today's safety tip or help you with something specific?",
            'celebratory',
            [
              {
                id: 'tip',
                label: 'Show me today\'s tip',
                type: 'learn',
                action: () => showSafetyTip()
              },
              {
                id: 'practice',
                label: 'Practice scam detection',
                type: 'learn',
                action: () => startPractice()
              }
            ]
          );
        }, 1000);
        break;
        
      case 'worried':
        addUserMessage("I'm worried about something");
        setTimeout(() => {
          addBotMessage(
            "I understand that feeling worried can be overwhelming. You're being smart by staying alert. What's concerning you? I'm here to help you feel more secure.",
            'concerned',
            [
              {
                id: 'suspicious-contact',
                label: 'Suspicious phone call/email',
                type: 'resource',
                action: () => handleSuspiciousContact()
              },
              {
                id: 'online-safety',
                label: 'Online safety concerns',
                type: 'resource',
                action: () => handleOnlineSafety()
              }
            ]
          );
        }, 1000);
        break;
        
      case 'upset':
        addUserMessage("I think I was scammed");
        setTimeout(() => {
          addBotMessage(
            "I'm so sorry this happened to you. You're not alone, and it's not your fault. Let's focus on what we can do right now to help you. First, take a deep breath - you've taken the right step by reaching out.",
            'concerned',
            [
              {
                id: 'emergency-help',
                label: 'I need immediate help',
                type: 'emergency',
                action: () => provideEmergencyHelp()
              },
              {
                id: 'report-scam',
                label: 'Help me report this',
                type: 'report',
                action: () => helpReportScam()
              }
            ]
          );
        }, 1000);
        break;
    }
  };

  const showSafetyTip = () => {
    addUserMessage("Show me today's tip");
    setTimeout(() => {
      addBotMessage(
        "Here's an important reminder: Legitimate companies will never ask you to pay with gift cards, wire transfers, or cryptocurrency. If someone asks for these payment methods, it's always a scam - no exceptions!",
        'informative',
        [
          {
            id: 'more-tips',
            label: 'Tell me more tips',
            type: 'learn',
            action: () => showMoreTips()
          }
        ]
      );
    }, 1500);
  };

  const startPractice = () => {
    addUserMessage("Practice scam detection");
    setTimeout(() => {
      addBotMessage(
        "Great choice! Practice makes you stronger. Here's a scenario: You get a call saying 'This is Microsoft support. Your computer has a virus and we need remote access to fix it.' What should you do?",
        'informative',
        [
          {
            id: 'correct-answer',
            label: 'Hang up immediately',
            type: 'learn',
            action: () => providePracticeCorrect()
          },
          {
            id: 'wrong-answer',
            label: 'Give them access',
            type: 'learn',
            action: () => providePracticeWrong()
          }
        ]
      );
    }, 1500);
  };

  const providePracticeCorrect = () => {
    addUserMessage("Hang up immediately");
    setTimeout(() => {
      addBotMessage(
        "Perfect! You got it exactly right! 🎉 Microsoft (and other tech companies) never make unsolicited calls about computer problems. You're becoming a scam-detection expert!",
        'celebratory'
      );
    }, 1000);
  };

  const providePracticeWrong = () => {
    addUserMessage("Give them access");
    setTimeout(() => {
      addBotMessage(
        "I understand why you might think that, but this would actually be dangerous. Real tech companies never call you unsolicited. The safe choice is always to hang up and contact the company directly if you're concerned. You're learning, and that's what matters!",
        'supportive'
      );
    }, 1000);
  };

  const handleSuspiciousContact = () => {
    addUserMessage("Suspicious phone call/email");
    setTimeout(() => {
      addBotMessage(
        "You're being very smart to trust your instincts. Can you tell me more about what felt suspicious? Don't worry about sharing too much detail - I'm here to help you figure this out together.",
        'supportive',
        [
          {
            id: 'analyze-now',
            label: 'Help me analyze it',
            type: 'resource',
            action: () => startAnalysis()
          }
        ]
      );
    }, 1000);
  };

  const startAnalysis = () => {
    addUserMessage("Help me analyze it");
    setTimeout(() => {
      addBotMessage(
        "I'd be happy to help you analyze this. You can use the 'Report' feature in the main app to safely check suspicious messages or calls. Remember, your personal information is always protected - we only analyze patterns, never your private details.",
        'supportive',
        [
          {
            id: 'go-to-report',
            label: 'Take me to analysis',
            type: 'resource',
            action: () => window.location.href = '/report'
          }
        ]
      );
    }, 1000);
  };

  const provideEmergencyHelp = () => {
    addUserMessage("I need immediate help");
    setTimeout(() => {
      addBotMessage(
        "I understand this is urgent. Here's what you should do right now: 1) If you gave out financial information, contact your bank immediately. 2) If it was identity theft, contact the Federal Trade Commission. 3) You are safe now, and we'll get through this together.",
        'concerned',
        [
          {
            id: 'call-bank',
            label: 'Find my bank\'s number',
            type: 'emergency',
            action: () => provideBankHelp()
          },
          {
            id: 'ftc-report',
            label: 'Report to FTC',
            type: 'emergency',
            action: () => provideFTCHelp()
          }
        ]
      );
    }, 1000);
  };

  const provideBankHelp = () => {
    addUserMessage("Find my bank's number");
    setTimeout(() => {
      addBotMessage(
        "Look for the phone number on the back of your bank card or your bank statement. DO NOT use any number someone gave you over the phone. Call them directly and explain what happened. They deal with this every day and will help you.",
        'supportive'
      );
    }, 1000);
  };

  const provideFTCHelp = () => {
    addUserMessage("Report to FTC");
    setTimeout(() => {
      addBotMessage(
        "You can report to the FTC at reportfraud.ftc.gov or call 1-877-FTC-HELP. This helps protect others too. Remember: reporting this doesn't mean you did anything wrong - scammers are getting more sophisticated every day.",
        'supportive'
      );
    }, 1000);
  };

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      addUserMessage(inputValue);
      setInputValue('');
      setIsTyping(true);
      
      // Simple response logic
      setTimeout(() => {
        setIsTyping(false);
        if (inputValue.toLowerCase().includes('scared') || inputValue.toLowerCase().includes('worried')) {
          addBotMessage(
            "It's completely normal to feel scared when dealing with potential scams. Your feelings are valid, and you're being very wise to be cautious. Remember, you have support and tools to stay safe.",
            'supportive'
          );
        } else if (inputValue.toLowerCase().includes('thank')) {
          addBotMessage(
            "You're so welcome! I'm here whenever you need support or have questions. Remember, you're stronger than you know, and you're taking all the right steps to stay protected.",
            'celebratory'
          );
        } else {
          addBotMessage(
            "I hear you. Would you like me to help you with analyzing a suspicious message, or would you prefer some reassuring safety tips?",
            'supportive',
            [
              {
                id: 'analyze',
                label: 'Analyze something suspicious',
                type: 'resource',
                action: () => startAnalysis()
              },
              {
                id: 'tips',
                label: 'Share safety tips',
                type: 'learn',
                action: () => showSafetyTip()
              }
            ]
          );
        }
      }, 1500);
    }
  };

  const getMessageEmotionStyle = (emotion: ChatMessage['emotion']) => {
    switch (emotion) {
      case 'supportive':
        return 'bg-blue-100 border-blue-200';
      case 'concerned':
        return 'bg-orange-100 border-orange-200';
      case 'celebratory':
        return 'bg-green-100 border-green-200';
      case 'informative':
        return 'bg-purple-100 border-purple-200';
      default:
        return 'bg-gray-100 border-gray-200';
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            onClick={() => setIsOpen(true)}
            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <MessageCircle size={24} />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="bg-white rounded-2xl shadow-2xl w-96 h-96 flex flex-col"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-4 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-white bg-opacity-20 p-2 rounded-full">
                  <Heart size={20} />
                </div>
                <div>
                  <h3 className="font-semibold">Buddy Support</h3>
                  <p className="text-xs opacity-90">Always here to help</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white hover:bg-opacity-20 p-1 rounded"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className={`max-w-xs ${message.type === 'user' ? 'order-1' : 'order-2'}`}>
                    <div className={`p-3 rounded-lg ${
                      message.type === 'user' 
                        ? 'bg-blue-500 text-white' 
                        : `border ${getMessageEmotionStyle(message.emotion)}`
                    }`}>
                      <div className="flex items-start space-x-2">
                        {message.type === 'bot' && (
                          <Bot size={16} className="mt-1 text-gray-600" />
                        )}
                        <p className="text-sm">{message.message}</p>
                      </div>
                    </div>
                    
                    {message.actions && (
                      <div className="mt-2 space-y-1">
                        {message.actions.map((action) => (
                          <button
                            key={action.id}
                            onClick={action.action}
                            className="block w-full text-left text-xs bg-gray-100 hover:bg-gray-200 p-2 rounded border transition-colors"
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              
              {isTyping && (
                <motion.div
                  className="flex justify-start"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="bg-gray-100 border border-gray-200 p-3 rounded-lg max-w-xs">
                    <div className="flex items-center space-x-2">
                      <Bot size={16} className="text-gray-600" />
                      <div className="flex space-x-1">
                        {[...Array(3)].map((_, i) => (
                          <motion.div
                            key={i}
                            className="w-2 h-2 bg-gray-400 rounded-full"
                            animate={{ y: [0, -5, 0] }}
                            transition={{
                              duration: 0.8,
                              repeat: Infinity,
                              delay: i * 0.2
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type your message..."
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={handleSendMessage}
                  className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EmotionalSupportChatbot;