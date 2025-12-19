/**
 * Sistema de Detecção Inteligente de Origem
 * Detecta de onde vem a requisição (app aluno, dashboard professor, domínio customizado, mobile)
 * e retorna metadados estruturados para armazenamento no user_metadata do Supabase
 */

export interface OriginMetadata {
  // Informações básicas de origem
  origin_domain: string;        // e.g., "coodsystem.com.br", "admin.coodsystem.com.br", "academia-fit.com.br"
  origin_url: string;           // URL completa de origem
  origin_protocol: string;      // "https", "http", "coodsystem"
  origin_port: string | null;   // porta se houver

  // Tipo de plataforma
  signup_platform: 'web' | 'mobile' | 'custom_domain';
  is_custom_domain: boolean;
  is_mobile: boolean;
  is_admin_dashboard: boolean;
  is_student_app: boolean;

  // Informações de tenant (se aplicável)
  tenant_id?: string;
  tenant_slug?: string;

  // Tipo de usuário (detectado pelo contexto da rota/signup)
  user_type?: 'student' | 'teacher';

  // URL de redirecionamento calculada
  redirect_url: string;

  // Timestamp da detecção
  detected_at: string;
}

/**
 * Detecta a origem da requisição atual e retorna metadados estruturados
 * @param userType - Tipo de usuário sendo criado (student/teacher) - opcional
 * @param tenantId - ID do tenant se for domínio customizado - opcional
 * @returns OriginMetadata com informações completas da origem
 */
export const detectOrigin = (
  userType?: 'student' | 'teacher',
  tenantId?: string
): OriginMetadata => {
  // Detectar se é ambiente mobile (Capacitor)
  const isMobile = typeof window !== 'undefined' &&
    (window as any).Capacitor !== undefined;

  // Obter informações do hostname e pathname atual
  const hostname = typeof window !== 'undefined'
    ? window.location.hostname
    : '';

  const pathname = typeof window !== 'undefined'
    ? window.location.pathname
    : '';

  const protocol = typeof window !== 'undefined'
    ? window.location.protocol.replace(':', '')
    : 'https';

  const port = typeof window !== 'undefined' && window.location.port
    ? window.location.port
    : null;

  const fullUrl = typeof window !== 'undefined'
    ? window.location.origin
    : '';

  // Domínio principal do sistema
  const MAIN_DOMAIN = 'coodsystem.com.br';
  const LOVABLE_DOMAINS = ['lovable.dev', 'lovableproject.com', 'lovable.app'];
  const KNOWN_DOMAINS = [MAIN_DOMAIN, 'localhost', '127.0.0.1'];

  // Detectar se é preview do Lovable
  const isLovablePreview = LOVABLE_DOMAINS.some(d =>
    hostname === d || hostname.endsWith(`.${d}`)
  );

  // Determinar tipo de origem BASEADO NA ROTA (pathname)
  const isAdminDashboard = pathname.includes('dashboard-professor');
  const isStudentApp = !isAdminDashboard;
  const isCustomDomain = !KNOWN_DOMAINS.some(domain => hostname.includes(domain)) && !isMobile && !isLovablePreview;

  // Determinar plataforma
  let signupPlatform: 'web' | 'mobile' | 'custom_domain' = 'web';
  if (isMobile) {
    signupPlatform = 'mobile';
  } else if (isCustomDomain) {
    signupPlatform = 'custom_domain';
  }

  // Calcular URL de redirecionamento inteligente baseado na ROTA
  let redirectUrl = '';
  const srcParam = isAdminDashboard ? 'dashboard' : 'app';

  if (isMobile) {
    // Mobile: usar deep link com src
    redirectUrl = `coodsystem://auth/confirm?src=${srcParam}`;
  } else if (isLovablePreview) {
    // 🔧 Lovable preview: Allow preview on Lovable domains
    redirectUrl = `${fullUrl}/auth/confirm?src=${srcParam}`;
    console.log('🔧 [Domain Detector] Lovable preview detected', {
      hostname,
      redirectUrl
    });
  } else if (isCustomDomain) {
    // Domínio customizado: redirecionar para próprio domínio + /auth/confirm
    redirectUrl = `${fullUrl}/auth/confirm?src=${srcParam}`;
  } else {
    // ✅ PADRÃO: Sempre redirecionar para /auth/confirm (página de processamento)
    // Se for localhost, manter localhost
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      redirectUrl = `${fullUrl}/auth/confirm?src=${srcParam}`;
    } else {
      redirectUrl = `https://${MAIN_DOMAIN}/auth/confirm?src=${srcParam}`;
    }
  }

  // Construir metadados
  const metadata: OriginMetadata = {
    origin_domain: hostname,
    origin_url: fullUrl,
    origin_protocol: protocol,
    origin_port: port,

    signup_platform: signupPlatform,
    is_custom_domain: isCustomDomain,
    is_mobile: isMobile,
    is_admin_dashboard: isAdminDashboard,
    is_student_app: isStudentApp,

    redirect_url: redirectUrl,
    detected_at: new Date().toISOString(),
  };

  // Adicionar user_type se fornecido
  if (userType) {
    metadata.user_type = userType;
  }

  // Adicionar tenant_id se fornecido (domínios customizados)
  if (tenantId) {
    metadata.tenant_id = tenantId;
  }

  console.log('🔍 [Domain Detector] Origin detected:', metadata);

  return metadata;
};

/**
 * Calcula a URL de redirecionamento baseada nos metadados de origem
 * Usado para o parâmetro emailRedirectTo do Supabase
 */
export const calculateRedirectUrl = (metadata: OriginMetadata): string => {
  return metadata.redirect_url;
};

/**
 * Extrai metadados relevantes para armazenar no user_metadata do Supabase
 * Remove informações sensíveis e mantém apenas o necessário
 */
export const extractUserMetadata = (metadata: OriginMetadata) => {
  return {
    origin_domain: metadata.origin_domain,
    origin_url: metadata.origin_url,
    signup_platform: metadata.signup_platform,
    is_custom_domain: metadata.is_custom_domain,
    is_mobile: metadata.is_mobile,
    user_type: metadata.user_type,
    tenant_id: metadata.tenant_id,
    redirect_url: metadata.redirect_url,
    detected_at: metadata.detected_at,
  };
};
