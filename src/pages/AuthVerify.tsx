import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getRedirectPath } from "@/utils/authRedirectUtils";
import { CheckCircle, Mail, RefreshCw, Loader2, AlertCircle } from "lucide-react";

export const AuthVerify = () => {
  const [params] = useSearchParams();
  const emailParam = params.get("email") || "";
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [autoCheckCount, setAutoCheckCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const email = useMemo(() => emailParam, [emailParam]);

  useEffect(() => {
    document.title = "Verificar Email";
  }, []);

  // ✅ BUILD 37: Listener de autenticação em tempo real
  useEffect(() => {
    console.log('[AuthVerify] 🎧 Configurando listener de autenticação...');

    // Inscrever-se para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[AuthVerify] 🔔 Evento de auth:', event, {
          hasSession: !!session,
          userId: session?.user?.id,
          emailConfirmed: session?.user?.email_confirmed_at
        });

        // ✅ Se sessão foi estabelecida = email foi confirmado!
        if (event === 'SIGNED_IN' && session?.user?.email_confirmed_at) {
          console.log('[AuthVerify] ✅ Usuário autenticado! Email confirmado.');
          setIsVerified(true);

          // Parar polling se estiver rodando
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }

          toast({
            title: "✅ Email verificado!",
            description: "Bem-vindo!",
          });

          // Redirecionar após 1.5s
          setTimeout(async () => {
            const redirectPath = await getRedirectPath();
            console.log('[AuthVerify] 🔄 Redirecionando para:', redirectPath);
            navigate(redirectPath, { replace: true });
          }, 1500);
        }
      }
    );

    return () => {
      console.log('[AuthVerify] 🧹 Removendo listener de autenticação');
      subscription.unsubscribe();
    };
  }, [toast, navigate]);

  // Verificar status de confirmação do email
  const checkEmailVerification = useCallback(async (silent = false) => {
    // Prevenir execuções simultâneas
    if (isProcessing && !silent) {
      console.log('[AuthVerify] ⏸️ Verificação já em andamento, ignorando...');
      return false;
    }

    if (!silent) {
      setIsProcessing(true);
    }

    try {
      if (!silent) {
        console.log('[AuthVerify] 🔍 Verificando status do email...', { autoCheckCount });
      }

      const { data: { user }, error } = await supabase.auth.getUser();

      if (error) {
        console.error('[AuthVerify] ❌ Erro ao verificar usuário:', error);
        return false;
      }

      if (user?.email_confirmed_at) {
        console.log('[AuthVerify] ✅ Email confirmado:', {
          email: user.email,
          confirmedAt: user.email_confirmed_at
        });
        return true;
      }

      if (!silent) {
        console.log('[AuthVerify] ⏳ Email ainda não confirmado');
      }
      return false;
    } catch (error) {
      console.error('[AuthVerify] ❌ Erro na verificação:', error);
      return false;
    }
  }, [autoCheckCount]);


  // Polling automático
  useEffect(() => {
    console.log('[AuthVerify] 🚀 Iniciando verificação automática...');

    const autoCheck = async () => {
      const confirmed = await checkEmailVerification(true);

      if (confirmed) {
        console.log('[AuthVerify] ✅ Email já confirmado! Redirecionando...');
        setIsVerified(true);

        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }

        toast({
          title: "✅ Email verificado!",
          description: "Bem-vindo!",
        });

        setTimeout(async () => {
          const redirectPath = await getRedirectPath();
          console.log('[AuthVerify] 🔄 Redirecionando para:', redirectPath);
          navigate(redirectPath, { replace: true });
        }, 1500);
      } else {
        // Iniciar polling se não confirmado
        console.log('[AuthVerify] ⏰ Iniciando polling automático (5s)...');
        pollingIntervalRef.current = setInterval(async () => {
          setAutoCheckCount(prev => {
            const newCount = prev + 1;
            console.log(`[AuthVerify] 🔄 Tentativa automática ${newCount}/24`);

            if (newCount >= 24) {
              console.log('[AuthVerify] ⏹️ Limite de tentativas atingido (2 min)');
              if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
              }
            }

            return newCount;
          });

          const isConfirmed = await checkEmailVerification(true);

          if (isConfirmed) {
            console.log('[AuthVerify] ✅ Email confirmado via polling!');
            setIsVerified(true);

            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }

            toast({
              title: "✅ Email verificado!",
              description: "Bem-vindo!",
            });

            setTimeout(async () => {
              const redirectPath = await getRedirectPath();
              console.log('[AuthVerify] 🔄 Redirecionando para:', redirectPath);
              navigate(redirectPath, { replace: true });
            }, 1500);
          }
        }, 5000);
      }
    };

    autoCheck();

    return () => {
      if (pollingIntervalRef.current) {
        console.log('[AuthVerify] 🧹 Limpando polling');
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Função para verificar manualmente quando o usuário clica no botão
  const handleCheckVerification = async () => {
    console.log('[AuthVerify] 👆 Verificação manual solicitada');
    setChecking(true);
    setErrorMessage("");

    try {
      // ✅ Forçar atualização da sessão para garantir dados mais recentes
      const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();

      if (refreshError) {
        console.warn('[AuthVerify] ⚠️ Erro ao atualizar sessão, tentando obter sessão atual:', refreshError);
      }

      // ✅ Verificar sessão atual (seja a refrescada ou a cacheada)
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('[AuthVerify] ❌ Erro ao verificar sessão:', error);
        throw error;
      }

      // Usar a sessão mais recente disponível
      const currentSession = refreshedSession || session;

      if (currentSession?.user?.email_confirmed_at) {
        console.log('[AuthVerify] ✅ Sessão ativa encontrada! Email confirmado.');
        setIsVerified(true);

        // Parar polling
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }

        toast({
          title: "✅ Email verificado!",
          description: "Bem-vindo!",
        });

        setTimeout(async () => {
          const redirectPath = await getRedirectPath();
          console.log('[AuthVerify] 🔄 Redirecionando para:', redirectPath);
          navigate(redirectPath, { replace: true });
        }, 1500);
      } else {
        console.log('[AuthVerify] ⏳ Nenhuma sessão ativa ou email não confirmado.');
        // Tentar recarregar o usuário para ter certeza
        const { data: { user: freshUser } } = await supabase.auth.getUser();

        if (freshUser?.email_confirmed_at) {
          console.log('[AuthVerify] ✅ Usuário confirmado encontrado via getUser!');
          setIsVerified(true);
          // ... mesmo código de sucesso ...
          setTimeout(async () => {
            const redirectPath = await getRedirectPath();
            navigate(redirectPath, { replace: true });
          }, 1500);
        } else {
          setErrorMessage("📧 Email ainda não confirmado. Por favor, verifique sua caixa de entrada.");
        }
      }
    } catch (error) {
      console.error('[AuthVerify] ❌ Erro na verificação manual:', error);
      setErrorMessage("Erro ao verificar. Tente novamente ou reenvie o email.");
    } finally {
      setChecking(false);
    }
  };

  const handleResend = async () => {
    console.log('[AuthVerify] 📧 Reenviando email de confirmação...');

    if (!email) {
      console.error('[AuthVerify] ❌ Email não informado');
      toast({
        title: "Email não informado",
        description: "Não foi possível reenviar o email de confirmação.",
        variant: "destructive",
      });
      return;
    }

    setSending(true);

    try {
      // FASE 2: Verificar se email já está confirmado antes de reenviar
      console.log('[AuthVerify] 🔍 Verificando se email já está confirmado...');

      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', email)
        .maybeSingle();

      if (!profileError && profiles) {
        // Email existe, verificar se está confirmado
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (!authError && user?.email_confirmed_at) {
          console.log('[AuthVerify] ✅ Email já confirmado! Redirecionando...');
          toast({
            title: "✅ Email já confirmado!",
            description: "Você já pode acessar o app.",
          });

          setTimeout(async () => {
            const redirectPath = await getRedirectPath();
            navigate(redirectPath, { replace: true });
          }, 1500);

          setSending(false);
          return;
        }
      }

      // Email não confirmado → continuar com resend normal
      const { detectOrigin, calculateRedirectUrl } = await import('@/utils/domainDetector');
      const meta = detectOrigin('student');
      const redirectUrl = calculateRedirectUrl(meta);

      console.log('[AuthVerify] 📤 Reenviando para:', email);
      console.log('[AuthVerify] 🎯 redirectUrl:', redirectUrl);

      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: redirectUrl
        }
      });

      if (error) {
        console.error('[AuthVerify] ❌ Erro ao reenviar:', error);

        // ✅ BUILD 35: Detectar rate limit
        if (error.message?.includes('rate') ||
          error.message?.includes('after') ||
          error.message?.includes('Email rate limit exceeded') ||
          error.status === 429) {
          toast({
            title: "⏰ Aguarde um momento",
            description: "Por segurança, aguarde 60 segundos antes de reenviar novamente.",
            variant: "destructive",
          });
          throw error;
        }

        throw error;
      }

      console.log('[AuthVerify] ✅ Email reenviado com sucesso');
      toast({
        title: "📧 Email reenviado!",
        description: "Verifique sua caixa de entrada e spam.",
      });
    } catch (error: any) {
      console.error('[AuthVerify] ❌ Erro ao reenviar email:', error);
      toast({
        title: "Erro ao reenviar",
        description: error.message || "Aguarde alguns minutos antes de tentar novamente.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  if (isVerified) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center p-4 md:p-6">
        <div className="w-full max-w-md md:max-w-lg">
          <div className="bg-black/40 backdrop-blur-xl border border-gray-800/50 rounded-2xl md:rounded-3xl shadow-2xl shadow-green-500/10 p-6 md:p-8 animate-in fade-in-50 zoom-in-95 duration-700">
            {/* Success Icon */}
            <div className="flex justify-center mb-6 animate-in zoom-in-50 duration-700">
              <div className="bg-green-500/20 rounded-full p-6 md:p-8">
                <CheckCircle className="h-20 w-20 md:h-24 md:w-24 text-green-400 animate-pulse" />
              </div>
            </div>

            {/* Success Text */}
            <div className="text-center space-y-3 mb-6">
              <h1 className="text-2xl md:text-3xl font-bold text-white animate-in slide-in-from-bottom-3 duration-500 delay-200">
                ✅ Email Verificado!
              </h1>
              <p className="text-sm md:text-base text-gray-300 leading-relaxed animate-in slide-in-from-bottom-3 duration-500 delay-300">
                Sua conta foi confirmada com sucesso
              </p>
            </div>

            {/* Loading Indicator */}
            <div className="flex justify-center items-center gap-3 text-gray-400 animate-in fade-in-50 duration-500 delay-500">
              <Loader2 className="h-5 w-5 animate-spin text-yellow-500" />
              <span className="text-sm md:text-base font-medium">Carregando app...</span>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center p-4 md:p-6 lg:p-8">
      <div className="w-full max-w-md md:max-w-lg">
        <div className="bg-black/40 backdrop-blur-xl border border-gray-800/50 rounded-2xl md:rounded-3xl shadow-2xl shadow-yellow-500/5 p-6 md:p-8">

          {/* Email Banner */}
          {email && (
            <div className="bg-gradient-to-r from-yellow-900/30 via-yellow-800/20 to-yellow-900/30 border border-yellow-600/50 rounded-xl p-4 mb-8 animate-in fade-in-50 slide-in-from-top-5 duration-500">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-300 mb-1">
                    📧 Email enviado para:
                  </p>
                  <p className="text-yellow-500 font-mono font-semibold text-sm md:text-base break-all">
                    {email}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Icon Container */}
          <div className="flex justify-center mb-8 animate-in zoom-in-50 duration-700 delay-200">
            <div className="bg-yellow-500/10 rounded-full p-6 md:p-8">
              {checking ? (
                <Loader2 className="h-20 w-20 md:h-24 md:w-24 text-yellow-500 animate-spin" />
              ) : (
                <Mail className="h-20 w-20 md:h-24 md:w-24 text-yellow-500 animate-pulse" />
              )}
            </div>
          </div>

          {/* Text Content */}
          <div className="text-center space-y-3 mb-8 animate-in fade-in-50 slide-in-from-bottom-3 duration-500 delay-300">
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              📧 Confirme seu Email
            </h1>
            <p className="text-sm md:text-base text-gray-300 leading-relaxed px-2">
              Enviamos um link de confirmação. Clique nele para ativar sua conta.
            </p>
            {autoCheckCount > 0 && autoCheckCount < 24 && (
              <div className="flex items-center justify-center gap-2 text-yellow-500/70 text-xs mt-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Verificando automaticamente... ({autoCheckCount}/24)</span>
              </div>
            )}
          </div>

          {/* Buttons Section */}
          <div className="flex flex-col gap-4 animate-in fade-in-50 slide-in-from-bottom-5 duration-500 delay-500">
            {/* Primary Button */}
            <button
              onClick={handleCheckVerification}
              disabled={checking}
              className="group relative w-full h-14 md:h-16 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-semibold text-base md:text-lg rounded-xl shadow-lg shadow-yellow-500/30 hover:shadow-yellow-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
              aria-label="Verificar se o email foi confirmado"
            >
              {checking ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Verificando...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5" />
                  <span>Já confirmei meu email</span>
                </>
              )}
            </button>

            {/* Error Message */}
            {errorMessage && (
              <div
                className="bg-red-500/10 border-l-4 border-red-500 p-3 rounded-lg animate-in slide-in-from-top-2 duration-300"
                role="alert"
                aria-live="polite"
              >
                <div className="flex items-center gap-2 text-red-400 text-sm">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              </div>
            )}

            {/* Secondary Button */}
            <button
              onClick={handleResend}
              disabled={sending || !email}
              className="group w-full h-12 md:h-14 bg-transparent border-2 border-gray-700 hover:border-gray-600 hover:bg-gray-800/50 text-gray-300 hover:text-white font-medium text-sm md:text-base rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              aria-label="Reenviar email de confirmação"
            >
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 group-hover:rotate-180 transition-transform duration-500" />
                  <span>Reenviar email de confirmação</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default AuthVerify;
