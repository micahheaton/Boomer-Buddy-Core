#!/bin/bash

# Simple APK Build - Gets you a working APK now
echo "Building your APK now..."

# Move to android dir
cd android

# Clean build
rm -rf app/build/

# Set environment
export JAVA_HOME=$(find /nix/store -path "*/lib/openjdk" | head -1)
export ANDROID_HOME=$(find /nix/store -path "*/share/android-sdk" | head -1)

# Build with direct gradle command bypassing wrapper issues
gradle clean
gradle assembleRelease

# Check result
if [ -f "app/build/outputs/apk/release/app-release.apk" ]; then
    echo "SUCCESS! APK built at: app/build/outputs/apk/release/app-release.apk"
    cp app/build/outputs/apk/release/app-release.apk ../boomer-buddy.apk
    echo "APK copied to: boomer-buddy.apk"
    echo "Size: $(du -h ../boomer-buddy.apk | cut -f1)"
    echo ""
    echo "READY TO INSTALL:"
    echo "1. Copy boomer-buddy.apk to your Android phone"
    echo "2. Enable 'Unknown sources' in Android settings"
    echo "3. Tap the APK to install"
    echo "4. Your native app with call/SMS protection is ready!"
else
    echo "Build issue - checking alternatives..."
    find app/build -name "*.apk" 2>/dev/null || echo "No APK found yet"
fi