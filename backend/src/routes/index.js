// =====================================================================
// FELIPINHO LAUNCHER - Índice central de rotas da API
// =====================================================================

const express = require('express');
const router = express.Router();
const { exigirAutenticacao, exigirAdmin, exigirAdminOuRH } = require('../middlewares/autenticacao');
const { contextoConta } = require('../middlewares/contextoConta');

router.get('/health', (req, res) => res.json({ sucesso: true, mensagem: 'FELIPINHO LAUNCHER API está operacional.', timestamp: new Date().toISOString() }));
router.use('/recrutamentos', require('./recrutamentos.routes'));
router.use('/empresas', require('./empresas.routes'));

// Garante que o login tenha o corpo JSON interpretado antes do controller,
// mesmo que a configuração global do Express seja alterada no deploy.
router.use('/auth', express.json({ limit: '1mb' }), require('./auth.routes'));

router.get('/stats-publicas', async (req, res) => {
  try {
    const { pool } = require('../config/database');
    const [[viagens]] = await pool.query(`SELECT COUNT(*) AS total FROM viagens`);
    const [[motoristas]] = await pool.query(`SELECT COUNT(*) AS total FROM motoristas WHERE status = 'ativo'`);
    res.json({ sucesso: true, dados: { total_viagens: viagens.total, motoristas_ativos: motoristas.total } });
  } catch (e) {
    res.json({ sucesso: false, dados: { total_viagens: 0, motoristas_ativos: 0 } });
  }
});

// Toda rota autenticada passa a receber req.conta.
router.use(exigirAutenticacao);
router.use(contextoConta);

router.use('/planos', require('./planos.routes'));
router.use('/assinaturas', require('./assinaturas.routes'));
router.use('/viagens', require('./viagens.routes'));
router.use('/abastecimentos', require('./abastecimentos.routes'));
router.use('/manutencoes', require('./manutencoes.routes'));
router.use('/notificacoes', require('./notificacoes.routes'));
router.use('/notas-fiscais', require('./notasFiscais.routes'));
router.use('/motoristas', require('./motoristas.routes'));
router.use('/telemetria', require('./telemetria.routes'));

const CaminhaoController = require('../controllers/CaminhaoController');
const ReboqueController = require('../controllers/ReboqueController');
router.get('/caminhoes', CaminhaoController.listar);
router.get('/reboques', ReboqueController.listar);

router.use('/dashboard', exigirAdminOuRH, require('./dashboard.routes'));
router.use('/caminhoes', exigirAdminOuRH, require('./caminhoes.routes'));
router.use('/reboques', exigirAdminOuRH, require('./reboques.routes'));
router.use('/despesas', exigirAdminOuRH, require('./despesas.routes'));
router.use('/financeiro', exigirAdminOuRH, require('./financeiro.routes'));
router.use('/relatorios', exigirAdminOuRH, require('./relatorios.routes'));
router.use('/integracoes', exigirAdmin, require('./integracoes.routes'));

module.exports = router;
