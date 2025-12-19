import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/components/auth/AuthProvider';


export interface ActiveSubscription {
  id: string;
  plan_id: string;
  teacher_id: string;
  status: string;
  start_at: string;
  end_at: string | null;
  plan_name: string;
  plan_features: any[];
  plan_price?: number;
  plan_currency?: string;
  plan_interval?: string;
  daysRemaining?: number;
  expirationStatus?: 'active' | 'expiring_soon' | 'expired';
}

export const useActiveSubscription = () => {
  const { user } = useAuthContext();
  const [subscription, setSubscription] = useState<ActiveSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const calculateDaysRemaining = (endDate: string | null): number => {
    if (!endDate) return -1;
    const now = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getExpirationStatus = (daysRemaining: number): 'active' | 'expiring_soon' | 'expired' => {
    if (daysRemaining < 0) return 'expired';
    if (daysRemaining <= 7) return 'expiring_soon';
    return 'active';
  };

  const fetchActiveSubscription = async () => {
    if (!user?.id) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('🔍 [useActiveSubscription] Fetching subscription for user:', user.id);

      // Priority 1: Check active_subscriptions table (new primary source)
      const { data: activeSubData, error: activeSubError } = await supabase
        .from('active_subscriptions')
        .select('id, plan_id, status, start_date, end_date, teacher_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .gte('end_date', new Date().toISOString().split('T')[0])
        .order('created_at', { ascending: false })
        .maybeSingle();

      if (activeSubData) {
        // Fetch plan catalog data separately
        const { data: planCatalogData, error: planCatalogError } = await supabase
          .from('plan_catalog')
          .select('name, price, currency, interval, features')
          .eq('id', activeSubData.plan_id)
          .eq('teacher_id', activeSubData.teacher_id)
          .maybeSingle();

        if (planCatalogData) {
          const daysRemaining = calculateDaysRemaining(activeSubData.end_date);
          const expirationStatus = getExpirationStatus(daysRemaining);

          console.log('✅ [useActiveSubscription] Found active subscription from active_subscriptions:', activeSubData);

          setSubscription({
            id: activeSubData.id,
            plan_id: activeSubData.plan_id,
            teacher_id: activeSubData.teacher_id,
            status: 'active',
            start_at: activeSubData.start_date,
            end_at: activeSubData.end_date,
            plan_name: planCatalogData.name,
            plan_features: Array.isArray(planCatalogData.features) ? planCatalogData.features : [],
            plan_price: planCatalogData.price,
            plan_currency: planCatalogData.currency,
            plan_interval: planCatalogData.interval,
            daysRemaining,
            expirationStatus
          });
          setLoading(false);
          return;
        }
      }

      // Priority 2: Check student membership data (legacy support)
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('teacher_id, active_plan, membership_status, membership_expiry')
        .eq('user_id', user.id)
        .maybeSingle();

      console.log('[useActiveSubscription] Student data:', {
        hasData: !!studentData,
        teacherId: studentData?.teacher_id,
        membershipStatus: studentData?.membership_status,
        activePlan: studentData?.active_plan,
        error: studentError
      });

      if (studentData?.membership_status === 'active' &&
        studentData.active_plan &&
        studentData.active_plan !== 'free' &&
        studentData.teacher_id) {

        const daysRemaining = calculateDaysRemaining(studentData.membership_expiry);
        const expirationStatus = getExpirationStatus(daysRemaining);

        // Only consider expired if date has actually passed
        if (expirationStatus !== 'expired') {
          let planCatalogData = null;

          // Fetch catalog data for additional information
          try {
            const planId = studentData.active_plan;
            const { data: catalogData } = await supabase
              .from('plan_catalog')
              .select('*')
              .or(`id.eq.${planId},name.eq.${studentData.active_plan}`)
              .eq('teacher_id', studentData.teacher_id)
              .limit(1)
              .maybeSingle();

            planCatalogData = catalogData;
          } catch (e) {
            console.warn('[useActiveSubscription] Error fetching plan catalog:', e);
          }

          console.log('✅ [useActiveSubscription] Using student data as primary source - Active membership');

          setSubscription({
            id: 'student-based-subscription',
            plan_id: studentData.active_plan,
            teacher_id: studentData.teacher_id,
            status: 'active',
            start_at: new Date().toISOString(),
            end_at: studentData.membership_expiry,
            plan_name: planCatalogData?.name || studentData.active_plan,
            plan_features: Array.isArray(planCatalogData?.features) ? planCatalogData.features : [],
            plan_price: planCatalogData?.price,
            plan_currency: planCatalogData?.currency,
            plan_interval: planCatalogData?.interval,
            daysRemaining,
            expirationStatus
          });
          setLoading(false);
          return;
        }
      }

      // Priority 3: Check plan_subscriptions table (fallback) - with error handling
      try {
        const { data: planSub, error: planSubError } = await supabase
          .from('plan_subscriptions')
          .select('id, plan_id, status, start_at, end_at, teacher_id')
          .eq('student_user_id', user.id)
          .in('status', ['active', 'pending'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!planSubError && planSub && planSub.status === 'active') {
          const daysRemaining = calculateDaysRemaining(planSub.end_at);
          const expirationStatus = getExpirationStatus(daysRemaining);

          // Fetch plan catalog details separately to avoid JOIN 400 errors
          const { data: catalogData } = await supabase
            .from('plan_catalog')
            .select('name, price, currency, interval, features')
            .eq('id', planSub.plan_id)
            .maybeSingle();

          console.log('✅ [useActiveSubscription] Using plan subscription as fallback source');

          setSubscription({
            id: planSub.id,
            plan_id: planSub.plan_id,
            teacher_id: planSub.teacher_id,
            status: planSub.status,
            start_at: planSub.start_at,
            end_at: planSub.end_at,
            plan_name: catalogData?.name || 'Unknown Plan',
            plan_features: Array.isArray(catalogData?.features) ? catalogData.features : [],
            plan_price: catalogData?.price,
            plan_currency: catalogData?.currency,
            plan_interval: catalogData?.interval,
            daysRemaining,
            expirationStatus
          });
          setLoading(false);
          return;
        }
      } catch (planSubError) {
        // Silently ignore plan_subscriptions errors - table may not exist or column missing
        console.warn('[useActiveSubscription] plan_subscriptions fallback skipped:', planSubError);
      }

      // ETAPA 2: Final fallback - if no subscription but student has teacher_id
      if (studentData?.teacher_id) {
        console.log('⚠️ [useActiveSubscription] No subscription but found teacher_id, creating minimal subscription object');
        setSubscription({
          id: 'student-teacher-only',
          plan_id: 'free',
          teacher_id: studentData.teacher_id,
          status: 'active',
          start_at: new Date().toISOString(),
          end_at: null,
          plan_name: 'free',
          plan_features: [],
          daysRemaining: -1,
          expirationStatus: 'active'
        });
      } else {
        // No active subscription found
        console.log('ℹ️ [useActiveSubscription] No active subscription found');
        setSubscription(null);
      }
    } catch (error: any) {
      console.error('❌ [useActiveSubscription] Error fetching subscription:', error);
      setError(error.message);
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.id) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    fetchActiveSubscription();
  }, [user?.id]);

  // Use centralized realtime manager
  // ✅ BUILD 54: Escutar eventos de realtime global
  useEffect(() => {
    if (!user?.id) return;

    const handleSubscriptionUpdate = () => {
      console.log('📡 [useActiveSubscription] Evento subscription-updated recebido');
      fetchActiveSubscription();
    };

    window.addEventListener('subscription-updated', handleSubscriptionUpdate);

    return () => {
      window.removeEventListener('subscription-updated', handleSubscriptionUpdate);
    };
  }, [user?.id]);

  // Helper functions - CORRIGIDO para considerar membership_status
  const hasActiveSubscription = () => {
    if (!subscription) return false;

    // Verificar se tem plano ativo e não está expirado
    const isActiveStatus = subscription.status === 'active';
    const isNotFree = subscription.plan_name !== 'free';
    const isNotExpired = !isSubscriptionExpired();

    console.log('[useActiveSubscription] hasActiveSubscription check:', {
      subscription: !!subscription,
      status: subscription.status,
      planName: subscription.plan_name,
      isActiveStatus,
      isNotFree,
      isNotExpired,
      result: isActiveStatus && isNotFree && isNotExpired
    });

    return isActiveStatus && isNotFree && isNotExpired;
  };

  const isSubscriptionExpired = () => {
    if (!subscription || !subscription.end_at) return false;
    return new Date(subscription.end_at) <= new Date();
  };

  const getSubscriptionStatus = () => {
    if (!subscription) return 'none';
    if (subscription.status === 'pending') return 'pending';
    if (isSubscriptionExpired()) return 'expired';
    if (subscription.status === 'active' && subscription.plan_name !== 'free') return 'active';
    return 'none';
  };

  const getStatusMessage = () => {
    const status = getSubscriptionStatus();

    switch (status) {
      case 'none':
        return 'Você precisa contratar uma consultoria para agendar horários';
      case 'pending':
        return 'Aguardando aprovação da consultoria pelo professor';
      case 'expired':
        return 'Sua consultoria expirou. Renove para continuar agendando';
      case 'active':
        return null; // Subscription is active, no message needed
      default:
        return 'Status da consultoria não reconhecido';
    }
  };

  return {
    subscription,
    loading,
    error,
    hasActiveSubscription: hasActiveSubscription(),
    isExpired: isSubscriptionExpired(),
    status: getSubscriptionStatus(),
    statusMessage: getStatusMessage(),
    teacherId: subscription?.teacher_id || null,
    planName: subscription?.plan_name || null,
    refresh: fetchActiveSubscription,
  };
};