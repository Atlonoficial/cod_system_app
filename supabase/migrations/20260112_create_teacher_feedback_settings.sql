-- Migration: create_teacher_feedback_settings.sql
-- Cria a tabela teacher_feedback_settings para configurações de feedback do professor

CREATE TABLE IF NOT EXISTS public.teacher_feedback_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- Configurações de feedback automático
  auto_feedback_enabled BOOLEAN DEFAULT true,
  feedback_frequency TEXT DEFAULT 'weekly' CHECK (feedback_frequency IN ('daily', 'weekly', 'biweekly', 'monthly')),
  
  -- Notificações
  notification_enabled BOOLEAN DEFAULT true,
  notification_channels JSONB DEFAULT '["push", "email"]'::jsonb,
  
  -- Templates de feedback
  feedback_template JSONB,
  
  -- Configurações de monitoramento
  auto_monitor_progress BOOLEAN DEFAULT true,
  alert_on_missed_workouts BOOLEAN DEFAULT true,
  missed_workout_threshold INTEGER DEFAULT 3, -- dias
  
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_teacher_settings UNIQUE(teacher_id)
);

-- Comentários
COMMENT ON TABLE public.teacher_feedback_settings IS 'Configurações de feedback automático para professores';
COMMENT ON COLUMN public.teacher_feedback_settings.feedback_frequency IS 'Frequência: daily, weekly, biweekly, monthly';
COMMENT ON COLUMN public.teacher_feedback_settings.missed_workout_threshold IS 'Dias sem treinar para gerar alerta';

-- RLS
ALTER TABLE public.teacher_feedback_settings ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "teachers_can_view_own_settings"
  ON public.teacher_feedback_settings FOR SELECT
  USING (auth.uid() = teacher_id);

CREATE POLICY "teachers_can_insert_own_settings"
  ON public.teacher_feedback_settings FOR INSERT
  WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "teachers_can_update_own_settings"
  ON public.teacher_feedback_settings FOR UPDATE
  USING (auth.uid() = teacher_id);

-- Índice
CREATE INDEX idx_teacher_feedback_teacher_id ON public.teacher_feedback_settings(teacher_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_teacher_feedback_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_teacher_feedback_settings_updated_at
  BEFORE UPDATE ON public.teacher_feedback_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_teacher_feedback_settings_updated_at();
