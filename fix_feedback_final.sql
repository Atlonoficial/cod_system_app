-- =====================================================
-- COD SYSTEM - BUILD 53 - FIX FINAL COMPLETO PARA FEEDBACK
-- =====================================================
-- PROBLEMA IDENTIFICADO:
-- A coluna student_id na tabela feedbacks referencia students.id (não auth.users.id)
-- A função estava passando auth.uid() diretamente, mas deveria buscar o ID na tabela students
--
-- INSTRUÇÕES:
-- 1. Abra o Supabase Dashboard > SQL Editor
-- 2. Cole este script INTEIRO
-- 3. Clique em "Run"

-- =====================================================
-- CRIAR FUNÇÃO RPC CORRIGIDA
-- =====================================================
CREATE OR REPLACE FUNCTION public.submit_feedback_with_points_v4(
  p_student_id uuid,  -- Este é na verdade o user_id (auth.uid())
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
  v_real_student_id UUID;  -- ID da tabela students (não user_id)
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

  -- VALIDAÇÃO 3: Buscar o student.id REAL da tabela students
  -- p_student_id é na verdade o user_id (auth.uid())
  -- Precisamos buscar o id da tabela students que corresponde a esse user_id
  SELECT id INTO v_real_student_id
  FROM students 
  WHERE user_id = p_student_id AND teacher_id = p_teacher_id
  LIMIT 1;
  
  IF v_real_student_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Relacionamento professor-aluno não encontrado',
      'error_type', 'relationship_not_found',
      'debug_info', jsonb_build_object(
        'user_id_passed', p_student_id,
        'teacher_id_passed', p_teacher_id
      )
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
  -- USAR v_real_student_id (id da tabela students)
  SELECT * INTO v_existing_feedback
  FROM feedbacks
  WHERE student_id = v_real_student_id
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
    -- INSERIR FEEDBACK COM ID CORRETO
    IF v_has_user_id_column THEN
      -- Tabela TEM coluna user_id
      INSERT INTO feedbacks (
        student_id,
        teacher_id,
        user_id,
        type,
        rating,
        message,
        metadata
      ) VALUES (
        v_real_student_id,  -- ID da tabela students (FK correta!)
        p_teacher_id,
        p_student_id,  -- user_id = auth.uid()
        'periodic_feedback',
        COALESCE((p_feedback_data->>'rating')::integer, 5),
        COALESCE(p_feedback_data->>'message', ''),
        COALESCE(p_feedback_data->'metadata', '{}'::jsonb) || jsonb_build_object(
          'submitted_at', now(),
          'frequency', v_frequency,
          'period_start', v_period_start,
          'period_end', v_period_end,
          'auth_user_id', p_student_id,
          'version', 'v4_build53_final'
        )
      ) RETURNING id INTO v_feedback_id;
    ELSE
      -- Tabela NÃO tem coluna user_id
      INSERT INTO feedbacks (
        student_id,
        teacher_id,
        type,
        rating,
        message,
        metadata
      ) VALUES (
        v_real_student_id,  -- ID da tabela students (FK correta!)
        p_teacher_id,
        'periodic_feedback',
        COALESCE((p_feedback_data->>'rating')::integer, 5),
        COALESCE(p_feedback_data->>'message', ''),
        COALESCE(p_feedback_data->'metadata', '{}'::jsonb) || jsonb_build_object(
          'submitted_at', now(),
          'frequency', v_frequency,
          'period_start', v_period_start,
          'period_end', v_period_end,
          'auth_user_id', p_student_id,
          'version', 'v4_build53_final'
        )
      ) RETURNING id INTO v_feedback_id;
    END IF;

    -- Dar pontos por feedback
    BEGIN
      SELECT * INTO v_points_result
      FROM award_points_enhanced_v3(
        p_student_id,  -- user_id para gamificação
        'periodic_feedback',
        'Feedback periódico enviado',
        jsonb_build_object(
          'teacher_id', p_teacher_id,
          'feedback_id', v_feedback_id,
          'student_id', v_real_student_id,
          'frequency', v_frequency,
          'period_start', v_period_start,
          'period_end', v_period_end,
          'type', 'periodic_feedback',
          'version', 'v4_build53_final'
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
      'metadata', jsonb_build_object(
        'frequency', v_frequency,
        'period', v_period_start || ' a ' || v_period_end,
        'student_table_id', v_real_student_id,
        'auth_user_id', p_student_id,
        'version', 'v4_build53_final'
      )
    );

  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'sqlstate', SQLSTATE,
      'message', 'Erro interno ao processar feedback: ' || SQLERRM,
      'debug_info', jsonb_build_object(
        'real_student_id', v_real_student_id,
        'auth_user_id', p_student_id,
        'has_user_id_column', v_has_user_id_column
      )
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
-- GARANTIR PERMISSÕES
-- =====================================================
GRANT EXECUTE ON FUNCTION public.submit_feedback_with_points_v4(uuid, uuid, jsonb) TO authenticated;

COMMENT ON FUNCTION public.submit_feedback_with_points_v4 IS 'BUILD 53: Corrigido para usar students.id na FK, não auth.uid()';

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================
SELECT '✅ Função submit_feedback_with_points_v4 atualizada!' AS status;
SELECT 'Agora busca o ID correto da tabela students baseado no user_id' AS info;
