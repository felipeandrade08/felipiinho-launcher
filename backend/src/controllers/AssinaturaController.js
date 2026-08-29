const { pool } = require('../config/database');
const StripeService = require('../services/StripeService');

async function dadosConta(usuarioId) {
  const [rows] = await pool.query(
    `SELECT c.id conta_id, c.nome conta_nome, u.nome usuario_nome, u.email usuario_email,
            a.id assinatura_id, a.provedor_customer_id, p.id plano_id, p.codigo plano_codigo, p.nome plano_nome
       FROM conta_membros cm
       JOIN contas c ON c.id = cm.conta_id
       JOIN usuarios u ON u.id = cm.usuario_id
       LEFT JOIN assinaturas a ON a.id = (
         SELECT a2.id FROM assinaturas a2 WHERE a2.conta_id = c.id ORDER BY a2.id DESC LIMIT 1
       )
       LEFT JOIN planos p ON p.id = a.plano_id
      WHERE cm.usuario_id = ? AND cm.status = 'ativo' LIMIT 1`,
    [usuarioId]
  );
  return rows[0] || null;
}

async function criarCheckout(req, res) {
  try {
    const planoCodigo = String(req.body?.planoCodigo || '').toLowerCase();
    const conta = await dadosConta(req.usuario.id);
    if (!conta) return res.status(404).json({ sucesso:false, mensagem:'Conta não encontrada.' });

    const [planos] = await pool.query(
      'SELECT id, codigo, nome FROM planos WHERE codigo = ? AND ativo = TRUE LIMIT 1',
      [planoCodigo]
    );
    const plano = planos[0];
    if (!plano) return res.status(400).json({ sucesso:false, mensagem:'Plano inválido.' });

    const assinatura = {
      provedor_customer_id: conta.provedor_customer_id
    };

    const { session, customerId } = await StripeService.criarCheckout({
      contaId: conta.conta_id,
      usuario: { nome: conta.usuario_nome, email: conta.usuario_email },
      assinatura,
      plano
    });

    // Guarda o customer antes do webhook para facilitar reconciliação.
    await pool.query(
      `UPDATE assinaturas SET provedor='stripe', provedor_customer_id=?, atualizado_em=NOW()
       WHERE conta_id=? ORDER BY id DESC LIMIT 1`,
      [customerId, conta.conta_id]
    );

    return res.json({ sucesso:true, dados:{ checkoutUrl: session.url, sessionId: session.id } });
  } catch (error) {
    console.error('Erro ao criar checkout:', error);
    return res.status(500).json({ sucesso:false, mensagem:error.message || 'Não foi possível iniciar o pagamento.' });
  }
}

async function portal(req, res) {
  try {
    const conta = await dadosConta(req.usuario.id);
    if (!conta?.provedor_customer_id) {
      return res.status(400).json({ sucesso:false, mensagem:'Ainda não existe uma assinatura Stripe para esta conta.' });
    }
    const session = await StripeService.criarPortal(conta.provedor_customer_id);
    return res.json({ sucesso:true, dados:{ url: session.url } });
  } catch (error) {
    console.error('Erro ao abrir portal:', error);
    return res.status(500).json({ sucesso:false, mensagem:'Não foi possível abrir o portal de cobrança.' });
  }
}

module.exports = { criarCheckout, portal };