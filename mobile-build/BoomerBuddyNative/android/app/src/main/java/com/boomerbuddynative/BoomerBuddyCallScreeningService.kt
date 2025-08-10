package com.boomerbuddynative

import android.telecom.CallScreeningService
import android.telecom.Call
import android.util.Log
import android.app.NotificationManager
import android.app.NotificationChannel
import android.content.Context
import androidx.core.app.NotificationCompat
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.Arguments
import com.facebook.react.modules.core.DeviceEventManagerModule

/**
 * Boomer Buddy Call Screening Service
 * Provides real-time call analysis and threat protection
 */
class BoomerBuddyCallScreeningService : CallScreeningService() {
    
    companion object {
        private const val TAG = "BoomerBuddyCallScreen"
        private const val CHANNEL_ID = "threat_alerts"
        private const val NOTIFICATION_ID = 1001
    }

    override fun onScreenCall(callDetails: Call.Details) {
        val phoneNumber = callDetails.handle?.schemeSpecificPart ?: "Unknown"
        Log.d(TAG, "Screening incoming call: $phoneNumber")
        
        try {
            // Perform risk assessment
            val riskAssessment = assessCallRisk(phoneNumber, callDetails)
            
            // Create response based on risk level
            val response = when (riskAssessment.riskLevel) {
                "critical" -> {
                    // Block high-risk calls
                    showThreatNotification(phoneNumber, riskAssessment)
                    sendEventToReactNative("THREAT_BLOCKED", riskAssessment)
                    
                    Call.CallResponse.Builder()
                        .setDisallowCall(true)
                        .setRejectCall(true)
                        .setSkipNotification(false)
                        .setSkipCallLog(false)
                        .build()
                }
                
                "high" -> {
                    // Warn but allow
                    showWarningNotification(phoneNumber, riskAssessment)
                    sendEventToReactNative("CALL_WARNING", riskAssessment)
                    
                    Call.CallResponse.Builder()
                        .setDisallowCall(false)
                        .setRejectCall(false)
                        .setSkipNotification(false)
                        .setSkipCallLog(false)
                        .build()
                }
                
                else -> {
                    // Allow safe calls
                    Call.CallResponse.Builder()
                        .setDisallowCall(false)
                        .setRejectCall(false)
                        .build()
                }
            }
            
            respondToCall(callDetails, response)
            
        } catch (e: Exception) {
            Log.e(TAG, "Error screening call: ${e.message}", e)
            
            // Default to allowing call if analysis fails
            val safeResponse = Call.CallResponse.Builder()
                .setDisallowCall(false)
                .setRejectCall(false)
                .build()
            
            respondToCall(callDetails, safeResponse)
        }
    }
    
    private data class RiskAssessment(
        val riskLevel: String,
        val confidence: Double,
        val threats: List<String>,
        val timestamp: Long = System.currentTimeMillis()
    )
    
    private fun assessCallRisk(phoneNumber: String, callDetails: Call.Details): RiskAssessment {
        val threats = mutableListOf<String>()
        var riskScore = 0
        
        // Basic risk assessment patterns
        when {
            // Premium rate numbers
            phoneNumber.startsWith("900") || phoneNumber.startsWith("976") -> {
                threats.add("Premium rate number")
                riskScore += 40
            }
            
            // International premium codes
            phoneNumber.startsWith("+1809") || phoneNumber.startsWith("+1829") || 
            phoneNumber.startsWith("+1849") || phoneNumber.startsWith("+1473") -> {
                threats.add("International premium rate")
                riskScore += 35
            }
            
            // Sequential or repeated patterns (often spoofed)
            phoneNumber.contains("0123456789") || phoneNumber.contains("9876543210") ||
            Regex("(\\d)\\1{4,}").containsMatchIn(phoneNumber) -> {
                threats.add("Suspicious number pattern")
                riskScore += 25
            }
            
            // Very short or invalid formats
            phoneNumber.replace("[^0-9]".toRegex(), "").length < 10 -> {
                threats.add("Invalid number format")
                riskScore += 20
            }
        }
        
        // Check against local blacklist (would be loaded from storage/server)
        val blacklistedNumbers = setOf("5551234567", "8005551234") // Example
        if (blacklistedNumbers.contains(phoneNumber.replace("[^0-9]".toRegex(), ""))) {
            threats.add("Number on blacklist")
            riskScore += 50
        }
        
        // Determine risk level
        val riskLevel = when {
            riskScore >= 40 -> "critical"
            riskScore >= 25 -> "high"
            riskScore >= 15 -> "medium"
            else -> "low"
        }
        
        val confidence = when (riskLevel) {
            "critical" -> 0.95
            "high" -> 0.85
            "medium" -> 0.75
            else -> 0.6
        }
        
        return RiskAssessment(riskLevel, confidence, threats)
    }
    
    private fun showThreatNotification(phoneNumber: String, assessment: RiskAssessment) {
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        
        // Create notification channel
        val channel = NotificationChannel(
            CHANNEL_ID,
            "Threat Alerts",
            NotificationManager.IMPORTANCE_HIGH
        ).apply {
            description = "Notifications for blocked scam calls and threats"
        }
        notificationManager.createNotificationChannel(channel)
        
        // Build notification
        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_menu_call) // Use system icon for now
            .setContentTitle("🛡️ Threat Blocked")
            .setContentText("Blocked suspicious call from $phoneNumber")
            .setStyle(NotificationCompat.BigTextStyle()
                .bigText("Blocked call from $phoneNumber\n\nThreats: ${assessment.threats.joinString(", ")}\nRisk: ${assessment.riskLevel.uppercase()}"))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .build()
        
        notificationManager.notify(NOTIFICATION_ID, notification)
    }
    
    private fun showWarningNotification(phoneNumber: String, assessment: RiskAssessment) {
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        
        val channel = NotificationChannel(
            CHANNEL_ID,
            "Threat Alerts", 
            NotificationManager.IMPORTANCE_DEFAULT
        )
        notificationManager.createNotificationChannel(channel)
        
        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_alert)
            .setContentTitle("⚠️ Suspicious Call")
            .setContentText("Warning: Potential threat from $phoneNumber")
            .setStyle(NotificationCompat.BigTextStyle()
                .bigText("Call from $phoneNumber may be suspicious\n\nConcerns: ${assessment.threats.joinToString(", ")}\nBe cautious when answering."))
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setAutoCancel(true)
            .build()
        
        notificationManager.notify(NOTIFICATION_ID + 1, notification)
    }
    
    private fun sendEventToReactNative(eventName: String, assessment: RiskAssessment) {
        try {
            // This would normally use ReactApplicationContext to send events
            // For now, just log the event
            Log.d(TAG, "Sending event to RN: $eventName - ${assessment.riskLevel}")
            
            // In a full implementation, you'd emit events like:
            // reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            //     .emit(eventName, eventData)
            
        } catch (e: Exception) {
            Log.e(TAG, "Failed to send event to React Native: ${e.message}")
        }
    }
}