#!/bin/bash

# Boomer Buddy Native - Build Environment Setup
echo "🔧 Setting up build environment..."

# Find Java installation
export JAVA_HOME=$(find /nix/store -path "*/openjdk*/lib/openjdk" | head -1)
if [ -z "$JAVA_HOME" ]; then
    export JAVA_HOME=$(find /nix/store -name "*openjdk*" -type d | head -1)
fi

# Set Android SDK path
export ANDROID_HOME=$(find /nix/store -path "*/share/android-sdk" | head -1)
export ANDROID_SDK_ROOT=$ANDROID_HOME

# Add paths
export PATH=$JAVA_HOME/bin:$PATH
export PATH=$ANDROID_HOME/tools:$ANDROID_HOME/tools/bin:$ANDROID_HOME/platform-tools:$PATH

echo "☕ Java: $(java -version 2>&1 | head -1)"
echo "🤖 Android SDK: $ANDROID_HOME"
echo "🏗️ Build tools ready!"

# Fix gradle wrapper permissions
chmod +x android/gradlew

echo "✅ Environment configured for APK build"