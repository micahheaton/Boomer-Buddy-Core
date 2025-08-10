# Setting Up the Boomer Buddy Mobile App

## Quick Start

1. **Project Structure**: The mobile app is located in the `mobile/` directory as a separate Expo project alongside the web application.

2. **Dependencies**: The mobile app uses Expo for cross-platform development with React Native.

3. **Backend Integration**: Both mobile and web apps share the same Express.js backend API endpoints.

## Development Setup

### Option 1: Use Replit's Mobile Development (Recommended)
Since Replit supports Expo development, you can:

1. Create a new Replit using the Expo template
2. Copy the mobile app files from this project's `mobile/` folder
3. Install dependencies and run via Expo

### Option 2: Local Development
```bash
# Navigate to mobile directory
cd mobile

# Install dependencies
npm install

# Start Expo development server
npx expo start
```

## Key Features Implemented

### Core Functionality
- ✅ Welcome screen with app onboarding
- ✅ Main dashboard with safety score display
- ✅ Live call transcription interface
- ✅ Screenshot capture and analysis workflow
- ✅ User profile with safety metrics
- ✅ PII filtering system (client-side)

### Technical Implementation
- ✅ User context for state management
- ✅ API client for backend integration  
- ✅ PII detection and filtering utilities
- ✅ TypeScript types matching web app
- ✅ Responsive design for mobile devices

### Privacy & Security
- ✅ Client-side PII removal before transmission
- ✅ Local storage for user preferences
- ✅ No sensitive data sent to servers
- ✅ Post-analysis PII sharing alerts

## Integration Points

The mobile app integrates with the existing backend:

1. **Analysis Endpoint** (`/api/analyze`)
   - Accepts both text and image uploads
   - Returns same JSON format as web app
   - Includes risk scoring and recommendations

2. **User Management** (Optional)
   - Profile creation and tracking
   - Analysis history storage
   - Safety score calculations

3. **Contact Database**
   - Same federal, state, and financial contacts
   - Contextual recommendations based on scam type

## Testing the Mobile App

### Device Permissions Needed:
- **Camera**: For screenshot capture
- **Microphone**: For call transcription
- **Storage**: For image selection and local data

### Demo Features:
- **Call Monitoring**: Simulated transcription with scam keywords
- **Screenshot Analysis**: Mock analysis results based on content
- **Safety Score**: Tracks user interactions and scam detection

## Deployment Options

### iOS Deployment:
- Build with Expo Application Services (EAS)
- Submit to Apple App Store
- TestFlight for beta testing

### Android Deployment:
- Build APK or AAB with EAS
- Submit to Google Play Store
- Direct APK distribution for testing

## Project Architecture

```
boomer-buddy/
├── client/          # Web application (React/Vite)
├── server/          # Backend API (Express.js)
├── shared/          # Shared TypeScript schemas
├── mobile/          # Mobile app (Expo/React Native)
│   ├── src/
│   │   ├── screens/     # App screens
│   │   ├── context/     # React context
│   │   ├── utils/       # Utilities (PII filter, API)
│   │   └── types/       # TypeScript types
│   ├── app.json         # Expo configuration
│   └── package.json     # Mobile dependencies
└── data/            # Static JSON data files
```

This structure allows both web and mobile apps to share the same backend while maintaining separate, optimized frontends for their respective platforms.