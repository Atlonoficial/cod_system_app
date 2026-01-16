import { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { User, Session } from '@supabase/supabase-js';
import { UserProfile } from '@/lib/supabase';
import { LoadingScreen } from './LoadingScreen';
import { AuthScreen } from './AuthScreen';
import { initPush, clearExternalUserId } from '@/lib/push';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useNativePermissions } from '@/hooks/useNativePermissions';
import { useDeviceContext } from '@/hooks/useDeviceContext';
import { logger } from '@/lib/logger';
import { useRegisterDailyActivity } from '@/hooks/useRegisterDailyActivity';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  isStudent: boolean;
  isTeacher: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ✅ BUILD 32.1: Export context para uso seguro em providers
export { AuthContext };

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const auth = useAuth();
  const location = useLocation();
  const { isNative } = useDeviceContext();
  const { requestCameraPermission } = useNativePermissions(); // ✅ BUILD 24: Push gerenciado por OneSignal
  const [forceRender, setForceRender] = useState(false);
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [emergencyDetails, setEmergencyDetails] = useState<string[]>([]);
  const [bootLogs, setBootLogs] = useState<string[]>([]);
  const [permissionsRequested, setPermissionsRequested] = useState(false);

  // ✅ Register daily activity automatically for authenticated users
  useRegisterDailyActivity();

  // ✅ NOVO: Capturar todos os logs do logger
  useEffect(() => {
    const logs: string[] = [];

    const originalLoggerLog = logger.info;
    const originalLoggerError = logger.error;

    (logger as any).infoWithCapture = (...args: any[]) => {
      const message = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
      if (message.includes('Boot') || message.includes('CapacitorStorage') || message.includes('useAuth')) {
        logs.push(message);
        setBootLogs(prev => [...prev, message].slice(-20)); // ✅ Últimos 20 logs
      }
      originalLoggerLog.apply(logger, args);
    };

    (logger as any).errorWithCapture = (...args: any[]) => {
      const message = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
      logs.push(`❌ ${message}`);
      setBootLogs(prev => [...prev, `❌ ${message}`].slice(-20));
      originalLoggerError.apply(logger, args);
    };

    return () => {
      // Restaurar originais se necessário
    };
  }, []);

  // ✅ BUILD 50: Log detalhado do estado de auth a cada mudança
  useEffect(() => {
    const stateStr = JSON.stringify({
      loading: auth.loading,
      isAuthenticated: auth.isAuthenticated,
      hasUser: !!auth.user,
      hasProfile: !!auth.userProfile,
      userType: auth.userProfile?.user_type || 'null',
      forceRender,
      emergencyMode
    });

    logger.info('AuthProvider', `🔄 State update: ${stateStr}`);
  }, [auth.loading, auth.isAuthenticated, auth.user, auth.userProfile, forceRender, emergencyMode, location.pathname]);

  // ✅ BUILD 52: FORÇA loading = false após 1s (2s → 1s mais agressivo)
  useEffect(() => {
    const forceLoadingOff = setTimeout(() => {
      if (auth.loading && !forceRender) {
        logger.error('AuthProvider', '🚨 FORCE LOADING OFF after 5s', {
          loading: auth.loading,
          user: !!auth.user,
          profile: !!auth.userProfile
        });
        setForceRender(true);
      }
    }, 5000); // ✅ 1s → 5s (give more time for profile fetch)

    return () => clearTimeout(forceLoadingOff);
  }, [auth.loading, forceRender, auth.user, auth.userProfile]);

  const PUBLIC_PATHS = [
    '/auth/verify',
    '/auth/verified',
    '/auth/confirm',
    '/auth/recovery',
    '/auth/invite',
    '/auth/magic-link',
    '/auth/change-email',
    '/auth/error'
  ];

  const isPublicRoute = PUBLIC_PATHS.some((p) => location.pathname.startsWith(p));

  // ✅ BUILD 52: Timeout reduzido para 1.5s (3s → 1.5s)
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (auth.loading && !forceRender) {
        logger.warn('AuthProvider', '⚠️ Loading timeout (6s) - forcing render', {
          loading: auth.loading,
          user: auth.user?.id
        });
        setForceRender(true);
      }
    }, 6000); // 1.5s → 6s
    return () => clearTimeout(timeout);
  }, [auth.loading, forceRender, auth.user]);

  // ✅ BUILD 52: Emergency timeout reduzido para 3s (5s → 3s)
  useEffect(() => {
    const timer = setTimeout(() => {
      // ✅ Ativar emergency mode APENAS se ainda estiver carregando E não tiver forçado render
      if (auth.loading && !forceRender) {
        logger.error('AuthProvider', '🚨 EMERGENCY MODE: Auth stuck for 10s', {
          loading: auth.loading,
          user: auth.user?.id,
          profile: !!auth.userProfile,
          isNative
        });

        setEmergencyDetails([
          `Loading: ${auth.loading}`,
          `User: ${auth.user?.id || 'null'}`,
          `Profile: ${auth.userProfile ? 'loaded' : 'null'}`,
          `Platform: ${isNative ? 'iOS/Android' : 'Web'}`,
          `Timestamp: ${new Date().toISOString()}`
        ]);
        setEmergencyMode(true);
      }
    }, 10000); // 10s safety net

    return () => clearTimeout(timer);
  }, [auth.loading, auth.isAuthenticated, auth.user, auth.userProfile, isNative, forceRender]);



  // Inicializar OneSignal quando usuário estiver autenticado
  useEffect(() => {
    const initializeOneSignal = async () => {
      if (auth.isAuthenticated && auth.user?.id && auth.userProfile) {
        try {
          // Verificar se o usuário tem push notifications habilitadas
          const pushEnabled = auth.userProfile.notification_preferences?.push_enabled !== false;

          if (!pushEnabled) {
            logger.info('AuthProvider', 'Push notifications disabled by user preference', {
              userId: auth.user.id
            });
            return;
          }

          logger.info('AuthProvider', 'OneSignal initialization starting', {
            userId: auth.user.id,
            userType: auth.userProfile?.user_type,
            platform: isNative ? 'Mobile' : 'Web',
            pushEnabled
          });

          await initPush(auth.user.id);

          logger.info('AuthProvider', 'OneSignal initialization complete', {
            userId: auth.user.id
          });
        } catch (error) {
          logger.error('AuthProvider', 'OneSignal initialization failed', error);
          if (import.meta.env.DEV) {
            logger.warn('AuthProvider', 'Check docs/ONESIGNAL_CONFIG.md for troubleshooting');
          }
        }
      } else if (!auth.isAuthenticated && !auth.loading) {
        // Limpar configurações OneSignal no logout
        logger.info('AuthProvider', 'Clearing OneSignal External User ID on logout');
        clearExternalUserId();
      }
    };

    initializeOneSignal();
  }, [auth.isAuthenticated, auth.user?.id, auth.loading, auth.userProfile, isNative]);

  // ✅ BUILD 24: Removido - OneSignal gerencia permissões automaticamente

  // ✅ FASE 3: Emergency mode UI melhorada com detalhes técnicos e logs
  if (emergencyMode) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 overflow-auto">
        <div className="text-center space-y-4 max-w-2xl w-full">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-white">Falha ao Iniciar</h1>
          <p className="text-gray-400 text-sm">
            O app não conseguiu carregar em 3 segundos.
          </p>

          {/* ✅ NOVO: Mostrar logs do boot */}
          <details className="text-left text-xs bg-gray-900 p-3 rounded max-h-60 overflow-auto" open>
            <summary className="cursor-pointer font-medium text-gray-400 mb-2">
              📋 Logs do Boot ({bootLogs.length})
            </summary>
            <div className="space-y-1 font-mono">
              {bootLogs.length > 0 ? (
                bootLogs.map((log, i) => (
                  <div key={i} className="text-gray-400 text-[10px] leading-tight break-all">
                    {log}
                  </div>
                ))
              ) : (
                <div className="text-gray-500">Nenhum log capturado</div>
              )}
            </div>
          </details>

          {/* Detalhes técnicos existentes */}
          <details className="text-left text-xs text-gray-500 bg-gray-900 p-3 rounded">
            <summary className="cursor-pointer font-medium text-gray-400">Detalhes técnicos</summary>
            <ul className="mt-2 space-y-1">
              {emergencyDetails.map((detail, i) => (
                <li key={i}>• {detail}</li>
              ))}
            </ul>
          </details>

          <Button
            onClick={() => {
              logger.info('Emergency', 'User requested reload');
              window.location.reload();
            }}
            className="w-full mt-6 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
          >
            🔄 Tentar Novamente
          </Button>

          <Button
            onClick={async () => {
              logger.info('Emergency', 'User requested cache clear');
              if ('caches' in window) {
                caches.keys().then(names => {
                  names.forEach(name => caches.delete(name));
                });
              }
              localStorage.clear();

              // ✅ NOVO: Limpar Preferences também
              if (isNative) {
                const { Preferences } = await import('@capacitor/preferences');
                await Preferences.clear();
                logger.info('Emergency', 'Preferences cleared');
              }

              window.location.reload();
            }}
            variant="outline"
            className="w-full text-white border-gray-700 hover:bg-gray-900"
          >
            🗑️ Limpar Cache e Tentar
          </Button>
        </div>
      </div>
    );
  }

  // ✅ BUILD 50: Mostrar LoadingScreen APENAS se loading E forceRender = false
  if (auth.loading && !forceRender) {
    return <LoadingScreen />;
  }

  // ✅ Se forceRender = true, ignorar auth.loading e renderizar app
  if (forceRender && auth.loading) {
    logger.warn('AuthProvider', '⚠️ Force rendering despite loading = true');
  }

  if (!auth.isAuthenticated && !isPublicRoute) {
    return <AuthScreen />;
  }

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
};
