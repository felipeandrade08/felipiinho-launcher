// =====================================================================
// FELIPINHO LAUNCHER - Model: Motoristas
// =====================================================================

const { pool } = require('../config/database');

const MotoristaModel = {
  async listarTodos(filtros = {}) {
    let sql = 'SELECT * FROM motoristas WHERE conta_id = ?';
    const params = [filtros.contaId];
    if (filtros.status) { sql += ' AND status = ?'; params.push(filtros.status); }
    if (filtros.busca) { sql += ' AND (nome LIKE ? OR apelido LIKE ?)'; params.push(`%${filtros.busca}%`, `%${filtros.busca}%`); }
    sql += ' ORDER BY nome ASC';
    const [linhas] = await pool.query(sql, params);
    return linhas;
  },

  async buscarPorId(id, contaId) {
    const [linhas] = await pool.query('SELECT * FROM motoristas WHERE id = ? AND conta_id = ?', [id, contaId]);
    return linhas[0] || null;
  },

  async criar(dados, contaId) {
    const { nome, apelido, cnh, telefone, email, steam_id, data_admissao, status, foto_url, observacoes } = dados;
    const [resultado] = await pool.query(
      `INSERT INTO motoristas (conta_id, nome, apelido, cnh, telefone, email, steam_id, data_admissao, status, foto_url, observacoes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [contaId, nome, apelido || null, cnh || null, telefone || null, email || null, steam_id || null, data_admissao || null, status || 'ativo', foto_url || null, observacoes || null]
    );
    return this.buscarPorId(resultado.insertId, contaId);
  },

  async atualizar(id, dados, contaId) {
    const { nome, apelido, cnh, telefone, email, steam_id, data_admissao, status, foto_url, observacoes } = dados;
    await pool.query(
      `UPDATE motoristas SET nome=?, apelido=?, cnh=?, telefone=?, email=?, steam_id=?, data_admissao=?, status=?, foto_url=?, observacoes=? WHERE id=? AND conta_id=?`,
      [nome, apelido || null, cnh || null, telefone || null, email || null, steam_id || null, data_admissao || null, status, foto_url || null, observacoes || null, id, contaId]
    );
    return this.buscarPorId(id, contaId);
  },

  async excluir(id, contaId) {
    const [resultado] = await pool.query('DELETE FROM motoristas WHERE id = ? AND conta_id = ?', [id, contaId]);
    return resultado.affectedRows > 0;
  },

  async ranking(limite = 20, contaId) {
    const RankingModel = require('./RankingModel');
    return RankingModel.listarRanking(limite, contaId);
  },

  async atualizarEstatisticas(id, contaId) {
    await pool.query(`UPDATE motoristas m SET total_viagens=(SELECT COUNT(*) FROM viagens WHERE motorista_id=m.id AND status='concluida'), total_km=(SELECT COALESCE(SUM(distancia_km),0) FROM viagens WHERE motorista_id=m.id AND status='concluida'), total_faturado=(SELECT COALESCE(SUM(valor_frete),0) FROM viagens WHERE motorista_id=m.id AND status='concluida') WHERE m.id=? AND m.conta_id=?`, [id, contaId]);
    return this.buscarPorId(id, contaId);
  },

  async contarPorStatus(contaId) {
    const [linhas] = await pool.query('SELECT status, COUNT(*) AS total FROM motoristas WHERE conta_id = ? GROUP BY status', [contaId]);
    return linhas;
  },

  async atualizarFoto(id, foto_url, contaId) {
    await pool.query('UPDATE motoristas SET foto_url = ? WHERE id = ? AND conta_id = ?', [foto_url, id, contaId]);
    return this.buscarPorId(id, contaId);
  }
};

module.exports = MotoristaModel;
