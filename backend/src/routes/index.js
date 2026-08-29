const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth.routes'));
router.use('/empresas', require('./empresas.routes'));
router.use('/empresas/solicitacoes', require('./empresaSolicitacoes.routes'));
router.use('/caminhoes', require('./caminhoes.routes'));
router.use('/reboques', require('./reboques.routes'));
router.use('/motoristas', require('./motoristas.routes'));
router.use('/viagens', require('./viagens.routes'));
router.use('/dashboard', require('./dashboard.routes'));
router.use('/abastecimentos', require('./abastecimentos.routes'));
router.use('/despesas', require('./despesas.routes'));
router.use('/financeiro', require('./financeiro.routes'));
router.use('/integracoes', require('./integracoes.routes'));
router.use('/manutencoes', require('./manutencoes.routes'));
router.use('/notas-fiscais', require('./notasFiscais.routes'));
router.use('/assinaturas', require('./assinaturas.routes'));
router.use('/recrutamentos', require('./recrutamentos.routes'));
router.use('/ranking', require('./ranking.routes'));
router.use('/multas', require('./multas.routes'));
router.use('/telemetria', require('./telemetria.routes'));

module.exports = router;
