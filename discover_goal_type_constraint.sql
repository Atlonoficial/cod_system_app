-- FASE 1: Descobrir valores permitidos para goal_type
-- Execute este SQL no Supabase SQL Editor

-- 1. Ver a constraint de check do goal_type
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.user_goals'::regclass 
AND conname LIKE '%goal_type%';

-- 2. Se for um ENUM, ver valores permitidos
SELECT 
    e.enumlabel as allowed_value,
    e.enumsortorder as sort_order
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname LIKE '%goal%'
ORDER BY e.enumsortorder;

-- 3. Ver todas as constraints da tabela user_goals
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'public.user_goals'::regclass;
