// =====================================================================
// FELIPINHO LAUNCHER - Middleware de Autenticação e Autorização
// =====================================================================

const { verificarToken } = require('../utils/token');
const { erro } = require('../utils/respostaPadrao');
const PlanoService = require('../services/PlanoService');

function exigirAutenticacao(req, res, next) {
  const cabecalho = req.headers.authorization || '';
  const token = cabecalho.startsWith('Bearer ')
    ? cabecalho.slice(7)
    : (req.query.token || null);

  if (!token) {
    return erro(res, 'Você precisa estar autenticado para acessar este recurso.', 401);
  }

  try {
    req.usuario = verificarToken(token);
    return next();
  } catch (e) {
    return erro(res, 'Sessão inválida ou expirada. Faça login novamente.', 401);
  }
}

/**
 * Carrega o contexto da conta do usuário autenticado.
 * A conta é resolvida no banco por conta_membros, evitando depender
 * de conta_id dentro do JWT e mantendo as permissões atualizadas.
 */
async function carregarConta(req, res, next) {
  try {
    if (!req.usuario?.id) {
      return erro(res, 'Usuário autenticado inválido.', 401);
    }

    const contexto = await PlanoService.obterContextoConta(req.usuario.id);

    if (!contexto || contexto.conta_status !== 'ativa') {
      return erro(res, 'Nenhuma conta ativa foi encontrada para este usuário.', 403);
    }

    req.conta = {
      id: Number(contexto.conta_id),
      tipo: contexto.conta_tipo,
      status: contexto.conta_status,
      papel: contexto.papel || null
    };

    req.contextoConta = contexto;
    return next();
  } catch (e) {
    console.error('Erro ao carregar contexto da conta:', e);
    return erro(res, 'Não foi possível carregar o contexto da sua conta.', 500);
  }
}

/** Admin = acesso total */
function exigirAdmin(req, res, next) {
  if (!req.usuario || req.usuario.tipo !== 'admin') {
    return erro(res, 'Apenas administradores podem realizar esta ação.', 403);
  }
  return next();
}

/** Admin OU Diretoria — mesmos poderes que admin no sistema */
function exigirDiretoriaOuAdmin(req, res, next) {
  const tipo = req.usuario?.tipo;
  if (!tipo || !['admin', 'diretoria'].includes(tipo)) {
    return erro(res, 'Acesso restrito à Diretoria ou Administradores.', 403);
  }
  return next();
}

/** Admin, Diretoria OU RH */
function exigirAdminOuRH(req, res, next) {
  const tipo = req.usuario?.tipo;
  if (!tipo || !['admin', 'diretoria', 'rh'].includes(tipo)) {
    return erro(res, 'Acesso restrito à equipe administrativa (Admin, Diretoria ou RH).', 403);
  }
  return next();
}

module.exports = {
  exigirAutenticacao,
  carregarConta,
  exigirAdmin,
  exigirDiretoriaOuAdmin,
  exigirAdminOuRH
};
