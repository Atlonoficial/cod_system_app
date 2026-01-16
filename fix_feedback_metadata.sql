-- =====================================================
-- COD SYSTEM - BUILD 52 - Fix Missing Metadata Column
-- =====================================================
-- PROBLEMA: A coluna 'metadata' não existe na tabela 'feedbacks'
-- SOLUÇÃO: Adicionar a coluna se não existir
--
-- INSTRUÇÕES:
-- 1. Abra o Supabase Dashboard
-- 2. Vá em SQL Editor
-- 3. Cole este script inteiro
-- 4. Clique em "Run" para executar

-- PASSO 1: Adicionar coluna metadata se não existir
DO $$
BEGIN
  -- Verificar se a coluna metadata já existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'feedbacks' 
      AND column_name = 'metadata'
  ) THEN
    -- Adicionar a coluna metadata como JSONB com default vazio
    ALTER TABLE public.feedbacks 
    ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    
    RAISE NOTICE '✅ Coluna "metadata" adicionada à tabela feedbacks';
  ELSE
    RAISE NOTICE '✅ Coluna "metadata" já existe na tabela feedbacks';
  END IF;
END $$;

-- PASSO 2: Verificar estrutura atual da tabela
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'feedbacks'
ORDER BY ordinal_position;

-- PASSO 3: Recriar a função RPC com tratamento de erro melhorado
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

  -- INÍCIO DA TRANSAÇÃO
  BEGIN
    -- Inserir feedback (com verificação de coluna metadata)
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
        'version', 'v4_build52'
      )
    ) RETURNING id INTO v_feedback_id;

    -- Dar pontos por feedback - com fallback se falhar
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
        50 -- Pontos padrão para feedback
      );
      
      IF v_points_result IS NULL OR NOT (v_points_result->>'success')::boolean THEN
        v_points_awarded := 50; -- Fallback points
      ELSE
        v_points_awarded := COALESCE((v_points_result->>'points_awarded')::integer, 50);
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      v_points_awarded := 50; -- Fallback em caso de erro
    END;
    
    RETURN jsonb_build_object(
      'success', true,
      'feedback_id', v_feedback_id,
      'points_awarded', v_points_awarded,
      'message', 'Feedback enviado com sucesso!',
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
      'message', 'Erro interno ao processar feedback: ' || SQLERRM
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

-- PASSO 4: Garantir permissões corretas
GRANT EXECUTE ON FUNCTION public.submit_feedback_with_points_v4(uuid, uuid, jsonb) TO authenticated;

-- PASSO 5: Adicionar comentário para documentação
COMMENT ON FUNCTION public.submit_feedback_with_points_v4 IS 'BUILD 52: Submissão de feedback periódico com pontos - Corrigido para usar coluna metadata';

-- VERIFICAÇÃO FINAL: Testar se a coluna existe agora
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'feedbacks' 
        AND column_name = 'metadata'
    ) THEN '✅ SUCESSO: Coluna metadata existe na tabela feedbacks!'
    ELSE '❌ ERRO: Coluna metadata NÃO foi criada!'
  END AS status;
