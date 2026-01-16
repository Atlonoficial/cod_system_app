import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { toast } from "sonner";

export interface UserGoal {
  id: string;
  user_id: string;
  teacher_id?: string;
  title: string;
  description?: string;
  category: string;
  target_type: string;
  target_value: number;
  target_unit?: string;
  current_value: number;
  progress_percentage: number;
  status: string;
  start_date: string;
  target_date?: string;
  completed_at?: string;
  points_reward: number;
  is_challenge_based: boolean;
  challenge_id?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export const useGoals = () => {
  const { user } = useAuthContext();
  const [goals, setGoals] = useState<UserGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGoals = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGoals(data || []);
    } catch (err: any) {
      console.error('Error fetching goals:', err);
      setError(err.message);
      toast.error('Erro ao carregar metas');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const createGoal = useCallback(async (goalData: Omit<UserGoal, 'id' | 'user_id' | 'progress_percentage' | 'created_at' | 'updated_at'>) => {
    if (!user?.id) return false;

    try {
      // BUILD 57: Enviar apenas campos válidos para evitar erros de schema
      const insertData = {
        user_id: user.id,
        title: goalData.title,
        description: goalData.description || null,
        category: goalData.category || 'general',
        target_type: goalData.target_type || 'numeric',
        target_value: goalData.target_value,
        target_unit: goalData.target_unit || null,
        current_value: goalData.current_value || 0,
        status: goalData.status || 'active',
        start_date: goalData.start_date || new Date().toISOString().split('T')[0],
        target_date: goalData.target_date || null,
        points_reward: goalData.points_reward || 100,
        // Removido is_challenge_based pois pode causar conflito de schema
        challenge_id: goalData.challenge_id || null,
        metadata: goalData.metadata || null
      };

      console.log('[useGoals] Creating goal with data:', insertData);

      const { data, error } = await supabase
        .from('user_goals')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('[useGoals] Error creating goal:', error);
        throw error;
      }

      console.log('[useGoals] Goal created successfully:', data);
      await fetchGoals();
      toast.success('Meta criada com sucesso! 🎯');
      return true;
    } catch (err: any) {
      console.error('Error creating goal:', err);
      toast.error(`Erro ao criar meta: ${err.message || 'Erro desconhecido'}`);
      return false;
    }
  }, [user?.id, fetchGoals]);

  const updateGoal = useCallback(async (goalId: string, updates: Partial<UserGoal>) => {
    try {
      const { error } = await supabase
        .from('user_goals')
        .update(updates)
        .eq('id', goalId);

      if (error) throw error;

      await fetchGoals();
      toast.success('Meta atualizada! 📈');
      return true;
    } catch (err: any) {
      console.error('Error updating goal:', err);
      toast.error('Erro ao atualizar meta');
      return false;
    }
  }, [fetchGoals]);

  const updateGoalProgress = useCallback(async (goalId: string, newValue: number) => {
    try {
      const { error } = await supabase
        .from('user_goals')
        .update({ current_value: newValue })
        .eq('id', goalId);

      if (error) throw error;

      await fetchGoals();
      return true;
    } catch (err: any) {
      console.error('Error updating goal progress:', err);
      toast.error('Erro ao atualizar progresso');
      return false;
    }
  }, [fetchGoals]);

  const deleteGoal = useCallback(async (goalId: string) => {
    try {
      const { error } = await supabase
        .from('user_goals')
        .update({ status: 'cancelled' })
        .eq('id', goalId);

      if (error) throw error;

      await fetchGoals();
      toast.success('Meta cancelada');
      return true;
    } catch (err: any) {
      console.error('Error deleting goal:', err);
      toast.error('Erro ao cancelar meta');
      return false;
    }
  }, [fetchGoals]);

  // Estatísticas das metas
  const getGoalStats = useCallback(() => {
    const activeGoals = goals.filter(goal => goal.status === 'active');
    const completedGoals = goals.filter(goal => goal.status === 'completed');
    const averageProgress = activeGoals.length > 0
      ? activeGoals.reduce((sum, goal) => sum + goal.progress_percentage, 0) / activeGoals.length
      : 0;

    return {
      totalGoals: goals.length,
      activeGoals: activeGoals.length,
      completedGoals: completedGoals.length,
      averageProgress: Math.round(averageProgress)
    };
  }, [goals]);

  // Buscar metas por categoria
  const getGoalsByCategory = useCallback((category: string) => {
    return goals.filter(goal => goal.category === category && goal.status === 'active');
  }, [goals]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  // ✅ BUILD 53: Realtime removido - consolidado em useGlobalRealtime

  return {
    goals,
    loading,
    error,
    createGoal,
    updateGoal,
    updateGoalProgress,
    deleteGoal,
    fetchGoals,
    getGoalStats,
    getGoalsByCategory
  };
};