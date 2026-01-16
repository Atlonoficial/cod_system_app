-- =====================================================
-- COD SYSTEM - BUILD 52 - Fix CONSTRAINT feedbacks_type_check
-- =====================================================
-- PROBLEMA: O tipo 'periodic_feedback' não está permitido pelo constraint
--
-- INSTRUÇÕES:
-- 1. Abra o Supabase Dashboard > SQL Editor
-- 2. Cole este script INTEIRO
-- 3. Clique em "Run"

-- =====================================================
-- PASSO 1: Ver constraint atual
-- =====================================================
SELECT pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'feedbacks_type_check';

-- =====================================================
-- PASSO 2: Remover constraint antigo
-- =====================================================
ALTER TABLE public.feedbacks DROP CONSTRAINT IF EXISTS feedbacks_type_check;

-- =====================================================
-- PASSO 3: Recriar constraint com periodic_feedback incluído
-- =====================================================
ALTER TABLE public.feedbacks ADD CONSTRAINT feedbacks_type_check 
CHECK (type IN (
  'general', 
  'workout', 
  'nutrition', 
  'progress', 
  'appointment', 
  'periodic_feedback',
  'teacher_response',
  'student_feedback',
  'performance_review'
));

-- =====================================================
-- PASSO 4: Verificar que constraint foi atualizado
-- =====================================================
SELECT '=== CONSTRAINT ATUALIZADO ===' as info;

SELECT pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'feedbacks_type_check';

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'feedbacks_type_check'
    ) THEN '✅ Constraint feedbacks_type_check existe'
    ELSE '❌ Constraint não encontrado'
  END AS status;
