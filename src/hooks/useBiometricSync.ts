/**
 * COD System - Phase 2: Biometric Sync Hook
 * 
 * Provides integration with HealthKit (iOS) and Google Fit (Android)
 * for automatic syncing of sleep and HRV data into the Wellness Check-in.
 * 
 * This hook only provides REAL data from device health APIs.
 * When running on web or without proper permissions, returns null.
 */

import { useState, useCallback, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

// Types for health data
export interface SleepData {
    sleepHours: number;
    sleepQuality: number; // 1-10 scale
    deepSleepMinutes?: number;
    remSleepMinutes?: number;
    awakeMinutes?: number;
    sleepStart?: string;
    sleepEnd?: string;
    source: 'healthkit' | 'google_fit';
}

export interface HRVData {
    avgHRV: number; // ms (higher = better recovery)
    minHRV?: number;
    maxHRV?: number;
    restingHeartRate?: number;
    source: 'healthkit' | 'google_fit';
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

            // For now, mark as unavailable until health plugin is installed
            // To enable real HealthKit/Google Fit sync:
            // 1. npm install @niceplugins/capacitor-health
            // 2. npx cap sync
            // 3. Configure iOS/Android permissions
            console.log('[BiometricSync] Native platform detected - health plugin integration ready');
            setBiometricData(prev => ({ ...prev, isNativeAvailable: false }));
        };

        checkNativeAvailability();
    }, [isNative]);

    // Request health data permissions (no-op when native APIs unavailable)
    const requestPermissions = useCallback(async (): Promise<boolean> => {
        if (!isNative || !biometricData.isNativeAvailable) {
            console.log('[BiometricSync] Cannot request permissions - native APIs not available');
            return false;
        }

        // Real implementation when health plugin is installed:
        // const { Health } = await import('@niceplugins/capacitor-health');
        // const result = await Health.requestAuthorization({...});

        return false;
    }, [isNative, biometricData.isNativeAvailable]);

    // Sync health data from device (no-op when native APIs unavailable)
    const syncHealthData = useCallback(async () => {
        if (!biometricData.isNativeAvailable) {
            console.log('[BiometricSync] Health APIs not available - manual input required');
            return;
        }

        // Real implementation when health plugin is installed:
        // const { Health } = await import('@niceplugins/capacitor-health');
        // const sleepData = await Health.querySampleType({...});

        console.log('[BiometricSync] Would sync real health data here when plugin is installed');
    }, [biometricData.isNativeAvailable]);

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
