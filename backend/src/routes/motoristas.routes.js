// =====================================================================
// FELIPINHO LAUNCHER - Rotas: Motoristas
// =====================================================================

const express = require('express');
const router = express.Router();
const MotoristaController = require('../controllers/MotoristaController');
const RankingController = require('../controllers/RankingController');
const { exigirAdmin } = require('../middlewares/autenticacao');
const { exigirLimite } = require('../middlewares/limitePlano');

router.get('/hall-da-fama', RankingController.hallDaFama);
router.get('/ranking', MotoristaController.ranking);
router.get('/ranking/:id/eventos', RankingController.historicoEventos);
router.get('/ranking/:id/evolucao', RankingController.evolucaoMotorista);
router.get('/ranking/evolucao-geral', RankingController.evolucaoGeral);
router.get('/ranking/:id/multas', RankingController.multasMotorista);
router.get('/:id', MotoristaController.buscarPorId);

router.delete('/ranking', exigirAdmin, RankingController.zerarRanking);
router.delete('/ranking/:id', exigirAdmin, RankingController.zerarRankingMotorista);
router.get('/', exigirAdmin, MotoristaController.listar);
router.post('/', exigirAdmin, exigirLimite('motoristas', 'motoristas'), MotoristaController.criar);
router.put('/:id', exigirAdmin, MotoristaController.atualizar);
router.delete('/:id', exigirAdmin, MotoristaController.excluir);
router.put('/:id/foto', MotoristaController.atualizarFoto);
router.post('/:id/multa', exigirAdmin, RankingController.multaManual);

module.exports = router;
