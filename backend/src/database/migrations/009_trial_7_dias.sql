-- =====================================================================
-- FELIPINHO LAUNCHER - Trial gratuito de 7 dias
-- Migration 009
-- =====================================================================

-- MySQL/Railway: ALTER TABLE ... ADD COLUMN IF NOT EXISTS não é usado.
-- A existência das colunas é verificada via INFORMATION_SCHEMA.

SET @db = DATABASE();

SET @sql = IF(
  EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'assinaturas' AND COLUMN_NAME = 'trial_inicio'
  ),
  'SELECT 1',
  'ALTER TABLE assinaturas ADD COLUMN trial_inicio DATETIME NULL AFTER status'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(
  EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'assinaturas' AND COLUMN_NAME = 'trial_fim'
  ),
  'SELECT 1',
  'ALTER TABLE assinaturas ADD COLUMN trial_fim DATETIME NULL AFTER trial_inicio'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(
  EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'assinaturas' AND COLUMN_NAME = 'trial_usado'
  ),
  'SELECT 1',
  'ALTER TABLE assinaturas ADD COLUMN trial_usado BOOLEAN NOT NULL DEFAULT FALSE AFTER trial_fim'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Índice do fim do trial, também de forma compatível com versões sem
-- CREATE INDEX IF NOT EXISTS.
SET @idx_exists = (
  SELECT COUNT(1)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = @db
    AND TABLE_NAME = 'assinaturas'
    AND INDEX_NAME = 'idx_assinaturas_trial_fim'
);
SET @sql = IF(
  @idx_exists = 0,
  'CREATE INDEX idx_assinaturas_trial_fim ON assinaturas (trial_fim)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

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
