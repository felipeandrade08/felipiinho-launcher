// =====================================================================
// FELIPINHO LAUNCHER - Controller: Caminhões
// =====================================================================

const CaminhaoModel = require('../models/CaminhaoModel');
const asyncHandler = require('../utils/asyncHandler');
const { sucesso, criado, naoEncontrado, requisicaoInvalida } = require('../utils/respostaPadrao');

const CaminhaoController = {
  listar: asyncHandler(async (req, res) => sucesso(res, await CaminhaoModel.listarTodos({ status: req.query.status, busca: req.query.busca, contaId: req.conta.id }))),
  buscarPorId: asyncHandler(async (req, res) => { const item = await CaminhaoModel.buscarPorId(req.params.id, req.conta.id); if (!item) return naoEncontrado(res, 'Caminhão não encontrado.'); return sucesso(res, item); }),
  criar: asyncHandler(async (req, res) => { const { placa, marca, modelo } = req.body; if (!placa || !marca || !modelo) return requisicaoInvalida(res, 'Os campos "placa", "marca" e "modelo" são obrigatórios.'); return criado(res, await CaminhaoModel.criar(req.body, req.conta.id), 'Caminhão cadastrado com sucesso.'); }),
  atualizar: asyncHandler(async (req, res) => { if (!await CaminhaoModel.buscarPorId(req.params.id, req.conta.id)) return naoEncontrado(res, 'Caminhão não encontrado.'); return sucesso(res, await CaminhaoModel.atualizar(req.params.id, req.body, req.conta.id), 'Caminhão atualizado com sucesso.'); }),
  excluir: asyncHandler(async (req, res) => { if (!await CaminhaoModel.buscarPorId(req.params.id, req.conta.id)) return naoEncontrado(res, 'Caminhão não encontrado.'); await CaminhaoModel.excluir(req.params.id, req.conta.id); return sucesso(res, null, 'Caminhão excluído com sucesso.'); }),
  alertasConsumo: asyncHandler(async (req, res) => sucesso(res, await CaminhaoModel.alertasConsumo(req.conta.id)))
};

module.exports = CaminhaoController;
