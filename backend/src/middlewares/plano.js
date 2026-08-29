// =====================================================================
// FELIPINHO LAUNCHER - Controle de acesso por plano
// =====================================================================

const { assinaturaValida, temRecurso } = require('../services/PlanoService');
const { erro } = require('../utils/respostaPadrao');

/**
 * Verifica se a conta do usuário possui uma assinatura válida.
 * Não é aplicado globalmente ainda para preservar compatibilidade com
 * usuários/instalações antigas durante a migração para o sistema de planos.
 */
async function exigirAssinatura(req, res, next) {
  try {
    const resultado = await assinaturaValida(req.usuario.id);

    if (!resultado.ativa) {
      return erro(res, 'Seu período de teste terminou. Escolha um plano para continuar.', 402);
    }

    req.planoContexto = resultado.contexto;
    req.planoMotivo = resultado.motivo;
    return next();
  } catch (e) {
    console.error('[Plano] Erro ao validar assinatura:', e);
    return erro(res, 'Não foi possível validar o acesso da sua conta.', 503);
  }
}

/** Verifica se o plano possui um recurso específico. */
function exigirRecurso(recurso) {
  return async (req, res, next) => {
    try {
      const contexto = req.planoContexto || (await assinaturaValida(req.usuario.id)).contexto;

      if (!contexto?.plano_id) {
        return erro(res, 'Sua conta ainda não possui um plano configurado.', 403);
      }

      const disponivel = await temRecurso(contexto.plano_id, recurso);
      if (!disponivel) {
        return erro(res, `O recurso '${recurso}' não está disponível no seu plano.`, 403);
      }

      req.planoContexto = contexto;
      return next();
    } catch (e) {
      console.error('[Plano] Erro ao validar recurso:', e);
      return erro(res, 'Não foi possível validar o recurso do seu plano.', 503);
    }
  };
}

module.exports = { exigirAssinatura, exigirRecurso };
