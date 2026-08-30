const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth.routes'));
router.use('/empresas', require('./empresas.routes'));
router.use('/empresas/solicitacoes', require('./empresaAprovacoes.routes'));
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
router.use('/contratacoes', require('./contratacoes.routes'));
// Rotas opcionais: os arquivos não existem nesta versão do backend.
// Ranking e multas não devem impedir o servidor de iniciar.
router.use('/telemetria', require('./telemetria.routes'));

module.exports = router;
