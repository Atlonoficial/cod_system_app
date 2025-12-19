import { useAuthContext } from './AuthProvider';
import { LoadingScreen } from './LoadingScreen';
import { AuthScreen } from './AuthScreen';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogOut, Monitor } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * Tela de bloqueio para usuários não-alunos tentando acessar o app de aluno
 */
const WrongUserTypeScreen = () => {
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/auth/login';
  };

  const handleGoToDashboard = () => {
    window.location.href = 'https://app.metodocod.com';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Icon */}
        <div className="w-24 h-24 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
          <Monitor className="w-12 h-12 text-destructive" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-foreground">
          Acesso Exclusivo para Alunos
        </h1>

        {/* Description */}
        <p className="text-muted-foreground">
          Este aplicativo é exclusivo para <strong>alunos</strong>.
          Se você é um Personal Trainer ou Administrador, utilize o painel web para gerenciar seus alunos.
        </p>

        {/* Actions */}
        <div className="space-y-3 pt-4">
          <Button
            onClick={handleGoToDashboard}
            className="w-full bg-primary hover:bg-primary/90"
          >
            <Monitor className="w-4 h-4 mr-2" />
            Ir para o Painel Web
          </Button>

          <Button
            variant="outline"
            onClick={handleLogout}
            className="w-full"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair e Usar Outra Conta
          </Button>
        </div>

        {/* Help text */}
        <p className="text-xs text-muted-foreground pt-4">
          Se você é aluno e está vendo esta mensagem, entre em contato com seu Personal Trainer.
        </p>
      </div>
    </div>
  );
};

export const AuthGuard = ({ children }: AuthGuardProps) => {
  const { isAuthenticated, loading } = useAuthContext();
  const { userProfile, loading: profileLoading } = useAuth();

  if (loading || profileLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  // ✅ BLOQUEIO: Verificar se o usuário é aluno
  // Teachers e Admins NÃO podem acessar o app de aluno
  const userType = userProfile?.user_type;

  if (userType && userType !== 'student') {
    console.warn(`[AuthGuard] ⛔ Acesso bloqueado: user_type="${userType}" tentou acessar app de aluno`);
    return <WrongUserTypeScreen />;
  }

  return <>{children}</>;
};