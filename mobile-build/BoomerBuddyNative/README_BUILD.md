# Boomer Buddy Native - APK Build Guide

## Quick Build Options

### Option 1: EAS Build (Cloud)
```bash
cd mobile-build/BoomerBuddyNative
eas build --platform android --profile production
```

### Option 2: Direct Build (Local)
```bash
cd mobile-build/BoomerBuddyNative
./direct-build.sh
```

## EAS Build Troubleshooting

If EAS has project configuration issues, follow these steps:

1. **Initialize Project**
   ```bash
   eas init
   ```

2. **Configure Build**
   ```bash
   eas build:configure
   ```

3. **Start Build**
   ```bash
   eas build --platform android --profile production
   ```

## Local Build Requirements

For direct building, ensure you have:
- Android SDK 34
- Build Tools 34.0.0
- Gradle 8.1.1
- Java 11+

## APK Features

Your production APK includes:
- Real-time call screening service
- SMS threat detection with pattern recognition
- Native Android system integration
- Government data source integration
- Zero-PII privacy protection
- Gamified user experience
- Background protection services

## Installation

1. Download APK from build output
2. Transfer to Android device
3. Enable "Install from unknown sources"
4. Install and grant all permissions

The app requires extensive permissions for system-level protection against scams and threats.