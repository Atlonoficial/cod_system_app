-- ═══════════════════════════════════════════════════════════════════════════
-- COD SYSTEM - Fix Workout Tracking
-- Version: 1.0.0 | Build: 18
-- ═══════════════════════════════════════════════════════════════════════════
-- @copyright (c) 2024-2026 Atlon Tech (CNPJ: 58.079.600/0001-77)
-- All intellectual property rights reserved to Atlon Tech
-- ═══════════════════════════════════════════════════════════════════════════
-- PROPÓSITO: Garantir registro correto de dias ativos (sem duplicatas)
-- TABELAS USADAS:
--   - workout_sessions: treinos completados
--   - user_daily_activity: dias únicos com atividade
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Criar tabela user_daily_activity se não existir
CREATE TABLE IF NOT EXISTS user_daily_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
  activity_type TEXT NOT NULL DEFAULT 'workout',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint: apenas 1 registro por usuário por dia por tipo
  UNIQUE(user_id, activity_date, activity_type)
);

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_user_daily_activity_user_id 
ON user_daily_activity(user_id);

CREATE INDEX IF NOT EXISTS idx_user_daily_activity_date 
ON user_daily_activity(activity_date);

-- 3. Habilitar RLS
ALTER TABLE user_daily_activity ENABLE ROW LEVEL SECURITY;

-- 4. Política de segurança: usuários só veem seus próprios dados
DROP POLICY IF EXISTS "Users can view own daily activity" ON user_daily_activity;
CREATE POLICY "Users can view own daily activity" 
ON user_daily_activity FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own daily activity" ON user_daily_activity;
CREATE POLICY "Users can insert own daily activity" 
ON user_daily_activity FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 5. Função para registrar atividade do dia (com proteção de duplicata)
CREATE OR REPLACE FUNCTION register_daily_activity(
  p_user_id UUID,
  p_activity_type TEXT DEFAULT 'workout'
)
RETURNS JSON AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_result JSON;
  v_is_new BOOLEAN := FALSE;
BEGIN
  -- Tentar inserir (constraint UNIQUE vai prevenir duplicatas)
  BEGIN
    INSERT INTO user_daily_activity (user_id, activity_date, activity_type)
    VALUES (p_user_id, v_today, p_activity_type);
    
    v_is_new := TRUE;
  EXCEPTION WHEN unique_violation THEN
    -- Já existe registro para hoje - ok, não é erro
    v_is_new := FALSE;
  END;
  
  -- Contar total de dias ativos do usuário
  DECLARE
    v_total_days INTEGER;
  BEGIN
    SELECT COUNT(DISTINCT activity_date) INTO v_total_days
    FROM user_daily_activity
    WHERE user_id = p_user_id;
    
    v_result := json_build_object(
      'success', TRUE,
      'is_first_today', v_is_new,
      'total_active_days', v_total_days,
      'date', v_today
    );
  END;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Conceder permissão
GRANT EXECUTE ON FUNCTION register_daily_activity(UUID, TEXT) TO authenticated;

-- 7. Comentário para documentação
COMMENT ON TABLE user_daily_activity IS 
'Registra dias únicos de atividade do usuário.
- BUILD 18: Previne duplicatas usando UNIQUE constraint
- Usado para contar "Dias Ativos" no perfil';

COMMENT ON FUNCTION register_daily_activity(UUID, TEXT) IS 
'Registra atividade do dia de forma segura.
- Previne duplicatas automaticamente
- Retorna JSON com is_first_today para saber se é novo';
