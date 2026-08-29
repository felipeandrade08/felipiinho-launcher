-- =====================================================================
-- FELIPINHO LAUNCHER - Trial gratuito de 7 dias
-- Migration 009
-- =====================================================================

-- Controle do período de teste na assinatura.
ALTER TABLE assinaturas
  ADD COLUMN IF NOT EXISTS trial_inicio DATETIME NULL AFTER status,
  ADD COLUMN IF NOT EXISTS trial_fim DATETIME NULL AFTER trial_inicio,
  ADD COLUMN IF NOT EXISTS trial_usado BOOLEAN NOT NULL DEFAULT FALSE AFTER trial_fim;

-- Novas assinaturas podem iniciar em trial.
-- A aplicação deve preencher trial_inicio/trial_fim ao criar a assinatura.

-- =====================================================================
-- REGRA DE NEGÓCIO
--
-- trial_inicio = data/hora em que o teste começou
-- trial_fim    = trial_inicio + 7 dias
-- trial_usado  = TRUE após a conta consumir o trial
--
-- Durante o trial, a conta utiliza os recursos do plano escolhido.
-- Após trial_fim, o acesso pago depende de uma assinatura ativa.
-- =====================================================================

CREATE INDEX idx_assinaturas_trial_fim ON assinaturas (trial_fim);
