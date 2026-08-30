const express = require('express');
const router = express.Router();
const Controller = require('../controllers/ContratacoesController');
const { exigirAutenticacao } = require('../middlewares/autenticacao');

router.use(exigirAutenticacao);

// Motorista
router.get('/empresas', Controller.empresasDisponiveis);
router.post('/empresas/:empresaId/solicitar', Controller.solicitarEntrada);
router.get('/minhas-solicitacoes', Controller.minhasSolicitacoes);

// Empresa
router.get('/empresa/solicitacoes', Controller.listarDaEmpresa);
router.patch('/empresa/solicitacoes/:id/aprovar', Controller.aprovar);
router.patch('/empresa/solicitacoes/:id/recusar', Controller.recusar);

module.exports = router;
