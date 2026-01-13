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
     * BUILD 18: Updated with complete list of permissions
     */
    async requestPermissions(): Promise<boolean> {
        debugLog('HealthService', '🚀 requestPermissions() INICIADO');
        debugLog('HealthService', `Platform: ${this.platform}, Native: ${this.isNative}`);

        if (!this.isNative) {
            debugLog('HealthService', '❌ NÃO É NATIVO - retornando false');
            console.log('[HealthService] Skipping - not native platform');
            return false;
        }

        try {
            debugLog('HealthService', '📦 Tentando carregar plugin...');
            const plugin = await getHealthPlugin();

            debugLog('HealthService', '🔄 getHealthPlugin() RETORNOU');
            debugLog('HealthService', `Plugin value: ${plugin ? 'EXISTS' : 'NULL'}`);

            if (!plugin) {
                debugLog('HealthService', '💥 PLUGIN NÃO CARREGOU!');
                debugLog('HealthService', 'Isso significa que @capgo/capacitor-health não está instalado nativamente');
                console.error('[HealthService] Plugin not loaded - check native setup');
                return false;
            }

            debugLog('HealthService', '✅ Plugin carregado com sucesso!');
            debugLog('HealthService', `Plugin type: ${typeof plugin}`);
            console.log('[HealthService] Requesting authorization...');

            // BUILD 18: Complete list of permissions for iOS & Android
            const readPermissions = [
                'steps',
                'distance',
                'activeEnergyBurned',
                'calories',
                'heartRate',
                'restingHeartRate',
                'heartRateVariability',
                'weight',
                'height',
                'bodyMass',
                'bodyFatPercentage',
                'sleep',
                'sleepAnalysis'
            ];

            const writePermissions = [
                'activeEnergyBurned',
                'steps',
                'distance'
            ];

            debugLog('HealthService', `📋 Read permissions (${readPermissions.length}): ${readPermissions.join(', ')}`);
            debugLog('HealthService', `📋 Write permissions (${writePermissions.length}): ${writePermissions.join(', ')}`);
            console.log('[HealthService] Requesting read:', readPermissions);
            console.log('[HealthService] Requesting write:', writePermissions);

            debugLog('HealthService', '⏳ Chamando plugin.requestAuthorization()...');
            const result = await plugin.requestAuthorization({
                read: readPermissions,
                write: writePermissions
            });

            debugLog('HealthService', '🔙 requestAuthorization() RETORNOU');
            debugLog('HealthService', `📥 Resultado recebido!`);
            debugLog('HealthService', `Resultado completo: ${JSON.stringify(result)}`);
            console.log('[HealthService] Authorization result:', JSON.stringify(result));

            // Check if authorization was successful
            const isAuthorized = result.status === 'authorized' ||
                result.status === 'limited' ||
                result.authorized === true;

            debugLog('HealthService', `🔍 isAuthorized: ${isAuthorized}`);
            debugLog('HealthService', `Status: ${result.status}`);
            console.log('[HealthService] Is authorized:', isAuthorized);

            return isAuthorized;
        } catch (error) {
            debugLog('HealthService', `🔥 ERRO CAPTURADO!`);
            debugLog('HealthService', `Tipo: ${(error as Error).name}`);
            debugLog('HealthService', `Mensagem: ${(error as Error).message}`);
            debugLog('HealthService', `Stack: ${(error as Error).stack}`);
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
