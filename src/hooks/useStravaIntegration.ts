/**
 * COD System - Strava Integration Hook
 * 
 * Handles OAuth2 connection to Strava and activity synchronization.
 * 
 * FEATURE STATUS: BLOCKED (UI hidden in Settings.tsx)
 * Ready to activate when Strava app credentials are configured.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';

// Strava OAuth Configuration
const STRAVA_CLIENT_ID = import.meta.env.VITE_STRAVA_CLIENT_ID || '';
const STRAVA_REDIRECT_URI = import.meta.env.VITE_STRAVA_REDIRECT_URI || '';
const STRAVA_AUTH_URL = 'https://www.strava.com/oauth/authorize';
const STRAVA_SCOPES = 'read,activity:read_all';

interface StravaConnection {
    id: string;
    user_id: string;
    strava_athlete_id: number;
    access_token: string;
    refresh_token: string;
    expires_at: string;
    last_sync_at: string | null;
    sync_error: string | null;
    metadata: {
        athlete?: {
            firstname: string;
            lastname: string;
            profile: string;
        };
    };
}

interface StravaStats {
    weeklyDistance: number;
    weeklyDuration: number;
    weeklyCalorics: number;
    totalActivities: number;
}

interface UseStravaIntegrationReturn {
    connection: StravaConnection | null;
    stats: StravaStats;
    loading: boolean;
    connecting: boolean;
    error: string | null;
    isConnected: boolean;
    connectStrava: () => Promise<void>;
    disconnect: () => Promise<void>;
    syncData: () => Promise<void>;
}

const defaultStats: StravaStats = {
    weeklyDistance: 0,
    weeklyDuration: 0,
    weeklyCalorics: 0,
    totalActivities: 0,
};

export const useStravaIntegration = (): UseStravaIntegrationReturn => {
    const { user } = useAuth();
    const [connection, setConnection] = useState<StravaConnection | null>(null);
    const [stats, setStats] = useState<StravaStats>(defaultStats);
    const [loading, setLoading] = useState(false);
    const [connecting, setConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isConnected = !!connection?.access_token;

    // Fetch connection status
    const fetchConnection = useCallback(async () => {
        if (!user?.id) return;

        try {
            setLoading(true);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data, error: fetchError } = await (supabase as any)
                .from('strava_connections')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (fetchError && fetchError.code !== 'PGRST116') {
                console.error('[Strava] Error fetching connection:', fetchError);
                setError(fetchError.message);
            } else {
                setConnection(data as StravaConnection | null);
            }
        } catch (err) {
            console.error('[Strava] Unexpected error:', err);
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    // Fetch weekly stats
    const fetchStats = useCallback(async () => {
        if (!user?.id || !isConnected) return;

        try {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data, error: statsError } = await (supabase as any)
                .from('strava_activities')
                .select('distance, duration, calories')
                .eq('user_id', user.id)
                .gte('created_at', weekAgo.toISOString());

            if (statsError) {
                console.error('[Strava] Error fetching stats:', statsError);
                return;
            }

            if (data && data.length > 0) {
                interface StravaActivity {
                    distance?: number;
                    duration?: number;
                    calories?: number;
                }
                const weeklyStats = (data as StravaActivity[]).reduce(
                    (acc, activity) => ({
                        weeklyDistance: acc.weeklyDistance + (Number(activity.distance) || 0) / 1000,
                        weeklyDuration: acc.weeklyDuration + (Number(activity.duration) || 0) / 60,
                        weeklyCalorics: acc.weeklyCalorics + (Number(activity.calories) || 0),
                        totalActivities: acc.totalActivities + 1,
                    }),
                    defaultStats
                );
                setStats(weeklyStats);
            }
        } catch (err) {
            console.error('[Strava] Error calculating stats:', err);
        }
    }, [user?.id, isConnected]);

    // Connect to Strava (OAuth2 flow)
    const connectStrava = useCallback(async () => {
        if (!user?.id) {
            setError('Usuário não autenticado');
            return;
        }

        if (!STRAVA_CLIENT_ID) {
            setError('Configuração Strava não encontrada. Contate o suporte.');
            console.error('[Strava] VITE_STRAVA_CLIENT_ID not configured');
            return;
        }

        try {
            setConnecting(true);
            setError(null);

            // Generate state for CSRF protection
            const state = btoa(JSON.stringify({
                userId: user.id,
                timestamp: Date.now(),
            }));

            const authUrl = `${STRAVA_AUTH_URL}?` + new URLSearchParams({
                client_id: STRAVA_CLIENT_ID,
                redirect_uri: STRAVA_REDIRECT_URI,
                response_type: 'code',
                scope: STRAVA_SCOPES,
                state,
            }).toString();

            if (Capacitor.isNativePlatform()) {
                // Native: Open in-app browser
                await Browser.open({ url: authUrl });
            } else {
                // Web: Redirect
                window.location.href = authUrl;
            }
        } catch (err) {
            console.error('[Strava] Connection error:', err);
            setError('Erro ao conectar com Strava');
        } finally {
            setConnecting(false);
        }
    }, [user?.id]);

    // Disconnect from Strava
    const disconnect = useCallback(async () => {
        if (!user?.id) return;

        try {
            setLoading(true);
            setError(null);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error: deleteError } = await (supabase as any)
                .from('strava_connections')
                .delete()
                .eq('user_id', user.id);

            if (deleteError) {
                setError('Erro ao desconectar do Strava');
                console.error('[Strava] Disconnect error:', deleteError);
            } else {
                setConnection(null);
                setStats(defaultStats);
            }
        } catch (err) {
            console.error('[Strava] Unexpected disconnect error:', err);
            setError('Erro inesperado ao desconectar');
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    // Sync activities from Strava
    const syncData = useCallback(async () => {
        if (!user?.id || !isConnected) return;

        try {
            setLoading(true);
            setError(null);

            // Call Edge Function to sync activities
            const { data, error: syncError } = await supabase.functions.invoke('strava-sync', {
                body: { userId: user.id },
            });

            if (syncError) {
                console.error('[Strava] Sync error:', syncError);
                setError('Erro ao sincronizar atividades');
            } else {
                console.log('[Strava] Sync successful:', data);
                await fetchStats();
                await fetchConnection();
            }
        } catch (err) {
            console.error('[Strava] Unexpected sync error:', err);
            setError('Erro inesperado na sincronização');
        } finally {
            setLoading(false);
        }
    }, [user?.id, isConnected, fetchStats, fetchConnection]);

    // Initial load
    useEffect(() => {
        fetchConnection();
    }, [fetchConnection]);

    // Load stats when connected
    useEffect(() => {
        if (isConnected) {
            fetchStats();
        }
    }, [isConnected, fetchStats]);

    return {
        connection,
        stats,
        loading,
        connecting,
        error,
        isConnected,
        connectStrava,
        disconnect,
        syncData,
    };
};

export default useStravaIntegration;
