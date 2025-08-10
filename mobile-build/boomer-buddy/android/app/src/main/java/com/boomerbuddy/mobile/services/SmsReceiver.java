package com.boomerbuddy.mobile.services;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.telephony.SmsMessage;
import android.util.Log;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.bridge.ReactContext;

/**
 * SMS Receiver for Real-time Scam Detection
 * Intercepts incoming SMS messages and analyzes them for scam indicators
 */
public class SmsReceiver extends BroadcastReceiver {
    private static final String TAG = "BoomerBuddy_SMS";
    
    @Override
    public void onReceive(Context context, Intent intent) {
        if ("android.provider.Telephony.SMS_RECEIVED".equals(intent.getAction())) {
            Bundle bundle = intent.getExtras();
            if (bundle != null) {
                try {
                    Object[] pdus = (Object[]) bundle.get("pdus");
                    if (pdus != null) {
                        for (Object pdu : pdus) {
                            SmsMessage smsMessage = SmsMessage.createFromPdu((byte[]) pdu);
                            String sender = smsMessage.getDisplayOriginatingAddress();
                            String messageBody = smsMessage.getMessageBody();
                            
                            Log.d(TAG, "SMS Received from: " + sender + " Message: " + messageBody);
                            
                            // Analyze SMS for scam indicators
                            ScamAnalysisResult result = analyzeMessage(messageBody, sender);
                            
                            if (result.isHighRisk()) {
                                // Block or quarantine high-risk messages
                                handleHighRiskSms(context, sender, messageBody, result);
                                // Abort broadcast to prevent message from reaching user
                                abortBroadcast();
                            } else if (result.isSuspicious()) {
                                // Flag suspicious messages but allow through with warning
                                flagSuspiciousMessage(context, sender, messageBody, result);
                            }
                            
                            // Send to React Native for UI updates
                            sendToReactNative(context, sender, messageBody, result);
                        }
                    }
                } catch (Exception e) {
                    Log.e(TAG, "Error processing SMS", e);
                }
            }
        }
    }
    
    private ScamAnalysisResult analyzeMessage(String message, String sender) {
        // Implement scam detection logic
        ScamAnalysisResult result = new ScamAnalysisResult();
        
        // Check for common scam patterns
        String lowerMessage = message.toLowerCase();
        
        // High-risk patterns
        if (containsPattern(lowerMessage, new String[]{
            "click here immediately", "urgent action required", "account suspended",
            "verify your ssn", "claim your prize", "act now or lose",
            "government refund", "irs notice", "medicare alert"
        })) {
            result.setRiskLevel("critical");
            result.setConfidence(0.95f);
        }
        // Medium-risk patterns
        else if (containsPattern(lowerMessage, new String[]{
            "limited time", "free gift", "congratulations", "winner",
            "click link", "reply stop", "exclusive offer"
        })) {
            result.setRiskLevel("medium");
            result.setConfidence(0.75f);
        }
        // Low-risk
        else {
            result.setRiskLevel("low");
            result.setConfidence(0.3f);
        }
        
        // Check sender patterns
        if (sender.contains("unknown") || sender.length() < 5 || sender.matches("\\d{5}")) {
            result.increaseRisk();
        }
        
        return result;
    }
    
    private boolean containsPattern(String message, String[] patterns) {
        for (String pattern : patterns) {
            if (message.contains(pattern)) {
                return true;
            }
        }
        return false;
    }
    
    private void handleHighRiskSms(Context context, String sender, String message, ScamAnalysisResult result) {
        // Quarantine high-risk messages
        Log.w(TAG, "HIGH RISK SMS BLOCKED - Sender: " + sender + " Risk: " + result.getRiskLevel());
        
        // Store in quarantine database
        QuarantineManager.quarantineMessage(context, sender, message, result);
        
        // Show emergency notification
        EmergencyNotificationManager.showScamAlert(context, 
            "🚨 SCAM BLOCKED", 
            "Dangerous message from " + sender + " was blocked for your protection");
    }
    
    private void flagSuspiciousMessage(Context context, String sender, String message, ScamAnalysisResult result) {
        // Add warning flag but allow message through
        Log.w(TAG, "SUSPICIOUS SMS FLAGGED - Sender: " + sender);
        
        // Show warning notification
        EmergencyNotificationManager.showWarning(context,
            "⚠️ Suspicious Message",
            "Be careful with message from " + sender);
    }
    
    private void sendToReactNative(Context context, String sender, String message, ScamAnalysisResult result) {
        try {
            ReactApplication reactApplication = (ReactApplication) context.getApplicationContext();
            ReactInstanceManager reactInstanceManager = reactApplication.getReactNativeHost().getReactInstanceManager();
            ReactContext reactContext = reactInstanceManager.getCurrentReactContext();
            
            if (reactContext != null) {
                WritableMap params = Arguments.createMap();
                params.putString("sender", sender);
                params.putString("message", message);
                params.putString("riskLevel", result.getRiskLevel());
                params.putDouble("confidence", result.getConfidence());
                params.putString("timestamp", String.valueOf(System.currentTimeMillis()));
                
                reactContext
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                    .emit("smsReceived", params);
            }
        } catch (Exception e) {
            Log.e(TAG, "Error sending to React Native", e);
        }
    }
}

class ScamAnalysisResult {
    private String riskLevel = "low";
    private float confidence = 0.0f;
    
    public void setRiskLevel(String level) { this.riskLevel = level; }
    public void setConfidence(float conf) { this.confidence = conf; }
    public String getRiskLevel() { return riskLevel; }
    public float getConfidence() { return confidence; }
    
    public boolean isHighRisk() { return "critical".equals(riskLevel) || "high".equals(riskLevel); }
    public boolean isSuspicious() { return "medium".equals(riskLevel); }
    
    public void increaseRisk() {
        if ("low".equals(riskLevel)) riskLevel = "medium";
        else if ("medium".equals(riskLevel)) riskLevel = "high";
        confidence = Math.min(1.0f, confidence + 0.2f);
    }
}