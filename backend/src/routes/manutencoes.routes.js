// =====================================================================
// FELIPINHO LAUNCHER - Rotas: Manutenções
// =====================================================================

const express = require('express');
const router  = express.Router();
const C       = require('../controllers/ManutencaoController');
const { exigirAutenticacao, carregarConta } = require('../middlewares/autenticacao');

router.use(exigirAutenticacao);
router.use(carregarConta);

router.get('/total-por-mes', C.totalPorMes);
router.get('/pendentes', C.listarPendentes);
router.get('/', C.listar);
router.get('/:id', C.buscarPorId);
router.post('/', C.criar);
router.delete('/:id', C.excluir);
router.patch('/:id/resolver-pendente', C.resolverPendente);
router.patch('/:id/regularizar', C.regularizarPendente);

module.exports = router;
