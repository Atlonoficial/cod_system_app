-- =====================================================
-- TESTE: Ver o campo instructions COMPLETO
-- =====================================================
SELECT 
  name,
  instructions
FROM exercises
WHERE name ILIKE '%Iso Hold%Joelho%'
LIMIT 1;
