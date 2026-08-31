// =====================================================================
// FELIPINHO LAUNCHER - Rotas: Abastecimentos
// =====================================================================

const express = require('express');
const router = express.Router();
const AbastecimentoController = require('../controllers/AbastecimentoController');
const { exigirAutenticacao } = require('../middlewares/autenticacao');

// Todas as operações de abastecimento dependem de req.usuario.
router.use(exigirAutenticacao);

router.get('/total-por-mes',        AbastecimentoController.totalPorMes);
router.get('/postos-credenciados',  AbastecimentoController.listarPostosCredenciados);
router.get('/pendentes',            AbastecimentoController.listarPendentes);
router.get('/',                     AbastecimentoController.listar);
router.get('/:id',                  AbastecimentoController.buscarPorId);
router.post('/',                    AbastecimentoController.criar);
router.put('/:id',                  AbastecimentoController.atualizar);
router.delete('/:id',               AbastecimentoController.excluir);

// Motorista preenche posto + cidade de um abastecimento pendente
router.patch('/:id/resolver-pendente', AbastecimentoController.resolverPendente);

// Admin regulariza (penaliza ou libera)
router.patch('/:id/regularizar',       AbastecimentoController.regularizarPendente);

module.exports = router;
