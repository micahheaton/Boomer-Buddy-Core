package com.boomerbuddynative

import android.telecom.CallScreeningService
import android.telecom.Call
import android.util.Log
import android.content.Context
import android.content.SharedPreferences
import org.json.JSONObject
import java.net.URL
import java.io.BufferedReader
import java.io.InputStreamReader
import java.net.HttpURLConnection

class BoomerBuddyCallScreeningService : CallScreeningService() {
    
    companion object {
        private const val TAG = "BoomerBuddyCallScreen"
        private const val PREFS_NAME = "BoomerBuddyPrefs"
        private const val API_BASE = "https://your-replit-app.replit.app"
    }
    
    override fun onScreenCall(callDetails: Call.Details) {
        val number = callDetails.handle?.schemeSpecificPart ?: ""
        Log.d(TAG, "Screening incoming call: $number")
        
        try {
            // Get risk assessment from our backend
            val riskLevel = assessCallRisk(number)
            
            // Create response based on risk level
            val responseBuilder = CallResponse.Builder()
            
            when (riskLevel) {
                "high", "critical" -> {
                    // Block high-risk calls
                    responseBuilder
                        .setDisallowCall(true)
                        .setRejectCall(true)
                        .setSkipCallLog(false)
                        .setSkipNotification(false)
                    
                    Log.d(TAG, "Blocked high-risk call from: $number")
                    
                    // Send notification to user
                    sendThreatNotification(number, riskLevel)
                }
                "medium" -> {
                    // Allow but warn user
                    responseBuilder
                        .setDisallowCall(false)
                        .setRejectCall(false)
                        .setSkipCallLog(false)
                        .setSkipNotification(false)
                    
                    Log.d(TAG, "Allowing medium-risk call with warning: $number")
                    sendWarningNotification(number)
                }
                else -> {
                    // Allow safe calls
                    responseBuilder
                        .setDisallowCall(false)
                        .setRejectCall(false)
                        .setSkipCallLog(false)
                        .setSkipNotification(false)
                    
                    Log.d(TAG, "Allowing safe call: $number")
                }
            }
            
            respondToCall(callDetails, responseBuilder.build())
            
            // Log the interaction for user review
            logCallInteraction(number, riskLevel)
            
        } catch (e: Exception) {
            Log.e(TAG, "Error screening call: ${e.message}")
            
            // Default to allow call if error occurs
            val responseBuilder = CallResponse.Builder()
                .setDisallowCall(false)
                .setRejectCall(false)
            
            respondToCall(callDetails, responseBuilder.build())
        }
    }
    
    private fun assessCallRisk(phoneNumber: String): String {
        return try {
            // Call our backend risk assessment API
            val url = URL("$API_BASE/v1/assess-call")
            val connection = url.openConnection() as HttpURLConnection
            
            connection.requestMethod = "POST"
            connection.setRequestProperty("Content-Type", "application/json")
            connection.doOutput = true
            
            val requestBody = JSONObject().apply {
                put("phoneNumber", phoneNumber)
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
                
                val jsonResponse = JSONObject(response)
                jsonResponse.getString("riskLevel")
            } else {
                Log.w(TAG, "API call failed with code: $responseCode")
                "unknown"
            }
            
        } catch (e: Exception) {
            Log.e(TAG, "Failed to assess call risk: ${e.message}")
            "unknown"
        }
    }
    
    private fun sendThreatNotification(phoneNumber: String, riskLevel: String) {
        // Send high-priority notification about blocked threat
        val intent = android.content.Intent("com.boomerbuddynative.THREAT_BLOCKED").apply {
            putExtra("phoneNumber", phoneNumber)
            putExtra("riskLevel", riskLevel)
            putExtra("timestamp", System.currentTimeMillis())
        }
        sendBroadcast(intent)
    }
    
    private fun sendWarningNotification(phoneNumber: String) {
        // Send warning notification about potential threat
        val intent = android.content.Intent("com.boomerbuddynative.CALL_WARNING").apply {
            putExtra("phoneNumber", phoneNumber)
            putExtra("timestamp", System.currentTimeMillis())
        }
        sendBroadcast(intent)
    }
    
    private fun logCallInteraction(phoneNumber: String, riskLevel: String) {
        val prefs: SharedPreferences = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val editor = prefs.edit()
        
        val logEntry = JSONObject().apply {
            put("phoneNumber", phoneNumber)
            put("riskLevel", riskLevel)
            put("timestamp", System.currentTimeMillis())
            put("action", if (riskLevel == "high" || riskLevel == "critical") "blocked" else "allowed")
        }
        
        // Store in local history for user review
        val existingLogs = prefs.getString("callLogs", "[]")
        val logsArray = org.json.JSONArray(existingLogs)
        logsArray.put(logEntry)
        
        editor.putString("callLogs", logsArray.toString())
        editor.apply()
    }
}