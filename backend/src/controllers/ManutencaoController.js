// =====================================================================
// FELIPINHO LAUNCHER - Controller: Manutenções
// Regra atual: manutenção não depende de filial/credenciamento.
// =====================================================================

const ManutencaoModel = require('../models/ManutencaoModel');
const asyncHandler = require('../utils/asyncHandler');
const { sucesso, criado, naoEncontrado, requisicaoInvalida, erro } = require('../utils/respostaPadrao');

function podeAcessar(usuario, manutencao) {
  if (usuario.tipo === 'admin') return true;
  return manutencao && Number(manutencao.motorista_id) === Number(usuario.motorista_id);
}

const ManutencaoController = {
  listar: asyncHandler(async (req, res) => {
    const { caminhao_id, status, data_inicio, data_fim } = req.query;
    const motorista_id = req.usuario.tipo === 'admin' ? null : req.usuario.motorista_id;
    const lista = await ManutencaoModel.listarTodas({ motorista_id, caminhao_id, status, data_inicio, data_fim });
    return sucesso(res, lista);
  }),

  buscarPorId: asyncHandler(async (req, res) => {
    const man = await ManutencaoModel.buscarPorId(req.params.id);
    if (!man) return naoEncontrado(res, 'Manutenção não encontrada.');
    if (!podeAcessar(req.usuario, man)) return erro(res, 'Acesso negado.', 403);
    return sucesso(res, man);
  }),

  criar: asyncHandler(async (req, res) => {
    const dados = { ...req.body, origem: 'manual', status: 'ok' };

    if (req.usuario.tipo !== 'admin') {
      if (!req.usuario.motorista_id) return erro(res, 'Conta não vinculada a motorista.', 403);
      dados.motorista_id = req.usuario.motorista_id;
    }

    if (!dados.caminhao_id || !dados.data_manutencao)
      return requisicaoInvalida(res, 'Os campos "caminhao_id" e "data_manutencao" são obrigatórios.');

    dados.credenciada = false;
    const man = await ManutencaoModel.criar(dados);
    return criado(res, man, 'Manutenção registrada.');
  }),

  excluir: asyncHandler(async (req, res) => {
    const man = await ManutencaoModel.buscarPorId(req.params.id);
    if (!man) return naoEncontrado(res, 'Manutenção não encontrada.');
    if (req.usuario.tipo !== 'admin') return erro(res, 'Apenas administradores podem excluir manutenções.', 403);
    const { pool } = require('../config/database');
    await pool.query('DELETE FROM manutencoes WHERE id = ?', [req.params.id]);
    return sucesso(res, null, 'Manutenção excluída.');
  }),

  totalPorMes: asyncHandler(async (req, res) => {
    const meses = Number(req.query.meses) || 6;
    return sucesso(res, await ManutencaoModel.totalPorMes(meses));
  }),

  listarPendentes: asyncHandler(async (req, res) => {
    const motorista_id = req.usuario.tipo === 'admin' ? null : req.usuario.motorista_id;
    return sucesso(res, await ManutencaoModel.listarPendentes(motorista_id));
  }),

  resolverPendente: asyncHandler(async (req, res) => {
    const man = await ManutencaoModel.buscarPorId(req.params.id);
    if (!man) return naoEncontrado(res, 'Manutenção não encontrada.');
    if (!podeAcessar(req.usuario, man)) return erro(res, 'Acesso negado.', 403);
    if (man.status !== 'pendente') return requisicaoInvalida(res, 'Esta manutenção não está pendente.');

    const { cidade, local_servico } = req.body;
    if (!cidade || !cidade.trim()) return requisicaoInvalida(res, 'Informe a cidade onde fez a manutenção.');
    if (!local_servico || !local_servico.trim()) return requisicaoInvalida(res, 'Informe o nome da oficina ou local onde fez a manutenção.');

    const atualizado = await ManutencaoModel.resolverPendente(req.params.id, {
      cidade: cidade.trim(),
      local_servico: local_servico.trim(),
    });

    return sucesso(res, { manutencao: atualizado }, 'Dados da manutenção atualizados. Aguarde a regularização administrativa.');
  }),

  regularizarPendente: asyncHandler(async (req, res) => {
    if (req.usuario.tipo !== 'admin') return erro(res, 'Somente administradores podem regularizar manutenções.', 403);

    const man = await ManutencaoModel.buscarPorId(req.params.id);
    if (!man) return naoEncontrado(res, 'Manutenção não encontrada.');
    if (man.status !== 'pendente') return requisicaoInvalida(res, 'Esta manutenção não está pendente.');
    if (!man.cidade || !man.local_servico)
      return requisicaoInvalida(res, 'O motorista ainda não preencheu cidade e local. Aguarde antes de regularizar.');

    const observacoes = req.body.observacoes ||
      `Manutenção regularizada — local: "${man.local_servico}", cidade: "${man.cidade}"`;

    const atualizado = await ManutencaoModel.regularizarPendente(req.params.id, { observacoes });
    return sucesso(res, { manutencao: atualizado, penalidade: null }, 'Manutenção regularizada sem penalidade.');
  }),
};

module.exports = ManutencaoController;
