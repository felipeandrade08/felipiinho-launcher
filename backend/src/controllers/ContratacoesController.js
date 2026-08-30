// =====================================================================
// FELIPINHO LAUNCHER - Contratação de Motoristas por Empresas
// =====================================================================

const { pool } = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { sucesso, criado, naoEncontrado, requisicaoInvalida, erro } = require('../utils/respostaPadrao');

async function empresaDoUsuario(usuarioId) {
  const [rows] = await pool.query(`
    SELECT e.*
    FROM empresas e
    JOIN conta_membros cm ON cm.conta_id = e.conta_id
    WHERE cm.usuario_id = ? AND cm.status = 'ativo'
      AND cm.papel IN ('proprietario','admin','gestor')
      AND e.status = 'ativa'
    LIMIT 1
  `, [usuarioId]);
  return rows[0] || null;
}

const ContratacoesController = {
  empresasDisponiveis: asyncHandler(async (req, res) => {
    const [rows] = await pool.query(`
      SELECT e.id,e.nome,e.slug,e.descricao,e.logo_url,e.capa_url,e.localizacao,
             e.motoristas,e.pontuacao_ranking,
             EXISTS(SELECT 1 FROM solicitacoes_motoristas s
                    WHERE s.empresa_id=e.id AND s.usuario_id=? AND s.status='pendente') AS solicitacao_pendente
      FROM empresas e
      WHERE e.status='ativa'
      ORDER BY e.destaque DESC,e.pontuacao_ranking DESC,e.nome ASC
    `, [req.usuario.id]);
    return sucesso(res, rows);
  }),

  solicitarEntrada: asyncHandler(async (req, res) => {
    const empresaId = Number(req.params.empresaId);
    if (!empresaId) return requisicaoInvalida(res, 'Empresa inválida.');

    const empresa = await pool.query('SELECT id FROM empresas WHERE id=? AND status=\'ativa\' LIMIT 1', [empresaId]);
    if (!empresa[0][0]) return naoEncontrado(res, 'Empresa não encontrada.');

    const [existentes] = await pool.query(
      'SELECT id,status FROM solicitacoes_motoristas WHERE empresa_id=? AND usuario_id=? LIMIT 1',
      [empresaId, req.usuario.id]
    );

    if (existentes[0]) {
      if (existentes[0].status === 'pendente') return erro(res, 'Você já possui uma solicitação aguardando análise nesta empresa.', 409);
      await pool.query(
        `UPDATE solicitacoes_motoristas
         SET status='pendente', mensagem=?, motivo_recusa=NULL, analisado_por=NULL, analisado_em=NULL
         WHERE id=?`,
        [String(req.body.mensagem || '').trim().slice(0,1000) || null, existentes[0].id]
      );
      return sucesso(res, { id: existentes[0].id, status: 'pendente' }, 'Nova solicitação enviada com sucesso.');
    }

    const [r] = await pool.query(
      'INSERT INTO solicitacoes_motoristas(empresa_id,usuario_id,mensagem) VALUES(?,?,?)',
      [empresaId, req.usuario.id, String(req.body.mensagem || '').trim().slice(0,1000) || null]
    );
    return criado(res, { id:r.insertId, status:'pendente' }, 'Solicitação enviada para a empresa.');
  }),

  minhasSolicitacoes: asyncHandler(async (req, res) => {
    const [rows] = await pool.query(`
      SELECT s.*,e.nome AS empresa_nome,e.slug AS empresa_slug,e.logo_url
      FROM solicitacoes_motoristas s
      JOIN empresas e ON e.id=s.empresa_id
      WHERE s.usuario_id=?
      ORDER BY s.atualizado_em DESC
    `, [req.usuario.id]);
    return sucesso(res, rows);
  }),

  listarDaEmpresa: asyncHandler(async (req, res) => {
    const empresa = await empresaDoUsuario(req.usuario.id);
    if (!empresa) return erro(res, 'Você não possui permissão de gestão de uma empresa.', 403);

    const status = req.query.status || 'pendente';
    const [rows] = await pool.query(`
      SELECT s.*,u.nome,u.email,u.tipo,u.status AS usuario_status,u.ultimo_login
      FROM solicitacoes_motoristas s
      JOIN usuarios u ON u.id=s.usuario_id
      WHERE s.empresa_id=? AND s.status=?
      ORDER BY s.criado_em ASC
    `, [empresa.id,status]);
    return sucesso(res, { empresa, solicitacoes: rows });
  }),

  aprovar: asyncHandler(async (req, res) => {
    const empresa = await empresaDoUsuario(req.usuario.id);
    if (!empresa) return erro(res, 'Você não possui permissão para contratar motoristas nesta empresa.', 403);

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [[s]] = await conn.query(
        `SELECT * FROM solicitacoes_motoristas WHERE id=? AND empresa_id=? AND status='pendente' FOR UPDATE`,
        [req.params.id, empresa.id]
      );
      if (!s) { await conn.rollback(); return naoEncontrado(res, 'Solicitação não encontrada ou já analisada.'); }

      const [[jaMembro]] = await conn.query(
        `SELECT id FROM conta_membros WHERE conta_id=? AND usuario_id=? AND status='ativo' LIMIT 1`,
        [empresa.conta_id,s.usuario_id]
      );
      if (!jaMembro) {
        await conn.query(
          `INSERT INTO conta_membros(conta_id,usuario_id,papel,status)
           VALUES(?,?,'motorista','ativo')`,
          [empresa.conta_id,s.usuario_id]
        );
      }

      await conn.query(
        `UPDATE solicitacoes_motoristas
         SET status='aprovada', analisado_por=?, analisado_em=NOW(), motivo_recusa=NULL
         WHERE id=?`,
        [req.usuario.id,s.id]
      );

      await conn.query(
        `UPDATE empresas
         SET motoristas=(SELECT COUNT(*) FROM conta_membros WHERE conta_id=? AND status='ativo' AND papel='motorista')
         WHERE id=?`,
        [empresa.conta_id,empresa.id]
      );

      await conn.commit();
      return sucesso(res, null, 'Motorista aprovado e contratado com sucesso.');
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally { conn.release(); }
  }),

  recusar: asyncHandler(async (req, res) => {
    const empresa = await empresaDoUsuario(req.usuario.id);
    if (!empresa) return erro(res, 'Você não possui permissão para analisar solicitações desta empresa.', 403);
    const motivo = String(req.body.motivo || '').trim().slice(0,500) || null;
    const [r] = await pool.query(
      `UPDATE solicitacoes_motoristas
       SET status='recusada',motivo_recusa=?,analisado_por=?,analisado_em=NOW()
       WHERE id=? AND empresa_id=? AND status='pendente'`,
      [motivo,req.usuario.id,req.params.id,empresa.id]
    );
    if (!r.affectedRows) return naoEncontrado(res, 'Solicitação não encontrada ou já analisada.');
    return sucesso(res, null, 'Solicitação recusada.');
  })
};

module.exports = ContratacoesController;
