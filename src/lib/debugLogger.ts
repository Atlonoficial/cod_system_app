/**
 * ═══════════════════════════════════════════════════════════════════════════
 * COD System - Debug Logger for iPhone (NO MAC NEEDED)
 * Version: 1.0.0 | Build: 19
 * ═══════════════════════════════════════════════════════════════════════════
 * @copyright (c) 2024-2026 Atlon Tech
 * 
 * Este logger mostra os logs VISUALMENTE no app quando você não tem Mac
 * para usar Safari Web Inspector
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';

// In-memory log storage
let logs: string[] = [];
const MAX_LOGS = 100;

// Listeners for UI updates
type LogListener = (logs: string[]) => void;
const listeners: LogListener[] = [];

/**
 * Add a log entry
 */
export function debugLog(tag: string, message: string, data?: any) {
    const timestamp = new Date().toLocaleTimeString('pt-BR');
    const platform = Capacitor.getPlatform();

    let logEntry = `[${timestamp}] [${tag}] ${message}`;

    if (data !== undefined) {
        try {
            logEntry += ` ${JSON.stringify(data)}`;
        } catch (e) {
            logEntry += ` [Error stringifying data]`;
        }
    }

    // Add to memory
    logs.unshift(logEntry);
    if (logs.length > MAX_LOGS) {
        logs = logs.slice(0, MAX_LOGS);
    }

    // Console log (for any connected debugger)
    console.log(logEntry);

    // Notify listeners (for UI updates)
    notifyListeners();

    // Send to Supabase (optional, for remote debugging)
    sendToSupabaseAsync(tag, message, data);
}

/**
 * Get all logs
 */
export function getDebugLogs(): string[] {
    return [...logs];
}

/**
 * Clear all logs
 */
export function clearDebugLogs() {
    logs = [];
    notifyListeners();
}

/**
 * Subscribe to log updates
 */
export function subscribeToLogs(listener: LogListener) {
    listeners.push(listener);
    return () => {
        const index = listeners.indexOf(listener);
        if (index > -1) {
            listeners.splice(index, 1);
        }
    };
}

/**
 * Notify all listeners
 */
function notifyListeners() {
    listeners.forEach(listener => listener([...logs]));
}

/**
 * Send log to Supabase for remote viewing (fire and forget)
 * DISABLED: Requires creating debug_logs table first
 */
async function sendToSupabaseAsync(tag: string, message: string, data?: any) {
    // Commented out until debug_logs table is created
    // This is optional - logs are visible in the UI anyway
    return;
}

/**
 * Export logs as text (for copying/sharing)
 */
export function exportLogsAsText(): string {
    return logs.join('\n');
}

/**
 * Download logs as file (Capacitor Filesystem)
 */
export async function downloadLogs(): Promise<string> {
    try {
        const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');

        const content = exportLogsAsText();
        const filename = `cood_debug_${Date.now()}.txt`;

        const result = await Filesystem.writeFile({
            path: filename,
            data: content,
            directory: Directory.Documents,
            encoding: Encoding.UTF8
        });

        return result.uri;
    } catch (error) {
        throw new Error('Falha ao salvar logs: ' + (error as Error).message);
    }
}
