// =====================================================================
// FELIPINHO LAUNCHER - Rotas: Caminhões
// =====================================================================

const express = require('express');
const router = express.Router();
const CaminhaoController = require('../controllers/CaminhaoController');
const { exigirLimite } = require('../middlewares/limitePlano');

router.get('/', CaminhaoController.listar);
router.get('/:id', CaminhaoController.buscarPorId);
router.post('/', exigirLimite('caminhoes', 'caminhoes'), CaminhaoController.criar);
router.put('/:id', CaminhaoController.atualizar);
router.delete('/:id', CaminhaoController.excluir);
router.get('/alertas-consumo', CaminhaoController.alertasConsumo);
module.exports = router;
