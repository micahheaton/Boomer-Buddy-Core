#!/bin/bash

echo "🔍 Checking APK build status..."

cd QuickBoomerBuddy/android

# Check if build is still running
if pgrep -f "gradle.*assembleRelease" > /dev/null; then
    echo "✅ Build is actively running"
    echo "🔄 Gradle process found - APK compilation in progress"
else
    echo "⚠️  Build process not detected, checking results..."
fi

# Check for APK output
if [ -f "app/build/outputs/apk/release/app-release.apk" ]; then
    echo ""
    echo "🎉 SUCCESS! APK FOUND!"
    echo "📱 Location: app/build/outputs/apk/release/app-release.apk"
    echo "📏 Size: $(du -h app/build/outputs/apk/release/app-release.apk | cut -f1)"
    
    # Copy to main directory for easy access
    cp app/build/outputs/apk/release/app-release.apk ../../QuickBoomerBuddy.apk
    echo "📋 Copied to: QuickBoomerBuddy.apk"
    
    echo ""
    echo "🚀 READY TO INSTALL:"
    echo "1. Download QuickBoomerBuddy.apk to your Android phone"
    echo "2. Enable 'Install from unknown sources' in Settings > Security"
    echo "3. Tap the APK file to install Boomer Buddy"
    echo "4. Grant permissions for full protection"
    echo ""
    echo "✅ Your native Android app is ready!"
    
elif [ -d "app/build/outputs/apk" ]; then
    echo "📂 APK directory exists, checking for any APK files..."
    find app/build/outputs/apk -name "*.apk" -type f
    
elif [ -d "app/build" ]; then
    echo "🔨 Build directory found, compilation may still be in progress"
    echo "⏳ Estimated completion: 1-3 more minutes"
    
else
    echo "🚧 Build not started yet or build directory missing"
    echo "🔄 Starting fresh build..."
    ./gradlew clean assembleRelease --no-daemon
fi