// =====================================================================
// FELIPINHO LAUNCHER - Controller de Conta e Planos
// =====================================================================

const PlanoService = require('../services/PlanoService');

async function meuPlano(req, res) {
  try {
    const resultado = await PlanoService.assinaturaValida(req.usuario.id);
    const contexto = resultado.contexto;

    if (!contexto) {
      return res.status(404).json({ sucesso: false, mensagem: 'Conta não encontrada.' });
    }

    let diasTrial = 0;
    if (contexto.trial_fim) {
      diasTrial = Math.max(0, Math.ceil((new Date(contexto.trial_fim).getTime() - Date.now()) / 86400000));
    }

    return res.json({
      sucesso: true,
      dados: {
        conta: {
          id: contexto.conta_id,
          tipo: contexto.conta_tipo,
          status: contexto.conta_status
        },
        plano: {
          id: contexto.plano_id,
          codigo: contexto.plano_codigo,
          nome: contexto.plano_nome,
          preco_mensal: contexto.preco_mensal
        },
        assinatura: {
          id: contexto.assinatura_id,
          status: contexto.assinatura_status,
          inicio_em: contexto.inicio_em,
          fim_em: contexto.fim_em
        },
        trial: {
          ativo: resultado.motivo === 'trial',
          usado: !!contexto.trial_usado,
          inicio: contexto.trial_inicio,
          fim: contexto.trial_fim,
          dias_restantes: diasTrial
        },
        acesso: resultado.ativa,
        motivo: resultado.motivo
      }
    });
  } catch (e) {
    console.error('Erro ao consultar plano:', e);
    return res.status(500).json({ sucesso: false, mensagem: 'Não foi possível consultar o plano da conta.' });
  }
}

module.exports = { meuPlano };
