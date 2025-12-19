/**
 * COD System - Phase 2: Workout Evolution Hook
 * 
 * Fetches and processes workout log data for evolution charts.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/components/auth/AuthProvider';

export interface WorkoutLogEntry {
    id: string;
    workout_date: string;
    total_volume_kg: number;
    average_rpe: number;
    readiness_score: number | null;
    readiness_level: 'green' | 'yellow' | 'red' | null;
    duration_seconds: number;
    completed_exercises: number;
}

export interface EvolutionStats {
    totalWorkouts: number;
    totalVolume: number;
    avgRpe: number;
    avgReadiness: number;
    greenDays: number;
    yellowDays: number;
    redDays: number;
    volumeTrend: number; // % change vs previous period
    consistencyScore: number; // % of expected workouts completed
}

export interface UseWorkoutEvolutionResult {
    logs: WorkoutLogEntry[];
    stats: EvolutionStats | null;
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;

    // Formatted data for charts
    chartData: Array<{
        date: string;
        totalVolume: number;
        averageRpe: number;
        readinessScore: number;
        readinessLevel: 'green' | 'yellow' | 'red';
        exerciseCount: number;
        duration: number;
    }>;
}

export const useWorkoutEvolution = (daysBack: number = 30): UseWorkoutEvolutionResult => {
    const { user } = useAuthContext();
    const [logs, setLogs] = useState<WorkoutLogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchLogs = useCallback(async () => {
        if (!user?.id) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const startDate = new Date();
            startDate.setDate(startDate.getDate() - daysBack);

            const { data, error: fetchError } = await supabase
                .from('workout_logs')
                .select(`
          id,
          workout_date,
          total_volume_kg,
          average_rpe,
          duration_seconds,
          completed_exercises,
          readiness_level
        `)
                .eq('student_id', user.id)
                .eq('status', 'completed')
                .gte('workout_date', startDate.toISOString().split('T')[0])
                .order('workout_date', { ascending: true });

            if (fetchError) {
                // Table might not exist
                if (fetchError.code === '42P01') {
                    console.warn('[WorkoutEvolution] Table not found - COD System not migrated');
                    setLogs([]);
                    return;
                }
                throw fetchError;
            }

            // Also fetch readiness scores from wellness_checkins
            const { data: checkins } = await supabase
                .from('wellness_checkins')
                .select('checkin_date, readiness_score')
                .eq('student_id', user.id)
                .gte('checkin_date', startDate.toISOString().split('T')[0]);

            // Map readiness scores to logs
            const checkinMap = new Map(
                (checkins || []).map(c => [c.checkin_date, c.readiness_score])
            );

            const processedLogs: WorkoutLogEntry[] = (data || []).map(log => ({
                id: log.id,
                workout_date: log.workout_date,
                total_volume_kg: log.total_volume_kg || 0,
                average_rpe: log.average_rpe || 5,
                readiness_score: checkinMap.get(log.workout_date) || null,
                readiness_level: log.readiness_level as any || 'green',
                duration_seconds: log.duration_seconds || 0,
                completed_exercises: log.completed_exercises || 0
            }));

            setLogs(processedLogs);
        } catch (err: any) {
            console.error('[WorkoutEvolution] Error:', err);
            setError(err.message || 'Erro ao carregar dados');
            setLogs([]);
        } finally {
            setLoading(false);
        }
    }, [user?.id, daysBack]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    // Calculate stats
    const stats = useMemo((): EvolutionStats | null => {
        if (logs.length === 0) return null;

        const totalVolume = logs.reduce((sum, l) => sum + l.total_volume_kg, 0);
        const avgRpe = logs.reduce((sum, l) => sum + l.average_rpe, 0) / logs.length;
        const logsWithReadiness = logs.filter(l => l.readiness_score !== null);
        const avgReadiness = logsWithReadiness.length > 0
            ? logsWithReadiness.reduce((sum, l) => sum + (l.readiness_score || 0), 0) / logsWithReadiness.length
            : 0;

        // Count by readiness level
        const greenDays = logs.filter(l => l.readiness_level === 'green').length;
        const yellowDays = logs.filter(l => l.readiness_level === 'yellow').length;
        const redDays = logs.filter(l => l.readiness_level === 'red').length;

        // Volume trend (last 7 days vs previous 7)
        const recentLogs = logs.slice(-7);
        const olderLogs = logs.slice(-14, -7);
        const recentVolume = recentLogs.reduce((sum, l) => sum + l.total_volume_kg, 0);
        const olderVolume = olderLogs.reduce((sum, l) => sum + l.total_volume_kg, 0);
        const volumeTrend = olderVolume > 0
            ? ((recentVolume - olderVolume) / olderVolume) * 100
            : 0;

        // Consistency (assuming 4 workouts per week target)
        const weeksInPeriod = daysBack / 7;
        const expectedWorkouts = weeksInPeriod * 4;
        const consistencyScore = Math.min(100, (logs.length / expectedWorkouts) * 100);

        return {
            totalWorkouts: logs.length,
            totalVolume: Math.round(totalVolume),
            avgRpe: Math.round(avgRpe * 10) / 10,
            avgReadiness: Math.round(avgReadiness * 10) / 10,
            greenDays,
            yellowDays,
            redDays,
            volumeTrend: Math.round(volumeTrend * 10) / 10,
            consistencyScore: Math.round(consistencyScore)
        };
    }, [logs, daysBack]);

    // Format data for charts
    const chartData = useMemo(() => {
        return logs.map(log => ({
            date: log.workout_date,
            totalVolume: log.total_volume_kg,
            averageRpe: log.average_rpe,
            readinessScore: log.readiness_score || 5,
            readinessLevel: log.readiness_level || 'green',
            exerciseCount: log.completed_exercises,
            duration: log.duration_seconds
        }));
    }, [logs]);

    return {
        logs,
        stats,
        loading,
        error,
        refresh: fetchLogs,
        chartData
    };
};

export default useWorkoutEvolution;
