/**
 * ═══════════════════════════════════════════════════════════════════════════
 * COD System - Health Service (Build 40 - DEFINITIVE FIX)
 * ═══════════════════════════════════════════════════════════════════════════
 * @copyright (c) 2024-2026 Atlon Tech (CNPJ: 58.079.600/0001-77)
 * 
 * Uses @capgo/capacitor-health plugin for unified access to:
 * - iOS: Apple HealthKit
 * - Android: Health Connect 
 * 
 * BUILD 40 FIX: Eliminated dynamic imports that caused await to hang on iOS
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { Capacitor } from '@capacitor/core';
import { debugLog } from '@/lib/debugLogger';
import { Health } from '@capgo/capacitor-health'; // ✅ DIRECT IMPORT - NO MORE await hang!

// Types
export interface HealthDataResponse {
    sleepDuration: number;      // hours
    sleepQuality: number;       // 1-10 scale
    deepSleepMinutes?: number;
    remSleepMinutes?: number;
    hrvAverage?: number;        // ms
    restingHeartRate?: number;  // bpm
    lastUpdated: string;        // ISO date
}

/**
 * BUILD 43: Simplified - Feature temporarily disabled (Em Breve)
 * Will be enabled when configured via Xcode
 */
export async function requestHealthPermissionsGlobal(): Promise<boolean> {
    const isNative = Capacitor.isNativePlatform();

    if (!isNative) {
        return false;
    }

    if (typeof Health === 'undefined' || !Health) {
        console.error('Health plugin unavailable');
        return false;
    }

    try {
        // Check availability first
        const availResult = await Health.isAvailable();
        if (!(availResult as any)?.available) {
            return false;
        }

        // Request authorization with 30s timeout
        const authPromise = Health.requestAuthorization({
            read: ['steps'],
            write: []
        });

        const result = await Promise.race([
            authPromise,
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('AUTH_REQUEST_TIMEOUT_30S')), 30000)
            )
        ]);

        const success = (result as any)?.status === 'authorized' ||
            (result as any)?.status === 'limited' ||
            (result as any)?.authorized === true;

        return success;

    } catch (e) {
        console.error('HealthKit error:', (e as Error).message);
        return false;
    }
}

class HealthServiceImpl {
    private isNative: boolean;
    private platform: 'ios' | 'android' | 'web';

    constructor() {
        this.isNative = Capacitor.isNativePlatform();
        this.platform = Capacitor.getPlatform() as 'ios' | 'android' | 'web';
        console.log(`[HealthService] Initialized - Platform: ${this.platform}, Native: ${this.isNative}`);
    }

    /**
     * Check if health services are available on this device
     */
    async isAvailable(): Promise<boolean> {
        if (!this.isNative) {
            console.log('[HealthService] Not native platform - health not available');
            return false;
        }

        try {
            if (!Health) {
                return false;
            }
            const result = await Health.isAvailable();
            return (result as any).available === true;
        } catch (error) {
            console.error('[HealthService] Check availability failed:', error);
            return false;
        }
    }
    /**
     * Request health data permissions from user
     * BUILD 43: Simplified - uses global function
     */
    async requestPermissions(): Promise<boolean> {
        if (!this.isNative) {
            return false;
        }

        return requestHealthPermissionsGlobal();
    }

    /**
     * Get sleep data from last night
     * Note: Sleep data may require additional permissions/setup
     */
    async getSleepData(): Promise<HealthDataResponse | null> {
        if (!this.isNative) return null;

        try {
            if (!Health) return null;

            const now = new Date();
            const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

            // Try to get sleep data directly
            try {
                const { samples } = await (Health as any).readSamples({
                    dataType: 'sleep',
                    startDate: yesterday.toISOString(),
                    endDate: now.toISOString(),
                    limit: 50
                });

                if (samples && samples.length > 0) {
                    console.log('[HealthService] Sleep samples found:', samples.length);

                    // Calculate total sleep duration
                    let totalMinutes = 0;
                    let deepSleepMinutes = 0;
                    let remSleepMinutes = 0;

                    samples.forEach((s: any) => {
                        const duration = s.duration || s.value || 0;
                        totalMinutes += duration;

                        if (s.type === 'deep' || s.stage === 'deep') {
                            deepSleepMinutes += duration;
                        }
                        if (s.type === 'rem' || s.stage === 'rem') {
                            remSleepMinutes += duration;
                        }
                    });

                    const sleepHours = totalMinutes / 60;
                    const sleepQuality = Math.min(10, Math.max(1, Math.round((deepSleepMinutes / 60) * 2)));

                    return {
                        sleepDuration: Math.round(sleepHours * 10) / 10,
                        sleepQuality,
                        deepSleepMinutes: Math.round(deepSleepMinutes),
                        remSleepMinutes: Math.round(remSleepMinutes),
                        lastUpdated: new Date().toISOString()
                    };
                }
            } catch (e) {
                console.log('[HealthService] Sleep data fetch failed, trying heart rate fallback:', e);
            }

            // Fallback: Use heart rate data as proxy for sleep quality
            try {
                const { samples } = await (Health as any).readSamples({
                    dataType: 'heartRate',
                    startDate: yesterday.toISOString(),
                    endDate: now.toISOString(),
                    limit: 100
                });

                if (samples && samples.length > 0) {
                    const values = samples.map((s: any) => s.value);
                    const minHR = Math.min(...values);

                    // Estimate sleep quality based on resting heart rate
                    const sleepQuality = Math.min(10, Math.max(1, 10 - ((minHR - 50) / 5)));

                    return {
                        sleepDuration: 7.5, // Placeholder - needs Apple Watch/wearable
                        sleepQuality: Math.round(sleepQuality),
                        restingHeartRate: Math.round(minHR),
                        lastUpdated: new Date().toISOString()
                    };
                }
            } catch (e) {
                console.log('[HealthService] Heart rate data unavailable:', e);
            }

            return null;
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
            if (!Health) return null;

            const now = new Date();
            const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

            let restingHR = 0;
            let avgHRV = 0;

            // Get heart rate samples
            try {
                const { samples } = await (Health as any).readSamples({
                    dataType: 'heartRate',
                    startDate: yesterday.toISOString(),
                    endDate: now.toISOString(),
                    limit: 100
                });

                if (samples && samples.length > 0) {
                    const values = samples.map((s: any) => s.value);
                    restingHR = Math.round(Math.min(...values));
                    console.log('[HealthService] Resting HR:', restingHR);
                }
            } catch (e) {
                console.warn('[HealthService] Heart rate fetch failed:', e);
            }

            // Try to get HRV data directly
            try {
                const { samples } = await (Health as any).readSamples({
                    dataType: 'heartRateVariability',
                    startDate: yesterday.toISOString(),
                    endDate: now.toISOString(),
                    limit: 50
                });

                if (samples && samples.length > 0) {
                    const values = samples.map((s: any) => s.value);
                    avgHRV = Math.round(values.reduce((a: number, b: number) => a + b, 0) / values.length);
                    console.log('[HealthService] Actual HRV:', avgHRV);
                }
            } catch (e) {
                console.log('[HealthService] HRV direct fetch failed, estimating from HR');
            }

            if (restingHR === 0) {
                return null;
            }

            // If no HRV data, estimate from resting HR
            if (avgHRV === 0) {
                avgHRV = Math.max(20, 100 - restingHR);
            }

            return {
                avgHRV,
                restingHeartRate: restingHR
            };
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
        console.log('[HealthService] Getting all health data...');

        const [sleep, hrv] = await Promise.all([
            this.getSleepData(),
            this.getHRVData()
        ]);

        console.log('[HealthService] Results - Sleep:', !!sleep, 'HRV:', !!hrv);
        return { sleep, hrv };
    }

    /**
     * Get current connection status
     */
    async getConnectionStatus(): Promise<{
        connected: boolean;
        platform: string;
        available: boolean;
        hasPermissions: boolean;
    }> {
        const available = await this.isAvailable();

        // If available, try to read some data to check if we have active permissions
        let hasPermissions = false;
        if (available) {
            try {
                const data = await this.getHRVData();
                hasPermissions = data !== null;
            } catch {
                hasPermissions = false;
            }
        }

        return {
            connected: hasPermissions,
            platform: this.platform === 'ios' ? 'Apple Health' : 'Google Fit',
            available,
            hasPermissions
        };
    }
}

// Export singleton instance
export const HealthService = new HealthServiceImpl();
export default HealthService;
