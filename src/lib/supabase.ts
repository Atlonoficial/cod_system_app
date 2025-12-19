import { getSupabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { logger } from '@/lib/logger';

// ✅ BUILD 20: Helper síncrono para obter client (lazy)
// Seguro porque bootManager garante que storage está pronto antes do React renderizar
const getClient = () => {
  return getSupabase();
};

// ✅ Export supabase client for hooks
export const supabase = getClient();

// Interfaces for Supabase
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  user_type: 'student' | 'teacher';
  profile_complete: boolean;
  avatar_url?: string;
  phone?: string;
  terms_accepted_at?: string;
  privacy_accepted_at?: string;
  terms_version?: string;
  privacy_version?: string;
  notification_preferences?: {
    push_enabled?: boolean;
    workout_reminders?: boolean;
    achievements?: boolean;
    social?: boolean;
    tips?: boolean;
  };
  created_at?: string;
  updated_at?: string;
}

export interface Student {
  id: string;
  user_id: string;
  teacher_id?: string;
  active_plan?: string;
  goals: string[];
  weight?: number;
  height?: number;
  body_fat?: number;
  muscle_mass?: number;
  measurements_updated_at?: string;
  notifications: boolean;
  language: string;
  timezone: string;
  membership_status: 'active' | 'suspended' | 'expired';
  membership_expiry?: string;
  created_at?: string;
  updated_at?: string;
  profiles?: {
    name: string;
    email: string;
    avatar_url?: string;
  };
}

export interface Workout {
  id: string;
  name: string;
  description?: string;
  exercises: any[];
  estimated_duration?: number;
  estimated_calories?: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  muscle_groups?: string[];
  tags?: string[];
  assigned_to: string[];
  created_by?: string;
  is_template: boolean;
  template_category?: string;
  sessions: number;
  last_completed?: string;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface NutritionPlan {
  id: string;
  name: string;
  description?: string;
  meals: any[];
  daily_calories?: number;
  daily_protein?: number;
  daily_carbs?: number;
  daily_fat?: number;
  daily_fiber?: number;
  daily_water?: number;
  weekly_schedule?: any;
  assigned_to: string[];
  created_by?: string;
  is_template: boolean;
  tags?: string[];
  duration?: number;
  start_date?: string;
  end_date?: string;
  adherence_rate?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'workout' | 'meal' | 'reminder' | 'achievement' | 'general' | 'payment' | 'appointment' | 'message' | 'course';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  target_users: string[];
  is_read: boolean;
  deep_link?: string;
  action_required?: boolean;
  action_url?: string;
  action_text?: string;
  image_url?: string;
  data?: any;
  expires_at?: string;
  scheduled_for?: string;
  read_at?: string;
  created_at?: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_type: 'student' | 'teacher';
  message: string;
  message_type: 'text' | 'image' | 'file' | 'audio';
  attachments?: any[];
  reply_to?: string;
  is_read: boolean;
  read_at?: string;
  edited_at?: string;
  deleted_at?: string;
  created_at?: string;
}

// Auth functions
export const signUpUser = async (
  email: string,
  password: string,
  name: string,
  userType: 'student' | 'teacher' = 'student',
  isNative: boolean = false,
  tenantId?: string
) => {
  // 🎯 FASE 1: Detecção Inteligente de Origem
  const { detectOrigin, extractUserMetadata, calculateRedirectUrl } = await import('@/utils/domainDetector');

  // Detectar origem automaticamente
  const originMetadata = detectOrigin(userType, tenantId);

  // Calcular URL de redirecionamento inteligente
  const redirectUrl = calculateRedirectUrl(originMetadata);

  // ✅ NOVO: Adicionar parâmetro src baseado no userType
  const srcParam = userType === 'teacher' ? 'dashboard' : 'app';

  // 🛡️ GUARD-RAIL: Forçar produção se detectar Lovable preview
  const previewRegex = /(lovable\.dev|lovableproject\.com|\.lovable\.app)/i;
  const finalRedirect = previewRegex.test(redirectUrl)
    ? `https://painel.metodocod.com/auth/confirm?src=${srcParam}`
    : `${redirectUrl}${redirectUrl.includes('?') ? '&' : '?'}src=${srcParam}`;

  logger.debug('signUpUser', 'Smart Origin Detection', {
    platform: originMetadata.signup_platform,
    userType,
    srcParam,
    redirectUrl,
    finalRedirect,
    isCustomDomain: originMetadata.is_custom_domain,
    isMobile: originMetadata.is_mobile,
  });

  // Extrair metadados para armazenar no user_metadata
  const userMetadata = extractUserMetadata(originMetadata);

  const client = getClient();
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: finalRedirect,
      data: {
        name,
        user_type: userType,
        src: srcParam,
        terms_accepted_at: new Date().toISOString(),
        privacy_accepted_at: new Date().toISOString(),
        terms_version: '1.0',
        privacy_version: '1.0',
        // 🔥 Metadados Inteligentes armazenados automaticamente
        ...userMetadata,
      },
    },
  });

  if (error) {
    logger.error('signUpUser', 'Error during signup', error);
    throw error;
  }

  logger.info('signUpUser', 'User created successfully with intelligent metadata');

  // ✅ BUILD 35: Log de confirmação que email foi enviado
  logger.debug('signUpUser', 'Email confirmation sent', {
    email,
    redirectUrl: finalRedirect
  });

  return data; // contains { user, session }
};

/**
 * ✅ BUILD 40.2 FASE 1: Health check do banco de dados
 * Usar auth.getSession() que é mais rápido e confiável
 */
export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    const client = getClient();

    // ✅ Timeout aumentado para 8s e com retry logic
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Health check timeout')), 8000)
    );

    // ✅ Adicionar retry (1 retry = 2 tentativas totais)
    const { retryWithBackoff } = await import('@/utils/retryWithBackoff');

    const healthPromise = retryWithBackoff(async () => {
      return await client.auth.getSession();
    }, 1);

    const { error } = await Promise.race([healthPromise, timeoutPromise]);

    if (error) {
      logger.error('checkDatabaseHealth', '❌ Database error', error);
      return false;
    }

    logger.debug('checkDatabaseHealth', '✅ Database is healthy');
    return true;
  } catch (error) {
    logger.error('checkDatabaseHealth', '❌ Database not responding', error);
    return false;
  }
};

export const signInUser = async (email: string, password: string) => {
  // ✅ BUILD 28: Verificar storage APENAS em plataforma nativa
  if (typeof window !== 'undefined') {
    const { Capacitor } = await import('@capacitor/core');

    if (Capacitor.isNativePlatform()) {
      const { capacitorStorage } = await import('@/lib/capacitorStorage');

      // ✅ BUILD 64: Aguardar inicialização em vez de lançar erro
      if (!capacitorStorage.initialized) {
        logger.warn('signInUser', 'Storage not ready, waiting for initialization...');
        try {
          // Tentar inicializar sob demanda (com timeout interno)
          await capacitorStorage.initialize();

          if (!capacitorStorage.initialized) {
            throw new Error('Falha na inicialização do armazenamento. Tente reiniciar o app.');
          }
        } catch (err) {
          logger.error('signInUser', 'Storage init failed during login', err);
          throw new Error('Aguarde a inicialização do app antes de fazer login');
        }
      }
    }
  }

  // ✅ Verificar health mas NÃO bloquear login se falhar
  const isHealthy = await checkDatabaseHealth();

  if (!isHealthy) {
    logger.warn('signInUser', '⚠️ Health check failed, attempting login anyway');
    // NÃO lançar erro - tentar login mesmo assim
  }

  // ✅ BUILD 24: Importar dinamicamente para garantir storage pronto
  const { getSupabase } = await import('@/integrations/supabase/client');
  const client = getSupabase();

  const { data, error } = await client.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    // ✅ BUILD 40.2 FASE 3: Melhorar mensagens de erro
    if (error.message.includes('User not found') ||
      error.message.includes('Invalid login credentials')) {
      throw new Error('Email ou senha incorretos. Verifique suas credenciais e tente novamente.');
    }

    if (error.message.includes('Email not confirmed')) {
      throw new Error('Email não confirmado. Verifique sua caixa de entrada para confirmar seu cadastro.');
    }

    // ✅ NOVO: Detectar problema de conexão
    if (error.message.includes('timeout') ||
      error.message.includes('Failed to fetch') ||
      error.message.includes('Network')) {
      throw new Error('Problema de conexão. Aguarde alguns segundos e tente novamente.');
    }

    throw error;
  }

  return data.user;
};

export const signOutUser = async () => {
  const client = getClient();
  const { error } = await client.auth.signOut();
  if (error) throw error;
};

export const resetPasswordForEmail = async (
  email: string,
  isNative: boolean = false,
  tenantId?: string,
  userType?: 'student' | 'teacher' // ✅ NOVO parâmetro opcional
) => {
  // 🎯 FASE 1: Detecção Inteligente de Origem (mesma lógica do signup)
  const { detectOrigin, calculateRedirectUrl } = await import('@/utils/domainDetector');

  // Detectar origem automaticamente
  const originMetadata = detectOrigin(userType, tenantId);

  // Calcular URL de redirecionamento inteligente
  // Para recovery, usamos /auth/recovery em vez de /auth/confirm
  const baseRedirectUrl = calculateRedirectUrl(originMetadata);

  // ✅ GARANTIR deep link em plataforma nativa (Capacitor)
  let redirectUrl: string;
  if (originMetadata.signup_platform === 'mobile' || originMetadata.is_mobile) {
    redirectUrl = 'metodocod://auth/recovery';
  } else {
    redirectUrl = baseRedirectUrl.replace('/auth/confirm', '/auth/recovery');
  }

  // ✅ NOVO: Adicionar src se userType fornecido
  if (userType) {
    const srcParam = userType === 'teacher' ? 'dashboard' : 'app';
    redirectUrl = `${redirectUrl}${redirectUrl.includes('?') ? '&' : '?'}src=${srcParam}`;
  }

  logger.debug('resetPasswordForEmail', 'Smart Origin Detection', {
    platform: originMetadata.signup_platform,
    userType,
    redirectUrl,
    isCustomDomain: originMetadata.is_custom_domain,
    isMobile: originMetadata.is_mobile,
  });

  try {
    const client = getClient();
    const { data, error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) {
      logger.error('resetPasswordForEmail', 'Supabase error', error);
      throw error;
    }

    logger.info('resetPasswordForEmail', 'Reset initiated successfully');
    return data;
  } catch (error: any) {
    logger.error('resetPasswordForEmail', 'Error caught', {
      message: error.message,
      code: error.code,
      status: error.status
    });

    // Melhorar mensagens de erro específicas
    if (error.message?.includes('rate')) {
      throw new Error('Muitas tentativas de reset. Aguarde alguns minutos antes de tentar novamente.');
    }

    if (error.message?.includes('invalid') || error.message?.includes('not found')) {
      throw new Error('Email não encontrado no sistema.');
    }

    if (error.message?.includes('network') || error.message?.includes('fetch')) {
      throw new Error('Erro de conexão. Verifique sua internet.');
    }

    throw error;
  }
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    // ✅ Timeout aumentado para 10s e com retry logic
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('getUserProfile timeout after 10 seconds')), 10000)
    );

    const client = getClient();

    // ✅ Adicionar retry com backoff (2 retries = 3 tentativas totais)
    const { retryWithBackoff } = await import('@/utils/retryWithBackoff');

    const fetchPromise = retryWithBackoff(async () => {
      return await client
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .single();
    }, 2);

    const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);

    if (error) {
      logger.error('getUserProfile', 'Error getting user profile', error);
      return null;
    }

    return data as UserProfile;
  } catch (error) {
    logger.error('getUserProfile', 'Failed to fetch profile - timeout or network error', error);
    return null;
  }
};

export const updateUserProfile = async (uid: string, updates: Partial<UserProfile>) => {
  const client = getClient();
  const { error } = await client
    .from('profiles')
    .update(updates)
    .eq('id', uid);

  if (error) throw error;
};

export const onAuthStateChange = (callback: (user: User | null, session: Session | null) => void) => {
  const client = getClient();

  logger.info('onAuthStateChange', '📡 Setting up auth listener');

  return client.auth.onAuthStateChange((event, session) => {
    logger.info('onAuthStateChange', `🔔 Event: ${event}`, {
      hasUser: !!session?.user,
      userId: session?.user?.id || 'null',
      timestamp: Date.now()
    });

    callback(session?.user ?? null, session);
  });
};

// Student functions
export const getStudentsByTeacher = (teacherId: string, callback: (students: any[]) => void) => {
  const client = getClient();
  const channel = client
    .channel('teacher-students-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'students',
        filter: `teacher_id=eq.${teacherId}`
      },
      () => {
        fetchStudents();
      }
    )
    .subscribe();

  const fetchStudents = async () => {
    const { data, error } = await client
      .from('students')
      .select(`
        *,
        profiles!students_user_id_fkey(name, email, avatar_url)
      `)
      .eq('teacher_id', teacherId);

    if (error) {
      console.error('Error fetching students:', error);
      callback([]);
      return;
    }
    callback(data || []);
  };

  fetchStudents();

  return () => {
    client.removeChannel(channel);
  };
};

export const getStudentAssessments = async (userId: string) => {
  const client = getClient();
  const { data, error } = await client
    .from('progress')
    .select('*')
    .eq('user_id', userId)
    .eq('type', 'physical_assessment')
    .order('date', { ascending: false });

  if (error) throw error;
  return data;
};

export const getStudentByUserId = (userId: string, callback: (student: Student | null) => void) => {
  const client = getClient();
  const channel = client
    .channel('student-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'students',
        filter: `user_id=eq.${userId}`
      },
      () => {
        fetchStudent();
      }
    )
    .subscribe();

  const fetchStudent = async () => {
    const { data, error } = await client
      .from('students')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      logger.error('getStudentByUserId', 'Error fetching student', error);
      callback(null);
      return;
    }
    callback(data as Student);
  };

  fetchStudent();

  return () => {
    client.removeChannel(channel);
  };
};

export const createStudent = async (student: Omit<Student, 'id' | 'created_at' | 'updated_at'>) => {
  const client = getClient();
  const { data, error } = await client
    .from('students')
    .insert(student)
    .select()
    .single();

  if (error) throw error;
  return data.id;
};

export const updateStudentProfile = async (studentId: string, updates: Partial<Student>) => {
  const client = getClient();
  const { error } = await client
    .from('students')
    .update(updates)
    .eq('id', studentId);

  if (error) throw error;
};

// Workout functions
export const getWorkoutsByUser = (userId: string, callback: (workouts: Workout[]) => void) => {
  const client = getClient();
  const channel = client
    .channel('workout-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'workouts'
      },
      () => {
        fetchWorkouts();
      }
    )
    .subscribe();

  const fetchWorkouts = async () => {
    const { data, error } = await client
      .from('workouts')
      .select('*')
      .contains('assigned_to', [userId])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching workouts:', error);
      callback([]);
      return;
    }
    callback((data || []) as Workout[]);
  };

  fetchWorkouts();

  return () => {
    client.removeChannel(channel);
  };
};

// Nutrition functions
export const getNutritionPlansByUser = (userId: string, callback: (plans: NutritionPlan[]) => void) => {
  const client = getClient();
  const channel = client
    .channel('nutrition-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'meal_plans'
      },
      () => {
        fetchPlans();
      }
    )
    .subscribe();

  const fetchPlans = async () => {
    const { data, error } = await client
      .from('meal_plans')
      .select('*')
      .contains('assigned_students', [userId])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching nutrition plans:', error);
      callback([]);
      return;
    }

    // Transform meal_plans data to match NutritionPlan interface
    const transformedPlans: NutritionPlan[] = (data || []).map(plan => ({
      id: plan.id,
      name: plan.name,
      description: plan.description,
      meals: Array.isArray(plan.meals_data) ? plan.meals_data : (plan.meals_data ? [plan.meals_data] : []),
      daily_calories: plan.total_calories,
      daily_protein: plan.total_protein,
      daily_carbs: plan.total_carbs,
      daily_fat: plan.total_fat,
      assigned_to: plan.assigned_students || [],
      created_by: plan.created_by,
      is_template: false,
      duration: plan.duration_days,
      created_at: plan.created_at,
      updated_at: plan.updated_at
    }));

    callback(transformedPlans);
  };

  fetchPlans();

  return () => {
    client.removeChannel(channel);
  };
};

// Notifications functions
export const getNotificationsByUser = (userId: string, callback: (notifications: Notification[]) => void) => {
  const client = getClient();
  const channel = client
    .channel('notification-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'notifications'
      },
      () => {
        fetchNotifications();
      }
    )
    .subscribe();

  const fetchNotifications = async () => {
    const { data, error } = await client
      .from('notifications')
      .select('*')
      .contains('target_users', [userId])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notifications:', error);
      callback([]);
      return;
    }
    callback((data || []) as Notification[]);
  };

  fetchNotifications();

  return () => {
    client.removeChannel(channel);
  };
};

export const markNotificationAsRead = async (notificationId: string) => {
  const client = getClient();
  const { error } = await client
    .from('notifications')
    .update({
      is_read: true,
      read_at: new Date().toISOString()
    })
    .eq('id', notificationId);

  if (error) throw error;
};

export const markAllNotificationsAsRead = async (userId: string) => {
  const client = getClient();
  const { error } = await client
    .from('notifications')
    .update({
      is_read: true,
      read_at: new Date().toISOString()
    })
    .contains('target_users', [userId])
    .eq('is_read', false);

  if (error) throw error;
};

export const clearAllNotifications = async (userId: string) => {
  const client = getClient();
  const { error } = await client
    .from('notifications')
    .delete()
    .contains('target_users', [userId]);

  if (error) throw error;
};

// Chat functions
export const getChatMessages = (conversationId: string, callback: (messages: ChatMessage[]) => void) => {
  const client = getClient();
  const channel = client
    .channel('chat-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'chat_messages',
        filter: `conversation_id=eq.${conversationId}`
      },
      () => {
        fetchMessages();
      }
    )
    .subscribe();

  const fetchMessages = async () => {
    const { data, error } = await client
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching chat messages:', error);
      callback([]);
      return;
    }
    callback((data || []) as ChatMessage[]);
  };

  fetchMessages();

  return () => {
    client.removeChannel(channel);
  };
};

export const sendChatMessage = async (message: Omit<ChatMessage, 'id' | 'created_at'>) => {
  const client = getClient();
  const { data, error } = await client
    .from('chat_messages')
    .insert(message)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Meal logs functions
export const getMealLogsByUserAndDate = async (userId: string, date: string) => {
  const client = getClient();

  const { data, error } = await client
    .from('meal_logs')
    .select('*')
    .eq('user_id', userId)
    .gte('date', `${date}T00:00:00`)
    .lt('date', `${date}T23:59:59`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching meal logs:', error);
    return [];
  }
  return data || [];
};

export const createMealLog = async (mealLog: {
  user_id: string;
  nutrition_plan_id?: string;
  meal_id?: string;
  meal_plan_id?: string;
  meal_plan_item_id?: string;
  meal_name?: string;
  date: string;
  consumed: boolean;
  actual_time?: string;
  notes?: string;
  photo_url?: string;
  rating?: number;
  custom_portion_amount?: number;
  custom_portion_unit?: string;
}) => {
  console.log('[createMealLog] Creating meal log with data:', mealLog);

  const client = getClient();
  const { data, error } = await client
    .from('meal_logs')
    .insert(mealLog)
    .select()
    .single();

  if (error) {
    console.error('[createMealLog] Error creating meal log:', error);
    throw error;
  }

  console.log('[createMealLog] Successfully created meal log:', data);
  return data;
};

export const updateMealLog = async (logId: string, updates: any) => {
  const client = getClient();
  const { data, error } = await client
    .from('meal_logs')
    .update(updates)
    .eq('id', logId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Anamnese functions for teachers
export const getStudentAnamnese = async (studentUserId: string) => {
  const client = getClient();
  const { data, error } = await client
    .from('anamneses')
    .select('*')
    .eq('user_id', studentUserId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
};