/**
 * COD System - Health Service (Build 16)
 * 
 * Uses @capgo/capacitor-health plugin for unified access to:
 * - iOS: Apple HealthKit
 * - Android: Health Connect
 * 
 * Requirements:
 * - npm install @capgo/capacitor-health
 * - iOS: HealthKit capability enabled in Xcode
 * - Android: Health Connect permissions in AndroidManifest.xml
 */

import { Capacitor } from '@capacitor/core';

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

// Dynamic import for the health plugin
let HealthPlugin: any = null;

async function getHealthPlugin() {
    if (HealthPlugin) return HealthPlugin;

    try {
        // Timeout de 3 segundos para evitar loading infinito
        // Se o plugin não estiver configurado corretamente, retorna null após timeout
        const timeoutPromise = new Promise<null>((resolve) =>
            setTimeout(() => {
                console.warn('[HealthService] Plugin load timeout - native setup may be missing');
                resolve(null);
            }, 3000)
        );

        const importPromise = (async () => {
            const module = await import('@capgo/capacitor-health');
            return module.Health;
        })();

        const result = await Promise.race([importPromise, timeoutPromise]);

        if (result) {
            HealthPlugin = result;
            return HealthPlugin;
        }

        return null;
    } catch (error) {
        console.warn('[HealthService] @capgo/capacitor-health not available:', error);
        return null;
    }
}

class HealthServiceImpl {
    private isNative: boolean;

    constructor() {
        this.isNative = Capacitor.isNativePlatform();
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
            console.log('[HealthService] Checking availability...');
            const plugin = await getHealthPlugin();
            if (!plugin) {
                console.error('[HealthService] Plugin failed to load');
                return false;
            }

            const result = await plugin.isAvailable();
            console.log('[HealthService] Availability check result:', JSON.stringify(result));
            return result.available === true;
        } catch (error) {
            console.error('[HealthService] Check availability failed:', error);
            return false;
        }
    }

    /**
     * Request health data permissions from user
     */
    async requestPermissions(): Promise<boolean> {
        if (!this.isNative) {
            console.log('[HealthService] Skipping - not native platform');
            return false;
        }

        try {
            const plugin = await getHealthPlugin();
            if (!plugin) {
                console.error('[HealthService] Plugin not loaded - check native setup');
                return false;
            }

            console.log('[HealthService] Requesting authorization...');

            // Request read permissions for all data types including sleep
            const result = await plugin.requestAuthorization({
                read: ['steps', 'heartRate', 'calories', 'weight', 'sleep'],
                write: []
            });

            console.log('[HealthService] Authorization result:', JSON.stringify(result));

            // Check if authorization was successful
            const isAuthorized = result.status === 'authorized' || result.status === 'limited';
            console.log('[HealthService] Is authorized:', isAuthorized);

            return isAuthorized;
        } catch (error) {
            console.error('[HealthService] Permission request failed:', error);
            return false;
        }
    }

    /**
     * Get sleep data from last night
     * Note: Sleep data may require additional permissions/setup
     */
    async getSleepData(): Promise<HealthDataResponse | null> {
        if (!this.isNative) return null;

        try {
            const plugin = await getHealthPlugin();
            if (!plugin) return null;

            // For now, generate estimated sleep data based on available metrics
            // Full sleep tracking requires Apple Watch or compatible device

            // Try to get heart rate data as proxy for sleep quality
            const now = new Date();
            const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

            try {
                const { samples } = await plugin.readSamples({
                    dataType: 'heartRate',
                    startDate: yesterday.toISOString(),
                    endDate: now.toISOString(),
                    limit: 100
                });

                if (samples && samples.length > 0) {
                    // Calculate resting HR from samples (proxy for sleep quality)
                    const values = samples.map((s: any) => s.value);
                    const minHR = Math.min(...values);
                    const avgHR = values.reduce((a: number, b: number) => a + b, 0) / values.length;

                    // Estimate sleep quality based on heart rate variability
                    // Lower resting HR typically indicates better recovery
                    const sleepQuality = Math.min(10, Math.max(1, 10 - ((minHR - 50) / 5)));

                    return {
                        sleepDuration: 7.5, // Placeholder - needs Apple Watch
                        sleepQuality: Math.round(sleepQuality),
                        restingHeartRate: Math.round(minHR),
                        lastUpdated: new Date().toISOString()
                    };
                }
            } catch (e) {
                console.log('[HealthService] Heart rate data unavailable:', e);
            }

            // No data available
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
            const plugin = await getHealthPlugin();
            if (!plugin) return null;

            const now = new Date();
            const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

            let restingHR = 0;

            // Get heart rate samples
            try {
                const { samples } = await plugin.readSamples({
                    dataType: 'heartRate',
                    startDate: yesterday.toISOString(),
                    endDate: now.toISOString(),
                    limit: 100
                });

                if (samples && samples.length > 0) {
                    const values = samples.map((s: any) => s.value);
                    restingHR = Math.round(Math.min(...values));
                }
            } catch (e) {
                console.warn('[HealthService] Heart rate fetch failed:', e);
            }

            if (restingHR === 0) {
                return null;
            }

            // HRV typically requires Apple Watch - estimate from resting HR
            // Lower resting HR suggests higher HRV (better recovery)
            const estimatedHRV = Math.max(20, 100 - restingHR);

            return {
                avgHRV: estimatedHRV,
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
