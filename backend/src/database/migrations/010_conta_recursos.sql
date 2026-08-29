-- =====================================================================
-- FELIPINHO LAUNCHER - Vínculo de recursos à conta
-- Migration 010
--
-- Prepara os recursos limitáveis do SaaS para pertencerem a uma conta.
-- As colunas começam NULL para não quebrar instalações existentes.
-- O backend deve preencher conta_id ao criar novos registros.
-- =====================================================================

ALTER TABLE motoristas
  ADD COLUMN IF NOT EXISTS conta_id INT NULL AFTER id,
  ADD INDEX IF NOT EXISTS idx_motoristas_conta (conta_id);

ALTER TABLE caminhoes
  ADD COLUMN IF NOT EXISTS conta_id INT NULL AFTER id,
  ADD INDEX IF NOT EXISTS idx_caminhoes_conta (conta_id);

ALTER TABLE reboques
  ADD COLUMN IF NOT EXISTS conta_id INT NULL AFTER id,
  ADD INDEX IF NOT EXISTS idx_reboques_conta (conta_id);

-- Foreign keys adicionadas separadamente para facilitar a execução
-- em instalações que já possuem dados.
SET @fk_motoristas := (
  SELECT COUNT(*) FROM information_schema.REFERENTIAL_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE() AND CONSTRAINT_NAME = 'fk_motorista_conta'
);
SET @sql_motoristas := IF(@fk_motoristas = 0,
  'ALTER TABLE motoristas ADD CONSTRAINT fk_motorista_conta FOREIGN KEY (conta_id) REFERENCES contas(id) ON DELETE SET NULL',
  'SELECT 1'
);
PREPARE stmt_motoristas FROM @sql_motoristas;
EXECUTE stmt_motoristas;
DEALLOCATE PREPARE stmt_motoristas;

SET @fk_caminhoes := (
  SELECT COUNT(*) FROM information_schema.REFERENTIAL_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE() AND CONSTRAINT_NAME = 'fk_caminhao_conta'
);
SET @sql_caminhoes := IF(@fk_caminhoes = 0,
  'ALTER TABLE caminhoes ADD CONSTRAINT fk_caminhao_conta FOREIGN KEY (conta_id) REFERENCES contas(id) ON DELETE SET NULL',
  'SELECT 1'
);
PREPARE stmt_caminhoes FROM @sql_caminhoes;
EXECUTE stmt_caminhoes;
DEALLOCATE PREPARE stmt_caminhoes;

SET @fk_reboques := (
  SELECT COUNT(*) FROM information_schema.REFERENTIAL_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE() AND CONSTRAINT_NAME = 'fk_reboque_conta'
);
SET @sql_reboques := IF(@fk_reboques = 0,
  'ALTER TABLE reboques ADD CONSTRAINT fk_reboque_conta FOREIGN KEY (conta_id) REFERENCES contas(id) ON DELETE SET NULL',
  'SELECT 1'
);
PREPARE stmt_reboques FROM @sql_reboques;
EXECUTE stmt_reboques;
DEALLOCATE PREPARE stmt_reboques;
