-- =====================================================================
-- FELIPINHO LAUNCHER - Migration 013: Empresas + Contratação de Motoristas
-- Fluxo: empresa aprovada -> empresa ativa -> motorista solicita -> empresa analisa -> aprova/recusa.
-- =====================================================================

CREATE TABLE IF NOT EXISTS empresas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  conta_id INT NULL,
  nome VARCHAR(150) NOT NULL,
  slug VARCHAR(180) NOT NULL,
  descricao TEXT NULL,
  logo_url VARCHAR(500) NULL,
  capa_url VARCHAR(500) NULL,
  localizacao VARCHAR(150) NULL,
  caminhoes INT NOT NULL DEFAULT 0,
  motoristas INT NOT NULL DEFAULT 0,
  data_fundacao DATE NULL,
  discord VARCHAR(255) NULL,
  instagram VARCHAR(255) NULL,
  site VARCHAR(255) NULL,
  pontuacao_ranking INT NOT NULL DEFAULT 0,
  posicao_ranking INT NULL,
  destaque TINYINT(1) NOT NULL DEFAULT 0,
  status ENUM('pendente','ativa','inativa','rejeitada') NOT NULL DEFAULT 'ativa',
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_empresas_slug (slug),
  INDEX idx_empresas_status (status),
  INDEX idx_empresas_conta (conta_id),
  CONSTRAINT fk_empresa_conta FOREIGN KEY (conta_id) REFERENCES contas(id) ON DELETE SET NULL
) ENGINE=InnoDB;

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
