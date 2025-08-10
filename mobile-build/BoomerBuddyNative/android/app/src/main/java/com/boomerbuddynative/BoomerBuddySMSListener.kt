package com.boomerbuddynative

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony
import android.telephony.SmsMessage
import android.util.Log
import android.content.SharedPreferences
import org.json.JSONObject
import org.json.JSONArray
import java.net.URL
import java.net.HttpURLConnection
import java.io.BufferedReader
import java.io.InputStreamReader

class BoomerBuddySMSListener : BroadcastReceiver() {
    
    companion object {
        private const val TAG = "BoomerBuddySMS"
        private const val PREFS_NAME = "BoomerBuddyPrefs"
        private const val API_BASE = "https://your-replit-app.replit.app"
    }
    
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Telephony.Sms.Intents.SMS_RECEIVED_ACTION) {
            val smsMessages = Telephony.Sms.Intents.getMessagesFromIntent(intent)
            
            for (smsMessage in smsMessages) {
                val sender = smsMessage.originatingAddress ?: ""
                val messageBody = smsMessage.messageBody ?: ""
                
                Log.d(TAG, "Received SMS from: $sender")
                
                try {
                    // Scrub PII before analysis
                    val scrubbedMessage = scrubPII(messageBody)
                    
                    // Assess SMS risk
                    val riskAssessment = assessSMSRisk(sender, scrubbedMessage)
                    
                    when (riskAssessment.getString("riskLevel")) {
                        "high", "critical" -> {
                            // High-risk SMS detected
                            sendThreatAlert(context, sender, riskAssessment)
                            logSMSInteraction(context, sender, messageBody, "blocked", riskAssessment)
                            
                            // Optionally block SMS (requires system-level permissions)
                            Log.d(TAG, "High-risk SMS detected from: $sender")
                        }
                        "medium" -> {
                            // Medium-risk SMS - warn user
                            sendWarningAlert(context, sender, riskAssessment)
                            logSMSInteraction(context, sender, messageBody, "warned", riskAssessment)
                            
                            Log.d(TAG, "Medium-risk SMS detected from: $sender")
                        }
                        else -> {
                            // Safe SMS
                            logSMSInteraction(context, sender, messageBody, "safe", riskAssessment)
                            Log.d(TAG, "Safe SMS from: $sender")
                        }
                    }
                    
                } catch (e: Exception) {
                    Log.e(TAG, "Error processing SMS: ${e.message}")
                }
            }
        }
    }
    
    private fun scrubPII(message: String): String {
        var scrubbed = message
        
        // Remove Social Security Numbers
        scrubbed = scrubbed.replace(Regex("\\b\\d{3}-?\\d{2}-?\\d{4}\\b"), "[SSN_REMOVED]")
        
        // Remove credit card numbers
        scrubbed = scrubbed.replace(Regex("\\b\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{4}\\b"), "[CARD_REMOVED]")
        
        // Remove email addresses
        scrubbed = scrubbed.replace(Regex("\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b"), "[EMAIL_REMOVED]")
        
        // Remove phone numbers
        scrubbed = scrubbed.replace(Regex("\\b\\(?\\d{3}\\)?[\\s.-]?\\d{3}[\\s.-]?\\d{4}\\b"), "[PHONE_REMOVED]")
        
        return scrubbed
    }
    
    private fun assessSMSRisk(sender: String, message: String): JSONObject {
        return try {
            val url = URL("$API_BASE/v1/analyze")
            val connection = url.openConnection() as HttpURLConnection
            
            connection.requestMethod = "POST"
            connection.setRequestProperty("Content-Type", "application/json")
            connection.doOutput = true
            
            val requestBody = JSONObject().apply {
                put("text", message)
                put("sender", sender)
                put("type", "sms")
                put("timestamp", System.currentTimeMillis())
            }
            
            connection.outputStream.use { outputStream ->
                outputStream.write(requestBody.toString().toByteArray())
            }
            
            val responseCode = connection.responseCode
            if (responseCode == HttpURLConnection.HTTP_OK) {
                val response = BufferedReader(InputStreamReader(connection.inputStream)).use { reader ->
                    reader.readText()
                }
                JSONObject(response)
            } else {
                Log.w(TAG, "API call failed with code: $responseCode")
                createDefaultRiskAssessment("unknown")
            }
            
        } catch (e: Exception) {
            Log.e(TAG, "Failed to assess SMS risk: ${e.message}")
            createDefaultRiskAssessment("error")
        }
    }
    
    private fun createDefaultRiskAssessment(riskLevel: String): JSONObject {
        return JSONObject().apply {
            put("riskLevel", riskLevel)
            put("confidence", 0.0)
            put("threats", JSONArray())
            put("recommendations", JSONArray())
        }
    }
    
    private fun sendThreatAlert(context: Context, sender: String, riskAssessment: JSONObject) {
        val intent = Intent("com.boomerbuddynative.SMS_THREAT_DETECTED").apply {
            putExtra("sender", sender)
            putExtra("riskLevel", riskAssessment.getString("riskLevel"))
            putExtra("confidence", riskAssessment.getDouble("confidence"))
            putExtra("threats", riskAssessment.getJSONArray("threats").toString())
            putExtra("timestamp", System.currentTimeMillis())
        }
        context.sendBroadcast(intent)
    }
    
    private fun sendWarningAlert(context: Context, sender: String, riskAssessment: JSONObject) {
        val intent = Intent("com.boomerbuddynative.SMS_WARNING").apply {
            putExtra("sender", sender)
            putExtra("riskLevel", riskAssessment.getString("riskLevel"))
            putExtra("confidence", riskAssessment.getDouble("confidence"))
            putExtra("timestamp", System.currentTimeMillis())
        }
        context.sendBroadcast(intent)
    }
    
    private fun logSMSInteraction(
        context: Context, 
        sender: String, 
        message: String, 
        action: String, 
        riskAssessment: JSONObject
    ) {
        val prefs: SharedPreferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val editor = prefs.edit()
        
        val logEntry = JSONObject().apply {
            put("sender", sender)
            put("messagePreview", message.take(50) + if (message.length > 50) "..." else "")
            put("action", action)
            put("riskLevel", riskAssessment.getString("riskLevel"))
            put("confidence", riskAssessment.getDouble("confidence"))
            put("timestamp", System.currentTimeMillis())
        }
        
        val existingLogs = prefs.getString("smsLogs", "[]")
        val logsArray = JSONArray(existingLogs)
        logsArray.put(logEntry)
        
        // Keep only last 100 entries
        while (logsArray.length() > 100) {
            logsArray.remove(0)
        }
        
        editor.putString("smsLogs", logsArray.toString())
        editor.apply()
    }
}