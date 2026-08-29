// =====================================================================
// FELIPINHO LAUNCHER - Controller: Empresas Virtuais
// =====================================================================

const EmpresaModel = require('../models/EmpresaModel');
const asyncHandler = require('../utils/asyncHandler');
const { sucesso, criado, naoEncontrado, requisicaoInvalida } = require('../utils/respostaPadrao');

const gerarSlug = (texto) => String(texto || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

const EmpresaController = {
  // Público
  listar: asyncHandler(async (req, res) => {
    const lista = await EmpresaModel.listar({
      busca: req.query.busca,
      destaque: req.query.destaque
    });
    return sucesso(res, lista);
  }),

  // Público
  buscarPorSlug: asyncHandler(async (req, res) => {
    const empresa = await EmpresaModel.buscarPorSlug(req.params.slug);
    if (!empresa) return naoEncontrado(res, 'Empresa não encontrada.');
    return sucesso(res, empresa);
  }),

  // Protegido no router para administração futura
  criar: asyncHandler(async (req, res) => {
    const { nome } = req.body;
    if (!nome) return requisicaoInvalida(res, 'O nome da empresa é obrigatório.');

    const dados = { ...req.body, slug: req.body.slug || gerarSlug(nome) };
    if (!dados.slug) return requisicaoInvalida(res, 'Não foi possível gerar o slug da empresa.');

    const existente = await EmpresaModel.buscarPorSlug(dados.slug);
    if (existente) return requisicaoInvalida(res, 'Já existe uma empresa com este slug.');

    const empresa = await EmpresaModel.criar(dados);
    return criado(res, empresa, 'Empresa criada com sucesso.');
  }),

  atualizar: asyncHandler(async (req, res) => {
    const existente = await EmpresaModel.buscarPorId(req.params.id);
    if (!existente) return naoEncontrado(res, 'Empresa não encontrada.');

    const dados = { ...req.body };
    if (dados.nome && !dados.slug) dados.slug = gerarSlug(dados.nome);

    const empresa = await EmpresaModel.atualizar(req.params.id, dados);
    return sucesso(res, empresa, 'Empresa atualizada com sucesso.');
  })
};

module.exports = EmpresaController;
