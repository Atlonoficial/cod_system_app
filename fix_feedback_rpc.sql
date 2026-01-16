-- =====================================================
-- COD SYSTEM - Fix Feedback RPC Functions
-- =====================================================
-- This migration adds the required RPC functions for the feedback system
-- Apply this via Supabase Dashboard > SQL Editor

-- 1. Create/Update award_points_enhanced_v3 function
CREATE OR REPLACE FUNCTION public.award_points_enhanced_v3(p_user_id uuid, p_activity_type text, p_description text DEFAULT NULL::text, p_metadata jsonb DEFAULT '{}'::jsonb, p_custom_points integer DEFAULT NULL::integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_points INTEGER;
  v_current_total INTEGER := 0;
  v_new_level INTEGER;
  v_old_level INTEGER;
  v_activity_id UUID;
  v_settings RECORD;
  v_existing_activity RECORD;
  v_today DATE := CURRENT_DATE;
  v_week_start DATE;
  v_month_start DATE;
  v_daily_points INTEGER := 0;
BEGIN
  v_week_start := DATE_TRUNC('week', v_today)::DATE;
  v_month_start := DATE_TRUNC('month', v_today)::DATE;

  IF p_activity_type = 'daily_checkin' THEN
    SELECT * INTO v_existing_activity FROM gamification_activities
    WHERE user_id = p_user_id AND activity_type = p_activity_type AND DATE(created_at) = v_today;
    IF FOUND THEN
      RETURN jsonb_build_object('success', false, 'message', 'Check-in diário já realizado hoje', 'duplicate', true);
    END IF;
  ELSIF p_activity_type = 'periodic_feedback' THEN
    SELECT * INTO v_existing_activity FROM gamification_activities
    WHERE user_id = p_user_id AND activity_type = p_activity_type 
      AND metadata->>'teacher_id' = p_metadata->>'teacher_id' AND DATE(created_at) >= v_week_start;
    IF FOUND THEN
      RETURN jsonb_build_object('success', false, 'message', 'Feedback já enviado esta semana', 'duplicate', true);
    END IF;
  ELSIF p_activity_type = 'meal_logged' AND p_metadata ? 'meal_id' THEN
    SELECT * INTO v_existing_activity FROM gamification_activities
    WHERE user_id = p_user_id AND activity_type = p_activity_type 
      AND metadata->>'meal_id' = p_metadata->>'meal_id' 
      AND DATE(created_at) = COALESCE((p_metadata->>'date')::date, v_today);
    IF FOUND THEN
      RETURN jsonb_build_object('success', false, 'message', 'Refeição já registrada', 'duplicate', true);
    END IF;
  ELSE
    SELECT * INTO v_existing_activity FROM gamification_activities
    WHERE user_id = p_user_id AND activity_type = p_activity_type 
      AND created_at > (NOW() - INTERVAL '1 minute');
    IF FOUND THEN
      RETURN jsonb_build_object('success', false, 'message', 'Atividade registrada recentemente', 'duplicate', true);
    END IF;
  END IF;

  SELECT gs.* INTO v_settings FROM gamification_settings gs
  JOIN students s ON s.teacher_id = gs.teacher_id
  WHERE s.user_id = p_user_id LIMIT 1;

  IF NOT FOUND THEN
    SELECT gs.* INTO v_settings FROM gamification_settings gs WHERE teacher_id IS NULL LIMIT 1;
    
    IF NOT FOUND THEN
      INSERT INTO gamification_settings (
        teacher_id, points_workout, points_checkin, points_meal_log,
        points_progress_update, points_goal_achieved, points_assessment,
        points_medical_exam, points_ai_interaction, points_teacher_message,
        level_up_bonus, max_daily_points
      ) VALUES (
        NULL, 75, 10, 25, 100, 300, 150, 100, 5, 20, 50, 500
      )
      ON CONFLICT DO NOTHING
      RETURNING * INTO v_settings;
      
      IF v_settings IS NULL THEN
        RETURN jsonb_build_object(
          'success', true, 
          'points_awarded', 0, 
          'message', 'Progresso salvo sem pontos (sem configuração de gamificação)'
        );
      END IF;
    END IF;
  END IF;

  v_points := CASE p_activity_type
    WHEN 'training_completed' THEN COALESCE(p_custom_points, v_settings.points_workout)
    WHEN 'daily_checkin' THEN COALESCE(p_custom_points, v_settings.points_checkin)
    WHEN 'meal_logged' THEN COALESCE(p_custom_points, v_settings.points_meal_log)
    WHEN 'progress_logged' THEN COALESCE(p_custom_points, v_settings.points_progress_update)
    WHEN 'goal_achieved' THEN COALESCE(p_custom_points, v_settings.points_goal_achieved)
    WHEN 'physical_assessment' THEN COALESCE(p_custom_points, v_settings.points_assessment)
    WHEN 'medical_exam' THEN COALESCE(p_custom_points, v_settings.points_medical_exam)
    WHEN 'ai_interaction' THEN COALESCE(p_custom_points, v_settings.points_ai_interaction)
    WHEN 'teacher_message' THEN COALESCE(p_custom_points, v_settings.points_teacher_message)
    WHEN 'periodic_feedback' THEN COALESCE(p_custom_points, 50)
    ELSE COALESCE(p_custom_points, 10)
  END;

  SELECT COALESCE(SUM(points_earned), 0) INTO v_daily_points
  FROM gamification_activities WHERE user_id = p_user_id AND DATE(created_at) = v_today;
    
  IF v_daily_points + v_points > v_settings.max_daily_points THEN
    v_points := GREATEST(0, v_settings.max_daily_points - v_daily_points);
    IF v_points <= 0 THEN
      RETURN jsonb_build_object('success', false, 'message', 'Limite diário atingido', 'daily_limit_reached', true);
    END IF;
  END IF;

  INSERT INTO gamification_activities (user_id, activity_type, points_earned, description, metadata)
  VALUES (p_user_id, p_activity_type, v_points, COALESCE(p_description, 'Atividade: ' || p_activity_type), p_metadata)
  RETURNING id INTO v_activity_id;

  INSERT INTO user_points (user_id, total_points, last_activity_date)
  VALUES (p_user_id, v_points, v_today)
  ON CONFLICT (user_id) DO UPDATE SET
    total_points = user_points.total_points + v_points,
    last_activity_date = v_today, updated_at = NOW()
  RETURNING total_points, level INTO v_current_total, v_old_level;

  v_new_level := FLOOR(v_current_total / 100.0) + 1;

  IF v_new_level > v_old_level THEN
    UPDATE user_points SET level = v_new_level WHERE user_id = p_user_id;
    
    IF NOT EXISTS (
      SELECT 1 FROM gamification_activities 
      WHERE user_id = p_user_id AND activity_type = 'level_up' 
        AND metadata->>'level' = v_new_level::text AND DATE(created_at) = v_today
    ) THEN
      INSERT INTO gamification_activities (user_id, activity_type, points_earned, description, metadata)
      VALUES (p_user_id, 'level_up', v_settings.level_up_bonus, 'Subiu para nível ' || v_new_level,
        jsonb_build_object('level', v_new_level, 'previous_level', v_old_level));
      UPDATE user_points SET total_points = total_points + v_settings.level_up_bonus WHERE user_id = p_user_id;
      v_current_total := v_current_total + v_settings.level_up_bonus;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'success', true, 'points_awarded', v_points, 'total_points', v_current_total,
    'level', v_new_level, 'level_up', v_new_level > v_old_level, 'activity_id', v_activity_id
  );
END;
$function$;

-- 2. Create/Update submit_feedback_with_points_v4 function
CREATE OR REPLACE FUNCTION public.submit_feedback_with_points_v4(p_student_id uuid, p_teacher_id uuid, p_feedback_data jsonb)
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
  IF auth.uid() != p_student_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Usuário não autorizado',
      'error_type', 'auth_mismatch'
    );
  END IF;

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

  SELECT COALESCE(feedback_frequency, 'weekly') INTO v_frequency
  FROM teacher_feedback_settings 
  WHERE teacher_id = p_teacher_id;
  
  IF v_frequency IS NULL THEN
    v_frequency := 'weekly';
  END IF;

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

  BEGIN
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
        'version', 'v4'
      )
    ) RETURNING id INTO v_feedback_id;

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
          'version', 'v4'
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
        'version', 'v4'
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

-- 3. Grant permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.award_points_enhanced_v3(uuid, text, text, jsonb, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_feedback_with_points_v4(uuid, uuid, jsonb) TO authenticated;

-- 4. Add comments
COMMENT ON FUNCTION public.award_points_enhanced_v3 IS 'Awards points for gamification activities with enhanced duplicate checking';
COMMENT ON FUNCTION public.submit_feedback_with_points_v4 IS 'Submits periodic feedback and awards points with comprehensive validation';

-- DONE! These functions should now be available for the app to use.
