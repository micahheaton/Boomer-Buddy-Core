package com.boomerbuddycomplete;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Bundle;
import android.telephony.SmsMessage;
import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

/**
 * Native Android SMS Interceptor Module
 * Provides real-time SMS interception capabilities for scam detection
 */
public class SmsInterceptorModule extends ReactContextBaseJavaModule {
    private static final String MODULE_NAME = "SmsInterceptor";
    private static final String SMS_RECEIVED_ACTION = "android.provider.Telephony.SMS_RECEIVED";
    private ReactApplicationContext reactContext;
    private SmsReceiver smsReceiver;
    private boolean isMonitoring = false;

    public SmsInterceptorModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return MODULE_NAME;
    }

    @ReactMethod
    public void startMonitoring(Promise promise) {
        try {
            if (!isMonitoring) {
                smsReceiver = new SmsReceiver();
                IntentFilter filter = new IntentFilter(SMS_RECEIVED_ACTION);
                filter.setPriority(1000); // High priority to intercept before default SMS app
                
                reactContext.registerReceiver(smsReceiver, filter);
                isMonitoring = true;
                
                Log.d(MODULE_NAME, "SMS monitoring started");
                promise.resolve("SMS monitoring started successfully");
            } else {
                promise.resolve("SMS monitoring already active");
            }
        } catch (Exception e) {
            Log.e(MODULE_NAME, "Failed to start SMS monitoring", e);
            promise.reject("SMS_MONITOR_ERROR", "Failed to start SMS monitoring: " + e.getMessage());
        }
    }

    @ReactMethod
    public void stopMonitoring(Promise promise) {
        try {
            if (isMonitoring && smsReceiver != null) {
                reactContext.unregisterReceiver(smsReceiver);
                smsReceiver = null;
                isMonitoring = false;
                
                Log.d(MODULE_NAME, "SMS monitoring stopped");
                promise.resolve("SMS monitoring stopped successfully");
            } else {
                promise.resolve("SMS monitoring was not active");
            }
        } catch (Exception e) {
            Log.e(MODULE_NAME, "Failed to stop SMS monitoring", e);
            promise.reject("SMS_MONITOR_ERROR", "Failed to stop SMS monitoring: " + e.getMessage());
        }
    }

    @ReactMethod
    public void getMonitoringStatus(Promise promise) {
        promise.resolve(isMonitoring);
    }

    /**
     * Broadcast receiver for intercepting SMS messages
     */
    private class SmsReceiver extends BroadcastReceiver {
        @Override
        public void onReceive(Context context, Intent intent) {
            try {
                if (SMS_RECEIVED_ACTION.equals(intent.getAction())) {
                    Bundle bundle = intent.getExtras();
                    if (bundle != null) {
                        Object[] pdus = (Object[]) bundle.get("pdus");
                        String format = bundle.getString("format");
                        
                        if (pdus != null) {
                            for (Object pdu : pdus) {
                                SmsMessage smsMessage;
                                
                                // Handle different Android versions
                                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
                                    smsMessage = SmsMessage.createFromPdu((byte[]) pdu, format);
                                } else {
                                    smsMessage = SmsMessage.createFromPdu((byte[]) pdu);
                                }
                                
                                if (smsMessage != null) {
                                    processSmsMessage(smsMessage);
                                }
                            }
                        }
                    }
                }
            } catch (Exception e) {
                Log.e(MODULE_NAME, "Error processing SMS message", e);
            }
        }
    }

    /**
     * Process intercepted SMS message and send to React Native
     */
    private void processSmsMessage(SmsMessage smsMessage) {
        try {
            String messageBody = smsMessage.getMessageBody();
            String senderNumber = smsMessage.getOriginatingAddress();
            long timestamp = smsMessage.getTimestampMillis();
            
            // Create event data for React Native
            WritableMap eventData = Arguments.createMap();
            eventData.putString("messageBody", messageBody);
            eventData.putString("senderNumber", senderNumber);
            eventData.putDouble("timestamp", timestamp);
            eventData.putString("eventType", "sms_received");
            
            // Quick local analysis for immediate high-risk detection
            boolean isHighRisk = performQuickRiskAssessment(messageBody, senderNumber);
            eventData.putBoolean("isHighRisk", isHighRisk);
            
            // Send event to React Native
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit("onSmsReceived", eventData);
                
            Log.d(MODULE_NAME, "SMS processed and sent to React Native - High Risk: " + isHighRisk);
            
        } catch (Exception e) {
            Log.e(MODULE_NAME, "Error processing SMS message", e);
        }
    }

    /**
     * Quick local risk assessment for immediate detection
     */
    private boolean performQuickRiskAssessment(String messageBody, String senderNumber) {
        if (messageBody == null) return false;
        
        String lowerMessage = messageBody.toLowerCase();
        
        // High-risk keywords that require immediate attention
        String[] immediateThreats = {
            "verify account",
            "click here immediately",
            "account suspended",
            "urgent action required",
            "confirm payment",
            "tax refund pending",
            "prize winner",
            "act now or lose",
            "final notice"
        };
        
        // Check for immediate threats
        for (String threat : immediateThreats) {
            if (lowerMessage.contains(threat)) {
                return true;
            }
        }
        
        // Check for suspicious URL patterns
        if (lowerMessage.matches(".*https?://[^\\s]*\\.tk.*") || 
            lowerMessage.matches(".*https?://[^\\s]*\\.ml.*") ||
            lowerMessage.matches(".*bit\\.ly.*") ||
            lowerMessage.matches(".*tinyurl.*")) {
            return true;
        }
        
        // Check for unknown shortcode senders with urgent content
        if (senderNumber != null && senderNumber.matches("^\\d{5,6}$")) {
            if (lowerMessage.contains("urgent") || lowerMessage.contains("expire")) {
                return true;
            }
        }
        
        return false;
    }
}