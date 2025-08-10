#!/bin/bash

# Boomer Buddy Native - Direct APK Build Script
# Alternative build method for production APK

echo "🛡️ Building Boomer Buddy Native APK (Direct Method)..."
echo "📱 Target: Production Android APK with system-level permissions"

# Check if we have Gradle available
if command -v gradle &> /dev/null; then
    echo "📦 Using system Gradle..."
    GRADLE_CMD="gradle"
elif [ -f "android/gradlew" ]; then
    echo "📦 Using Gradle wrapper..."
    GRADLE_CMD="android/gradlew"
else
    echo "❌ Gradle not found. Installing Gradle wrapper..."
    cd android
    gradle wrapper --gradle-version=8.1.1
    cd ..
    GRADLE_CMD="android/gradlew"
fi

# Navigate to android directory
cd android

# Clean previous builds
echo "🧹 Cleaning previous builds..."
if [ -f "gradlew" ]; then
    ./gradlew clean
else
    gradle clean
fi

# Build release APK
echo "🔨 Building release APK..."
if [ -f "gradlew" ]; then
    ./gradlew assembleRelease
else
    gradle assembleRelease
fi

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