#!/bin/bash

# Boomer Buddy Native - Final APK Build Script
# Production-ready build without dependency issues

echo "🛡️ Building Boomer Buddy Native APK (Final Production Method)..."
echo "📱 Target: Production Android APK with system-level permissions"

# Set environment variables
export JAVA_HOME=$(find /nix/store -path "*/lib/openjdk" | head -1)
if [ -z "$JAVA_HOME" ]; then
    export JAVA_HOME=$(find /nix/store -name "*openjdk*" -type d | head -1)
fi

export ANDROID_HOME=$(find /nix/store -path "*/share/android-sdk" | head -1)
export ANDROID_SDK_ROOT=$ANDROID_HOME
export PATH=$JAVA_HOME/bin:$PATH

echo "☕ Java: $JAVA_HOME"
echo "🤖 Android: $ANDROID_HOME"

# Navigate to android directory
cd android

# Clean any previous builds
echo "🧹 Cleaning previous builds..."
rm -rf app/build/

# Create a minimal gradle.properties if it doesn't exist
if [ ! -f "gradle.properties" ]; then
    cat > gradle.properties << EOF
android.useAndroidX=true
android.enableJetifier=true
org.gradle.jvmargs=-Xmx2048m -XX:MaxPermSize=512m -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8
org.gradle.parallel=true
org.gradle.daemon=false
EOF
fi

# Build the release APK directly with Gradle
echo "🔨 Building release APK with system Gradle..."

if command -v gradle &> /dev/null; then
    gradle assembleRelease --no-daemon --stacktrace
    BUILD_EXIT_CODE=$?
else
    echo "❌ Gradle not found in system"
    BUILD_EXIT_CODE=1
fi

# Check if build succeeded
if [ $BUILD_EXIT_CODE -eq 0 ]; then
    echo ""
    echo "✅ APK build completed successfully!"
    echo "📁 Searching for generated APK..."
    
    # Find and display the APK
    APK_PATH=$(find app/build/outputs/apk/release/ -name "*.apk" -type f 2>/dev/null | head -1)
    
    if [ -n "$APK_PATH" ]; then
        echo "📦 APK Generated: $APK_PATH"
        echo "📏 APK Size: $(du -h "$APK_PATH" | cut -f1)"
        
        echo ""
        echo "🚀 Installation Instructions:"
        echo "1. Copy APK to your Android device"
        echo "2. Enable 'Install from unknown sources' in Android settings"
        echo "3. Tap the APK file to install"
        echo "4. Grant all requested permissions for full protection"
        echo ""
        echo "🛡️ Boomer Buddy Native Features:"
        echo "  • Real-time call screening with threat detection"
        echo "  • SMS monitoring with scam pattern recognition"
        echo "  • Government data integration from 60+ sources"
        echo "  • Zero-PII privacy protection"
        echo "  • Gamified learning and safety tips"
        echo "  • Background protection services"
        echo ""
        echo "✅ Production APK ready for deployment!"
        
        # Copy APK to project root for easy access
        cp "$APK_PATH" "../boomer-buddy-native-v2.0.0.apk" 2>/dev/null
        echo "📋 APK copied to: boomer-buddy-native-v2.0.0.apk"
        
    else
        echo "⚠️ APK file not found in expected location"
        echo "📁 Checking all build outputs..."
        find app/build/ -name "*.apk" -type f 2>/dev/null
    fi
    
else
    echo "❌ APK build failed with exit code: $BUILD_EXIT_CODE"
    echo ""
    echo "💡 Troubleshooting options:"
    echo "1. Check Android SDK installation"
    echo "2. Verify all required dependencies"
    echo "3. Try EAS Build cloud service instead"
    echo ""
    echo "🔧 For immediate deployment, use:"
    echo "   cd mobile-build/BoomerBuddyNative"
    echo "   eas build --platform android --profile production"
    
    exit 1
fi