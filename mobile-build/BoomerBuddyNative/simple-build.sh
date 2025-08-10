#!/bin/bash

# Boomer Buddy Native - Simple APK Build Script
# Uses npx react-native for building

echo "🛡️ Building Boomer Buddy Native APK (Simple Method)..."
echo "📱 Target: Production Android APK with system-level permissions"

# Install React Native CLI if needed
if ! command -v npx &> /dev/null; then
    echo "📦 Installing npm and npx..."
    # This would require system package installation
    echo "❌ npx not available. Please install Node.js and npm first."
    exit 1
fi

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf android/app/build/

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build APK using React Native CLI
echo "🔨 Building APK with React Native..."
npx react-native build-android --mode=release

# Check if build succeeded
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ APK build completed successfully!"
    echo "📁 APK location: android/app/build/outputs/apk/release/"
    
    # List the generated APK
    find android/app/build/outputs/apk/release/ -name "*.apk" -type f -exec echo "📦 APK: {}" \; 2>/dev/null || echo "📦 APK should be in android/app/build/outputs/apk/release/"
    
    echo ""
    echo "🚀 Installation Instructions:"
    echo "1. Copy APK to your Android device"
    echo "2. Enable 'Install from unknown sources' in Android settings"
    echo "3. Tap the APK file to install"
    echo "4. Grant all requested permissions for full protection"
    echo ""
    echo "🛡️ Boomer Buddy Native is ready to protect!"
    
else
    echo "❌ APK build failed. Trying alternative method..."
    echo "💡 Attempting build with Android Gradle Plugin directly..."
    
    # Try alternative build method
    cd android
    if [ -f "gradlew" ]; then
        echo "Using gradlew..."
        ./gradlew assembleRelease
    else
        echo "Using system gradle..."
        gradle assembleRelease 2>/dev/null || echo "❌ Gradle not available"
    fi
    
    if [ $? -eq 0 ]; then
        echo "✅ Alternative build succeeded!"
        find app/build/outputs/apk/release/ -name "*.apk" -type f -exec echo "📦 APK: {}" \;
    else
        echo "❌ Both build methods failed."
        echo "💡 This may require Android SDK to be properly installed."
        echo "💡 For now, use EAS Build cloud service instead."
    fi
fi