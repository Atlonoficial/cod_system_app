/**
 * COD System - Native Health Service
 * 
 * Custom plugin bridge for HealthKit (iOS) and Health Connect (Android)
 * 
 * This is a wrapper that will:
 * 1. Check platform capability
 * 2. Handle permissions
 * 3. Query health data
 * 
 * Note: Requires native implementation in iOS and Android projects
 */

import { Capacitor, registerPlugin } from '@capacitor/core';

// Define plugin interface
export interface HealthDataResponse {
    sleepDuration: number;      // hours
    sleepQuality: number;       // 1-10 scale
    deepSleepMinutes?: number;
    remSleepMinutes?: number;
    hrvAverage?: number;        // ms
    restingHeartRate?: number;  // bpm
    lastUpdated: string;        // ISO date
}

export interface HealthPluginInterface {
    isAvailable(): Promise<{ available: boolean }>;
    requestHealthPermissions(): Promise<{ granted: boolean }>;
    getSleepData(options: { startDate: string; endDate: string }): Promise<HealthDataResponse>;
    getHeartRateData(options: { startDate: string; endDate: string }): Promise<{
        avgHRV: number;
        restingHeartRate: number
    }>;
}

// Custom implementation for when native plugin is not available
class MockHealthPlugin implements HealthPluginInterface {
    async isAvailable(): Promise<{ available: boolean }> {
        console.log('[HealthService] Mock plugin - health not available');
        return { available: false };
    }

    async requestHealthPermissions(): Promise<{ granted: boolean }> {
        console.log('[HealthService] Mock plugin - cannot request permissions');
        return { granted: false };
    }

    async getSleepData(): Promise<HealthDataResponse> {
        throw new Error('Health service not available on this platform');
    }

    async getHeartRateData(): Promise<{ avgHRV: number; restingHeartRate: number }> {
        throw new Error('Health service not available on this platform');
    }
}

// Create HealthService with fallback
class HealthServiceImpl {
    private plugin: HealthPluginInterface;
    private isNative: boolean;

    constructor() {
        this.isNative = Capacitor.isNativePlatform();

        if (this.isNative) {
            try {
                // Try to register the native plugin
                this.plugin = registerPlugin<HealthPluginInterface>('HealthService', {
                    web: () => new MockHealthPlugin(),
                    ios: () => import('./health/ios').then(m => m.default),
                    android: () => import('./health/android').then(m => m.default),
                });
            } catch (error) {
                console.warn('[HealthService] Native plugin not available, using mock');
                this.plugin = new MockHealthPlugin();
            }
        } else {
            this.plugin = new MockHealthPlugin();
        }
    }

    /**
     * Check if health services are available on this device
     */
    async isAvailable(): Promise<boolean> {
        if (!this.isNative) return false;
        try {
            const { available } = await this.plugin.isAvailable();
            return available;
        } catch {
            return false;
        }
    }

    /**
     * Request health data permissions from user
     */
    async requestPermissions(): Promise<boolean> {
        if (!this.isNative) return false;
        try {
            const { granted } = await this.plugin.requestHealthPermissions();
            return granted;
        } catch (error) {
            console.error('[HealthService] Permission request failed:', error);
            return false;
        }
    }

    /**
     * Get sleep data from last night
     */
    async getSleepData(): Promise<HealthDataResponse | null> {
        if (!this.isNative) return null;

        try {
            const now = new Date();
            const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

            return await this.plugin.getSleepData({
                startDate: yesterday.toISOString(),
                endDate: now.toISOString()
            });
        } catch (error) {
            console.error('[HealthService] Failed to get sleep data:', error);
            return null;
        }
    }

    /**
     * Get heart rate / HRV data
     */
    async getHRVData(): Promise<{ avgHRV: number; restingHeartRate: number } | null> {
        if (!this.isNative) return null;

        try {
            const now = new Date();
            const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

            return await this.plugin.getHeartRateData({
                startDate: yesterday.toISOString(),
                endDate: now.toISOString()
            });
        } catch (error) {
            console.error('[HealthService] Failed to get HRV data:', error);
            return null;
        }
    }

    /**
     * Get all health data at once
     */
    async getAllHealthData(): Promise<{
        sleep: HealthDataResponse | null;
        hrv: { avgHRV: number; restingHeartRate: number } | null;
    }> {
        const [sleep, hrv] = await Promise.all([
            this.getSleepData(),
            this.getHRVData()
        ]);
        return { sleep, hrv };
    }
}

// Export singleton instance
export const HealthService = new HealthServiceImpl();
export default HealthService;
