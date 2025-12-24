/**
 * COD System - Safe Area Hook
 * 
 * Provides safe area inset values for proper layout on notched devices.
 * Uses CSS env() values and provides fallbacks.
 */

import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

interface SafeAreaInsets {
    top: number;
    bottom: number;
    left: number;
    right: number;
}

const DEFAULT_INSETS: SafeAreaInsets = {
    top: 0,
    bottom: 0,
    left: 0,
    right: 0
};

export function useSafeArea(): SafeAreaInsets {
    const [insets, setInsets] = useState<SafeAreaInsets>(DEFAULT_INSETS);
    const isNative = Capacitor.isNativePlatform();

    useEffect(() => {
        if (!isNative) return;

        const computeInsets = () => {
            // Try to get insets from CSS env() variables
            const computedStyle = getComputedStyle(document.documentElement);

            const parseEnvValue = (value: string): number => {
                const parsed = parseInt(value, 10);
                return isNaN(parsed) ? 0 : parsed;
            };

            // Create a temp element to compute the values
            const temp = document.createElement('div');
            temp.style.cssText = `
                position: fixed;
                top: env(safe-area-inset-top, 0px);
                bottom: env(safe-area-inset-bottom, 0px);
                left: env(safe-area-inset-left, 0px);
                right: env(safe-area-inset-right, 0px);
                visibility: hidden;
                pointer-events: none;
            `;
            document.body.appendChild(temp);

            const rect = temp.getBoundingClientRect();
            document.body.removeChild(temp);

            // For more accurate values, use CSS custom properties
            const newInsets: SafeAreaInsets = {
                top: parseEnvValue(computedStyle.getPropertyValue('--sat') || `${rect.top}`),
                bottom: parseEnvValue(computedStyle.getPropertyValue('--sab') || `${window.innerHeight - rect.bottom}`),
                left: parseEnvValue(computedStyle.getPropertyValue('--sal') || `${rect.left}`),
                right: parseEnvValue(computedStyle.getPropertyValue('--sar') || `${window.innerWidth - rect.right}`)
            };

            // iOS default fallbacks
            if (Capacitor.getPlatform() === 'ios') {
                if (newInsets.top === 0) newInsets.top = 47; // iPhone with notch
                if (newInsets.bottom === 0) newInsets.bottom = 34; // Home indicator
            }

            setInsets(newInsets);
        };

        // Initial compute
        computeInsets();

        // Recompute on orientation change
        window.addEventListener('resize', computeInsets);
        window.addEventListener('orientationchange', computeInsets);

        return () => {
            window.removeEventListener('resize', computeInsets);
            window.removeEventListener('orientationchange', computeInsets);
        };
    }, [isNative]);

    return insets;
}

/**
 * CSS utility classes for safe areas
 * Add these to your global CSS:
 * 
 * .pt-safe { padding-top: env(safe-area-inset-top, 0px); }
 * .pb-safe { padding-bottom: env(safe-area-inset-bottom, 0px); }
 * .pl-safe { padding-left: env(safe-area-inset-left, 0px); }
 * .pr-safe { padding-right: env(safe-area-inset-right, 0px); }
 * .mt-safe { margin-top: env(safe-area-inset-top, 0px); }
 * .mb-safe { margin-bottom: env(safe-area-inset-bottom, 0px); }
 */

export default useSafeArea;
