-- Diagnóstico: Descobrir EXATAMENTE quais colunas existem na tabela user_goals
-- Execute este SQL no Supabase SQL Editor

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_goals'
ORDER BY ordinal_position;
