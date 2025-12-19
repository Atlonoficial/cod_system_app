import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useActiveSubscription } from '@/hooks/useActiveSubscription';
import { useMyNutrition } from '@/hooks/useMyNutrition';
import { useRealTimePermissions } from '@/hooks/useRealTimePermissions';
import { supabase } from '@/integrations/supabase/client';

export interface StudentPermissions {
  // Verificações básicas
  hasActiveSubscription: boolean;
  hasNutritionAccess: boolean;
  hasAgendaAccess: boolean;
  hasProgressAccess: boolean;

  // Informações do plano
  planName: string | null;
  planFeatures: string[];
  membershipStatus: string | null;
  daysRemaining: number | null;
  teacherId: string | null;

  // Estados
  loading: boolean;
  error: string | null;

  // Métodos
  refresh: () => Promise<void>;
  getAccessMessage: (feature: string) => string;
}

export const useStudentPermissions = (): StudentPermissions => {
  const { user } = useAuth();
  const {
    subscription,
    hasActiveSubscription: hasActiveSubscriptionBase,
    loading: subscriptionLoading,
    error: subscriptionError,
    refresh: refreshSubscription
  } = useActiveSubscription();

  const {
    todaysMeals,
    loading: nutritionLoading,
    hasNutritionAccess
  } = useMyNutrition();

  // Hook para escutar mudanças em tempo real
  useRealTimePermissions();

  const [studentData, setStudentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Buscar dados do student para verificações adicionais
  useEffect(() => {
    const fetchStudentData = async () => {
      if (!user?.id) {
        setStudentData(null);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;

        console.log('[useStudentPermissions] Student data:', data);
        setStudentData(data);
      } catch (err: any) {
        console.error('[useStudentPermissions] Error fetching student data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [user?.id]);

  // Calcular permissões baseado nos dados disponíveis
  const permissions = useMemo((): StudentPermissions => {
    const baseLoading = subscriptionLoading || nutritionLoading || loading;
    const baseError = subscriptionError || error;

    // Função para gerar mensagens de acesso
    const getAccessMessage = (feature: string): string => {
      if (!hasActiveSubscriptionBase) {
        return `Para acessar ${feature}, você precisa de uma consultoria ativa. Entre em contato com seu professor ou contrate um plano.`;
      }

      if (subscription?.status === 'pending') {
        return `Sua consultoria está pendente de aprovação. Entre em contato com seu professor.`;
      }

      if (subscription?.expirationStatus === 'expired') {
        return `Sua consultoria expirou. Renove para continuar acessando ${feature}.`;
      }

      return `Acesso liberado para ${feature}.`;
    };

    // Verificações específicas por funcionalidade
    const hasNutritionAccessReal = hasNutritionAccess?.() || todaysMeals.length > 0;

    // Log detalhado das verificações
    console.log('[useStudentPermissions] Permission calculations:', {
      hasActiveSubscriptionBase,
      hasNutritionAccessReal,
      subscriptionStatus: subscription?.status,
      membershipStatus: studentData?.membership_status,
      todaysMealsCount: todaysMeals.length,
      planName: subscription?.plan_name,
      expirationStatus: subscription?.expirationStatus
    });

    return {
      // Verificações básicas
      hasActiveSubscription: hasActiveSubscriptionBase,
      hasNutritionAccess: hasNutritionAccessReal,
      hasAgendaAccess: hasActiveSubscriptionBase,
      hasProgressAccess: hasActiveSubscriptionBase,

      // Informações do plano
      planName: subscription?.plan_name || null,
      planFeatures: subscription?.plan_features || [],
      membershipStatus: studentData?.membership_status || subscription?.status || null,
      daysRemaining: subscription?.daysRemaining || null,
      teacherId: subscription?.teacher_id || studentData?.teacher_id || null,

      // Estados
      loading: baseLoading,
      error: baseError,

      // Métodos
      refresh: async () => {
        await refreshSubscription();
      },
      getAccessMessage
    };
  }, [
    subscriptionLoading,
    nutritionLoading,
    loading,
    subscriptionError,
    error,
    hasActiveSubscriptionBase,
    hasNutritionAccess,
    todaysMeals.length,
    subscription,
    studentData,
    refreshSubscription
  ]);

  return permissions;
};