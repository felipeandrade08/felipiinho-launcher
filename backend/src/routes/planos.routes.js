// =====================================================================
// FELIPINHO LAUNCHER - Rotas de Conta e Planos
// =====================================================================

const express = require('express');
const router = express.Router();
const PlanoController = require('../controllers/PlanoController');
const { exigirAutenticacao } = require('../middlewares/autenticacao');

// Retorna conta, plano, assinatura e situação do trial do usuário autenticado.
router.get('/meu-plano', exigirAutenticacao, PlanoController.meuPlano);

module.exports = router;
