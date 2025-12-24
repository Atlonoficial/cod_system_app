import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface WorkoutPlan {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive' | 'draft';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  created_by: string;
  assigned_students: string[];
  exercises_data: Array<{
    id: string;
    name: string;
    notes?: string;
    exercises: Array<{
      id: string;
      name: string;
      category: string;
      sets: string;
      reps: number;
      weight?: number;
      load_unit?: 'kg' | '%' | 'lbs';
      duration?: number;
      rest_time: number;
      cycles?: number;
      tempo_cadence?: string;
      notes?: string;
    }>;
  }>;
  duration_weeks: number;
  sessions_per_week: number;
  tags: string[];
  notes?: string;
  is_template: boolean;
  created_at: string;
  updated_at: string;
}

export const useWorkoutPlans = () => {
  const { user } = useAuth();
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ BUILD 52: Cache com versionamento para invalidar após mudanças
  const CACHE_VERSION = 'v52_rpc'; // Incrementar para invalidar cache antigo
  const cacheRef = useRef<{ data: WorkoutPlan[]; timestamp: number; version: string } | null>(null);
  const CACHE_DURATION = 60000; // 1 minuto

  const fetchWorkoutPlans = useCallback(async (forceRefresh = false, retryCount = 0) => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    if (!forceRefresh && cacheRef.current) {
      const hasInvalidVersion = !cacheRef.current.version || cacheRef.current.version !== CACHE_VERSION;

      if (hasInvalidVersion) {
        cacheRef.current = null;
      } else {
        const cacheAge = Date.now() - cacheRef.current.timestamp;
        const isEmpty = cacheRef.current.data.length === 0;
        const cacheValid = isEmpty ? cacheAge < 10000 : cacheAge < CACHE_DURATION;

        if (cacheValid) {
          setWorkoutPlans(cacheRef.current.data);
          setLoading(false);
          return;
        }
      }
    }

    try {
      setError(null);

      let { data, error: queryError } = await supabase
        .rpc('get_user_workout_plans', {
          p_user_id: user.id
        });

      if (queryError || !data || data.length === 0) {
        const { data: allPlans } = await supabase
          .from('workout_plans')
          .select('*')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(100);

        data = (allPlans || []).filter(plan =>
          plan.created_by === user.id ||
          (Array.isArray(plan.assigned_students) && plan.assigned_students.includes(user.id))
        );
      }

      const formatted = (data || []).map(plan => ({
        ...plan,
        status: plan.status as 'active' | 'inactive' | 'draft',
        difficulty: plan.difficulty as 'beginner' | 'intermediate' | 'advanced',
        exercises_data: Array.isArray(plan.exercises_data) ? plan.exercises_data as any[] : []
      }));

      // ✅ BUILD 52: Retry automático se vazio (máx 3 tentativas)
      if (formatted.length === 0 && retryCount < 3) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        return fetchWorkoutPlans(true, retryCount + 1);
      }

      // ✅ BUILD 52: Atualizar cache com versão
      cacheRef.current = { data: formatted, timestamp: Date.now(), version: CACHE_VERSION };
      setWorkoutPlans(formatted);
    } catch (err) {
      setError('Erro inesperado ao carregar planos');
      setWorkoutPlans([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // ✅ CORREÇÃO DEFINITIVA: Fetch inicial SEM dependência circular
  useEffect(() => {
    if (!user?.id) {
      console.log('[useWorkoutPlans] No user, skipping');
      setLoading(false);
      return;
    }

    console.log('🔄 [useWorkoutPlans] Mount with user:', user.id);

    // ✅ Limpar cache para forçar RPC
    cacheRef.current = null;

    // ✅ Chamar RPC diretamente sem dependência de fetchWorkoutPlans
    (async () => {
      try {
        setError(null);
        console.log('📞 [useWorkoutPlans] Calling RPC get_user_workout_plans');

        let { data, error: queryError } = await supabase
          .rpc('get_user_workout_plans', {
            p_user_id: user.id
          });

        console.log('📦 [useWorkoutPlans] RPC result:', {
          hasData: !!data,
          length: data?.length || 0,
          hasError: !!queryError
        });

        if (queryError || !data || data.length === 0) {
          console.log('[useWorkoutPlans] RPC failed/empty, using fallback');
          const { data: allPlans } = await supabase
            .from('workout_plans')
            .select('*')
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(100);

          data = (allPlans || []).filter(plan =>
            plan.created_by === user.id ||
            (Array.isArray(plan.assigned_students) && plan.assigned_students.includes(user.id))
          );
        }

        const formatted = (data || []).map(plan => ({
          ...plan,
          status: plan.status as 'active' | 'inactive' | 'draft',
          difficulty: plan.difficulty as 'beginner' | 'intermediate' | 'advanced',
          exercises_data: Array.isArray(plan.exercises_data) ? plan.exercises_data as any[] : []
        }));

        console.log('✅ [useWorkoutPlans] Setting plans:', formatted.length);
        cacheRef.current = { data: formatted, timestamp: Date.now(), version: CACHE_VERSION };
        setWorkoutPlans(formatted);

      } catch (err) {
        console.error('[useWorkoutPlans] Unexpected error:', err);
        setError('Erro inesperado ao carregar planos');
        setWorkoutPlans([]);
      } finally {
        setLoading(false);
      }
    })();

  }, [user?.id]); // ✅ APENAS user?.id como dependência

  // ✅ BUILD 54: Escutar eventos de realtime global
  useEffect(() => {
    if (!user?.id) return;

    const handleWorkoutPlansUpdate = () => {
      console.log('📡 [useWorkoutPlans] Evento realtime recebido - refreshing');
      cacheRef.current = null; // Limpar cache antes do refresh
      fetchWorkoutPlans(true);
    };

    window.addEventListener('workout-plans-updated', handleWorkoutPlansUpdate);

    return () => {
      window.removeEventListener('workout-plans-updated', handleWorkoutPlansUpdate);
    };
  }, [user?.id]); // ✅ REMOVIDO fetchWorkoutPlans das dependências (causa re-render infinito)

  // Get active plans for current user
  const activePlans = workoutPlans.filter(plan => plan.status === 'active');

  // Get current plan (most recent active plan)
  const currentPlan = activePlans.length > 0 ? activePlans[0] : null;

  return {
    workoutPlans,
    activePlans,
    currentPlan,
    loading,
    error,
    refetch: fetchWorkoutPlans
  };
};