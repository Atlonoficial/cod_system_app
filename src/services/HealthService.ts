/**
 * ═══════════════════════════════════════════════════════════════════════════
 * COD System - Health Service (Build 20)
 * ═══════════════════════════════════════════════════════════════════════════
 * @copyright (c) 2024-2026 Atlon Tech (CNPJ: 58.079.600/0001-77)
 * 
 * Uses @capgo/capacitor-health plugin for unified access to:
 * - iOS: Apple HealthKit
 * - Android: Health Connect 
 * 
 * Requirements:
 * - npm install @capgo/capacitor-health
 * - iOS: HealthKit capability enabled (App.entitlements)
 * - Android: Health Connect permissions in AndroidManifest.xml
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { Capacitor } from '@capacitor/core';
import { debugLog } from '@/lib/debugLogger';

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
let pluginLoadAttempted = false;

async function getHealthPlugin() {
    debugLog('HealthService', '🔌 getHealthPlugin() chamado');

    try {
        debugLog('HealthService', '📦 Executando import direto...');

        const module = await import('@capgo/capacitor-health');

        debugLog('HealthService', '📥 Import completo!');
        debugLog('HealthService', `Chaves: ${Object.keys(module).join(', ')}`);

        let plugin = null;

        if (module.Health) {
            debugLog('HealthService', '✅ Encontrou module.Health');
            plugin = module.Health;
        } else if (module.default) {
            debugLog('HealthService', '✅ Encontrou module.default');
            plugin = module.default;
        } else {
            debugLog('HealthService', '❌ Nenhum export encontrado!');
            return null;
        }

        if (plugin) {
            debugLog('HealthService', `✅ Plugin tipo: ${typeof plugin}`);

            const methods = ['requestAuthorization', 'isAvailable'];
            for (const method of methods) {
                const hasMethod = typeof plugin[method] === 'function';
                debugLog('HealthService', `  - ${method}: ${hasMethod ? '✅' : '❌'}`);
            }

            debugLog('HealthService', '🎉 RETORNANDO PLUGIN!');
            return plugin;
        }

        debugLog('HealthService', '💥 Plugin é null');
        return null;
    } catch (error) {
        debugLog('HealthService', `🔥 ERRO!`);
        debugLog('HealthService', `Tipo: ${(error as Error).name}`);
        debugLog('HealthService', `Msg: ${(error as Error).message}`);
        return null;
    }
}

/**
 * BUILD 34: GLOBAL FUNCTION - Uses debugLog for UI visibility 
 * This function is OUTSIDE the class to ensure fresh code execution
 * Now with GRANULAR TIMEOUTS to identify exactly where it hangs
 */
export async function requestHealthPermissionsGlobal(): Promise<boolean> {
    // Import debugLog here to ensure it's available
    const { debugLog } = await import('@/lib/debugLogger');

    // MARKER - If this appears, we know the new code is running
    debugLog('GLOBAL', '================================================');
    debugLog('GLOBAL', '🚀 GLOBAL_V2 - requestHealthPermissionsGlobal()');
    debugLog('GLOBAL', '🚀 BUILD 34 - With debugLog + granular timeouts');
    debugLog('GLOBAL', `🚀 Timestamp: ${new Date().toISOString()}`);
    debugLog('GLOBAL', '================================================');

    const isNative = Capacitor.isNativePlatform();
    const platform = Capacitor.getPlatform();

    debugLog('GLOBAL', `Platform: ${platform} | Native: ${isNative}`);

    if (!isNative) {
        debugLog('GLOBAL', '❌ Not native, returning false');
        return false;
    }

    // Step 1: Load plugin (max 5s)
    debugLog('GLOBAL', '📦 Step 1: Loading plugin (5s timeout)...');
    let plugin: any;

    try {
        const pluginPromise = getHealthPlugin();
        plugin = await Promise.race([
            pluginPromise,
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('PLUGIN_LOAD_TIMEOUT_5S')), 5000)
            )
        ]);
    } catch (e) {
        debugLog('GLOBAL', `❌ Step 1 FAILED: ${(e as Error).message}`);
        return false;
    }

    if (!plugin) {
        debugLog('GLOBAL', '❌ Step 1: Plugin is null');
        return false;
    }
    debugLog('GLOBAL', '✅ Step 1: Plugin loaded successfully');

    // Step 2: Check isAvailable (max 5s)
    debugLog('GLOBAL', '🔍 Step 2: Checking isAvailable (5s timeout)...');
    try {
        const availPromise = plugin.isAvailable();
        const availResult = await Promise.race([
            availPromise,
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('IS_AVAILABLE_TIMEOUT_5S')), 5000)
            )
        ]);
        debugLog('GLOBAL', `✅ Step 2 Result: ${JSON.stringify(availResult)}`);

        if (!(availResult as any)?.available) {
            debugLog('GLOBAL', '⚠️ HealthKit NOT available on device');
            // Continue anyway - some plugins return false but still work
        }
    } catch (e) {
        debugLog('GLOBAL', `⚠️ Step 2 Error (continuing): ${(e as Error).message}`);
        // Continue anyway
    }

    // Step 3: Request authorization (max 30s)
    debugLog('GLOBAL', '🔐 Step 3: Requesting authorization (30s timeout)...');
    debugLog('GLOBAL', '📋 Permissions requested: read=[steps], write=[]');

    try {
        debugLog('GLOBAL', '⏳ Creating authorization promise...');

        const authPromise = plugin.requestAuthorization({
            read: ['steps'],
            write: []
        });

        debugLog('GLOBAL', '⏳ Promise created, waiting for native response...');

        const result = await Promise.race([
            authPromise,
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('AUTH_REQUEST_TIMEOUT_30S')), 30000)
            )
        ]);

        debugLog('GLOBAL', `✅ Step 3 Got result: ${JSON.stringify(result)}`);

        const success = (result as any)?.status === 'authorized' ||
            (result as any)?.status === 'limited' ||
            (result as any)?.authorized === true;

        debugLog('GLOBAL', success ? '🎉 AUTHORIZED!' : '❌ NOT AUTHORIZED');
        return success;

    } catch (e) {
        const msg = (e as Error).message;
        debugLog('GLOBAL', `❌ Step 3 FAILED: ${msg}`);

        if (msg === 'AUTH_REQUEST_TIMEOUT_30S') {
            debugLog('GLOBAL', '🔥 NATIVE CALL TIMED OUT!');
            debugLog('GLOBAL', '🔥 The HealthKit dialog probably never appeared');
            debugLog('GLOBAL', '🔥 Possible causes:');
            debugLog('GLOBAL', '  1. HealthKit NOT enabled in Xcode capabilities');
            debugLog('GLOBAL', '  2. Provisioning profile missing HealthKit');
            debugLog('GLOBAL', '  3. Plugin native bridge broken');
            debugLog('GLOBAL', '  4. Device HealthKit is disabled');
        }

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
            console.log(`[HealthService] Checking availability on ${this.platform}...`);
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
     * BUILD 31: Added XCODE31 marker - if this doesn't show, code is not updated!
     */
    async requestPermissions(): Promise<boolean> {
        // XCODE31 MARKER - This MUST appear in logs if code is updated
        console.log('========================================');
        console.log('XCODE31 - BUILD 31 - requestPermissions ENTRY');
        console.log('XCODE31 - Platform:', this.platform);
        console.log('XCODE31 - isNative:', this.isNative);
        console.log('========================================');

        if (!this.isNative) {
            console.log('[HealthService] ❌ Not native platform');
            return false;
        }

        // Step 1: Load plugin
        console.log('[HealthService] STEP 1: Loading plugin...');
        let plugin: any;
        try {
            plugin = await getHealthPlugin();
            console.log('[HealthService] STEP 1: Plugin loaded -', plugin ? 'OK' : 'NULL');
        } catch (e) {
            console.log('[HealthService] STEP 1: FAILED -', (e as Error).message);
            return false;
        }

        if (!plugin) {
            console.log('[HealthService] ❌ Plugin is null, cannot proceed');
            return false;
        }

        // Step 2: Check availability FIRST
        console.log('[HealthService] STEP 2: Checking isAvailable()...');
        try {
            const availResult = await plugin.isAvailable();
            console.log('[HealthService] STEP 2: isAvailable result:', JSON.stringify(availResult));

            if (!availResult?.available) {
                console.log('[HealthService] ❌ HealthKit not available on this device');
                return false;
            }
            console.log('[HealthService] ✅ HealthKit IS available');
        } catch (e) {
            console.log('[HealthService] STEP 2: FAILED -', (e as Error).message);
            // Continue anyway - some devices may not support isAvailable check
        }

        // Step 3: Request authorization with minimal permissions
        console.log('[HealthService] STEP 3: Requesting authorization...');
        console.log('[HealthService] Permissions: read=[steps], write=[]');

        try {
            // Use absolute minimum permissions for testing
            console.log('[HealthService] Creating promise...');

            const authPromise = plugin.requestAuthorization({
                read: ['steps'],
                write: []
            });

            console.log('[HealthService] Promise created, waiting with 15s timeout...');

            // 15 second timeout 
            const result = await Promise.race([
                authPromise,
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('TIMEOUT_15S')), 15000)
                )
            ]);

            console.log('[HealthService] STEP 3: Got result:', JSON.stringify(result));

            const success = result?.status === 'authorized' ||
                result?.status === 'limited' ||
                result?.authorized === true;

            console.log('[HealthService] ✅ Authorization success:', success);
            return success;

        } catch (e) {
            const msg = (e as Error).message;
            console.log('[HealthService] STEP 3: FAILED -', msg);

            if (msg === 'TIMEOUT_15S') {
                console.log('[HealthService] 🔥 Native call timed out - HealthKit dialog may not have appeared');
                console.log('[HealthService] Possible causes:');
                console.log('[HealthService]  1. HealthKit capability not properly signed in provisioning profile');
                console.log('[HealthService]  2. Device has HealthKit disabled in Settings > Privacy');
                console.log('[HealthService]  3. Plugin native code issue');
            }

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

            const now = new Date();
            const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

            // Try to get sleep data directly
            try {
                const { samples } = await plugin.readSamples({
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
                const { samples } = await plugin.readSamples({
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
            const plugin = await getHealthPlugin();
            if (!plugin) return null;

            const now = new Date();
            const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

            let restingHR = 0;
            let avgHRV = 0;

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
                    console.log('[HealthService] Resting HR:', restingHR);
                }
            } catch (e) {
                console.warn('[HealthService] Heart rate fetch failed:', e);
            }

            // Try to get HRV data directly
            try {
                const { samples } = await plugin.readSamples({
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
