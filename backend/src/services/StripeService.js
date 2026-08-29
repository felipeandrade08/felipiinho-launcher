const Stripe = require('stripe');

function stripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY não configurada.');
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

function obterUrlFrontend() {
  return (process.env.FRONTEND_URL || '').split(',')[0].trim().replace(/\/$/, '');
}

const PRECOS = {
  individual: process.env.STRIPE_PRICE_INDIVIDUAL,
  profissional: process.env.STRIPE_PRICE_PROFISSIONAL,
  empresa: process.env.STRIPE_PRICE_EMPRESA
};

function obterPriceId(codigo) {
  const priceId = PRECOS[codigo];
  if (!priceId) throw new Error(`Preço Stripe não configurado para o plano ${codigo}.`);
  return priceId;
}

async function obterOuCriarCustomer({ email, nome, contaId, customerId }) {
  const stripe = stripeClient();
  if (customerId) {
    try { return await stripe.customers.retrieve(customerId); } catch (_) {}
  }
  return stripe.customers.create({
    email,
    name: nome,
    metadata: { conta_id: String(contaId) }
  });
}

async function criarCheckout({ contaId, usuario, assinatura, plano }) {
  const stripe = stripeClient();
  const customer = await obterOuCriarCustomer({
    email: usuario.email,
    nome: usuario.nome,
    contaId,
    customerId: assinatura.provedor_customer_id
  });

  const baseUrl = obterUrlFrontend();
  if (!baseUrl) throw new Error('FRONTEND_URL não configurada.');

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customer.id,
    line_items: [{ price: obterPriceId(plano.codigo), quantity: 1 }],
    success_url: `${baseUrl}/planos.html?checkout=sucesso&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/planos.html?checkout=cancelado`,
    metadata: { conta_id: String(contaId), plano_codigo: plano.codigo },
    subscription_data: {
      metadata: { conta_id: String(contaId), plano_codigo: plano.codigo }
    },
    allow_promotion_codes: true
  });

  return { session, customerId: customer.id };
}

async function criarPortal(customerId) {
  const stripe = stripeClient();
  const baseUrl = obterUrlFrontend();
  if (!baseUrl) throw new Error('FRONTEND_URL não configurada.');
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${baseUrl}/planos.html`
  });
}

module.exports = { stripeClient, criarCheckout, criarPortal };