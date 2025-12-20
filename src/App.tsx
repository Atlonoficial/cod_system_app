import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { useEffect, Suspense } from "react";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { TermsGuard } from "@/components/auth/TermsGuard";
// Gamification imports removed
import { SecurityProvider } from "@/components/security/SecurityProvider";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { NativeIntegration } from "@/components/native/NativeIntegration";
// NotificationPermissionModal removed - notifications disabled
import { NetworkStatus } from "@/components/ui/NetworkStatus";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { SubscriptionGuard } from "@/components/auth/SubscriptionGuard";
import { useGlobalRealtime } from "@/hooks/useGlobalRealtime";
import Index from "./pages/Index";
// Core application imports ready for production
import NotFound from "./pages/NotFound";
import { AuthConfirm } from "./pages/auth/AuthConfirm";
import { AuthRecovery } from "./pages/auth/AuthRecovery";
import { AuthInvite } from "./pages/auth/AuthInvite";
import { AuthMagicLink } from "./pages/auth/AuthMagicLink";
import { AuthChangeEmail } from "./pages/auth/AuthChangeEmail";
import { AuthError } from "./pages/auth/AuthError";
import { AcceptTerms } from "./pages/AcceptTerms";
import { Anamnese } from "./pages/Anamnese";
import { LoadingScreen } from "@/components/auth/LoadingScreen";
import ContaSeguranca from "./pages/ContaSeguranca";
import AssinaturasPlanos from "./pages/AssinaturasPlanos";
import { LazySettings } from "./pages/lazy/LazySettings";
// LazyAIChat removed
import { LazyTeacherStudentChat } from "./pages/lazy/LazyTeacherStudentChat";
import { LazyAgenda } from "./pages/lazy/LazyAgenda";
import { LazyMetas } from "./pages/lazy/LazyMetas";
import PoliticaPrivacidade from "./pages/PoliticaPrivacidade";


// LazyCursos removed
import { LazyExames } from "./pages/lazy/LazyExames";
import { LazyFotos } from "./pages/lazy/LazyFotos";
import { LazyAvaliacoes } from "./pages/lazy/LazyAvaliacoes";

import { AuthVerify } from "./pages/AuthVerify";
import { AuthVerified } from "./pages/AuthVerified";
import CadastroCompleto from "./pages/CadastroCompleto";
// Recompensas removed
import { HealthConnectionsScreen } from "./components/settings/HealthConnectionsScreen";
import WellnessHistoryPage from "./pages/WellnessHistoryPage";





const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 15, // 15 minutes (era cacheTime)
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: false, // CRITICAL: Prevent duplicate queries during boot
      retry: (failureCount, error: any) => {
        // Não tentar novamente para erros 4xx
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
    },
  },
});

// Componente auxiliar para redirecionar para /auth/confirm preservando query e hash
const RedirectToAuthConfirm = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Preservar query params e hash
    const newPath = `/auth/confirm${location.search}${location.hash}`;
    navigate(newPath, { replace: true });
  }, [location, navigate]);

  return null; // Não renderiza nada durante o redirect
};

// ✅ BUILD 32.1: AuthenticatedApp - Garante que AuthProvider está pronto antes de GamificationProvider
const AuthenticatedApp = () => {
  // ✅ BUILD 53: Consolidar TODAS as subscriptions realtime aqui
  useGlobalRealtime();

  return (
    // GamificationProvider removed
    // GamificationIntegrator removed
    <Routes>
      {/* Public routes (no AuthGuard, no TermsGuard) */}
      <Route path="/politica-privacidade" element={<PoliticaPrivacidade />} />
      <Route path="/accept-terms" element={<AcceptTerms />} />

      {/* Authentication Routes */}
      <Route path="/auth/confirm" element={<AuthConfirm />} />

      {/* ✅ Aliases de compatibilidade (redireciona para /auth/confirm) */}
      <Route path="/email/confirm" element={<RedirectToAuthConfirm />} />
      <Route path="/auth/app/confirm.html" element={<RedirectToAuthConfirm />} />

      <Route path="/auth/recovery" element={<AuthRecovery />} />
      <Route path="/auth/invite" element={<AuthInvite />} />
      <Route path="/auth/magic-link" element={<AuthMagicLink />} />
      <Route path="/auth/change-email" element={<AuthChangeEmail />} />
      <Route path="/auth/error" element={<AuthError />} />
      <Route path="/auth/verify" element={<AuthVerify />} />
      <Route path="/auth/verified" element={<AuthVerified />} />

      {/* ✅ BUILD 37: Fallback para variações de URL de confirmação */}
      <Route path="/auth/callback" element={<AuthConfirm />} />

      {/* Protected routes (with TermsGuard) */}
      <Route path="/" element={
        <AuthGuard>
          <TermsGuard>
            <Index />
          </TermsGuard>
        </AuthGuard>
      } />

      <Route path="/cadastro-completo" element={<AuthGuard><TermsGuard><CadastroCompleto /></TermsGuard></AuthGuard>} />
      <Route path="/anamnese" element={<AuthGuard><TermsGuard><Anamnese /></TermsGuard></AuthGuard>} />

      {/* Rotas que requerem assinatura ativa */}
      <Route path="/exames-medicos" element={<AuthGuard><TermsGuard><SubscriptionGuard><LazyExames /></SubscriptionGuard></TermsGuard></AuthGuard>} />
      <Route path="/fotos-progresso" element={<AuthGuard><TermsGuard><SubscriptionGuard><LazyFotos /></SubscriptionGuard></TermsGuard></AuthGuard>} />
      <Route path="/avaliacoes-fisicas" element={<AuthGuard><TermsGuard><SubscriptionGuard><LazyAvaliacoes /></SubscriptionGuard></TermsGuard></AuthGuard>} />

      {/* Configurações sempre acessíveis (para ver status do plano) */}
      <Route path="/configuracoes" element={<AuthGuard><TermsGuard><LazySettings /></TermsGuard></AuthGuard>} />
      <Route path="/conta-seguranca" element={<AuthGuard><TermsGuard><ContaSeguranca /></TermsGuard></AuthGuard>} />
      <Route path="/assinaturas-planos" element={<AuthGuard><TermsGuard><AssinaturasPlanos /></TermsGuard></AuthGuard>} />
      <Route path="/conexoes-saude" element={<AuthGuard><TermsGuard><HealthConnectionsScreen onBack={() => window.history.back()} /></TermsGuard></AuthGuard>} />
      <Route path="/wellness-history" element={<AuthGuard><TermsGuard><WellnessHistoryPage /></TermsGuard></AuthGuard>} />

      {/* Rotas que requerem assinatura ativa */}
      <Route path="/agenda" element={<AuthGuard><TermsGuard><SubscriptionGuard><LazyAgenda /></SubscriptionGuard></TermsGuard></AuthGuard>} />
      <Route path="/metas" element={<AuthGuard><TermsGuard><SubscriptionGuard><LazyMetas /></SubscriptionGuard></TermsGuard></AuthGuard>} />

      {/* Chats permitidos para suporte */}
      <Route path="/teacher-chat" element={<AuthGuard><TermsGuard><LazyTeacherStudentChat /></TermsGuard></AuthGuard>} />



      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

import { Capacitor } from '@capacitor/core';
import { syncManager } from '@/services/offline/syncManager';
import { AppTrackingTransparency } from 'capacitor-plugin-app-tracking-transparency';

const App = () => {
  // ✅ Initialize SyncManager
  useEffect(() => {
    syncManager.sync();

    // Request tracking permission on iOS
    if (Capacitor.getPlatform() === 'ios') {
      AppTrackingTransparency.requestPermission().then((status) => {
        console.log('Tracking status:', status);
      });
    }
  }, []);

  // ✅ BUILD 50: NUNCA usar StrictMode em:
  // - Produção (evita double render que causa loops infinitos)
  // - Plataforma nativa (iOS/Android)
  const isNative = Capacitor.isNativePlatform();
  const IS_PRODUCTION = import.meta.env.PROD;

  const useStrictMode = !IS_PRODUCTION && !isNative;

  const AppContent = (
    <ErrorBoundary>
      <Suspense fallback={<LoadingScreen />}>
        <SecurityProvider>
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <AuthProvider>
                  <NativeIntegration />
                  {/* NotificationPermissionModal removed */}
                  <NetworkStatus />
                  <AuthenticatedApp />
                </AuthProvider>
              </BrowserRouter>
            </TooltipProvider>
          </QueryClientProvider>
        </SecurityProvider>
      </Suspense>
    </ErrorBoundary>
  );

  // ✅ BUILD 50: StrictMode desativado globalmente para evitar double-render e loops
  // Isso estabiliza o comportamento de hooks sensíveis como useAuth e Realtime
  return AppContent;
};

export default App;