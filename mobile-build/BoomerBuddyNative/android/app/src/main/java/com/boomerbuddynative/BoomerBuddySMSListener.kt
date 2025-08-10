package com.boomerbuddynative

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.telephony.SmsMessage
import android.util.Log
import android.app.NotificationManager
import android.app.NotificationChannel
import androidx.core.app.NotificationCompat
import java.util.regex.Pattern

/**
 * Boomer Buddy SMS Listener
 * Monitors incoming SMS messages for scam patterns and threats
 */
class BoomerBuddySMSListener : BroadcastReceiver() {
    
    companion object {
        private const val TAG = "BoomerBuddySMS"
        private const val SMS_RECEIVED = "android.provider.Telephony.SMS_RECEIVED"
        private const val CHANNEL_ID = "sms_threats"
        private const val NOTIFICATION_ID = 2001
    }
    
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == SMS_RECEIVED) {
            try {
                val bundle = intent.extras
                if (bundle != null) {
                    val pdus = bundle.get("pdus") as Array<*>?
                    val format = bundle.getString("format")
                    
                    pdus?.forEach { pdu ->
                        val smsMessage = SmsMessage.createFromPdu(pdu as ByteArray, format)
                        val messageBody = smsMessage.messageBody
                        val sender = smsMessage.originatingAddress ?: "Unknown"
                        
                        Log.d(TAG, "SMS received from $sender")
                        
                        // Analyze message for threats
                        val riskAssessment = analyzeSMSContent(messageBody, sender)
                        
                        when (riskAssessment.riskLevel) {
                            "critical", "high" -> {
                                // Block/warn about high-risk SMS
                                showSMSThreatNotification(context, sender, riskAssessment)
                                sendSMSEventToReactNative(context, "SMS_THREAT_DETECTED", sender, riskAssessment)
                                
                                // Optionally abort broadcast to prevent message from showing
                                if (riskAssessment.riskLevel == "critical") {
                                    Log.d(TAG, "Blocking critical threat SMS from $sender")
                                    abortBroadcast()
                                }
                            }
                            
                            "medium" -> {
                                // Warning for medium risk
                                showSMSWarningNotification(context, sender, riskAssessment)
                                sendSMSEventToReactNative(context, "SMS_WARNING", sender, riskAssessment)
                            }
                            
                            else -> {
                                // Allow safe messages
                                Log.d(TAG, "SMS from $sender appears safe")
                            }
                        }
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error processing SMS: ${e.message}", e)
            }
        }
    }
    
    private data class SMSRiskAssessment(
        val riskLevel: String,
        val confidence: Double,
        val threats: List<String>,
        val scamType: String?,
        val timestamp: Long = System.currentTimeMillis()
    )
    
    private fun analyzeSMSContent(messageBody: String, sender: String): SMSRiskAssessment {
        val threats = mutableListOf<String>()
        var riskScore = 0
        var scamType: String? = null
        
        val lowerMessage = messageBody.lowercase()
        
        // Financial scam patterns
        val financialKeywords = listOf(
            "wire money", "western union", "moneygram", "gift card", "bitcoin",
            "cryptocurrency", "inheritance", "lottery", "sweepstakes", "prize",
            "refund", "overpayment", "tax refund", "stimulus"
        )
        
        financialKeywords.forEach { keyword ->
            if (lowerMessage.contains(keyword)) {
                threats.add("Financial scam indicator: $keyword")
                riskScore += 15
                scamType = "Financial Scam"
            }
        }
        
        // Urgency patterns
        val urgencyKeywords = listOf(
            "urgent", "immediate", "expires today", "limited time", "act now",
            "don't delay", "final notice", "last chance", "expires soon"
        )
        
        urgencyKeywords.forEach { keyword ->
            if (lowerMessage.contains(keyword)) {
                threats.add("High-pressure tactic: $keyword")
                riskScore += 10
            }
        }
        
        // Authority impersonation
        val authorityKeywords = listOf(
            "irs", "fbi", "police", "sheriff", "medicare", "social security",
            "government", "federal", "treasury", "department"
        )
        
        authorityKeywords.forEach { keyword ->
            if (lowerMessage.contains(keyword)) {
                threats.add("Authority impersonation: $keyword")
                riskScore += 20
                scamType = "Government Impersonation"
            }
        }
        
        // Phishing patterns
        val phishingKeywords = listOf(
            "verify account", "suspended account", "click here", "update payment",
            "confirm identity", "security alert", "unusual activity"
        )
        
        phishingKeywords.forEach { keyword ->
            if (lowerMessage.contains(keyword)) {
                threats.add("Phishing attempt: $keyword")
                riskScore += 15
                scamType = "Phishing"
            }
        }
        
        // Personal information requests
        val personalInfoKeywords = listOf(
            "social security number", "ssn", "bank account", "routing number",
            "credit card", "password", "pin number", "date of birth"
        )
        
        personalInfoKeywords.forEach { keyword ->
            if (lowerMessage.contains(keyword)) {
                threats.add("Requests personal information: $keyword")
                riskScore += 25
            }
        }
        
        // Suspicious URLs
        val urlPattern = Pattern.compile("http[s]?://[^\\s]+")
        val urlMatcher = urlPattern.matcher(messageBody)
        while (urlMatcher.find()) {
            val url = urlMatcher.group()
            if (url.contains("bit.ly") || url.contains("tinyurl") || url.contains("t.co")) {
                threats.add("Suspicious shortened URL")
                riskScore += 15
            }
        }
        
        // Phone number patterns (callback scams)
        val phonePattern = Pattern.compile("\\b\\d{3}[-.]?\\d{3}[-.]?\\d{4}\\b")
        val phoneMatcher = phonePattern.matcher(messageBody)
        while (phoneMatcher.find()) {
            val phone = phoneMatcher.group()
            if (phone.startsWith("900") || phone.startsWith("976")) {
                threats.add("Premium rate callback number")
                riskScore += 30
                scamType = "Callback Scam"
            }
        }
        
        // Check sender patterns
        when {
            sender.startsWith("+1900") || sender.startsWith("+1976") -> {
                threats.add("Premium rate sender")
                riskScore += 25
            }
            
            sender.length > 15 || sender.contains("@") -> {
                threats.add("Suspicious sender format")
                riskScore += 15
            }
            
            // Known spam shortcodes
            listOf("32665", "40404", "742742").contains(sender) -> {
                // These are actually legitimate (Facebook, Twitter, etc.)
                riskScore -= 10
            }
        }
        
        // Grammar and spelling issues (simple check)
        val grammarIssues = countGrammarIssues(messageBody)
        if (grammarIssues > 3) {
            threats.add("Poor grammar/spelling")
            riskScore += 10
        }
        
        // Determine risk level
        val riskLevel = when {
            riskScore >= 50 -> "critical"
            riskScore >= 30 -> "high"
            riskScore >= 15 -> "medium"
            else -> "low"
        }
        
        val confidence = when (riskLevel) {
            "critical" -> 0.95
            "high" -> 0.85
            "medium" -> 0.75
            else -> 0.6
        }
        
        return SMSRiskAssessment(riskLevel, confidence, threats, scamType)
    }
    
    private fun countGrammarIssues(text: String): Int {
        var issues = 0
        
        // Simple heuristics
        if (!text.trim().matches(Regex("^[A-Z].*"))) issues++ // Doesn't start with capital
        if (!text.trim().matches(Regex(".*[.!?]$"))) issues++ // Doesn't end with punctuation
        if (text.contains(Regex("!{2,}"))) issues++ // Multiple exclamation marks
        if (text.contains(Regex("[A-Z]{10,}"))) issues++ // Excessive caps
        
        return issues
    }
    
    private fun showSMSThreatNotification(context: Context, sender: String, assessment: SMSRiskAssessment) {
        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        
        val channel = NotificationChannel(
            CHANNEL_ID,
            "SMS Threat Alerts",
            NotificationManager.IMPORTANCE_HIGH
        ).apply {
            description = "Notifications for suspicious SMS messages"
        }
        notificationManager.createNotificationChannel(channel)
        
        val notification = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_email)
            .setContentTitle("🛡️ SMS Threat Detected")
            .setContentText("Suspicious message from $sender")
            .setStyle(NotificationCompat.BigTextStyle()
                .bigText("Detected ${assessment.scamType ?: "threat"} from $sender\n\nThreats: ${assessment.threats.joinToString(", ")}\nRisk: ${assessment.riskLevel.uppercase()}"))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .build()
        
        notificationManager.notify(NOTIFICATION_ID, notification)
    }
    
    private fun showSMSWarningNotification(context: Context, sender: String, assessment: SMSRiskAssessment) {
        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        
        val channel = NotificationChannel(
            CHANNEL_ID,
            "SMS Threat Alerts",
            NotificationManager.IMPORTANCE_DEFAULT
        )
        notificationManager.createNotificationChannel(channel)
        
        val notification = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_alert)
            .setContentTitle("⚠️ Suspicious SMS")
            .setContentText("Warning: Message from $sender may be suspicious")
            .setStyle(NotificationCompat.BigTextStyle()
                .bigText("Message from $sender may be suspicious\n\nConcerns: ${assessment.threats.joinToString(", ")}\nBe cautious with any links or requests."))
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setAutoCancel(true)
            .build()
        
        notificationManager.notify(NOTIFICATION_ID + 1, notification)
    }
    
    private fun sendSMSEventToReactNative(context: Context, eventName: String, sender: String, assessment: SMSRiskAssessment) {
        try {
            // This would normally send events to React Native
            Log.d(TAG, "Sending SMS event to RN: $eventName from $sender - ${assessment.riskLevel}")
            
            // In a full implementation, you'd emit events to React Native here
            
        } catch (e: Exception) {
            Log.e(TAG, "Failed to send SMS event to React Native: ${e.message}")
        }
    }
}