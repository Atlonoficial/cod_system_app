/**
 * COD System - Phase 2: Biometric Sync Hook
 * 
 * Provides integration with HealthKit (iOS) and Health Connect (Android)
 * for automatic syncing of sleep and HRV data into the Wellness Check-in.
 * 
 * Uses HealthService for native platform communication.
 */

import { useState, useCallback, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { HealthService, type HealthDataResponse } from '@/services/HealthService';

// Types for health data
export interface SleepData {
    sleepHours: number;
    sleepQuality: number; // 1-10 scale
    deepSleepMinutes?: number;
    remSleepMinutes?: number;
    awakeMinutes?: number;
    sleepStart?: string;
    sleepEnd?: string;
    source: 'healthkit' | 'google_fit' | 'manual';
}

export interface HRVData {
    avgHRV: number; // ms (higher = better recovery)
    minHRV?: number;
    maxHRV?: number;
    restingHeartRate?: number;
    source: 'healthkit' | 'google_fit' | 'manual';
}

export interface BiometricData {
    sleep: SleepData | null;
    hrv: HRVData | null;
    lastSyncedAt: Date | null;
    isNativeAvailable: boolean;
}

export interface UseBiometricSyncResult {
    // Data
    biometricData: BiometricData;
    loading: boolean;
    error: string | null;

    // Actions
    syncHealthData: () => Promise<void>;
    requestPermissions: () => Promise<boolean>;

    // Computed
    hasHealthPermission: boolean;
    canAutoSync: boolean;

    // Sleep helpers (returns null if no real data available)
    getSleepQualityScore: () => number | null;
    getRecoveryScore: () => number | null;
}

export const useBiometricSync = (): UseBiometricSyncResult => {
    const [biometricData, setBiometricData] = useState<BiometricData>({
        sleep: null,
        hrv: null,
        lastSyncedAt: null,
        isNativeAvailable: false
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasHealthPermission, setHasHealthPermission] = useState(false);

    // Check if running on native platform
    const isNative = Capacitor.isNativePlatform();
    const platform = Capacitor.getPlatform();

    // Check if native health APIs are available
    useEffect(() => {
        const checkNativeAvailability = async () => {
            if (!isNative) {
                console.log('[BiometricSync] Running on web - health APIs not available');
                setBiometricData(prev => ({ ...prev, isNativeAvailable: false }));
                return;
            }

            try {
                const available = await HealthService.isAvailable();
                console.log('[BiometricSync] Native health available:', available);
                setBiometricData(prev => ({ ...prev, isNativeAvailable: available }));
            } catch (err) {
                console.error('[BiometricSync] Error checking availability:', err);
                setBiometricData(prev => ({ ...prev, isNativeAvailable: false }));
            }
        };

        checkNativeAvailability();
    }, [isNative]);

    // Request health data permissions
    const requestPermissions = useCallback(async (): Promise<boolean> => {
        if (!isNative) {
            console.log('[BiometricSync] Cannot request permissions - not native');
            return false;
        }

        try {
            setLoading(true);
            setError(null);

            const granted = await HealthService.requestPermissions();
            console.log('[BiometricSync] Permissions granted:', granted);
            setHasHealthPermission(granted);

            if (granted) {
                // Auto-sync after permissions granted
                await syncHealthDataInternal();
            }

            return granted;
        } catch (err) {
            console.error('[BiometricSync] Permission request failed:', err);
            setError('Falha ao solicitar permissões de saúde');
            return false;
        } finally {
            setLoading(false);
        }
    }, [isNative]);

    // Internal sync function
    const syncHealthDataInternal = async () => {
        try {
            const { sleep, hrv } = await HealthService.getAllHealthData();

            const source = platform === 'ios' ? 'healthkit' : 'google_fit';

            // Convert HealthDataResponse to SleepData
            const sleepData: SleepData | null = sleep ? {
                sleepHours: sleep.sleepDuration,
                sleepQuality: sleep.sleepQuality,
                deepSleepMinutes: sleep.deepSleepMinutes,
                remSleepMinutes: sleep.remSleepMinutes,
                source: source as 'healthkit' | 'google_fit'
            } : null;

            // Convert to HRVData
            const hrvData: HRVData | null = hrv ? {
                avgHRV: hrv.avgHRV,
                restingHeartRate: hrv.restingHeartRate,
                source: source as 'healthkit' | 'google_fit'
            } : null;

            setBiometricData(prev => ({
                ...prev,
                sleep: sleepData,
                hrv: hrvData,
                lastSyncedAt: new Date()
            }));

            console.log('[BiometricSync] Data synced:', { sleepData, hrvData });
        } catch (err) {
            console.error('[BiometricSync] Sync failed:', err);
            throw err;
        }
    };

    // Sync health data from device
    const syncHealthData = useCallback(async () => {
        if (!biometricData.isNativeAvailable) {
            console.log('[BiometricSync] Health APIs not available - manual input required');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            await syncHealthDataInternal();
        } catch (err) {
            console.error('[BiometricSync] Sync failed:', err);
            setError('Falha ao sincronizar dados de saúde');
        } finally {
            setLoading(false);
        }
    }, [biometricData.isNativeAvailable, platform]);

    // Calculate sleep quality score - returns null if no real data
    const getSleepQualityScore = useCallback((): number | null => {
        if (!biometricData.sleep) return null;
        return biometricData.sleep.sleepQuality;
    }, [biometricData.sleep]);

    // Calculate recovery score - returns null if no real data
    const getRecoveryScore = useCallback((): number | null => {
        if (!biometricData.hrv && !biometricData.sleep) return null;

        let score = 5;

        if (biometricData.hrv) {
            const hrvScore = biometricData.hrv.avgHRV >= 60
                ? 8 + (biometricData.hrv.avgHRV - 60) / 20 * 2
                : biometricData.hrv.avgHRV >= 40
                    ? 5 + (biometricData.hrv.avgHRV - 40) / 20 * 3
                    : biometricData.hrv.avgHRV / 40 * 5;

            score = Math.min(10, Math.max(1, hrvScore));
        }

        if (biometricData.sleep) {
            const sleepContrib = biometricData.sleep.sleepQuality * 0.3;
            score = score * 0.7 + sleepContrib;
        }

        return Math.round(score * 10) / 10;
    }, [biometricData.hrv, biometricData.sleep]);

    return {
        biometricData,
        loading,
        error,
        syncHealthData,
        requestPermissions,
        hasHealthPermission,
        canAutoSync: biometricData.isNativeAvailable && hasHealthPermission,
        getSleepQualityScore,
        getRecoveryScore
    };
};

export default useBiometricSync;
