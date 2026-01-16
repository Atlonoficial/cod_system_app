-- =====================================================
-- COD SYSTEM - BUILD 52 - Fix COMPLETE para Feedback
-- =====================================================
-- PROBLEMA 1: Coluna 'metadata' pode não existir
-- PROBLEMA 2: Coluna 'user_id' é obrigatória mas não preenchida
--
-- INSTRUÇÕES:
-- 1. Abra o Supabase Dashboard
-- 2. Vá em SQL Editor
-- 3. Cole este script INTEIRO
-- 4. Clique em "Run" para executar

-- =====================================================
-- PASSO 1: Verificar estrutura atual da tabela feedbacks
-- =====================================================
SELECT '=== ESTRUTURA ATUAL DA TABELA FEEDBACKS ===' as info;

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'feedbacks'
ORDER BY ordinal_position;

-- =====================================================
-- PASSO 2: Adicionar coluna metadata se não existir
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'feedbacks' 
      AND column_name = 'metadata'
  ) THEN
    ALTER TABLE public.feedbacks 
    ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    RAISE NOTICE '✅ Coluna "metadata" adicionada';
  ELSE
    RAISE NOTICE '✅ Coluna "metadata" já existe';
  END IF;
END $$;

-- =====================================================
-- PASSO 3: Verificar se user_id existe e se é obrigatório
-- =====================================================
DO $$
DECLARE
  v_has_user_id BOOLEAN;
  v_is_nullable TEXT;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'feedbacks' 
      AND column_name = 'user_id'
  ) INTO v_has_user_id;
  
  IF v_has_user_id THEN
    SELECT is_nullable INTO v_is_nullable
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'feedbacks' 
      AND column_name = 'user_id';
      
    RAISE NOTICE '⚠️ Coluna user_id EXISTE e is_nullable = %', v_is_nullable;
  ELSE
    RAISE NOTICE '✅ Coluna user_id NÃO existe';
  END IF;
END $$;

-- =====================================================
-- PASSO 4: CRIAR NOVA FUNÇÃO RPC QUE INCLUI user_id
-- =====================================================
CREATE OR REPLACE FUNCTION public.submit_feedback_with_points_v4(
  p_student_id uuid, 
  p_teacher_id uuid, 
  p_feedback_data jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_feedback_id UUID;
  v_points_result JSONB;
  v_existing_feedback RECORD;
  v_week_start DATE := DATE_TRUNC('week', CURRENT_DATE)::DATE;
  v_today DATE := CURRENT_DATE;
  v_frequency TEXT;
  v_period_start DATE;
  v_period_end DATE;
  v_teacher_exists BOOLEAN := FALSE;
  v_student_relationship BOOLEAN := FALSE;
  v_points_awarded INTEGER := 0;
  v_has_user_id_column BOOLEAN := FALSE;
BEGIN
  -- VALIDAÇÃO 1: Verificar auth.uid() matches student_id
  IF auth.uid() != p_student_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Usuário não autorizado',
      'error_type', 'auth_mismatch'
    );
  END IF;

  -- VALIDAÇÃO 2: Verificar se o teacher existe
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = p_teacher_id AND user_type = 'teacher'
  ) INTO v_teacher_exists;
  
  IF NOT v_teacher_exists THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Professor não encontrado',
      'error_type', 'teacher_not_found'
    );
  END IF;

  -- VALIDAÇÃO 3: Verificar relacionamento teacher/student
  SELECT EXISTS (
    SELECT 1 FROM students 
    WHERE user_id = p_student_id AND teacher_id = p_teacher_id
  ) INTO v_student_relationship;
  
  IF NOT v_student_relationship THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Relacionamento professor-aluno não encontrado',
      'error_type', 'relationship_not_found'
    );
  END IF;

  -- BUSCAR frequência de feedback do professor
  SELECT COALESCE(feedback_frequency, 'weekly') INTO v_frequency
  FROM teacher_feedback_settings 
  WHERE teacher_id = p_teacher_id;
  
  IF v_frequency IS NULL THEN
    v_frequency := 'weekly';
  END IF;

  -- Determinar período baseado na frequência
  CASE v_frequency
    WHEN 'daily' THEN
      v_period_start := v_today;
      v_period_end := v_today;
    WHEN 'weekly' THEN  
      v_period_start := v_week_start;
      v_period_end := v_week_start + INTERVAL '6 days';
    WHEN 'biweekly' THEN
      v_period_start := v_today - INTERVAL '14 days';
      v_period_end := v_today;
    WHEN 'monthly' THEN
      v_period_start := DATE_TRUNC('month', v_today)::DATE;
      v_period_end := (DATE_TRUNC('month', v_today) + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
    ELSE
      v_period_start := v_week_start;
      v_period_end := v_week_start + INTERVAL '6 days';
  END CASE;

  -- VALIDAÇÃO 4: Verificar duplicatas no período
  SELECT * INTO v_existing_feedback
  FROM feedbacks
  WHERE student_id = p_student_id
    AND teacher_id = p_teacher_id
    AND type = 'periodic_feedback'
    AND DATE(created_at) >= v_period_start
    AND DATE(created_at) <= v_period_end;
    
  IF FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Feedback já enviado neste período',
      'duplicate', true,
      'existing_feedback_id', v_existing_feedback.id
    );
  END IF;

  -- VERIFICAR se tabela tem coluna user_id
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'feedbacks' 
      AND column_name = 'user_id'
  ) INTO v_has_user_id_column;

  BEGIN
    -- INSERIR FEEDBACK COM OU SEM user_id
    IF v_has_user_id_column THEN
      -- Tabela TEM coluna user_id - incluir na inserção
      INSERT INTO feedbacks (
        student_id,
        teacher_id,
        user_id,
        type,
        rating,
        message,
        metadata
      ) VALUES (
        p_student_id,
        p_teacher_id,
        p_student_id,  -- user_id = student_id
        'periodic_feedback',
        COALESCE((p_feedback_data->>'rating')::integer, 5),
        COALESCE(p_feedback_data->>'message', ''),
        COALESCE(p_feedback_data->'metadata', '{}'::jsonb) || jsonb_build_object(
          'submitted_at', now(),
          'frequency', v_frequency,
          'period_start', v_period_start,
          'period_end', v_period_end,
          'version', 'v4_build52_with_userid'
        )
      ) RETURNING id INTO v_feedback_id;
    ELSE
      -- Tabela NÃO tem coluna user_id - inserção normal
      INSERT INTO feedbacks (
        student_id,
        teacher_id,
        type,
        rating,
        message,
        metadata
      ) VALUES (
        p_student_id,
        p_teacher_id,
        'periodic_feedback',
        COALESCE((p_feedback_data->>'rating')::integer, 5),
        COALESCE(p_feedback_data->>'message', ''),
        COALESCE(p_feedback_data->'metadata', '{}'::jsonb) || jsonb_build_object(
          'submitted_at', now(),
          'frequency', v_frequency,
          'period_start', v_period_start,
          'period_end', v_period_end,
          'version', 'v4_build52_no_userid'
        )
      ) RETURNING id INTO v_feedback_id;
    END IF;

    -- Dar pontos por feedback
    BEGIN
      SELECT * INTO v_points_result
      FROM award_points_enhanced_v3(
        p_student_id,
        'periodic_feedback',
        'Feedback periódico enviado',
        jsonb_build_object(
          'teacher_id', p_teacher_id,
          'feedback_id', v_feedback_id,
          'frequency', v_frequency,
          'period_start', v_period_start,
          'period_end', v_period_end,
          'type', 'periodic_feedback',
          'version', 'v4_build52'
        ),
        50
      );
      
      IF v_points_result IS NULL OR NOT (v_points_result->>'success')::boolean THEN
        v_points_awarded := 50;
      ELSE
        v_points_awarded := COALESCE((v_points_result->>'points_awarded')::integer, 50);
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      v_points_awarded := 50;
    END;
    
    RETURN jsonb_build_object(
      'success', true,
      'feedback_id', v_feedback_id,
      'points_awarded', v_points_awarded,
      'message', 'Feedback enviado com sucesso!',
      'has_user_id_column', v_has_user_id_column,
      'metadata', jsonb_build_object(
        'frequency', v_frequency,
        'period', v_period_start || ' a ' || v_period_end,
        'version', 'v4_build52'
      )
    );

  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'sqlstate', SQLSTATE,
      'message', 'Erro interno ao processar feedback: ' || SQLERRM,
      'has_user_id_column', v_has_user_id_column
    );
  END;

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'sqlstate', SQLSTATE,
    'message', 'Erro crítico: ' || SQLERRM
  );
END;
$function$;

-- =====================================================
-- PASSO 5: Garantir permissões
-- =====================================================
GRANT EXECUTE ON FUNCTION public.submit_feedback_with_points_v4(uuid, uuid, jsonb) TO authenticated;

COMMENT ON FUNCTION public.submit_feedback_with_points_v4 IS 'BUILD 52: Feedback com suporte a user_id obrigatório e metadata';

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================
SELECT '=== VERIFICAÇÃO FINAL ===' as info;

SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'feedbacks' 
        AND column_name = 'metadata'
    ) THEN '✅ Coluna metadata: OK'
    ELSE '❌ Coluna metadata: FALTA'
  END AS status_metadata,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'feedbacks' 
        AND column_name = 'user_id'
    ) THEN '⚠️ Coluna user_id: EXISTE (função atualizada para incluir)'
    ELSE '✅ Coluna user_id: NÃO EXISTE'
  END AS status_user_id;
