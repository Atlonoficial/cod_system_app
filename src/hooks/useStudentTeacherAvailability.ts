import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useActiveSubscription } from '@/hooks/useActiveSubscription';
import { useRealtimeManager } from '@/hooks/useRealtimeManager';

export interface TeacherAvailability {
  id: string;
  teacher_id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  slot_minutes: number;
}

export const useStudentTeacherAvailability = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { hasActiveSubscription, teacherId: subscriptionTeacherId } = useActiveSubscription();
  const [availability, setAvailability] = useState<TeacherAvailability[]>([]);
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTeacherAndAvailability = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Check if user has active subscription first
      if (!hasActiveSubscription || !subscriptionTeacherId) {
        setTeacherId(null);
        setAvailability([]);
        setLoading(false);
        return;
      }

      // Use teacher ID from active subscription
      setTeacherId(subscriptionTeacherId);

      // Then fetch the teacher's availability
      const { data: availabilityData, error: availabilityError } = await supabase
        .from('teacher_availability')
        .select('*')
        .eq('teacher_id', subscriptionTeacherId)
        .order('weekday', { ascending: true })
        .order('start_time', { ascending: true });

      if (availabilityError) throw availabilityError;

      console.log('📊 [useStudentTeacherAvailability] Resultado:', {
        teacherId: subscriptionTeacherId,
        availabilityCount: availabilityData?.length || 0,
        hasAvailability: (availabilityData?.length || 0) > 0
      });

      if (!availabilityData || availabilityData.length === 0) {
        console.warn('⚠️ [useStudentTeacherAvailability] Professor não tem disponibilidade configurada');
      }

      setAvailability(availabilityData || []);
    } catch (error: any) {
      console.error('Error fetching teacher availability:', error);
      // Silent fail - don't show toast, the UI handles no-data state gracefully
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchTeacherAndAvailability();
  }, [user?.id, hasActiveSubscription, subscriptionTeacherId]); // ✅ Add subscriptionTeacherId

  // Realtime subscriptions using centralized manager
  useRealtimeManager({
    subscriptions: [
      {
        table: 'teacher_availability',
        event: '*',
        filter: `teacher_id=eq.${teacherId}`,
        callback: () => {
          fetchTeacherAndAvailability();
        }
      }
    ],
    enabled: !!(teacherId && hasActiveSubscription),
    channelName: `teacher-availability-${teacherId}`,
    debounceMs: 2000
  });

  // Helper function to get availability for a specific weekday
  const getAvailabilityForWeekday = (weekday: number) => {
    return availability.filter(av => av.weekday === weekday);
  };

  // Helper function to format weekday names
  const getWeekdayName = (weekday: number) => {
    const names = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    return names[weekday] || '';
  };

  return {
    availability,
    teacherId,
    loading,
    getAvailabilityForWeekday,
    getWeekdayName,
    refreshAvailability: fetchTeacherAndAvailability,
  };
};