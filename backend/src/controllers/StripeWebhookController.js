const { pool } = require('../config/database');
const { stripeClient } = require('../services/StripeService');

const MAPA_STATUS = {
  trialing: 'trial',
  active: 'ativa',
  past_due: 'past_due',
  canceled: 'cancelada',
  unpaid: 'expirada',
  incomplete_expired: 'expirada'
};

async function eventoJaProcessado(id) {
  const [rows] = await pool.query('SELECT id FROM stripe_eventos WHERE stripe_event_id=? LIMIT 1', [id]);
  return rows.length > 0;
}

async function marcarEvento(id, tipo) {
  await pool.query(
    'INSERT INTO stripe_eventos (stripe_event_id, tipo) VALUES (?, ?)',
    [id, tipo]
  );
}

async function sincronizarAssinatura(subscription) {
  const contaId = Number(subscription.metadata?.conta_id);
  if (!contaId) throw new Error('Webhook sem conta_id na assinatura.');

  const status = MAPA_STATUS[subscription.status] || 'expirada';
  const planoCodigo = subscription.metadata?.plano_codigo;
  let planoId = null;

  if (planoCodigo) {
    const [planos] = await pool.query('SELECT id FROM planos WHERE codigo=? LIMIT 1', [planoCodigo]);
    planoId = planos[0]?.id || null;
  }

  const inicio = subscription.current_period_start ? new Date(subscription.current_period_start * 1000) : null;
  const fim = subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : null;
  const trialInicio = subscription.trial_start ? new Date(subscription.trial_start * 1000) : null;
  const trialFim = subscription.trial_end ? new Date(subscription.trial_end * 1000) : null;

  const [existentes] = await pool.query(
    'SELECT id FROM assinaturas WHERE provedor=? AND provedor_subscription_id=? LIMIT 1',
    ['stripe', subscription.id]
  );

  if (existentes.length) {
    await pool.query(
      `UPDATE assinaturas SET status=?, plano_id=COALESCE(?,plano_id), provedor_customer_id=?,
       inicio_em=COALESCE(?,inicio_em), fim_em=?, trial_inicio=COALESCE(?,trial_inicio),
       trial_fim=COALESCE(?,trial_fim), cancelada_em=? WHERE id=?`,
      [status, planoId, subscription.customer, inicio, fim, trialInicio, trialFim,
       subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null, existentes[0].id]
    );
  } else {
    if (!planoId) throw new Error('Plano não identificado para assinatura Stripe.');
    await pool.query(
      `INSERT INTO assinaturas
       (conta_id, plano_id, provedor, provedor_customer_id, provedor_subscription_id, status, inicio_em, fim_em, trial_inicio, trial_fim, trial_usado)
       VALUES (?, ?, 'stripe', ?, ?, ?, COALESCE(?,NOW()), ?, ?, ?, TRUE)`,
      [contaId, planoId, subscription.customer, subscription.id, status, inicio, fim, trialInicio, trialFim]
    );
  }
}

async function receber(req, res) {
  const assinatura = req.headers['stripe-signature'];
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(500).send('Webhook Stripe não configurado.');
  }

  let event;
  try {
    event = stripeClient().webhooks.constructEvent(req.body, assinatura, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    console.error('Assinatura de webhook inválida:', error.message);
    return res.status(400).send('Assinatura inválida.');
  }

  try {
    if (await eventoJaProcessado(event.id)) return res.json({ recebido:true, duplicado:true });

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        if (session.subscription) {
          const subscription = await stripeClient().subscriptions.retrieve(session.subscription);
          await sincronizarAssinatura(subscription);
        }
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await sincronizarAssinatura(event.data.object);
        break;
      default:
        break;
    }

    await marcarEvento(event.id, event.type);
    return res.json({ recebido:true });
  } catch (error) {
    console.error('Erro ao processar webhook Stripe:', error);
    return res.status(500).send('Erro interno no webhook.');
  }
}

module.exports = { receber };