/**
 * Android Health Connect Web Bridge
 * 
 * This TypeScript file acts as a bridge for the native Android Health Connect implementation.
 * The actual Kotlin code must be added to the Android project.
 * 
 * For Android, the Health Connect integration requires:
 * 1. Add Health Connect SDK dependency in build.gradle
 * 2. Add the Kotlin plugin file (HealthServicePlugin.kt)
 * 3. Register the plugin in MainActivity
 * 4. Add required permissions in AndroidManifest.xml
 */

import type { HealthPluginInterface, HealthDataResponse } from '../HealthService';

class AndroidHealthPlugin implements HealthPluginInterface {
    async isAvailable(): Promise<{ available: boolean }> {
        // In real implementation, this calls the native Kotlin method
        // The native implementation checks if Health Connect is installed
        try {
            // @ts-ignore - Native method injected by Capacitor
            if (window.Capacitor?.Plugins?.HealthService) {
                // @ts-ignore
                return await window.Capacitor.Plugins.HealthService.isAvailable();
            }
            return { available: false };
        } catch {
            return { available: false };
        }
    }

    async requestPermissions(): Promise<{ granted: boolean }> {
        try {
            // @ts-ignore - Native method injected by Capacitor
            if (window.Capacitor?.Plugins?.HealthService) {
                // @ts-ignore
                return await window.Capacitor.Plugins.HealthService.requestPermissions();
            }
            return { granted: false };
        } catch {
            return { granted: false };
        }
    }

    async getSleepData(options: { startDate: string; endDate: string }): Promise<HealthDataResponse> {
        try {
            // @ts-ignore - Native method injected by Capacitor
            if (window.Capacitor?.Plugins?.HealthService) {
                // @ts-ignore
                return await window.Capacitor.Plugins.HealthService.getSleepData(options);
            }
            throw new Error('HealthService plugin not available');
        } catch (error) {
            console.error('[Android Health] getSleepData failed:', error);
            throw error;
        }
    }

    async getHeartRateData(options: { startDate: string; endDate: string }): Promise<{ avgHRV: number; restingHeartRate: number }> {
        try {
            // @ts-ignore - Native method injected by Capacitor
            if (window.Capacitor?.Plugins?.HealthService) {
                // @ts-ignore
                return await window.Capacitor.Plugins.HealthService.getHeartRateData(options);
            }
            throw new Error('HealthService plugin not available');
        } catch (error) {
            console.error('[Android Health] getHeartRateData failed:', error);
            throw error;
        }
    }
}

export default new AndroidHealthPlugin();
