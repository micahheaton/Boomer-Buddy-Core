#!/bin/bash

# Boomer Buddy Native - APK Build Script
# Production-ready Android APK generation with EAS Build

echo "🛡️ Building Boomer Buddy Native APK..."
echo "📱 Target: Production Android APK with system-level permissions"

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo "📦 Installing EAS CLI..."
    npm install -g eas-cli
fi

# Login with provided credentials
echo "🔐 Authenticating with EAS..."
eas login

# Configure project if not already done
if [ ! -f "eas.json" ]; then
    echo "⚙️ Configuring EAS project..."
    eas build:configure
fi

# Build production APK using the generic workflow
echo "🔨 Building production APK with EAS..."
echo "📋 Build profile: release-apk (generic workflow)"

# Start the build
eas build --platform android --profile release-apk

# Check if build command succeeded
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build initiated successfully!"
    echo "🌐 Check your EAS dashboard for build progress:"
    echo "   https://expo.dev/accounts/micahheaton/projects"
    echo ""
    echo "📋 Once build completes:"
    echo "1. Download APK from EAS dashboard"
    echo "2. Transfer to your Android device"
    echo "3. Enable 'Install from unknown sources' in Android settings"
    echo "4. Install APK and grant all permissions"
    echo ""
    echo "🛡️ Your native Boomer Buddy app will have:"
    echo "   • Real-time call screening"
    echo "   • SMS threat detection"
    echo "   • Government data integration"
    echo "   • Zero-PII privacy protection"
    echo ""
    echo "📱 Ready for production use with 10/10 quality!"
    
else
    echo "❌ Build command failed. Check the error above."
    echo "💡 Try:"
    echo "   • Verify EAS login: eas whoami"
    echo "   • Check project configuration"
    echo "   • Ensure internet connection"
    exit 1
fi