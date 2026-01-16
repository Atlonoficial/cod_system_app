-- =====================================================
-- COD SYSTEM - BUILD 53 - DIAGNÓSTICO DE INSTRUÇÕES
-- =====================================================
-- Este script mostra TODOS os campos de um exercício
-- para identificar onde estão as instruções completas
--
-- INSTRUÇÕES:
-- 1. Abra o Supabase Dashboard > SQL Editor
-- 2. Cole este script INTEIRO
-- 3. Clique em "Run"

-- =====================================================
-- 1. VER ESTRUTURA COMPLETA DA TABELA EXERCISES
-- =====================================================
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'exercises'
ORDER BY ordinal_position;

-- =====================================================
-- 2. VER TODOS OS DADOS DE UM EXERCÍCIO (Step Atrás)
-- =====================================================
SELECT *
FROM exercises
WHERE name ILIKE '%Step%Atrás%'
   OR name ILIKE '%Iso Hold%Afundo%'
LIMIT 1;

-- =====================================================
-- 3. VER TAMANHO DOS CAMPOS DE TEXTO
-- =====================================================
SELECT 
  name,
  LENGTH(description::text) as description_length,
  LENGTH(instructions::text) as instructions_length,
  SUBSTRING(description::text, 1, 100) as description_preview,
  SUBSTRING(instructions::text, 1, 100) as instructions_preview
FROM exercises
WHERE name ILIKE '%Step%'
LIMIT 3;

-- =====================================================
-- 4. BUSCAR CAMPOS QUE CONTENHAM "Objetivo" ou "Execução"
-- =====================================================
SELECT 
  name,
  description::text as description_text,
  instructions::text as instructions_text
FROM exercises
WHERE description::text ILIKE '%Objetivo%'
   OR instructions::text ILIKE '%Objetivo%'
   OR description::text ILIKE '%Execução%'
   OR instructions::text ILIKE '%Execução%'
LIMIT 3;

