-- =====================================================
-- DIAGNÓSTICO CORRETO: Instructions é TEXT[] (Array PostgreSQL)
-- BUILD 54: Investigar conteúdo do array
-- =====================================================

-- QUERY 1: Ver elementos do array
SELECT 
  id,
  name,
  instructions,
  array_length(instructions, 1) as num_elementos,
  instructions[1] as primeiro_elemento,
  instructions[2] as segundo_elemento,
  instructions[3] as terceiro_elemento
FROM exercises
WHERE name ILIKE '%Iso Hold%Joelho%'
ORDER BY name
LIMIT 1;

-- QUERY 2: Confirmar tipo da coluna
SELECT 
  column_name,
  data_type,
  udt_name
FROM information_schema.columns
WHERE table_name = 'exercises' 
  AND column_name = 'instructions';

-- QUERY 3: Expandir TODOS os elementos do array
SELECT 
  name,
  unnest(instructions) as elemento_instrucao,
  ordinality as posicao
FROM exercises, unnest(instructions) WITH ORDINALITY
WHERE name ILIKE '%Iso Hold%Joelho%'
ORDER BY posicao;

-- QUERY 4: Ver o array completo como texto único
SELECT 
  name,
  array_to_string(instructions, ' | ') as instructions_concatenadas
FROM exercises
WHERE name ILIKE '%Iso Hold%Joelho%'
LIMIT 1;
