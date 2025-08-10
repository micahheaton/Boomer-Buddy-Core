#!/bin/bash

# Boomer Buddy Native - APK Build Script
# Production-ready Android APK generation

echo "🛡️ Building Boomer Buddy Native APK..."
echo "📱 Target: Production Android APK with system-level permissions"

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo "📦 Installing EAS CLI..."
    npm install -g @expo/eas-cli
fi

# Login with provided credentials
echo "🔐 Authenticating with EAS..."
echo "micahheaton" | eas login --non-interactive

# Configure project
echo "⚙️ Configuring EAS project..."
eas build:configure

# Build production APK
echo "🔨 Building production APK..."
eas build --platform android --profile production --local

# Check if build succeeded
if [ $? -eq 0 ]; then
    echo "✅ APK build completed successfully!"
    echo "📁 APK location: ./build/android/"
    echo "📲 Ready for installation on Android device"
    
    # List the generated APK
    find . -name "*.apk" -type f -exec echo "📦 APK: {}" \;
    
    echo ""
    echo "🚀 Installation Instructions:"
    echo "1. Transfer APK to your Android device"
    echo "2. Enable 'Install from unknown sources' in Android settings"
    echo "3. Tap the APK file to install"
    echo "4. Grant all requested permissions for full protection"
    echo ""
    echo "🛡️ Boomer Buddy Native is ready to protect!"
    
else
    echo "❌ APK build failed. Check the logs above."
    exit 1
fi