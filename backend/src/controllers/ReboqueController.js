// =====================================================================
// FELIPINHO LAUNCHER - Controller: Reboques
// =====================================================================

const ReboqueModel = require('../models/ReboqueModel');
const asyncHandler = require('../utils/asyncHandler');
const { sucesso, criado, naoEncontrado, requisicaoInvalida } = require('../utils/respostaPadrao');

const ReboqueController = {
  listar: asyncHandler(async (req, res) => sucesso(res, await ReboqueModel.listarTodos({ status: req.query.status, tipo: req.query.tipo, contaId: req.conta.id }))),
  buscarPorId: asyncHandler(async (req, res) => { const item = await ReboqueModel.buscarPorId(req.params.id, req.conta.id); if (!item) return naoEncontrado(res, 'Reboque não encontrado.'); return sucesso(res, item); }),
  criar: asyncHandler(async (req, res) => { if (!req.body.placa) return requisicaoInvalida(res, 'O campo "placa" é obrigatório.'); return criado(res, await ReboqueModel.criar(req.body, req.conta.id), 'Reboque cadastrado com sucesso.'); }),
  atualizar: asyncHandler(async (req, res) => { if (!await ReboqueModel.buscarPorId(req.params.id, req.conta.id)) return naoEncontrado(res, 'Reboque não encontrado.'); return sucesso(res, await ReboqueModel.atualizar(req.params.id, req.body, req.conta.id), 'Reboque atualizado com sucesso.'); }),
  excluir: asyncHandler(async (req, res) => { if (!await ReboqueModel.buscarPorId(req.params.id, req.conta.id)) return naoEncontrado(res, 'Reboque não encontrado.'); await ReboqueModel.excluir(req.params.id, req.conta.id); return sucesso(res, null, 'Reboque excluído com sucesso.'); })
};

module.exports = ReboqueController;
