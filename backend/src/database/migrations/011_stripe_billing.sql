-- Stripe Billing: idempotência e rastreamento de eventos.
CREATE TABLE IF NOT EXISTS stripe_eventos (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  stripe_event_id VARCHAR(255) NOT NULL,
  tipo VARCHAR(120) NOT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_stripe_evento (stripe_event_id),
  INDEX idx_stripe_eventos_tipo (tipo)
) ENGINE=InnoDB;

CREATE INDEX idx_assinaturas_stripe_subscription
ON assinaturas (provedor, provedor_subscription_id);