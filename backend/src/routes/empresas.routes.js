// =====================================================================
// FELIPINHO LAUNCHER - Rotas: Empresas Virtuais
// =====================================================================

const express = require('express');
const router = express.Router();
const EmpresaController = require('../controllers/EmpresaController');
const { exigirAutenticacao, exigirAdmin } = require('../middlewares/autenticacao');

// Vitrine pública — não exige login.
router.get('/', EmpresaController.listar);
router.get('/:slug', EmpresaController.buscarPorSlug);

// Administração — preparado para o painel de gestão das empresas.
router.post('/', exigirAutenticacao, exigirAdmin, EmpresaController.criar);
router.put('/:id', exigirAutenticacao, exigirAdmin, EmpresaController.atualizar);

module.exports = router;
