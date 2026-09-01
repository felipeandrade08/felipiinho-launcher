// =====================================================================
// FELIPINHO LAUNCHER - Rotas: Notas Fiscais
// =====================================================================

const express = require('express');
const router = express.Router();
const NotaFiscalController = require('../controllers/NotaFiscalController');
const { exigirAutenticacao, carregarConta } = require('../middlewares/autenticacao');

router.use(exigirAutenticacao);
router.use(carregarConta);

router.get('/', NotaFiscalController.listar);
router.get('/:id', NotaFiscalController.buscarPorId);
router.post('/', NotaFiscalController.criar);
router.put('/:id', NotaFiscalController.atualizar);
router.delete('/:id', NotaFiscalController.excluir);

module.exports = router;
