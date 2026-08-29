-- FELIPINHO LAUNCHER - Solicitações de empresas
-- Migration 012
CREATE TABLE IF NOT EXISTS solicitacoes_empresas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  nome VARCHAR(150) NOT NULL,
  slug VARCHAR(180) NOT NULL,
  responsavel VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL,
  localizacao VARCHAR(150) NULL,
  discord VARCHAR(255) NULL,
  instagram VARCHAR(255) NULL,
  site VARCHAR(255) NULL,
  data_fundacao DATE NULL,
  descricao TEXT NULL,
  logo_url VARCHAR(500) NULL,
  capa_url VARCHAR(500) NULL,
  status ENUM('pendente','aprovada','rejeitada') NOT NULL DEFAULT 'pendente',
  motivo_recusa VARCHAR(500) NULL,
  analisado_por INT NULL,
  analisado_em DATETIME NULL,
  empresa_id INT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_solic_emp_status (status),
  INDEX idx_solic_emp_usuario (usuario_id),
  CONSTRAINT fk_solic_emp_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  CONSTRAINT fk_solic_emp_analisador FOREIGN KEY (analisado_por) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB;
