-- =====================================================================
-- FELIPINHO LAUNCHER - Arquitetura SaaS: contas, planos e assinaturas
-- Migration 008
--
-- Objetivo:
--   Separar uso individual de uso empresarial e preparar o sistema para
--   limites por plano e cobrança recorrente futura.
--
-- IMPORTANTE:
--   Esta migration NAO altera os usuários existentes automaticamente.
--   A associação das contas será feita na etapa de aplicação/backend.
-- =====================================================================

-- ---------------------------------------------------------------------
-- CONTAS / TENANTS
-- Uma conta representa o espaço de trabalho de um cliente.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  tipo ENUM('individual', 'empresa') NOT NULL DEFAULT 'individual',
  documento VARCHAR(30) NULL,
  email_contato VARCHAR(150) NULL,
  telefone VARCHAR(30) NULL,
  status ENUM('ativa', 'suspensa', 'cancelada') NOT NULL DEFAULT 'ativa',
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_contas_tipo_status (tipo, status)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- MEMBROS DA CONTA
-- Permite que uma conta empresarial tenha vários usuários e papéis.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS conta_membros (
  id INT AUTO_INCREMENT PRIMARY KEY,
  conta_id INT NOT NULL,
  usuario_id INT NOT NULL,
  papel ENUM('proprietario', 'admin', 'gestor', 'motorista') NOT NULL DEFAULT 'motorista',
  status ENUM('ativo', 'convite_pendente', 'removido') NOT NULL DEFAULT 'ativo',
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_conta_usuario (conta_id, usuario_id),
  INDEX idx_membros_usuario (usuario_id),
  INDEX idx_membros_conta_status (conta_id, status),
  CONSTRAINT fk_membro_conta FOREIGN KEY (conta_id) REFERENCES contas(id) ON DELETE CASCADE,
  CONSTRAINT fk_membro_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- PLANOS
-- Os valores ficam no banco para permitir alteração comercial sem
-- precisar alterar a aplicação.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS planos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(40) NOT NULL UNIQUE,
  nome VARCHAR(80) NOT NULL,
  descricao VARCHAR(255),
  preco_mensal DECIMAL(10,2) NOT NULL DEFAULT 0,
  moeda CHAR(3) NOT NULL DEFAULT 'BRL',
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  ordem INT NOT NULL DEFAULT 0,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_planos_ativo_ordem (ativo, ordem)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- LIMITES POR PLANO
-- Valores -1 significam ilimitado.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS plano_limites (
  id INT AUTO_INCREMENT PRIMARY KEY,
  plano_id INT NOT NULL,
  recurso VARCHAR(60) NOT NULL,
  limite INT NOT NULL DEFAULT 0,
  UNIQUE KEY uq_plano_recurso (plano_id, recurso),
  CONSTRAINT fk_limite_plano FOREIGN KEY (plano_id) REFERENCES planos(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- RECURSOS / FEATURES POR PLANO
-- Permite bloquear funcionalidades inteiras além dos limites numéricos.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS plano_recursos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  plano_id INT NOT NULL,
  recurso VARCHAR(80) NOT NULL,
  habilitado BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE KEY uq_plano_feature (plano_id, recurso),
  CONSTRAINT fk_recurso_plano FOREIGN KEY (plano_id) REFERENCES planos(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- ASSINATURAS
-- Estrutura preparada para Stripe/outro gateway futuramente.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS assinaturas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  conta_id INT NOT NULL,
  plano_id INT NOT NULL,
  provedor VARCHAR(40) NULL,
  provedor_customer_id VARCHAR(150) NULL,
  provedor_subscription_id VARCHAR(150) NULL,
  status ENUM('trial', 'ativa', 'past_due', 'cancelada', 'expirada') NOT NULL DEFAULT 'trial',
  inicio_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fim_em DATETIME NULL,
  cancelada_em DATETIME NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_assinaturas_conta_status (conta_id, status),
  INDEX idx_assinaturas_provedor (provedor, provedor_subscription_id),
  CONSTRAINT fk_assinatura_conta FOREIGN KEY (conta_id) REFERENCES contas(id) ON DELETE CASCADE,
  CONSTRAINT fk_assinatura_plano FOREIGN KEY (plano_id) REFERENCES planos(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- CATÁLOGO INICIAL DE PLANOS
-- ---------------------------------------------------------------------
INSERT INTO planos (codigo, nome, descricao, preco_mensal, moeda, ativo, ordem)
SELECT 'individual', 'Individual', 'Para quem usa o sistema sozinho.', 9.90, 'BRL', TRUE, 1
WHERE NOT EXISTS (SELECT 1 FROM planos WHERE codigo = 'individual');

INSERT INTO planos (codigo, nome, descricao, preco_mensal, moeda, ativo, ordem)
SELECT 'profissional', 'Profissional', 'Para pequenas equipes e operações.', 29.90, 'BRL', TRUE, 2
WHERE NOT EXISTS (SELECT 1 FROM planos WHERE codigo = 'profissional');

INSERT INTO planos (codigo, nome, descricao, preco_mensal, moeda, ativo, ordem)
SELECT 'empresa', 'Empresa', 'Para transportadoras e equipes maiores.', 59.90, 'BRL', TRUE, 3
WHERE NOT EXISTS (SELECT 1 FROM planos WHERE codigo = 'empresa');

-- ---------------------------------------------------------------------
-- LIMITES INICIAIS
-- -1 = ilimitado
-- ---------------------------------------------------------------------
INSERT INTO plano_limites (plano_id, recurso, limite)
SELECT p.id, x.recurso, x.limite
FROM planos p
JOIN (
  SELECT 'individual' codigo, 'motoristas' recurso, 1 limite UNION ALL
  SELECT 'individual', 'caminhoes', 1 UNION ALL
  SELECT 'individual', 'reboques', 1 UNION ALL
  SELECT 'profissional', 'motoristas', 5 UNION ALL
  SELECT 'profissional', 'caminhoes', 10 UNION ALL
  SELECT 'profissional', 'reboques', 10 UNION ALL
  SELECT 'empresa', 'motoristas', 15 UNION ALL
  SELECT 'empresa', 'caminhoes', 30 UNION ALL
  SELECT 'empresa', 'reboques', 30
) x ON x.codigo = p.codigo
WHERE NOT EXISTS (
  SELECT 1 FROM plano_limites pl
  WHERE pl.plano_id = p.id AND pl.recurso = x.recurso
);

-- ---------------------------------------------------------------------
-- RECURSOS INICIAIS
-- ---------------------------------------------------------------------
INSERT INTO plano_recursos (plano_id, recurso, habilitado)
SELECT p.id, x.recurso, x.habilitado
FROM planos p
JOIN (
  SELECT 'individual' codigo, 'dashboard' recurso, TRUE habilitado UNION ALL
  SELECT 'individual', 'viagens', TRUE UNION ALL
  SELECT 'individual', 'abastecimentos', TRUE UNION ALL
  SELECT 'individual', 'despesas', TRUE UNION ALL
  SELECT 'individual', 'notas_fiscais', TRUE UNION ALL
  SELECT 'individual', 'ranking', TRUE UNION ALL
  SELECT 'individual', 'telemetria', TRUE UNION ALL
  SELECT 'profissional', 'dashboard', TRUE UNION ALL
  SELECT 'profissional', 'viagens', TRUE UNION ALL
  SELECT 'profissional', 'abastecimentos', TRUE UNION ALL
  SELECT 'profissional', 'despesas', TRUE UNION ALL
  SELECT 'profissional', 'notas_fiscais', TRUE UNION ALL
  SELECT 'profissional', 'financeiro', TRUE UNION ALL
  SELECT 'profissional', 'manutencoes', TRUE UNION ALL
  SELECT 'profissional', 'relatorios', TRUE UNION ALL
  SELECT 'profissional', 'ranking', TRUE UNION ALL
  SELECT 'profissional', 'telemetria', TRUE UNION ALL
  SELECT 'empresa', 'dashboard', TRUE UNION ALL
  SELECT 'empresa', 'viagens', TRUE UNION ALL
  SELECT 'empresa', 'abastecimentos', TRUE UNION ALL
  SELECT 'empresa', 'despesas', TRUE UNION ALL
  SELECT 'empresa', 'notas_fiscais', TRUE UNION ALL
  SELECT 'empresa', 'financeiro', TRUE UNION ALL
  SELECT 'empresa', 'manutencoes', TRUE UNION ALL
  SELECT 'empresa', 'relatorios', TRUE UNION ALL
  SELECT 'empresa', 'ranking', TRUE UNION ALL
  SELECT 'empresa', 'telemetria', TRUE UNION ALL
  SELECT 'empresa', 'central_operacoes', TRUE
) x ON x.codigo = p.codigo
WHERE NOT EXISTS (
  SELECT 1 FROM plano_recursos pr
  WHERE pr.plano_id = p.id AND pr.recurso = x.recurso
);
