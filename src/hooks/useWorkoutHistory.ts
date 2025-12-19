import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface CompletedWorkout {
    workoutPlanId: string;
    completedAt: string;
    sessionName: string;
    totalVolume: number;
    averageRpe: number;
    overallRpe?: number;
    workoutFeeling?: string;
}

export const useWorkoutHistory = () => {
    const { user } = useAuth();
    const [completedToday, setCompletedToday] = useState<string[]>([]);
    const [todayWorkouts, setTodayWorkouts] = useState<CompletedWorkout[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.id) {
            setLoading(false);
            return;
        }

        const fetchTodayWorkouts = async () => {
            try {
                setLoading(true);

                // Get today's date range
                const today = new Date();
                const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
                const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

                const { data, error } = await supabase
                    .from('workout_logs')
                    .select('*')
                    .eq('student_id', user.id)
                    .eq('status', 'completed')
                    .gte('completed_at', startOfDay)
                    .lte('completed_at', endOfDay)
                    .order('completed_at', { ascending: false });

                if (error) {
                    console.warn('Error fetching workout history:', error);
                    // Graceful failure - return empty
                    setCompletedToday([]);
                    setTodayWorkouts([]);
                    return;
                }

                if (data) {
                    // Extract workout plan IDs
                    const completedIds = data.map(log => log.workout_plan_id).filter(Boolean);
                    setCompletedToday(completedIds);

                    // Map to structured data
                    const workouts: CompletedWorkout[] = data.map(log => ({
                        workoutPlanId: log.workout_plan_id || '',
                        completedAt: log.completed_at || '',
                        sessionName: log.session_name || '',
                        totalVolume: log.total_volume_kg || 0,
                        averageRpe: log.average_rpe || 0,
                        overallRpe: log.overall_rpe,
                        workoutFeeling: log.workout_feeling
                    }));
                    setTodayWorkouts(workouts);
                }
            } catch (err) {
                console.warn('Failed to fetch workout history:', err);
                setCompletedToday([]);
                setTodayWorkouts([]);
            } finally {
                setLoading(false);
            }
        };

        fetchTodayWorkouts();
    }, [user?.id]);

    const isCompletedToday = (workoutId: string | number): boolean => {
        return completedToday.includes(String(workoutId));
    };

    const getCompletionData = (workoutId: string | number): CompletedWorkout | undefined => {
        return todayWorkouts.find(w => w.workoutPlanId === String(workoutId));
    };

    return {
        completedToday,
        todayWorkouts,
        loading,
        isCompletedToday,
        getCompletionData
    };
};
