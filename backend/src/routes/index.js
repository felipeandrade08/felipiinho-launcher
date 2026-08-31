const express = require('express');
const router = express.Router();
const RankingModel = require('../models/RankingModel');

// Endpoint público para a página inicial: ranking mensal por quilometragem.
router.get('/ranking-publico', async (req, res, next) => {
  try {
    const dados = await RankingModel.rankingMensalKm(req.query.limite || 10);
    res.json({ sucesso: true, dados });
  } catch (erro) {
    next(erro);
  }
});

router.use('/auth', require('./auth.routes'));

// Rotas específicas devem ser montadas antes de /empresas para que
// /empresas/solicitacoes não seja interpretada como /empresas/:slug.
router.use('/empresas/solicitacoes', require('./empresaAprovacoes.routes'));
router.use('/empresas', require('./empresas.routes'));

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
router.use('/notificacoes', require('./notificacoes.routes'));
// Rotas opcionais: os arquivos não existem nesta versão do backend.
// Ranking e multas não devem impedir o servidor de iniciar.
router.use('/telemetria', require('./telemetria.routes'));

module.exports = router;
