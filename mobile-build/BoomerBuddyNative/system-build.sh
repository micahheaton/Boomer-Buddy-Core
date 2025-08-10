#!/bin/bash

# Boomer Buddy Native - System Gradle Build
echo "🛡️ Building Boomer Buddy Native APK (System Gradle)..."
echo "📱 Target: Production Android APK with system-level permissions"

# Set environment variables for Android build
export JAVA_HOME=$(find /nix/store -path "*/lib/openjdk" | head -1)
export ANDROID_HOME=$(find /nix/store -path "*/share/android-sdk" | head -1)
export ANDROID_SDK_ROOT=$ANDROID_HOME
export PATH=$JAVA_HOME/bin:$PATH

echo "☕ Java: $JAVA_HOME"
echo "🤖 Android: $ANDROID_HOME"

# Navigate to android directory and use system gradle directly
cd android

# Create gradle.properties for build optimization
cat > gradle.properties << EOF
android.useAndroidX=true
android.enableJetifier=true
org.gradle.jvmargs=-Xmx2048m
org.gradle.parallel=true
org.gradle.daemon=false
org.gradle.configureondemand=true
EOF

# Clean and build using system gradle
echo "🧹 Cleaning previous builds..."
gradle clean --no-daemon

echo "🔨 Building release APK..."
gradle assembleRelease --no-daemon --stacktrace

# Check if build succeeded
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ APK build completed successfully!"
    echo "📁 APK location: android/app/build/outputs/apk/release/"
    
    # Find and show the APK
    APK_FILE=$(find app/build/outputs/apk/release/ -name "*.apk" -type f | head -1)
    if [ -n "$APK_FILE" ]; then
        echo "📦 APK: $APK_FILE"
        echo "📏 Size: $(du -h "$APK_FILE" | cut -f1)"
        
        # Copy to root for easy access
        cp "$APK_FILE" "../boomer-buddy-native.apk"
        echo "📋 Copied to: boomer-buddy-native.apk"
        
        echo ""
        echo "🚀 Your native Android APK is ready!"
        echo "🛡️ Features: Call screening, SMS monitoring, system integration"
        echo "💾 Install: Transfer APK to Android device and install"
    else
        echo "⚠️ APK not found in expected location"
    fi
else
    echo "❌ Build failed. Checking for available build tools..."
    echo "📋 Available Gradle: $(gradle --version | head -1)"
    echo "☕ Java: $(java -version 2>&1 | head -1)"
fi