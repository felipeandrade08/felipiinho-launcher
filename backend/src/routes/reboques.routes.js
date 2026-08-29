// =====================================================================
// FELIPINHO LAUNCHER - Rotas: Reboques
// =====================================================================

const express = require('express');
const router = express.Router();
const ReboqueController = require('../controllers/ReboqueController');
const { exigirLimite } = require('../middlewares/limitePlano');

router.get('/', ReboqueController.listar);
router.get('/:id', ReboqueController.buscarPorId);
router.post('/', exigirLimite('reboques', 'reboques'), ReboqueController.criar);
router.put('/:id', ReboqueController.atualizar);
router.delete('/:id', ReboqueController.excluir);
module.exports = router;
