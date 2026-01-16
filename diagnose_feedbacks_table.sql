-- =====================================================
-- COD SYSTEM - BUILD 52 - DIAGNÓSTICO COMPLETO DA TABELA FEEDBACKS
-- =====================================================
-- Este script mostra TODA a estrutura da tabela feedbacks
-- para identificar TODOS os constraints e foreign keys
--
-- INSTRUÇÕES:
-- 1. Abra o Supabase Dashboard > SQL Editor
-- 2. Cole este script INTEIRO
-- 3. Clique em "Run"

-- =====================================================
-- 1. ESTRUTURA DA TABELA (colunas)
-- =====================================================
SELECT '=== COLUNAS DA TABELA FEEDBACKS ===' as info;

SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'feedbacks'
ORDER BY ordinal_position;

-- =====================================================
-- 2. TODAS AS CONSTRAINTS (CHECK, FK, PK, UNIQUE)
-- =====================================================
SELECT '=== TODAS AS CONSTRAINTS ===' as info;

SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.feedbacks'::regclass
ORDER BY conname;

-- =====================================================
-- 3. FOREIGN KEYS DETALHADAS
-- =====================================================
SELECT '=== FOREIGN KEYS DETALHADAS ===' as info;

SELECT
  tc.constraint_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM 
  information_schema.table_constraints AS tc 
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'feedbacks';

-- =====================================================
-- 4. VERIFICAR QUAIS TABELAS student_id REFERENCIA
-- =====================================================
SELECT '=== WHAT DOES student_id REFERENCE? ===' as info;

SELECT
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS referenced_table,
  ccu.column_name AS referenced_column
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu 
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu 
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'feedbacks' 
  AND tc.constraint_type = 'FOREIGN KEY'
  AND kcu.column_name IN ('student_id', 'user_id');
