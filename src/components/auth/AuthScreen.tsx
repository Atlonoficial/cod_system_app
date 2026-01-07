import { useState, useEffect } from 'react';
import { signInUser, resetPasswordForEmail } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Mail } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDeviceContext } from '@/hooks/useDeviceContext';

export const AuthScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resetCooldown, setResetCooldown] = useState(0);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isNative } = useDeviceContext();
  const [searchParams] = useSearchParams();

  // ✅ BUILD 36: Auto-focar no login se vier de confirmação de email
  useEffect(() => {
    const confirmed = searchParams.get('confirmed');

    if (confirmed === 'true') {
      toast({
        title: "✅ Email confirmado com sucesso!",
        description: "Faça login para acessar sua conta.",
      });
    }
  }, [searchParams, toast]);

  // Gerenciar cooldown
  useEffect(() => {
    if (resetCooldown > 0) {
      const timer = setTimeout(() => {
        setResetCooldown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resetCooldown]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // ✅ BUILD 40.2 FASE 4: Função de retry com backoff exponencial
    const loginWithRetry = async (maxRetries = 2) => {
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          if (attempt > 0) {
            // Aguardar antes de retry (2s, 4s, 8s...)
            const waitTime = Math.pow(2, attempt) * 1000;

            toast({
              title: `🔄 Tentativa ${attempt + 1}/${maxRetries + 1}`,
              description: `Aguardando ${waitTime / 1000}s antes de tentar novamente...`,
            });

            await new Promise(resolve => setTimeout(resolve, waitTime));
          }

          // Tentar login
          await signInUser(email, password);

          // Sucesso!
          toast({
            title: "Login realizado com sucesso!",
            description: "Bem-vindo de volta!",
          });

          return; // Sair do loop

        } catch (error: any) {
          // Se for último retry, propagar erro
          if (attempt === maxRetries) {
            throw error;
          }

          // Se não for erro de timeout, não fazer retry
          if (!error.message.includes('timeout') &&
            !error.message.includes('não está respondendo') &&
            !error.message.includes('Problema de conexão')) {
            throw error;
          }

          // Continuar para próximo retry
          console.log(`[Login] Tentativa ${attempt + 1} falhou, tentando novamente...`);
        }
      }
    };

    try {
      await loginWithRetry(2); // Até 3 tentativas (0, 1, 2)
    } catch (error: any) {
      // ✅ Detectar timeout do banco
      if (error.message.includes('timeout') ||
        error.message.includes('não está respondendo') ||
        error.message.includes('Problema de conexão')) {
        toast({
          title: "⏱️ Servidor está demorando",
          description: "O banco de dados pode estar acordando. Aguarde 10 segundos e tente novamente.",
          variant: "destructive",
        });
        return;
      }

      // ✅ Detectar erro de email não confirmado
      if (error.message.includes('não confirmado')) {
        toast({
          title: "⚠️ Email não confirmado",
          description: "Verifique sua caixa de entrada antes de fazer login.",
          variant: "destructive",
        });

        setTimeout(() => {
          toast({
            title: "💡 Dica",
            description: "Não recebeu o email? Clique em 'Criar Conta' novamente para reenviar.",
          });
        }, 2000);

        return;
      }

      // Erro genérico
      toast({
        title: "Erro no login",
        description: error.message || "Verifique suas credenciais e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    // Verificar cooldown
    if (resetCooldown > 0) {
      toast({
        title: "⏱️ Aguarde",
        description: `Você poderá solicitar novamente em ${resetCooldown}s`,
        variant: "destructive",
      });
      return;
    }

    if (!email) {
      toast({
        title: "Informe seu email",
        description: "Digite seu email para receber o link de recuperação.",
        variant: "destructive",
      });
      return;
    }

    if (!email.includes('@') || email.length < 5) {
      toast({
        title: "Email inválido",
        description: "Digite um email válido para continuar.",
        variant: "destructive",
      });
      return;
    }

    setResetLoading(true);

    try {
      // Tentar enviar o email de reset
      await resetPasswordForEmail(email, isNative);

      toast({
        title: "Email enviado com sucesso!",
        description: "Verifique sua caixa de entrada e spam. O link é válido por 1 hora.",
      });

      // Opcional: Mostrar informações adicionais sobre onde verificar
      setTimeout(() => {
        toast({
          title: "💡 Dica importante",
          description: "Se não receber o email, verifique a pasta de spam ou lixo eletrônico.",
        });
      }, 3000);

    } catch (error: any) {
      // Mensagens de erro mais específicas
      let errorMessage = "Tente novamente mais tarde.";

      if (error.message?.includes('network')) {
        errorMessage = "Verifique sua conexão com a internet.";
      } else if (error.message?.includes('rate limit')) {
        errorMessage = "Muitas tentativas. Aguarde alguns minutos.";
      } else if (error.message?.includes('invalid')) {
        errorMessage = "Email inválido ou não encontrado.";
      }

      toast({
        title: "Erro ao enviar email",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-10">
          <img
            src="/cod-logo.png"
            alt="COD System"
            className="h-20 w-auto mx-auto"
          />
        </div>

        {/* Login Card with Glassmorphism */}
        <div className="relative">
          {/* Glow Effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 to-green-500/20 rounded-2xl blur-xl"></div>

          {/* Card */}
          <Card className="relative bg-slate-900/40 backdrop-blur-xl border-white/10 shadow-2xl">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl font-bold text-white">Bem-vindo de volta</CardTitle>
              <CardDescription className="text-slate-400">
                Acesse sua conta para continuar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignIn} className="space-y-4">
                {/* Email Input */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm text-slate-300">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20"
                  />
                </div>
                {/* Password Input */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm text-slate-300">Senha</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-slate-400 hover:text-slate-300"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                {/* Forgot Password Link */}
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    onClick={handleResetPassword}
                    disabled={resetLoading || resetCooldown > 0}
                    className="flex items-center gap-2 text-blue-400 hover:text-blue-300 p-0 h-auto"
                  >
                    {resetLoading ? (
                      <>
                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Enviando...
                      </>
                    ) : resetCooldown > 0 ? (
                      <>
                        <Mail className="h-3 w-3" />
                        Aguarde {resetCooldown}s
                      </>
                    ) : (
                      <>
                        <Mail className="h-3 w-3" />
                        Esqueceu a senha?
                      </>
                    )}
                  </Button>
                </div>
                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-green-500 hover:from-blue-700 hover:to-green-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                  disabled={loading}
                >
                  {loading ? "Entrando..." : "Entrar"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center space-y-3">
          <p className="text-sm text-slate-400">
            Não tem conta?{' '}
            <span className="text-blue-400 font-medium">Cadastre-se</span>
          </p>
          <div className="pt-4 border-t border-slate-800">
            <p className="text-xs text-slate-500">
              Esqueceu sua senha ou precisa de ajuda?
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Entre em contato com o{' '}
              <span className="text-blue-400">suporte técnico</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};