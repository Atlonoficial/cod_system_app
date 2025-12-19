import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/components/auth/AuthProvider';

export interface WellnessCheckin {
    id: string;
    student_id: string;
    sleep_quality: number;
    sleep_hours: number;
    muscle_soreness: number;
    stress_level: number;
    energy_level: number;
    mood: number;
    hrv_score?: number;
    resting_hr?: number;
    readiness_score: number;
    readiness_level: 'green' | 'yellow' | 'red';
    notes?: string;
    checkin_date: string;
    checked_in_at: string;
}

export interface WellnessInput {
    sleep_quality: number;
    sleep_hours?: number;
    muscle_soreness: number;
    stress_level: number;
    energy_level: number;
    mood?: number;
    notes?: string;
    hrv_score?: number;
    resting_hr?: number;
}

interface AdaptationRule {
    id: string;
    readiness_level: string;
    volume_modifier: number;
    intensity_modifier: number;
    rest_modifier: number;
    user_message: string;
}

export const useWellnessCheckin = () => {
    const { user } = useAuthContext();
    const [todayCheckin, setTodayCheckin] = useState<WellnessCheckin | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [adaptationRule, setAdaptationRule] = useState<AdaptationRule | null>(null);
    const [tableExists, setTableExists] = useState(true);

    // Fetch today's check-in
    const fetchTodayCheckin = useCallback(async () => {
        if (!user?.id) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const today = new Date().toISOString().split('T')[0];

            const { data, error } = await supabase
                .from('wellness_checkins')
                .select('*')
                .eq('student_id', user.id)
                .eq('checkin_date', today)
                .maybeSingle();

            // Check if table doesn't exist (42P01 = undefined_table)
            if (error) {
                if (error.code === '42P01' || error.message?.includes('does not exist')) {
                    console.warn('[WellnessCheckin] Table not found - COD System migration needed');
                    setTableExists(false);
                    setLoading(false);
                    return;
                }
                if (error.code !== 'PGRST116') {
                    console.error('[WellnessCheckin] Error fetching:', error);
                    setLoading(false);
                    return;
                }
            }

            if (data) {
                setTodayCheckin(data as WellnessCheckin);
                // Fetch adaptation rule based on readiness level
                await fetchAdaptationRule(data.readiness_level);
            }
        } catch (err) {
            console.warn('[WellnessCheckin] Exception (table may not exist):', err);
            setTableExists(false);
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    // Fetch adaptation rule for readiness level
    const fetchAdaptationRule = async (level: string) => {
        if (!tableExists) return;

        try {
            const { data, error } = await supabase
                .from('adaptation_rules')
                .select('*')
                .eq('readiness_level', level)
                .eq('is_system_default', true)
                .single();

            if (!error && data) {
                setAdaptationRule(data as AdaptationRule);
            }
        } catch (err) {
            console.error('[WellnessCheckin] Error fetching rule:', err);
        }
    };

    // Submit check-in
    const submitCheckin = async (input: WellnessInput): Promise<WellnessCheckin | null> => {
        if (!user?.id) return null;

        try {
            setSubmitting(true);
            const today = new Date().toISOString().split('T')[0];

            // Upsert (insert or update if exists)
            const { data, error } = await supabase
                .from('wellness_checkins')
                .upsert({
                    student_id: user.id,
                    checkin_date: today,
                    ...input
                }, {
                    onConflict: 'student_id,checkin_date'
                })
                .select()
                .single();

            if (error) {
                console.error('[WellnessCheckin] Submit error:', error);
                throw error;
            }

            const checkin = data as WellnessCheckin;
            setTodayCheckin(checkin);
            await fetchAdaptationRule(checkin.readiness_level);

            console.log('[WellnessCheckin] ✅ Submitted:', checkin.readiness_level, checkin.readiness_score);
            return checkin;
        } catch (err) {
            console.error('[WellnessCheckin] Exception:', err);
            throw err;
        } finally {
            setSubmitting(false);
        }
    };

    // Check if user needs to do check-in today
    // Returns false if table doesn't exist (COD System not yet migrated)
    const needsCheckin = tableExists && !loading && !todayCheckin;

    // Get modifiers based on current readiness
    const getModifiers = () => {
        if (!adaptationRule) {
            return { volume: 1.0, intensity: 1.0, rest: 1.0 };
        }
        return {
            volume: adaptationRule.volume_modifier,
            intensity: adaptationRule.intensity_modifier,
            rest: adaptationRule.rest_modifier
        };
    };

    // Get user message based on readiness
    const getReadinessMessage = () => {
        if (!adaptationRule) return null;
        return adaptationRule.user_message;
    };

    // Load on mount
    useEffect(() => {
        fetchTodayCheckin();
    }, [fetchTodayCheckin]);

    return {
        // State
        todayCheckin,
        loading,
        submitting,
        needsCheckin,
        tableExists, // True if COD System tables are migrated

        // Computed
        readinessLevel: todayCheckin?.readiness_level || null,
        readinessScore: todayCheckin?.readiness_score || null,
        modifiers: getModifiers(),
        readinessMessage: getReadinessMessage(),

        // Actions
        submitCheckin,
        refresh: fetchTodayCheckin
    };
};
