-- =====================================================================
-- FELIPINHO LAUNCHER - Migration 013: Contratação de Motoristas
-- Fluxo: motorista solicita -> empresa analisa -> aprova/recusa.
-- =====================================================================

SET @db = DATABASE();

-- Vincula cada empresa à sua conta do sistema.
SET @sql = IF(
  EXISTS (SELECT 1 FROM information_schema.COLUMNS
          WHERE TABLE_SCHEMA=@db AND TABLE_NAME='empresas' AND COLUMN_NAME='conta_id'),
  'SELECT 1',
  'ALTER TABLE empresas ADD COLUMN conta_id INT NULL AFTER id'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx = (SELECT COUNT(*) FROM information_schema.STATISTICS
            WHERE TABLE_SCHEMA=@db AND TABLE_NAME='empresas' AND INDEX_NAME='idx_empresas_conta');
SET @sql = IF(@idx=0, 'CREATE INDEX idx_empresas_conta ON empresas(conta_id)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fk = (SELECT COUNT(*) FROM information_schema.REFERENTIAL_CONSTRAINTS
           WHERE CONSTRAINT_SCHEMA=@db AND CONSTRAINT_NAME='fk_empresa_conta');
SET @sql = IF(@fk=0,
  'ALTER TABLE empresas ADD CONSTRAINT fk_empresa_conta FOREIGN KEY (conta_id) REFERENCES contas(id) ON DELETE SET NULL',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS solicitacoes_motoristas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  empresa_id INT NOT NULL,
  usuario_id INT NOT NULL,
  mensagem VARCHAR(1000) NULL,
  status ENUM('pendente','aprovada','recusada','cancelada') NOT NULL DEFAULT 'pendente',
  analisado_por INT NULL,
  analisado_em DATETIME NULL,
  motivo_recusa VARCHAR(500) NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_solicitacao_motorista_empresa (empresa_id, usuario_id),
  INDEX idx_solic_motorista_empresa_status (empresa_id, status),
  INDEX idx_solic_motorista_usuario (usuario_id),
  CONSTRAINT fk_solic_motorista_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
  CONSTRAINT fk_solic_motorista_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  CONSTRAINT fk_solic_motorista_analisador FOREIGN KEY (analisado_por) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Empresas já aprovadas antes desta migration são vinculadas à conta
-- criada com o mesmo e-mail de contato.
UPDATE empresas e
JOIN contas c ON LOWER(c.email_contato) = LOWER(
  (SELECT se.email FROM solicitacoes_empresas se WHERE se.empresa_id=e.id LIMIT 1)
)
SET e.conta_id = c.id
WHERE e.conta_id IS NULL;
