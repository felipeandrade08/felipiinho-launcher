// =====================================================================
// FELIPINHO LAUNCHER - Rotas: Caminhões
// =====================================================================

const express = require('express');
const router = express.Router();
const CaminhaoController = require('../controllers/CaminhaoController');
const { exigirAutenticacao, carregarConta } = require('../middlewares/autenticacao');
const { exigirLimite } = require('../middlewares/limitePlano');

router.use(exigirAutenticacao);
router.use(carregarConta);

router.get('/', CaminhaoController.listar);
router.get('/alertas-consumo', CaminhaoController.alertasConsumo);
router.get('/:id', CaminhaoController.buscarPorId);
router.post('/', exigirLimite('caminhoes', 'caminhoes'), CaminhaoController.criar);
router.put('/:id', CaminhaoController.atualizar);
router.delete('/:id', CaminhaoController.excluir);

module.exports = router;
