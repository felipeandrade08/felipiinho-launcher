// =====================================================================
// FELIPINHO LAUNCHER - Serviço de Planos, Assinaturas e Trial
// =====================================================================

const { pool } = require('../config/database');

async function obterContextoConta(usuarioId) {
  const [linhas] = await pool.query(
    `SELECT c.id AS conta_id, c.tipo AS conta_tipo, c.status AS conta_status,
            a.id AS assinatura_id, a.status AS assinatura_status,
            a.inicio_em, a.fim_em, a.trial_inicio, a.trial_fim, a.trial_usado,
            p.id AS plano_id, p.codigo AS plano_codigo, p.nome AS plano_nome,
            p.preco_mensal
     FROM conta_membros cm
     INNER JOIN contas c ON c.id = cm.conta_id
     LEFT JOIN assinaturas a ON a.conta_id = c.id
       AND a.id = (SELECT a2.id FROM assinaturas a2 WHERE a2.conta_id = c.id ORDER BY a2.id DESC LIMIT 1)
     LEFT JOIN planos p ON p.id = a.plano_id
     WHERE cm.usuario_id = ? AND cm.status = 'ativo'
     LIMIT 1`,
    [usuarioId]
  );

  return linhas[0] || null;
}

function trialAtivo(contexto) {
  if (!contexto || contexto.assinatura_status !== 'trial' || !contexto.trial_fim) return false;
  return new Date(contexto.trial_fim).getTime() > Date.now();
}

function assinaturaPagaAtiva(contexto) {
  if (!contexto || contexto.assinatura_status !== 'ativa') return false;
  if (!contexto.fim_em) return true;
  return new Date(contexto.fim_em).getTime() > Date.now();
}

async function assinaturaValida(usuarioId) {
  const contexto = await obterContextoConta(usuarioId);
  if (!contexto || contexto.conta_status !== 'ativa') {
    return { ativa: false, motivo: 'conta_inativa', contexto };
  }

  if (trialAtivo(contexto)) {
    return { ativa: true, motivo: 'trial', contexto };
  }

  if (assinaturaPagaAtiva(contexto)) {
    return { ativa: true, motivo: 'assinatura', contexto };
  }

  return { ativa: false, motivo: 'assinatura_expirada', contexto };
}

async function obterLimite(planoId, recurso) {
  const [linhas] = await pool.query(
    `SELECT limite FROM plano_limites WHERE plano_id = ? AND recurso = ? LIMIT 1`,
    [planoId, recurso]
  );
  return linhas[0] ? linhas[0].limite : null;
}

async function temRecurso(planoId, recurso) {
  const [linhas] = await pool.query(
    `SELECT disponivel FROM plano_recursos WHERE plano_id = ? AND recurso = ? LIMIT 1`,
    [planoId, recurso]
  );
  return !!(linhas[0] && linhas[0].disponivel);
}

module.exports = {
  obterContextoConta,
  trialAtivo,
  assinaturaPagaAtiva,
  assinaturaValida,
  obterLimite,
  temRecurso
};
