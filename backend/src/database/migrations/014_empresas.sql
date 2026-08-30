-- =====================================================================
-- FELIPINHO LAUNCHER - Migration 014: Estrutura de Empresas
-- Garante que a tabela empresas exista antes dos recursos de contratação.
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
  CONSTRAINT fk_empresa_conta FOREIGN KEY (conta_id)
    REFERENCES contas(id) ON DELETE SET NULL
) ENGINE=InnoDB;
