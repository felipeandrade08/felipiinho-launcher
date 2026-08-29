// =====================================================================
// FELIPINHO LAUNCHER - Model: Usuários (autenticação)
// =====================================================================

const { pool } = require('../config/database');

const UsuarioModel = {
  async buscarPorEmail(email) {
    const [linhas] = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);
    return linhas[0] || null;
  },

  async buscarPorId(id) {
    const [linhas] = await pool.query(
      `SELECT u.*, m.nome AS motorista_nome, m.apelido AS motorista_apelido,
              m.nivel AS motorista_nivel, m.total_km AS motorista_total_km,
              cm.conta_id, cm.papel AS conta_papel, cm.status AS conta_membro_status,
              c.nome AS conta_nome, c.tipo AS conta_tipo, c.status AS conta_status,
              a.id AS assinatura_id, a.status AS assinatura_status,
              a.inicio_em AS assinatura_inicio, a.fim_em AS assinatura_fim,
              a.trial_inicio, a.trial_fim, a.trial_usado,
              p.codigo AS plano_codigo, p.nome AS plano_nome, p.preco_mensal AS plano_preco
       FROM usuarios u
       LEFT JOIN motoristas m ON m.id = u.motorista_id
       LEFT JOIN conta_membros cm ON cm.usuario_id = u.id AND cm.status = 'ativo'
       LEFT JOIN contas c ON c.id = cm.conta_id
       LEFT JOIN assinaturas a ON a.conta_id = c.id
          AND a.id = (SELECT a2.id FROM assinaturas a2 WHERE a2.conta_id = c.id
                      ORDER BY a2.id DESC LIMIT 1)
       LEFT JOIN planos p ON p.id = a.plano_id
       WHERE u.id = ?`,
      [id]
    );
    return linhas[0] || null;
  },

  async listarPendentes() {
    const [linhas] = await pool.query(
      `SELECT u.id, u.nome, u.email, u.tipo, u.status, u.criado_em, m.nome AS motorista_nome
       FROM usuarios u LEFT JOIN motoristas m ON m.id = u.motorista_id
       WHERE u.status = 'pendente' ORDER BY u.criado_em ASC`
    );
    return linhas;
  },

  async listarTodos(filtros = {}) {
    let sql = `SELECT u.id, u.nome, u.email, u.tipo, u.status, u.ultimo_login, u.criado_em,
                      m.nome AS motorista_nome, m.nivel AS motorista_nivel, m.total_km AS motorista_total_km
               FROM usuarios u LEFT JOIN motoristas m ON m.id = u.motorista_id WHERE 1=1`;
    const params = [];
    if (filtros.status) { sql += ' AND u.status = ?'; params.push(filtros.status); }
    if (filtros.tipo) { sql += ' AND u.tipo = ?'; params.push(filtros.tipo); }
    sql += ' ORDER BY u.criado_em DESC';
    const [linhas] = await pool.query(sql, params);
    return linhas;
  },

  async criarComMotorista({ nome, email, senhaHash, telefone, cnh, nivel = 'novato', tipoConta = 'individual', planoCodigo = 'individual' }) {
    const conexao = await pool.getConnection();
    try {
      await conexao.beginTransaction();

      const [planos] = await conexao.query(
        'SELECT id FROM planos WHERE codigo = ? AND ativo = TRUE LIMIT 1', [planoCodigo]
      );
      if (!planos[0]) {
        const e = new Error('Plano selecionado não está disponível.');
        e.statusCode = 400;
        throw e;
      }

      const [resultadoMotorista] = await conexao.query(
        `INSERT INTO motoristas (nome, telefone, cnh, status, nivel) VALUES (?, ?, ?, 'ativo', ?)`,
        [nome, telefone || null, cnh || null, nivel]
      );
      const motoristaId = resultadoMotorista.insertId;

      const [resultadoUsuario] = await conexao.query(
        `INSERT INTO usuarios (nome, email, senha_hash, tipo, status, motorista_id)
         VALUES (?, ?, ?, 'motorista', 'pendente', ?)`,
        [nome, email, senhaHash, motoristaId]
      );
      const usuarioId = resultadoUsuario.insertId;

      const [resultadoConta] = await conexao.query(
        `INSERT INTO contas (nome, tipo, email_contato, telefone, status)
         VALUES (?, ?, ?, ?, 'ativa')`,
        [nome, tipoConta, email, telefone || null]
      );
      const contaId = resultadoConta.insertId;

      await conexao.query(
        `INSERT INTO conta_membros (conta_id, usuario_id, papel, status)
         VALUES (?, ?, 'proprietario', 'ativo')`,
        [contaId, usuarioId]
      );

      await conexao.query(
        `INSERT INTO assinaturas
         (conta_id, plano_id, status, inicio_em, fim_em, trial_inicio, trial_fim, trial_usado)
         VALUES (?, ?, 'trial', NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY),
                 NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY), FALSE)`,
        [contaId, planos[0].id]
      );

      await conexao.commit();
      return this.buscarPorId(usuarioId);
    } catch (erro) {
      await conexao.rollback();
      throw erro;
    } finally {
      conexao.release();
    }
  },

  async atualizarStatus(id, status) {
    await pool.query('UPDATE usuarios SET status = ? WHERE id = ?', [status, id]);
    if (status === 'dispensado' || status === 'bloqueado') {
      await pool.query(`UPDATE motoristas m JOIN usuarios u ON u.motorista_id = m.id
                        SET m.status = 'inativo' WHERE u.id = ?`, [id]);
    }
    return this.buscarPorId(id);
  },

  async atualizarCargo(id, tipo) { await pool.query('UPDATE usuarios SET tipo = ? WHERE id = ?', [tipo, id]); },
  async registrarLogin(id) { await pool.query('UPDATE usuarios SET ultimo_login = NOW() WHERE id = ?', [id]); },
  async excluir(id) {
    const [resultado] = await pool.query('DELETE FROM usuarios WHERE id = ?', [id]);
    return resultado.affectedRows > 0;
  },
  async verificarProgressaoNovatos() {
    await pool.query(`UPDATE motoristas SET nivel = 'motorista' WHERE nivel = 'novato' AND total_km >= 10000`);
  }
};

module.exports = UsuarioModel;
