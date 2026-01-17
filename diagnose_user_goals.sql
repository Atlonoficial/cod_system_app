-- Diagnóstico: Descobrir EXATAMENTE quais colunas existem na tabela user_goals
-- Execute este SQL no Supabase SQL Editor

-- 1. Listar todas as colunas da tabela user_goals
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_goals'
ORDER BY ordinal_position;

-- 2. Ver a definição completa da tabela
SELECT pg_get_tabledef('public.user_goals'::regclass);

-- 3. Alternativa: ver todas as colunas
\d public.user_goals
