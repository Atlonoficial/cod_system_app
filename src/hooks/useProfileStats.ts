import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/components/auth/AuthProvider';
import { useRealtimeManager } from './useRealtimeManager';

interface ProfileStats {

  sessionsCount: number;
  activeDays: number;
  examCount: number;
  photoCount: number;
  assessmentCount: number;
  loading: boolean;
  error: string | null;
}

export const useProfileStats = (): ProfileStats => {
  const { user } = useAuthContext();
  const [stats, setStats] = useState<Omit<ProfileStats, 'loading' | 'error'>>({

    sessionsCount: 0,
    activeDays: 0,
    examCount: 0,
    photoCount: 0,
    assessmentCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all data in parallel for better performance
        const [
          pointsResult,
          sessionsResult,
          activeDaysResult,
          examsResult,
          photosResult,
          assessmentsResult
        ] = await Promise.all([


          // Workout sessions count
          supabase
            .from('workout_sessions')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .then(res => {
              console.log('📊 [STATS] Sessions count:', res.count, res.error);
              return res;
            }),

          // Active days from user_daily_activity (NEW!)
          supabase
            .from('user_daily_activity')
            .select('activity_date', { count: 'exact', head: true })
            .eq('user_id', user.id),

          // Medical exams - check if table exists first
          supabase
            .from('medical_exams')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id),

          // Progress photos - check if table exists first  
          supabase
            .from('progress_photos')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id),

          // Physical assessments
          supabase
            .from('progress')
            .select('date, type')
            .eq('user_id', user.id)
            .eq('type', 'physical_assessment')
        ]);

        // Process assessments unique dates
        const assessmentDatesSet = new Set(
          (assessmentsResult.data || [])
            .map((r: any) => new Date(r.date).toISOString().slice(0, 10))
        );

        setStats({

          sessionsCount: sessionsResult.count || 0,
          activeDays: activeDaysResult.count || 0, // Count from user_daily_activity
          examCount: examsResult.count || 0,
          photoCount: photosResult.count || 0,
          assessmentCount: assessmentDatesSet.size,
        });

      } catch (err) {
        console.error('Error fetching profile stats:', err);
        setError(err instanceof Error ? err.message : 'Erro ao carregar estatísticas');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user?.id]);

  // Centralized realtime subscriptions
  useRealtimeManager({
    subscriptions: user?.id ? [

      {
        table: 'workout_sessions',
        event: '*',
        filter: `user_id=eq.${user.id}`,
        callback: async () => {
          // Refetch workout session count when sessions change
          const sessionsResult = await supabase
            .from('workout_sessions')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id);

          setStats(prev => ({
            ...prev,
            sessionsCount: sessionsResult.count || 0,
          }));
        },
      },
      {
        table: 'user_daily_activity',
        event: '*',
        filter: `user_id=eq.${user.id}`,
        callback: async () => {
          // Refetch active days when daily activity changes
          const activeDaysResult = await supabase
            .from('user_daily_activity')
            .select('activity_date', { count: 'exact', head: true })
            .eq('user_id', user.id);

          setStats(prev => ({
            ...prev,
            activeDays: activeDaysResult.count || 0,
          }));
        },
      },

    ] : [],
    enabled: !!user?.id,
    channelName: 'profile-stats-realtime',
    debounceMs: 1000,
  });

  return useMemo(() => ({
    ...stats,
    loading,
    error
  }), [stats, loading, error]);
};