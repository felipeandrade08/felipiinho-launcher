// =====================================================================
// FELIPINHO LAUNCHER - Model: Empresas Virtuais
// =====================================================================

const { pool } = require('../config/database');

const EmpresaModel = {
  async listar(filtros = {}) {
    let sql = `
      SELECT
        e.*,
        COALESCE(e.motoristas, 0) AS total_motoristas,
        COALESCE(e.caminhoes, 0) AS total_caminhoes
      FROM empresas e
      WHERE e.status = 'ativa'
    `;
    const params = [];

    if (filtros.busca) {
      sql += ' AND (e.nome LIKE ? OR e.localizacao LIKE ?)';
      const busca = `%${filtros.busca}%`;
      params.push(busca, busca);
    }

    if (filtros.destaque === 'true') sql += ' AND e.destaque = 1';

    sql += ' ORDER BY e.pontuacao_ranking DESC, e.nome ASC';

    const [linhas] = await pool.query(sql, params);
    return linhas;
  },

  async buscarPorSlug(slug) {
    const [linhas] = await pool.query(
      `SELECT * FROM empresas WHERE slug = ? AND status = 'ativa' LIMIT 1`,
      [slug]
    );
    return linhas[0] || null;
  },

  async criar(dados) {
    const {
      nome, slug, descricao, logo_url, capa_url, localizacao,
      caminhoes = 0, motoristas = 0, data_fundacao,
      discord, instagram, site, pontuacao_ranking = 0,
      posicao_ranking = null, destaque = false
    } = dados;

    const [res] = await pool.query(
      `INSERT INTO empresas
        (nome, slug, descricao, logo_url, capa_url, localizacao,
         caminhoes, motoristas, data_fundacao, discord, instagram, site,
         pontuacao_ranking, posicao_ranking, destaque)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nome, slug, descricao || null, logo_url || null, capa_url || null,
        localizacao || null, caminhoes, motoristas, data_fundacao || null,
        discord || null, instagram || null, site || null,
        pontuacao_ranking, posicao_ranking, destaque ? 1 : 0
      ]
    );

    return this.buscarPorId(res.insertId);
  },

  async buscarPorId(id) {
    const [linhas] = await pool.query('SELECT * FROM empresas WHERE id = ?', [id]);
    return linhas[0] || null;
  },

  async atualizar(id, dados) {
    const camposPermitidos = [
      'nome', 'slug', 'descricao', 'logo_url', 'capa_url', 'localizacao',
      'caminhoes', 'motoristas', 'data_fundacao', 'discord', 'instagram',
      'site', 'pontuacao_ranking', 'posicao_ranking', 'destaque', 'status'
    ];

    const alteracoes = [];
    const params = [];

    for (const campo of camposPermitidos) {
      if (dados[campo] !== undefined) {
        alteracoes.push(`${campo} = ?`);
        params.push(campo === 'destaque' ? (dados[campo] ? 1 : 0) : dados[campo]);
      }
    }

    if (!alteracoes.length) return this.buscarPorId(id);

    params.push(id);
    await pool.query(`UPDATE empresas SET ${alteracoes.join(', ')} WHERE id = ?`, params);
    return this.buscarPorId(id);
  }
};

module.exports = EmpresaModel;
