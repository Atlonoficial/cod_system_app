import { useEffect, useRef, useMemo } from 'react';
import { useRealtimeManager } from './useRealtimeManager';
import { useAuth } from './useAuth';
import '@/utils/realtimeMonitor'; // ✅ BUILD 55: Import monitor (auto-inicia em DEV)

/**
 * ✅ BUILD 53: Global Realtime Hook (Singleton)
 * 
 * Consolidates ALL realtime subscriptions into a SINGLE channel
 * to prevent server overload and excessive battery drain.
 * 
 * BEFORE: 30+ separate channels = 30x overhead
 * AFTER: 1 channel = 97% reduction in connections
 * 
 * Usage: Import ONLY in App.tsx
 */

let globalRealtimeInitialized = false;

export const useGlobalRealtime = () => {
  const { user } = useAuth();
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current || globalRealtimeInitialized) return;
    initRef.current = true;
    globalRealtimeInitialized = true;

    return () => {
      initRef.current = false;
      globalRealtimeInitialized = false;
    };
  }, []);

  // ✅ BUILD 55: Subscriptions consolidadas (6 canais → 1 canal = 83% redução)
  // ⚠️ EMERGENCY: Removido notifications do Realtime (array scan muito lento)

  // ✅ OTIMIZAÇÃO: Memoizar array de subscrições para evitar recriação do canal
  const subscriptions = useMemo(() => {
    if (!user?.id) return [];

    return [
      // Profile (crítico - dados do usuário)
      {
        table: 'profiles',
        event: '*' as const,
        filter: `id=eq.${user.id}`,
        callback: () => {
          window.dispatchEvent(new CustomEvent('profile-updated'));
        }
      },

      // Chat messages (crítico - tempo real necessário)
      // ⚠️ NOTA: Filtro .like é lento mas necessário (conversation_id pode ser teacher-student ou student-teacher)
      {
        table: 'chat_messages',
        event: 'INSERT' as const,
        filter: `conversation_id.like.%${user.id}%`,
        callback: (payload: any) => {
          if (import.meta.env.DEV) {
            console.log('📨 New chat message:', payload.new.id);
          }
          window.dispatchEvent(new CustomEvent('chat-messages-updated', {
            detail: payload.new
          }));
        }
      },



      // ✅ Conversations (consolidado de useUnreadMessages)
      {
        table: 'conversations',
        event: '*' as const,
        filter: `student_id=eq.${user.id}`,
        callback: () => {
          window.dispatchEvent(new CustomEvent('conversations-updated'));
        }
      },

      // ✅ Workout activities (consolidado de useGamificationStravaIntegration)
      {
        table: 'workout_activities',
        event: 'INSERT' as const,
        filter: `user_id=eq.${user.id}`,
        callback: (payload: any) => {
          window.dispatchEvent(new CustomEvent('workout-activity-created', {
            detail: payload.new
          }));
        }
      },

      // ✅ Active Subscriptions (consolidado de useActiveSubscription)
      {
        table: 'active_subscriptions',
        event: '*' as const,
        filter: `user_id=eq.${user.id}`,
        callback: () => {
          window.dispatchEvent(new CustomEvent('subscription-updated'));
        }
      },

      // ✅ Students (consolidado de useActiveSubscription - legacy status)
      {
        table: 'students',
        event: '*' as const,
        filter: `user_id=eq.${user.id}`,
        callback: () => {
          window.dispatchEvent(new CustomEvent('subscription-updated'));
        }
      },
    ];
  }, [user?.id]);

  useRealtimeManager({
    subscriptions,
    enabled: !!user?.id,
  });

  // ✅ BUILD 56: Performance metrics (DEV only)
  useEffect(() => {
    if (import.meta.env.DEV && user?.id) {
      console.log('📊 [GlobalRealtime] EMERGENCY Recovery Metrics:', {
        subscriptions: 5,
        removed: ['notifications (array scan)'],
        debounceMs: 2000,
        channelName: 'global-app-realtime',
        userId: user.id
      });
    }
  }, [user?.id]);
};
