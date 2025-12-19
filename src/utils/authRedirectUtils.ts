import { supabase } from '@/integrations/supabase/client';

export interface AuthActionData {
  type: string;
  token_hash?: string;
  email?: string;
  redirect_to?: string;
  error?: string;
  error_code?: string;
  error_description?: string;
}

export const parseAuthParams = (searchParams: URLSearchParams): AuthActionData => {
  // First try to get from search params (query)
  let authData: AuthActionData = {
    type: searchParams.get('type') || '',
    token_hash: searchParams.get('token_hash') || undefined,
    email: searchParams.get('email') || undefined,
    redirect_to: searchParams.get('redirect_to') || undefined,
    error: searchParams.get('error') || undefined,
    error_code: searchParams.get('error_code') || undefined,
    error_description: searchParams.get('error_description') || undefined,
  };

  // If no type found in search params, check URL fragment (hash)
  if (!authData.type && window.location.hash) {
    const fragmentParams = new URLSearchParams(window.location.hash.substring(1));

    authData = {
      type: fragmentParams.get('type') || 'recovery', // Default to recovery for fragment tokens
      token_hash: fragmentParams.get('access_token') || fragmentParams.get('token_hash') || undefined,
      email: fragmentParams.get('email') || undefined,
      redirect_to: fragmentParams.get('redirect_to') || undefined,
      error: fragmentParams.get('error') || undefined,
      error_code: fragmentParams.get('error_code') || undefined,
      error_description: fragmentParams.get('error_description') || undefined,
    };
  }

  return authData;
};

export const calculateIntelligentRedirect = (metadata: any, userType?: 'student' | 'teacher'): string => {
  console.log('🧠 calculateIntelligentRedirect: Calculando redirecionamento inteligente');
  console.log('📊 Metadados recebidos:', metadata);
  console.log('👤 Tipo de usuário fornecido:', userType);

  // Determinar user type final (prioriza o parâmetro, depois metadata)
  const metadataUserType = metadata?.user_type;
  const finalUserType = userType || metadataUserType;

  console.log('👤 Tipo de usuário final:', finalUserType);

  // Prioridade 1: Professor → Dashboard
  if (finalUserType === 'teacher') {
    console.log('👨‍🏫 Redirecionamento: Professor → /dashboard-professor');
    return '/dashboard-professor';
  }

  // Prioridade 2: Aluno ou padrão → Home
  console.log('👨‍🎓 Redirecionamento: Aluno/Default → /');
  return '/';
};

export const getRedirectPath = async (userType?: 'student' | 'teacher'): Promise<string> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    console.log('🔍 getRedirectPath: Buscando dados do usuário:', user?.id);

    if (user) {
      // Buscar metadados de origem armazenados no signup
      const metadata = user.user_metadata;
      console.log('📦 getRedirectPath: Metadados do usuário:', metadata);

      // Se não tiver userType passado, buscar do profile
      let finalUserType = userType;
      if (!finalUserType) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('id', user.id)
          .single();

        finalUserType = profile?.user_type as 'student' | 'teacher';
        console.log('👤 getRedirectPath: Tipo de usuário do profile:', finalUserType);
      }

      // Usar função de cálculo inteligente
      return calculateIntelligentRedirect(metadata, finalUserType);
    }
  } catch (error) {
    console.error('❌ getRedirectPath: Erro ao buscar dados:', error);
  }

  // Fallback seguro
  console.log('⚠️ getRedirectPath: Usando fallback → /');
  return '/';
};

export const processAuthAction = async (actionData: AuthActionData) => {
  const { type, token_hash, error } = actionData;

  console.log('🔐 processAuthAction: Processando ação de autenticação:', type);

  if (error) {
    console.error('❌ processAuthAction: Erro na ação:', error);
    throw new Error(actionData.error_description || error);
  }

  if (!token_hash) {
    console.error('❌ processAuthAction: Token não encontrado');
    throw new Error('Token de autenticação não encontrado');
  }

  switch (type) {
    case 'signup':
    case 'email_confirmation':
      console.log('📧 processAuthAction: Verificando email de confirmação');
      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash,
        type: 'email'
      });

      if (verifyError) {
        // ✅ BUILD 35: Detectar OTP expirado especificamente
        if (verifyError.message?.includes('expired') ||
          verifyError.message?.includes('otp_expired') ||
          verifyError.message?.includes('invalid') ||
          verifyError.status === 401) {
          throw new Error('Link de confirmação expirado ou inválido. Solicite um novo email de confirmação.');
        }

        console.error('❌ processAuthAction: Erro ao verificar OTP:', verifyError);
        throw verifyError;
      }
      console.log('✅ processAuthAction: Email confirmado com sucesso');

      // 🔄 FASE 1: Esperar sessão ser estabelecida (até 5 segundos)
      console.log('⏳ processAuthAction: Aguardando sessão ser estabelecida...');
      let sessionFound = false;
      for (let i = 0; i < 10; i++) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          console.log('✅ processAuthAction: Sessão estabelecida após verificação', {
            attempt: i + 1,
            userId: session.user.id
          });
          sessionFound = true;
          break;
        }
        console.log(`⏳ processAuthAction: Tentativa ${i + 1}/10 - aguardando sessão...`);
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      if (!sessionFound) {
        console.warn('⚠️ processAuthAction: Sessão não estabelecida automaticamente após verifyOtp');
      }
      break;

    case 'recovery':
    case 'password_recovery':
      // For password recovery from fragment, the token is already an access_token
      // We don't need to exchange it, Supabase will handle it automatically
      console.log('🔐 processAuthAction: Processando token de recuperação');
      break;

    case 'email_change':
      console.log('📧 processAuthAction: Verificando alteração de email');
      const { error: emailChangeError } = await supabase.auth.verifyOtp({
        token_hash,
        type: 'email_change'
      });
      if (emailChangeError) throw emailChangeError;
      console.log('✅ processAuthAction: Email alterado com sucesso');
      break;

    case 'invite':
    case 'magiclink':
      console.log('🔗 processAuthAction: Verificando magic link');
      const { error: magicLinkError } = await supabase.auth.verifyOtp({
        token_hash,
        type: 'magiclink'
      });
      if (magicLinkError) throw magicLinkError;
      console.log('✅ processAuthAction: Magic link verificado com sucesso');
      break;

    default:
      throw new Error(`Tipo de ação não reconhecido: ${type}`);
  }
};

export const getActionTitle = (type: string): string => {
  switch (type) {
    case 'signup':
    case 'email_confirmation':
      return 'Confirmação de Email';
    case 'recovery':
    case 'password_recovery':
      return 'Recuperação de Senha';
    case 'email_change':
      return 'Alteração de Email';
    case 'invite':
      return 'Convite Aceito';
    case 'magiclink':
      return 'Login por Link Mágico';
    default:
      return 'Autenticação';
  }
};

export const getActionDescription = (type: string): string => {
  switch (type) {
    case 'signup':
    case 'email_confirmation':
      return 'Sua conta foi confirmada com sucesso!';
    case 'recovery':
    case 'password_recovery':
      return 'Agora você pode definir uma nova senha.';
    case 'email_change':
      return 'Seu email foi alterado com sucesso!';
    case 'invite':
      return 'Convite aceito! Bem-vindo ao COD SYSTEM!';
    case 'magiclink':
      return 'Login realizado com sucesso!';
    default:
      return 'Processando sua solicitação...';
  }
};

/**
 * Processa o token de convite para vincular aluno ao professor
 * Chama a função RPC accept_invite_token do banco de dados
 */
export interface InviteTokenResult {
  success: boolean;
  teacherId?: string;
  planId?: string;
  error?: string;
}

export const processInviteToken = async (token: string): Promise<InviteTokenResult> => {
  console.log('🔗 processInviteToken: Processando token de convite:', token);

  if (!token) {
    console.warn('⚠️ processInviteToken: Token vazio');
    return { success: false, error: 'Token de convite não fornecido' };
  }

  try {
    // Chamar a função RPC que vincula o aluno ao professor
    // Nota: accept_invite_token existe no banco mas não está tipado no types.ts
    const { data, error } = await (supabase as any).rpc('accept_invite_token', {
      token_input: token
    });

    if (error) {
      console.error('❌ processInviteToken: Erro ao processar convite:', error);

      // Tratar erros específicos
      if (error.message?.includes('Not authenticated')) {
        return { success: false, error: 'Você precisa estar autenticado para aceitar o convite' };
      }
      if (error.message?.includes('Invalid or expired')) {
        return { success: false, error: 'Convite inválido ou expirado' };
      }

      return { success: false, error: error.message || 'Erro ao processar convite' };
    }

    console.log('✅ processInviteToken: Convite processado com sucesso:', data);

    // O retorno da função é um JSONB com success, plan_id, teacher_id
    if (data?.success) {
      return {
        success: true,
        teacherId: data.teacher_id,
        planId: data.plan_id
      };
    }

    return { success: false, error: 'Falha ao processar convite' };

  } catch (error: any) {
    console.error('❌ processInviteToken: Exceção ao processar convite:', error);
    return { success: false, error: error.message || 'Erro inesperado ao processar convite' };
  }
};