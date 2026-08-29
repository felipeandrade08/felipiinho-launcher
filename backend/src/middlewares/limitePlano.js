// =====================================================================
// FELIPINHO LAUNCHER - Limites de recursos por plano
// =====================================================================

const PlanoService = require('../services/PlanoService');
const { pool } = require('../config/database');

function exigirLimite(recurso, tabela) {
  return async (req, res, next) => {
    try {
      const validacao = await PlanoService.assinaturaValida(req.usuario.id);
      if (!validacao.ativa || !validacao.contexto) {
        return res.status(402).json({ sucesso: false, codigo: 'ASSINATURA_NECESSARIA', mensagem: 'Seu período de teste ou assinatura terminou. Escolha um plano para continuar.' });
      }

      const { plano_id: planoId, conta_id: contaId } = validacao.contexto;
      const limite = await PlanoService.obterLimite(planoId, recurso);
      if (limite === null || Number(limite) === -1) return next();

      const [[resultado]] = await pool.query(`SELECT COUNT(*) AS total FROM ${tabela} WHERE conta_id = ?`, [contaId]);
      const total = Number(resultado.total || 0);

      if (total >= Number(limite)) {
        return res.status(403).json({ sucesso: false, codigo: 'LIMITE_PLANO_ATINGIDO', recurso, limite: Number(limite), total, mensagem: `Você atingiu o limite de ${limite} ${recurso} do seu plano. Faça upgrade para continuar.` });
      }

      req.plano = { ...validacao.contexto, limite: Number(limite) };
      next();
    } catch (e) {
      console.error('Erro ao verificar limite do plano:', e);
      return res.status(500).json({ sucesso: false, mensagem: 'Não foi possível verificar o limite do plano.' });
    }
  };
}

module.exports = { exigirLimite };
