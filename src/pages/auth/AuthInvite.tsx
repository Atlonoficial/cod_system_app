import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { AuthStatusHandler } from '@/components/auth/AuthStatusHandler';
import { parseAuthParams, processAuthAction, getRedirectPath, processInviteToken } from '@/utils/authRedirectUtils';

export const AuthInvite = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [redirectPath, setRedirectPath] = useState('/');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const processInvite = async () => {
      try {
        console.log('🔗 AuthInvite: Iniciando processamento de convite');

        const actionData = parseAuthParams(searchParams);
        console.log('📋 AuthInvite: Dados da ação:', actionData);

        // Processar autenticação (magic link/signup)
        await processAuthAction(actionData);
        console.log('✅ AuthInvite: Autenticação processada com sucesso');

        // ✅ CORREÇÃO: Extrair e processar o token de convite para vincular aluno ao professor
        const inviteToken = searchParams.get('token');
        if (inviteToken) {
          console.log('🎟️ AuthInvite: Token de convite encontrado, processando vinculação...');

          const inviteResult = await processInviteToken(inviteToken);

          if (inviteResult.success) {
            console.log('✅ AuthInvite: Aluno vinculado ao professor com sucesso!', {
              teacherId: inviteResult.teacherId,
              planId: inviteResult.planId
            });
          } else {
            // Log warning but don't fail - student is authenticated, just not linked
            console.warn('⚠️ AuthInvite: Falha ao vincular professor:', inviteResult.error);
            // Opcional: podemos adicionar uma mensagem de aviso para o usuário
          }
        } else {
          console.log('ℹ️ AuthInvite: Nenhum token de convite encontrado na URL');
        }

        const path = await getRedirectPath();
        setRedirectPath(path);
        setStatus('success');

      } catch (error: any) {
        console.error('❌ AuthInvite: Erro ao processar convite:', error);
        setErrorMessage(error.message || 'Erro ao processar convite');
        setStatus('error');
      }
    };

    processInvite();
  }, [searchParams]);

  const handleRetry = () => {
    setStatus('loading');
    window.location.reload();
  };

  return (
    <AuthLayout
      title="Convite Aceito"
      description={status === 'loading' ? 'Processando seu convite...' : undefined}
    >
      <AuthStatusHandler
        status={status}
        successMessage="Convite aceito com sucesso! Bem-vindo!"
        errorMessage={errorMessage}
        redirectPath={redirectPath}
        onRetry={handleRetry}
      />
    </AuthLayout>
  );
};