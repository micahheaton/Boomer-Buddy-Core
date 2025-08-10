package com.boomerbuddy.mobile.services;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.telephony.TelephonyManager;
import android.util.Log;
import android.media.MediaRecorder;
import android.speech.SpeechRecognizer;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.bridge.ReactContext;

/**
 * Call Receiver for Live Call Transcription and Scam Detection
 * Monitors phone call states and provides real-time scam analysis
 */
public class CallReceiver extends BroadcastReceiver {
    private static final String TAG = "BoomerBuddy_Call";
    private static boolean isCallActive = false;
    private static SpeechRecognizer speechRecognizer;
    private static MediaRecorder mediaRecorder;
    private static String currentCallerNumber;
    
    @Override
    public void onReceive(Context context, Intent intent) {
        String state = intent.getStringExtra(TelephonyManager.EXTRA_STATE);
        String incomingNumber = intent.getStringExtra(TelephonyManager.EXTRA_INCOMING_NUMBER);
        
        Log.d(TAG, "Call state changed: " + state + " Number: " + incomingNumber);
        
        if (TelephonyManager.EXTRA_STATE_RINGING.equals(state)) {
            handleIncomingCall(context, incomingNumber);
        } else if (TelephonyManager.EXTRA_STATE_OFFHOOK.equals(state)) {
            handleCallAnswered(context, incomingNumber);
        } else if (TelephonyManager.EXTRA_STATE_IDLE.equals(state)) {
            handleCallEnded(context);
        }
    }
    
    private void handleIncomingCall(Context context, String number) {
        currentCallerNumber = number;
        Log.d(TAG, "Incoming call from: " + number);
        
        // Pre-screen caller number for known scam patterns
        if (number != null) {
            ScamCallerResult result = analyzeCallerNumber(number);
            
            if (result.isKnownScammer()) {
                // Show immediate warning
                EmergencyNotificationManager.showScamAlert(context,
                    "🚨 SCAM CALLER DETECTED",
                    "Number " + number + " is a known scam source. DO NOT ANSWER!");
                
                // Optionally auto-reject high-risk calls
                if (result.isHighRisk()) {
                    // Implementation would require system-level call blocking
                    Log.w(TAG, "HIGH RISK CALLER - Consider auto-blocking: " + number);
                }
            }
        }
        
        sendCallEventToReactNative(context, "incoming", number, null);
    }
    
    private void handleCallAnswered(Context context, String number) {
        if (!isCallActive) {
            isCallActive = true;
            Log.d(TAG, "Call answered - Starting live transcription");
            
            // Start live call transcription
            startLiveTranscription(context, number);
            
            // Show live monitoring notification
            EmergencyNotificationManager.showLiveMonitoring(context,
                "🛡️ Live Call Protection Active",
                "Monitoring call for scam indicators. Tap for emergency help.");
        }
        
        sendCallEventToReactNative(context, "answered", number, null);
    }
    
    private void handleCallEnded(Context context) {
        if (isCallActive) {
            isCallActive = false;
            Log.d(TAG, "Call ended - Stopping transcription");
            
            stopLiveTranscription();
            currentCallerNumber = null;
            
            EmergencyNotificationManager.dismissLiveMonitoring(context);
        }
        
        sendCallEventToReactNative(context, "ended", null, null);
    }
    
    private void startLiveTranscription(Context context, String number) {
        try {
            // Initialize speech recognizer for live transcription
            speechRecognizer = SpeechRecognizer.createSpeechRecognizer(context);
            speechRecognizer.setRecognitionListener(new ScamDetectionListener(context, number));
            
            Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
            intent.putExtra(RecognizerIntent.EXTRA_CALLING_PACKAGE, context.getPackageName());
            intent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);
            intent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1);
            
            speechRecognizer.startListening(intent);
            
            Log.d(TAG, "Live transcription started for call with: " + number);
            
        } catch (Exception e) {
            Log.e(TAG, "Error starting live transcription", e);
        }
    }
    
    private void stopLiveTranscription() {
        try {
            if (speechRecognizer != null) {
                speechRecognizer.stopListening();
                speechRecognizer.destroy();
                speechRecognizer = null;
            }
            
            if (mediaRecorder != null) {
                mediaRecorder.stop();
                mediaRecorder.release();
                mediaRecorder = null;
            }
            
            Log.d(TAG, "Live transcription stopped");
            
        } catch (Exception e) {
            Log.e(TAG, "Error stopping transcription", e);
        }
    }
    
    private ScamCallerResult analyzeCallerNumber(String number) {
        ScamCallerResult result = new ScamCallerResult();
        
        // Check against known scam number patterns
        if (number != null) {
            // Robocall patterns
            if (number.matches("\\d{3}-\\d{3}-\\d{4}") && 
                (number.startsWith("800") || number.startsWith("888") || 
                 number.startsWith("877") || number.startsWith("866"))) {
                result.setRiskLevel("medium");
                result.setReason("Toll-free number often used by scammers");
            }
            
            // Spoofed number patterns
            if (number.length() < 5 || number.equals("UNKNOWN") || number.equals("PRIVATE")) {
                result.setRiskLevel("high");
                result.setReason("Hidden or spoofed caller ID");
            }
            
            // International scam numbers
            if (number.startsWith("+1-876") || number.startsWith("+233") || 
                number.startsWith("+234")) {
                result.setRiskLevel("critical");
                result.setReason("Known international scam source");
            }
        }
        
        return result;
    }
    
    private void sendCallEventToReactNative(Context context, String event, String number, String transcript) {
        try {
            ReactApplication reactApplication = (ReactApplication) context.getApplicationContext();
            ReactInstanceManager reactInstanceManager = reactApplication.getReactNativeHost().getReactInstanceManager();
            ReactContext reactContext = reactInstanceManager.getCurrentReactContext();
            
            if (reactContext != null) {
                WritableMap params = Arguments.createMap();
                params.putString("event", event);
                params.putString("number", number);
                params.putString("transcript", transcript);
                params.putString("timestamp", String.valueOf(System.currentTimeMillis()));
                
                reactContext
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                    .emit("callEvent", params);
            }
        } catch (Exception e) {
            Log.e(TAG, "Error sending call event to React Native", e);
        }
    }
    
    // Inner class for real-time speech recognition during calls
    private class ScamDetectionListener implements RecognitionListener {
        private Context context;
        private String callerNumber;
        private StringBuilder fullTranscript = new StringBuilder();
        
        public ScamDetectionListener(Context context, String number) {
            this.context = context;
            this.callerNumber = number;
        }
        
        @Override
        public void onResults(Bundle results) {
            ArrayList<String> matches = results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
            if (matches != null && !matches.isEmpty()) {
                String spokenText = matches.get(0);
                fullTranscript.append(spokenText).append(" ");
                
                // Analyze speech for scam indicators in real-time
                ScamSpeechResult result = analyzeSpeechForScams(spokenText);
                
                if (result.isScamDetected()) {
                    // IMMEDIATE EMERGENCY INTERVENTION
                    EmergencyNotificationManager.showEmergencyIntervention(context,
                        "🚨 SCAM DETECTED DURING CALL!",
                        "Scam phrases detected: " + result.getScamPhrase() + 
                        "\n\nHANG UP IMMEDIATELY!");
                    
                    // Send emergency alert to React Native
                    sendCallEventToReactNative(context, "scamDetected", callerNumber, spokenText);
                }
                
                // Send transcript to React Native for UI updates
                sendCallEventToReactNative(context, "transcript", callerNumber, spokenText);
                
                Log.d(TAG, "Live transcript: " + spokenText);
            }
        }
        
        @Override
        public void onPartialResults(Bundle results) {
            // Handle partial results for real-time processing
            ArrayList<String> matches = results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
            if (matches != null && !matches.isEmpty()) {
                String partialText = matches.get(0);
                
                // Quick scan for emergency scam phrases
                if (containsEmergencyScamPhrases(partialText)) {
                    EmergencyNotificationManager.showInstantAlert(context,
                        "⚠️ SUSPICIOUS PHRASE DETECTED",
                        "Be very careful - potential scam language detected");
                }
            }
        }
        
        private ScamSpeechResult analyzeSpeechForScams(String speech) {
            ScamSpeechResult result = new ScamSpeechResult();
            String lowerSpeech = speech.toLowerCase();
            
            // Critical scam phrases that trigger immediate intervention
            String[] criticalPhrases = {
                "social security number", "ssn", "verify your identity",
                "government refund", "irs audit", "arrest warrant",
                "account suspended", "urgent action required",
                "microsoft tech support", "computer virus",
                "amazon purchase", "cancel subscription",
                "bitcoin", "cryptocurrency", "investment opportunity",
                "wire transfer", "gift card", "itunes card"
            };
            
            for (String phrase : criticalPhrases) {
                if (lowerSpeech.contains(phrase)) {
                    result.setScamDetected(true);
                    result.setScamPhrase(phrase);
                    result.setRiskLevel("critical");
                    break;
                }
            }
            
            return result;
        }
        
        private boolean containsEmergencyScamPhrases(String speech) {
            String[] emergencyPhrases = {
                "social security", "irs", "arrest", "suspended", "urgent",
                "microsoft", "amazon", "refund", "virus", "bitcoin"
            };
            
            String lowerSpeech = speech.toLowerCase();
            for (String phrase : emergencyPhrases) {
                if (lowerSpeech.contains(phrase)) {
                    return true;
                }
            }
            return false;
        }
        
        @Override public void onReadyForSpeech(Bundle params) {}
        @Override public void onBeginningOfSpeech() {}
        @Override public void onRmsChanged(float rmsdB) {}
        @Override public void onBufferReceived(byte[] buffer) {}
        @Override public void onEndOfSpeech() {}
        @Override public void onError(int error) {
            Log.e(TAG, "Speech recognition error: " + error);
            // Restart listening if error occurs
            if (isCallActive) {
                startLiveTranscription(context, callerNumber);
            }
        }
    }
}

class ScamCallerResult {
    private String riskLevel = "low";
    private String reason = "";
    
    public void setRiskLevel(String level) { this.riskLevel = level; }
    public void setReason(String reason) { this.reason = reason; }
    public String getRiskLevel() { return riskLevel; }
    public String getReason() { return reason; }
    
    public boolean isKnownScammer() { return !"low".equals(riskLevel); }
    public boolean isHighRisk() { return "high".equals(riskLevel) || "critical".equals(riskLevel); }
}

class ScamSpeechResult {
    private boolean scamDetected = false;
    private String scamPhrase = "";
    private String riskLevel = "low";
    
    public void setScamDetected(boolean detected) { this.scamDetected = detected; }
    public void setScamPhrase(String phrase) { this.scamPhrase = phrase; }
    public void setRiskLevel(String level) { this.riskLevel = level; }
    
    public boolean isScamDetected() { return scamDetected; }
    public String getScamPhrase() { return scamPhrase; }
    public String getRiskLevel() { return riskLevel; }
}