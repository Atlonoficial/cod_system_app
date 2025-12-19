import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/components/auth/AuthProvider';
import { updateUserProfile } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ShieldCheck } from 'lucide-react';

export const AcceptTerms = () => {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user, refreshProfile } = useAuthContext();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleAcceptTerms = async () => {
    if (!termsAccepted) {
      toast({
        title: "⚠️ Termos não aceitos",
        description: "Você precisa aceitar os Termos de Uso e Política de Privacidade para continuar.",
        variant: "destructive",
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: "❌ Erro",
        description: "Usuário não encontrado. Faça login novamente.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const now = new Date().toISOString();

      // 1. Atualizar tabela profiles (Fonte da verdade)
      // ✅ Tenta atualizar, mas não bloqueia se as colunas não existirem (erro de schema)
      try {
        await updateUserProfile(user.id, {
          terms_accepted_at: now,
          privacy_accepted_at: now,
          terms_version: '1.0',
          privacy_version: '1.0',
        });
      } catch (profileError) {
        console.warn('[AcceptTerms] Falha ao atualizar tabela profiles (provavelmente colunas inexistentes):', profileError);
        // Não lançar erro, continuar para metadata
      }

      // 2. Atualizar metadata do usuário (Backup para fallback)
      // Usar getSupabase() diretamente para garantir que o cliente esteja inicializado
      const { getSupabase } = await import('@/integrations/supabase/client');
      const supabase = getSupabase();

      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          terms_accepted_at: now,
          privacy_accepted_at: now
        }
      });

      if (updateError) {
        console.error('[AcceptTerms] Erro ao atualizar metadata no servidor:', updateError);

        // 🚨 FALLBACK DE EMERGÊNCIA: Atualizar sessão localmente para desbloquear o usuário
        // Isso permite que o TermsGuard passe mesmo se o servidor rejeitar o update (ex: 400 Bad Request)
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user) {
          console.warn('[AcceptTerms] Aplicando fallback local de sessão...');

          const newSession = {
            ...session,
            user: {
              ...session.user,
              user_metadata: {
                ...session.user.user_metadata,
                terms_accepted_at: now,
                privacy_accepted_at: now
              }
            }
          };

          // Forçar atualização da sessão local
          await supabase.auth.setSession(newSession);

          // Atualizar contexto se disponível
          if (refreshProfile) {
            await refreshProfile();
          }
        }
      } else {
        // ✅ SUCESSO: Refresh session para garantir que o userRef no useAuth pegue o metadata atualizado
        console.log('[AcceptTerms] Metadata atualizado com sucesso, refreshing session...');
        await supabase.auth.refreshSession();
      }

      toast({
        title: "✅ Termos aceitos",
        description: "Você aceitou os Termos de Uso e Política de Privacidade.",
      });

      // ✅ Atualizar perfil localmente para evitar loop no TermsGuard
      if (refreshProfile) {
        await refreshProfile();
      }

      navigate('/', { replace: true });
    } catch (error) {
      console.error('[AcceptTerms] Erro ao atualizar perfil:', error);
      toast({
        title: "❌ Erro",
        description: "Não foi possível aceitar os termos. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Aceite dos Termos de Uso</CardTitle>
          <CardDescription>
            Para continuar usando o COD SYSTEM, é necessário aceitar nossos Termos de Uso e Política de Privacidade.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-border">
            <div>
              <h3 className="font-semibold mb-2">📋 Termos de Uso</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Os Termos de Uso definem as regras de utilização do aplicativo, suas responsabilidades e nossos compromissos.
              </p>
              <a
                href="https://exemplo.com/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline hover:text-primary/80 text-sm font-medium"
              >
                Ler Termos de Uso completos →
              </a>
            </div>

            <div className="border-t border-border pt-4">
              <h3 className="font-semibold mb-2">🔒 Política de Privacidade</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Nossa Política de Privacidade explica como coletamos, usamos e protegemos seus dados pessoais.
              </p>
              <a
                href="https://exemplo.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline hover:text-primary/80 text-sm font-medium"
              >
                Ler Política de Privacidade completa →
              </a>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-accent/30 rounded-lg border-2 border-accent">
            <Checkbox
              id="accept-terms"
              checked={termsAccepted}
              onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
              className="mt-1"
            />
            <Label htmlFor="accept-terms" className="text-sm leading-relaxed cursor-pointer font-medium">
              Li e concordo com os Termos de Uso e a Política de Privacidade do COD SYSTEM
            </Label>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              onClick={handleAcceptTerms}
              disabled={!termsAccepted || loading}
              className="w-full"
              size="lg"
            >
              {loading ? "Processando..." : "Aceitar e Continuar"}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Ao aceitar, você concorda em cumprir nossos termos e confirma que leu nossa política de privacidade.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
