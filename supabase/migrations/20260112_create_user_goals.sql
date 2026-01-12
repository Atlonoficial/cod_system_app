-- Migration: create_user_goals_table.sql
-- Cria a tabela user_goals para a funcionalidade de Metas no app do aluno

CREATE TABLE IF NOT EXISTS public.user_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- Informações da meta
  title TEXT NOT NULL,
  description TEXT,
  target_value NUMERIC,
  current_value NUMERIC DEFAULT 0,
  unit TEXT, -- 'kg', '%', 'reps', 'min', 'cm'
  
  -- Tipo e categoria
  goal_type TEXT CHECK (goal_type IN ('weight', 'strength', 'cardio', 'habit', 'body_comp', 'custom')),
  category TEXT, -- 'perda_peso', 'ganho_massa', 'resistencia', etc.
  
  -- Prazo e status
  deadline DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'paused')),
  progress_percentage NUMERIC DEFAULT 0,
  
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  CONSTRAINT unique_user_goal UNIQUE(user_id, title)
);

-- Comentários
COMMENT ON TABLE public.user_goals IS 'Metas pessoais de fitness dos usuários';
COMMENT ON COLUMN public.user_goals.goal_type IS 'Tipo da meta: weight (peso), strength (força), cardio, habit (hábito), body_comp (composição corporal), custom';
COMMENT ON COLUMN public.user_goals.unit IS 'Unidade de medida: kg, %, reps, min, cm';

-- RLS (Row Level Security)
ALTER TABLE public.user_goals ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "users_can_view_own_goals"
  ON public.user_goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users_can_insert_own_goals"
  ON public.user_goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_can_update_own_goals"
  ON public.user_goals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "users_can_delete_own_goals"
  ON public.user_goals FOR DELETE
  USING (auth.uid() = user_id);

-- Índices para performance
CREATE INDEX idx_user_goals_user_id ON public.user_goals(user_id);
CREATE INDEX idx_user_goals_status ON public.user_goals(status);
CREATE INDEX idx_user_goals_deadline ON public.user_goals(deadline);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_user_goals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_goals_updated_at
  BEFORE UPDATE ON public.user_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_user_goals_updated_at();
