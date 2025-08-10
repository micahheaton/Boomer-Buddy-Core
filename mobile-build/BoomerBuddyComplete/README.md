# Boomer Buddy Mobile App

A companion mobile application for the Boomer Buddy scam detection platform.

## Features

### 🔍 Live Call Transcription
- One-button activation for suspicious calls
- Real-time speech-to-text with scam detection
- Automatic analysis and risk scoring
- Voice alerts for high-risk conversations

### 📸 Screenshot Analysis
- Camera integration for capturing suspicious messages
- Same OCR and AI analysis as web app
- Direct integration with backend API
- Quick analysis results with risk scoring

### 👤 Personal Profile
- Boomer Buddy Safety Score tracking
- Analysis history and statistics
- Achievement badges for safety awareness
- Community features and Facebook group access

### 🔒 Privacy & Security
- Client-side PII filtering before transmission
- No sensitive data stored on servers
- Post-analysis PII sharing alerts
- Local storage for user preferences

## Technical Architecture

- **Framework**: Expo/React Native for cross-platform support
- **Backend Integration**: Shared API with web application
- **Local Storage**: AsyncStorage for user data and preferences
- **Device APIs**: Camera, microphone, file system access
- **PII Protection**: Client-side filtering and detection

## Installation & Setup

```bash
cd mobile
npm install
npx expo start
```

## Key Components

- `src/screens/WelcomeScreen.tsx` - Onboarding experience
- `src/screens/HomeScreen.tsx` - Main dashboard with quick actions
- `src/screens/CallTranscriptionScreen.tsx` - Live call monitoring
- `src/screens/ScreenshotAnalysisScreen.tsx` - Image capture and analysis
- `src/screens/ProfileScreen.tsx` - User profile and community features
- `src/utils/piiFilter.ts` - PII detection and filtering utilities
- `src/utils/apiClient.ts` - Backend API integration
- `src/context/UserContext.tsx` - User state management

## Platform Support

- **iOS**: Native deployment via App Store
- **Android**: Native deployment via Google Play Store
- **Development**: Expo Go for rapid testing and iteration

## Integration with Web App

The mobile app shares the same backend API endpoints as the web application:
- `/api/analyze` - Scam analysis for text and images
- `/api/analysis/:id` - Retrieve analysis results
- User authentication and session management (optional)
- Shared contact databases and recommendation logic

## Privacy Features

The mobile app includes advanced PII filtering:
- Automatic detection of SSNs, credit cards, phone numbers
- Client-side removal before server transmission
- Post-analysis reporting of PII sharing risks
- No storage of sensitive personal information