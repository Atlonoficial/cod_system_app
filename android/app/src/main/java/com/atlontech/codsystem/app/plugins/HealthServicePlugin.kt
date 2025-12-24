package com.atlontech.codsystem.app.plugins

import android.util.Log
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.HeartRateRecord
import androidx.health.connect.client.records.HeartRateVariabilityRmssdRecord
import androidx.health.connect.client.records.SleepSessionRecord
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.time.Instant
import java.time.Duration

/**
 * COD System - HealthService Plugin (Android)
 *
 * Native plugin for Health Connect integration.
 * Provides sleep, HRV, and heart rate data to the web layer.
 *
 * SETUP REQUIRED:
 * 1. Add Health Connect SDK dependency in build.gradle
 * 2. Add permissions in AndroidManifest.xml
 * 3. Register this plugin in MainActivity.kt
 */
@CapacitorPlugin(name = "HealthService")
class HealthServicePlugin : Plugin() {
    private val TAG = "HealthServicePlugin"
    private var healthConnectClient: HealthConnectClient? = null

    override fun load() {
        super.load()
        try {
            if (HealthConnectClient.getSdkStatus(context) == HealthConnectClient.SDK_AVAILABLE) {
                healthConnectClient = HealthConnectClient.getOrCreate(context)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to initialize Health Connect: ${e.message}")
        }
    }

    @PluginMethod
    fun isAvailable(call: PluginCall) {
        val available = HealthConnectClient.getSdkStatus(context) == HealthConnectClient.SDK_AVAILABLE
        val result = JSObject()
        result.put("available", available)
        call.resolve(result)
    }

    @PluginMethod
    fun requestPermissions(call: PluginCall) {
        val client = healthConnectClient
        if (client == null) {
            val result = JSObject()
            result.put("granted", false)
            call.resolve(result)
            return
        }

        val permissions = setOf(
            HealthPermission.getReadPermission(SleepSessionRecord::class),
            HealthPermission.getReadPermission(HeartRateRecord::class),
            HealthPermission.getReadPermission(HeartRateVariabilityRmssdRecord::class)
        )

        CoroutineScope(Dispatchers.Main).launch {
            try {
                val granted = client.permissionController.getGrantedPermissions()
                val allGranted = permissions.all { it in granted }
                
                if (!allGranted) {
                    // Request permissions through activity - user must manually grant
                    val result = JSObject()
                    result.put("granted", false)
                    result.put("message", "Please grant Health Connect permissions in device settings")
                    call.resolve(result)
                } else {
                    val result = JSObject()
                    result.put("granted", true)
                    call.resolve(result)
                }
            } catch (e: Exception) {
                Log.e(TAG, "Permission check failed: ${e.message}")
                val result = JSObject()
                result.put("granted", false)
                call.resolve(result)
            }
        }
    }

    @PluginMethod
    fun getSleepData(call: PluginCall) {
        val client = healthConnectClient
        if (client == null) {
            call.reject("Health Connect not available")
            return
        }

        val startDateStr = call.getString("startDate") ?: run {
            call.reject("startDate is required")
            return
        }
        val endDateStr = call.getString("endDate") ?: run {
            call.reject("endDate is required")
            return
        }

        CoroutineScope(Dispatchers.IO).launch {
            try {
                val startTime = Instant.parse(startDateStr)
                val endTime = Instant.parse(endDateStr)

                val request = ReadRecordsRequest(
                    recordType = SleepSessionRecord::class,
                    timeRangeFilter = TimeRangeFilter.between(startTime, endTime)
                )

                val response = client.readRecords(request)
                
                var totalSleepSeconds = 0L
                var deepSleepSeconds = 0L
                var remSleepSeconds = 0L

                for (session in response.records) {
                    val sessionDuration = Duration.between(session.startTime, session.endTime).seconds
                    totalSleepSeconds += sessionDuration

                    // Parse sleep stages if available
                    for (stage in session.stages) {
                        val stageDuration = Duration.between(stage.startTime, stage.endTime).seconds
                        when (stage.stage) {
                            SleepSessionRecord.STAGE_TYPE_DEEP -> deepSleepSeconds += stageDuration
                            SleepSessionRecord.STAGE_TYPE_REM -> remSleepSeconds += stageDuration
                        }
                    }
                }

                val sleepHours = totalSleepSeconds / 3600.0
                
                // Calculate quality (1-10 scale)
                var quality = minOf(10.0, maxOf(1.0, sleepHours / 8.0 * 10))
                val deepRemRatio = (deepSleepSeconds + remSleepSeconds).toDouble() / maxOf(1, totalSleepSeconds)
                quality = quality * (0.6 + deepRemRatio * 0.4)

                val result = JSObject()
                result.put("sleepDuration", sleepHours)
                result.put("sleepQuality", quality.toInt())
                result.put("deepSleepMinutes", (deepSleepSeconds / 60).toInt())
                result.put("remSleepMinutes", (remSleepSeconds / 60).toInt())
                result.put("lastUpdated", Instant.now().toString())

                CoroutineScope(Dispatchers.Main).launch {
                    call.resolve(result)
                }
            } catch (e: Exception) {
                Log.e(TAG, "Failed to get sleep data: ${e.message}")
                CoroutineScope(Dispatchers.Main).launch {
                    call.reject("Failed to get sleep data: ${e.message}")
                }
            }
        }
    }

    @PluginMethod
    fun getHeartRateData(call: PluginCall) {
        val client = healthConnectClient
        if (client == null) {
            call.reject("Health Connect not available")
            return
        }

        val startDateStr = call.getString("startDate") ?: run {
            call.reject("startDate is required")
            return
        }
        val endDateStr = call.getString("endDate") ?: run {
            call.reject("endDate is required")
            return
        }

        CoroutineScope(Dispatchers.IO).launch {
            try {
                val startTime = Instant.parse(startDateStr)
                val endTime = Instant.parse(endDateStr)

                // Get HRV data
                val hrvRequest = ReadRecordsRequest(
                    recordType = HeartRateVariabilityRmssdRecord::class,
                    timeRangeFilter = TimeRangeFilter.between(startTime, endTime)
                )
                val hrvResponse = client.readRecords(hrvRequest)
                val avgHRV = if (hrvResponse.records.isNotEmpty()) {
                    hrvResponse.records.map { it.heartRateVariabilityMillis }.average()
                } else 0.0

                // Get resting heart rate
                val hrRequest = ReadRecordsRequest(
                    recordType = HeartRateRecord::class,
                    timeRangeFilter = TimeRangeFilter.between(startTime, endTime)
                )
                val hrResponse = client.readRecords(hrRequest)
                val restingHR = if (hrResponse.records.isNotEmpty()) {
                    hrResponse.records
                        .flatMap { it.samples }
                        .minOfOrNull { it.beatsPerMinute } ?: 0L
                } else 0L

                val result = JSObject()
                result.put("avgHRV", avgHRV)
                result.put("restingHeartRate", restingHR.toInt())

                CoroutineScope(Dispatchers.Main).launch {
                    call.resolve(result)
                }
            } catch (e: Exception) {
                Log.e(TAG, "Failed to get heart rate data: ${e.message}")
                CoroutineScope(Dispatchers.Main).launch {
                    call.reject("Failed to get heart rate data: ${e.message}")
                }
            }
        }
    }
}
