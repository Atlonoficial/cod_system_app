import { supabase } from '@/integrations/supabase/client';

/**
 * ✅ BUILD 55: Realtime Monitor (DEV only)
 * Monitora canais ativos e fornece visibilidade sobre conexões WebSocket
 */

export const logRealtimeStatus = () => {
  if (!import.meta.env.DEV) return;

  const channels = supabase.getChannels();

  console.log('📊 [RealtimeMonitor] Status:', {
    timestamp: new Date().toISOString(),
    totalChannels: channels.length,
    channels: channels.map(c => ({
      topic: c.topic,
      state: c.state
    }))
  });

  // ✅ Alerta se houver muitos canais (objetivo: máximo 3)
  if (channels.length > 3) {
    console.warn('⚠️ [RealtimeMonitor] Excesso de canais detectado!', {
      current: channels.length,
      expected: '2-3',
      suggestion: 'Consolidar subscriptions em useGlobalRealtime'
    });
  }
};

// ✅ Auto-iniciar monitor em DEV
if (import.meta.env.DEV) {
  // Log imediato
  setTimeout(logRealtimeStatus, 5000);

  // Log a cada 60 segundos (Build 14: reduzido de 30s)
  setInterval(logRealtimeStatus, 60000);
}
