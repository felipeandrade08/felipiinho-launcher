// =====================================================================
// FELIPINHO LAUNCHER - Model: Reboques
// =====================================================================

const { pool } = require('../config/database');

const ReboqueModel = {
  async listarTodos(filtros = {}) {
    let sql = `SELECT r.*, c.placa AS caminhao_placa FROM reboques r LEFT JOIN caminhoes c ON c.id = r.caminhao_atual_id WHERE r.conta_id = ?`;
    const params = [filtros.contaId];
    if (filtros.status) { sql += ' AND r.status = ?'; params.push(filtros.status); }
    if (filtros.tipo) { sql += ' AND r.tipo = ?'; params.push(filtros.tipo); }
    sql += ' ORDER BY r.placa ASC';
    const [linhas] = await pool.query(sql, params); return linhas;
  },
  async buscarPorId(id, contaId) {
    const [linhas] = await pool.query(`SELECT r.*, c.placa AS caminhao_placa FROM reboques r LEFT JOIN caminhoes c ON c.id=r.caminhao_atual_id WHERE r.id=? AND r.conta_id=?`, [id, contaId]);
    return linhas[0] || null;
  },
  async criar(dados, contaId) {
    const { placa, tipo, capacidade_carga, status, caminhao_atual_id, valor_aquisicao, observacoes } = dados;
    const [resultado] = await pool.query(`INSERT INTO reboques (conta_id, placa, tipo, capacidade_carga, status, caminhao_atual_id, valor_aquisicao, observacoes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [contaId, placa, tipo || 'outro', capacidade_carga || 0, status || 'disponivel', caminhao_atual_id || null, valor_aquisicao || 0, observacoes || null]);
    return this.buscarPorId(resultado.insertId, contaId);
  },
  async atualizar(id, dados, contaId) {
    const { placa, tipo, capacidade_carga, status, caminhao_atual_id, valor_aquisicao, observacoes } = dados;
    await pool.query(`UPDATE reboques SET placa=?, tipo=?, capacidade_carga=?, status=?, caminhao_atual_id=?, valor_aquisicao=?, observacoes=? WHERE id=? AND conta_id=?`, [placa, tipo, capacidade_carga || 0, status, caminhao_atual_id || null, valor_aquisicao || 0, observacoes || null, id, contaId]);
    return this.buscarPorId(id, contaId);
  },
  async excluir(id, contaId) { const [resultado] = await pool.query('DELETE FROM reboques WHERE id=? AND conta_id=?', [id, contaId]); return resultado.affectedRows > 0; }
};

module.exports = ReboqueModel;
