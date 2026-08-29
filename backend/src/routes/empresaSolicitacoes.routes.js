// =====================================================================
// FELIPINHO LAUNCHER - Solicitações de cadastro de empresas
// =====================================================================
const express = require('express');
const router = express.Router();
const db = require('../database');
const { exigirAutenticacao } = require('../middlewares/autenticacao');

router.post('/', exigirAutenticacao, async (req, res) => {
  try {
    const usuarioId = req.usuario?.id || req.user?.id;
    if (!usuarioId) return res.status(401).json({ sucesso: false, mensagem: 'Usuário não autenticado.' });

    const {
      nome, localizacao, responsavel, email, discord, instagram, site,
      data_fundacao, descricao, logo_url, capa_url
    } = req.body || {};

    if (!nome || !responsavel || !email) {
      return res.status(400).json({ sucesso: false, mensagem: 'Nome, responsável e e-mail são obrigatórios.' });
    }

    const [existentes] = await db.query(
      `SELECT id FROM empresas WHERE LOWER(nome) = LOWER(?) LIMIT 1`,
      [nome]
    );
    if (existentes.length) {
      return res.status(409).json({ sucesso: false, mensagem: 'Já existe uma empresa com este nome.' });
    }

    const slug = String(nome)
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().trim().replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const [resultado] = await db.query(
      `INSERT INTO empresas
       (nome, slug, localizacao, responsavel, email, discord, instagram, site,
        data_fundacao, descricao, logo_url, capa_url, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pendente')`,
      [nome, slug, localizacao || null, responsavel, email, discord || null,
       instagram || null, site || null, data_fundacao || null, descricao || null,
       logo_url || null, capa_url || null]
    );

    return res.status(201).json({
      sucesso: true,
      mensagem: 'Cadastro da empresa enviado para análise.',
      dados: { id: resultado.insertId, status: 'pendente' }
    });
  } catch (erro) {
    console.error('[EMPRESA SOLICITAÇÃO]', erro);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro ao cadastrar empresa.' });
  }
});

module.exports = router;
