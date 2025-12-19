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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img
            src="/cod-logo.png"
            alt="COD System"
            className="h-32 w-auto mx-auto mb-4"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Fazer Login</CardTitle>
            <CardDescription>
              Entre com sua conta para acessar seus treinos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
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
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  onClick={handleResetPassword}
                  disabled={resetLoading || resetCooldown > 0}
                  className="flex items-center gap-2"
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
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Não tem uma conta?
          </p>
          <div className="p-3 bg-muted/30 rounded-lg border border-border/50 text-sm text-muted-foreground">
            <p>
              Este aplicativo é exclusivo para alunos convidados.
              <br />
              <strong>Peça o convite para seu Personal Trainer.</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};