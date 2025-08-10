#!/bin/bash

# Boomer Buddy Native - Direct APK Build Script
# Alternative build method for production APK

echo "🛡️ Building Boomer Buddy Native APK (Direct Method)..."
echo "📱 Target: Production Android APK with system-level permissions"

# Navigate to android directory
cd android

# Clean previous builds
echo "🧹 Cleaning previous builds..."
./gradlew clean

# Build release APK
echo "🔨 Building release APK..."
./gradlew assembleRelease

# Check if build succeeded
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ APK build completed successfully!"
    echo "📁 APK location: android/app/build/outputs/apk/release/"
    
    # List the generated APK
    find app/build/outputs/apk/release/ -name "*.apk" -type f -exec echo "📦 APK: {}" \;
    
    echo ""
    echo "🚀 Installation Instructions:"
    echo "1. Copy APK to your Android device"
    echo "2. Enable 'Install from unknown sources' in Android settings"
    echo "3. Tap the APK file to install"
    echo "4. Grant all requested permissions for full protection"
    echo ""
    echo "🛡️ Boomer Buddy Native is ready to protect!"
    
else
    echo "❌ APK build failed. Check the logs above."
    echo "💡 Make sure Android SDK and dependencies are properly installed."
    exit 1
fi