-- =====================================================================
-- FELIPINHO LAUNCHER - Migration 004: Cargos, Recrutamento e Progressão
-- =====================================================================

-- 1. Atualiza o tipo/cargo dos usuários
ALTER TABLE usuarios
  MODIFY COLUMN tipo ENUM('admin','diretoria','rh','motorista') NOT NULL DEFAULT 'motorista';

-- 2. Adiciona nível do motorista
-- MySQL/MariaDB usado no ambiente não aceita "ADD COLUMN IF NOT EXISTS".
ALTER TABLE motoristas
  ADD COLUMN nivel ENUM('novato','motorista') NOT NULL DEFAULT 'novato';

-- 3. Tabela de solicitações de recrutamento (pré-cadastro)
CREATE TABLE IF NOT EXISTS recrutamentos (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  nome          VARCHAR(120) NOT NULL,
  apelido       VARCHAR(60),
  discord_user  VARCHAR(80)  NOT NULL,
  idade         TINYINT UNSIGNED,
  experiencia   TEXT,
  como_conheceu VARCHAR(200),
  status        ENUM('pendente','aprovado','rejeitado') NOT NULL DEFAULT 'pendente',
  observacoes   TEXT,
  criado_em     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- O controle de migrations garante que esta migration seja executada uma única vez.
-- Portanto não usamos "CREATE INDEX IF NOT EXISTS", que não é suportado por algumas
-- versões MySQL/MariaDB.
CREATE INDEX idx_recrutamentos_status ON recrutamentos(status);
