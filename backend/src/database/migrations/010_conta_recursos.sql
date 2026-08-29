-- =====================================================================
-- FELIPINHO LAUNCHER - Vínculo de recursos à conta
-- Migration 010
-- Compatível com MySQL/Railway sem ADD COLUMN/INDEX IF NOT EXISTS.
-- =====================================================================

SET @db = DATABASE();

-- motoristas.conta_id
SET @sql = IF(
  EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='motoristas' AND COLUMN_NAME='conta_id'),
  'SELECT 1',
  'ALTER TABLE motoristas ADD COLUMN conta_id INT NULL AFTER id'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='motoristas' AND INDEX_NAME='idx_motoristas_conta');
SET @sql = IF(@idx=0, 'CREATE INDEX idx_motoristas_conta ON motoristas (conta_id)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- caminhoes.conta_id
SET @sql = IF(
  EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='caminhoes' AND COLUMN_NAME='conta_id'),
  'SELECT 1',
  'ALTER TABLE caminhoes ADD COLUMN conta_id INT NULL AFTER id'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='caminhoes' AND INDEX_NAME='idx_caminhoes_conta');
SET @sql = IF(@idx=0, 'CREATE INDEX idx_caminhoes_conta ON caminhoes (conta_id)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- reboques.conta_id
SET @sql = IF(
  EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='reboques' AND COLUMN_NAME='conta_id'),
  'SELECT 1',
  'ALTER TABLE reboques ADD COLUMN conta_id INT NULL AFTER id'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='reboques' AND INDEX_NAME='idx_reboques_conta');
SET @sql = IF(@idx=0, 'CREATE INDEX idx_reboques_conta ON reboques (conta_id)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Foreign keys, adicionadas somente se ainda não existirem.
SET @fk = (SELECT COUNT(*) FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=@db AND CONSTRAINT_NAME='fk_motorista_conta');
SET @sql = IF(@fk=0, 'ALTER TABLE motoristas ADD CONSTRAINT fk_motorista_conta FOREIGN KEY (conta_id) REFERENCES contas(id) ON DELETE SET NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fk = (SELECT COUNT(*) FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=@db AND CONSTRAINT_NAME='fk_caminhao_conta');
SET @sql = IF(@fk=0, 'ALTER TABLE caminhoes ADD CONSTRAINT fk_caminhao_conta FOREIGN KEY (conta_id) REFERENCES contas(id) ON DELETE SET NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fk = (SELECT COUNT(*) FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=@db AND CONSTRAINT_NAME='fk_reboque_conta');
SET @sql = IF(@fk=0, 'ALTER TABLE reboques ADD CONSTRAINT fk_reboque_conta FOREIGN KEY (conta_id) REFERENCES contas(id) ON DELETE SET NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
