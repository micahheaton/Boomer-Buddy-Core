# Boomer Buddy Mobile App - Android Testing Guide

## 🚀 Quick Start (3 Simple Steps)

### Step 1: Install Expo Go on Your Android Phone
1. Open **Google Play Store** on your Android device  
2. Search for **"Expo Go"** and install it (free app by Expo)
3. Open the app and create a free account if needed

### Step 2: Start Mobile Development Server
In the Replit console, run these commands:

```bash
# Navigate to mobile directory  
cd mobile

# Start the mobile development server
npx expo start --tunnel
```

**Important**: Use `--tunnel` flag for Replit to work properly with your phone.

### Step 3: Connect Your Phone
1. **QR Code appears** in the Replit console after running the command above
2. **Open Expo Go** app on your Android phone
3. **Tap "Scan QR Code"** and point camera at the QR code in Replit
4. **Your app loads automatically** on your phone! 📱

## If QR Code Doesn't Work

### Alternative Method:
1. Copy the **expo URL** from Replit console (starts with `exp://`)
2. Open **Expo Go** app on your phone
3. Tap **"Enter URL manually"**
4. Paste the URL and tap **"Connect"**

## What You'll Experience

✅ **Live Mobile App**: Full Boomer Buddy experience on your Android device  
✅ **Real-time Updates**: Changes in code update instantly on your phone  
✅ **Zero-PII Security**: All sensitive processing happens on your device only  
✅ **Government Data**: Live scam alerts from 60+ official sources  
✅ **Voice Analysis**: Record and analyze suspicious calls  
✅ **Image Analysis**: Upload screenshots for scam detection

## Alternative Methods

### Method 2: Build APK for Testing

#### Prerequisites
- Create a free EAS account at https://expo.dev/signup
- Install EAS CLI: `npm install -g eas-cli`

#### Build APK
```bash
# Login to EAS
eas login

# Configure your project
eas build:configure

# Build APK for Android
eas build --platform android --profile preview
```

This will build an APK file you can download and install directly on your Android device.

### Method 3: Expo Development Build

For advanced features that require native code:

```bash
# Build development client
eas build --platform android --profile development

# Install the development build on your device
# Then run:
npx expo start --dev-client
```

## Troubleshooting

### Common Issues:

1. **"Metro bundler not found"**: Run `npx expo start --clear`

2. **QR Code not working**: 
   - Ensure both devices are on the same WiFi network
   - Try the tunnel mode: `npx expo start --tunnel`

3. **Dependencies missing**:
   ```bash
   cd mobile
   rm -rf node_modules
   npm install
   ```

4. **App crashes on device**:
   - Check the Expo Go app logs
   - Ensure all native dependencies are properly configured

## Key Features Enabled:

✅ **Zero-PII Architecture**: All sensitive data processing happens on-device
✅ **Real-time Scam Detection**: Connects to government data feeds
✅ **Voice & Image Analysis**: Upload screenshots or record calls for analysis
✅ **Training Modules**: Interactive scam awareness training
✅ **Emergency Features**: Quick reporting and evidence collection

## Next Steps After Testing:

1. **For App Store Distribution**: Use `eas build --platform android --profile production`
2. **For Internal Testing**: Use TestFlight or Google Play Internal Testing
3. **For Enterprise**: Configure signing certificates and private distribution

## Support:

If you encounter issues:
1. Check the Expo documentation: https://docs.expo.dev/
2. Review the mobile app logs in the Replit console
3. Test the web app first at: https://boomer-buddy.replit.app

---

**Security Note**: The mobile app is designed with privacy-first architecture. No personal information (SSN, passwords, etc.) is transmitted to servers - all sensitive processing happens locally on your device.