/**
 * iOS HealthKit Web Bridge
 * 
 * This TypeScript file acts as a bridge for the native iOS HealthKit implementation.
 * The actual Swift code must be added to the iOS project.
 * 
 * For iOS, the HealthKit integration requires:
 * 1. Enable HealthKit capability in Xcode
 * 2. Add the Swift plugin file (HealthServicePlugin.swift)
 * 3. Register the plugin in AppDelegate
 */

import type { HealthPluginInterface, HealthDataResponse } from '../HealthService';

class IOSHealthPlugin implements HealthPluginInterface {
    async isAvailable(): Promise<{ available: boolean }> {
        // In real implementation, this calls the native Swift method
        // The native implementation checks HKHealthStore.isHealthDataAvailable()
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

    async requestHealthPermissions(): Promise<{ granted: boolean }> {
        try {
            // @ts-ignore - Native method injected by Capacitor
            if (window.Capacitor?.Plugins?.HealthService) {
                // @ts-ignore
                return await window.Capacitor.Plugins.HealthService.requestHealthPermissions();
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
            console.error('[iOS Health] getSleepData failed:', error);
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
            console.error('[iOS Health] getHeartRateData failed:', error);
            throw error;
        }
    }
}

export default new IOSHealthPlugin();
