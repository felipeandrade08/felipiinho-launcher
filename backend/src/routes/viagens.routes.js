// =====================================================================
// FELIPINHO LAUNCHER - Rotas: Viagens
// =====================================================================

const express = require('express');
const router = express.Router();
const ViagemController = require('../controllers/ViagemController');
const { exigirAutenticacao } = require('../middlewares/autenticacao');

// Todas as operações de viagens dependem de req.usuario.
router.use(exigirAutenticacao);

router.get('/mapa', ViagemController.mapaEntregas);
router.get('/', ViagemController.listar);
router.get('/:id', ViagemController.buscarPorId);
router.post('/', ViagemController.criar);
router.put('/:id', ViagemController.atualizar);
router.patch('/:id/status', ViagemController.atualizarStatus);
router.delete('/:id', ViagemController.excluir);

module.exports = router;
