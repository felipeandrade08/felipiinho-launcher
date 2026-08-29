// =====================================================================
// FELIPINHO LAUNCHER - Contexto da conta do usuário
// =====================================================================

const PlanoService = require('../services/PlanoService');

async function contextoConta(req, res, next) {
  try {
    const resultado = await PlanoService.assinaturaValida(req.usuario.id);
    if (!resultado.contexto) {
      return res.status(403).json({ sucesso: false, codigo: 'CONTA_NAO_ENCONTRADA', mensagem: 'Usuário não possui uma conta associada.' });
    }

    req.conta = {
      id: resultado.contexto.conta_id,
      tipo: resultado.contexto.conta_tipo,
      status: resultado.contexto.conta_status,
      plano_id: resultado.contexto.plano_id,
      plano_codigo: resultado.contexto.plano_codigo,
      assinatura_id: resultado.contexto.assinatura_id,
      assinatura_status: resultado.contexto.assinatura_status,
      acesso: resultado.ativa,
      motivo: resultado.motivo
    };

    next();
  } catch (e) {
    console.error('Erro ao carregar contexto da conta:', e);
    return res.status(500).json({ sucesso: false, mensagem: 'Não foi possível carregar a conta do usuário.' });
  }
}

module.exports = { contextoConta };
