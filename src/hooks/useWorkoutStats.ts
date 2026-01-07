import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/components/auth/AuthProvider';

interface WorkoutStats {
    completedThisMonth: number;
    totalVolumeKg: number;
    estimatedCalories: number;
    todayCalories: number;
}

/**
 * Hook para buscar estatísticas de treinos completados
 * Usado no DashboardStats para exibir calorias e treinos do mês
 */
export const useWorkoutStats = () => {
    const { user } = useAuthContext();
    const [stats, setStats] = useState<WorkoutStats>({
        completedThisMonth: 0,
        totalVolumeKg: 0,
        estimatedCalories: 0,
        todayCalories: 0
    });
    const [loading, setLoading] = useState(true);

    const fetchStats = useCallback(async () => {
        if (!user?.id) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);

            // Get first day of current month
            const now = new Date();
            const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const startOfMonth = firstDayOfMonth.toISOString();

            // Get today's date range
            const today = new Date();
            const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
            const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString();

            // Fetch completed workouts this month
            const { data, error } = await supabase
                .from('workout_logs')
                .select('id, total_volume_kg, duration_seconds, completed_at')
                .eq('student_id', user.id)
                .eq('status', 'completed')
                .gte('completed_at', startOfMonth)
                .order('completed_at', { ascending: false });

            if (error) {
                console.warn('[useWorkoutStats] Error fetching:', error);
                setLoading(false);
                return;
            }

            if (data) {
                const completedThisMonth = data.length;
                const totalVolumeKg = data.reduce((sum, w) => sum + (w.total_volume_kg || 0), 0);

                // Estimate calories: ~5 calories per kg of volume (rough estimate based on metabolic cost)
                // Alternative: ~0.1 calories per second of workout time
                const estimatedCalories = data.reduce((sum, w) => {
                    // Use duration-based calculation if available, otherwise volume-based
                    if (w.duration_seconds && w.duration_seconds > 0) {
                        // Moderate intensity: ~0.1 cal/sec (6 cal/min)
                        return sum + Math.round(w.duration_seconds * 0.1);
                    }
                    // Volume-based fallback: ~5 cal per kg lifted
                    return sum + Math.round((w.total_volume_kg || 0) * 0.05);
                }, 0);

                // Calculate today's calories
                const todayWorkouts = data.filter(w => {
                    const completedAt = new Date(w.completed_at || '');
                    return completedAt >= new Date(startOfDay) && completedAt <= new Date(endOfDay);
                });

                const todayCalories = todayWorkouts.reduce((sum, w) => {
                    if (w.duration_seconds && w.duration_seconds > 0) {
                        return sum + Math.round(w.duration_seconds * 0.1);
                    }
                    return sum + Math.round((w.total_volume_kg || 0) * 0.05);
                }, 0);

                setStats({
                    completedThisMonth,
                    totalVolumeKg,
                    estimatedCalories,
                    todayCalories
                });
            }
        } catch (err) {
            console.warn('[useWorkoutStats] Exception:', err);
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    return {
        ...stats,
        loading,
        refresh: fetchStats
    };
};
