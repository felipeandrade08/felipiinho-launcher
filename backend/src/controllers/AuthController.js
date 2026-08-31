const bcrypt = require('bcryptjs');
const UsuarioModel = require('../models/UsuarioModel');
const { gerarToken } = require('../utils/token');
const asyncHandler = require('../utils/asyncHandler');
const { sucesso, criado, erro, naoEncontrado, requisicaoInvalida } = require('../utils/respostaPadrao');

function sanitizarUsuario(usuario) {
  if (!usuario) return null;
  const { senha_hash, ...resto } = usuario;
  return resto;
}

const AuthController = {
  registrar: asyncHandler(async (req, res) => {
    const { nome, email, senha, telefone, cnh } = req.body;

    if (!nome || !email || !senha) {
      return requisicaoInvalida(res, 'Os campos "nome", "email" e "senha" são obrigatórios.');
    }
    if (senha.length < 6) {
      return requisicaoInvalida(res, 'A senha deve ter pelo menos 6 caracteres.');
    }

    const existente = await UsuarioModel.buscarPorEmail(email);
    if (existente) return erro(res, 'Já existe uma conta cadastrada com este e-mail.', 409);

    const senhaHash = await bcrypt.hash(senha, 10);
    const usuario = await UsuarioModel.criarComMotorista({ nome, email, senhaHash, telefone, cnh });

    return criado(res, sanitizarUsuario(usuario), 'Cadastro realizado com sucesso! Sua conta já está pronta para uso.');
  }),

  login: asyncHandler(async (req, res) => {
    const { email, senha } = req.body;
    if (!email || !senha) return requisicaoInvalida(res, 'Informe e-mail e senha.');

    const usuario = await UsuarioModel.buscarPorEmail(email);
    if (!usuario) return erro(res, 'E-mail ou senha incorretos.', 401);

    const senhaConfere = await bcrypt.compare(senha, usuario.senha_hash);
    if (!senhaConfere) return erro(res, 'E-mail ou senha incorretos.', 401);

    if (usuario.status === 'rejeitado' || usuario.status === 'bloqueado') {
      return erro(res, 'Sua conta não está disponível para acesso. Entre em contato com o administrador.', 403);
    }

    await UsuarioModel.registrarLogin(usuario.id);
    return sucesso(res, {
      token: gerarToken(usuario),
      usuario: sanitizarUsuario(await UsuarioModel.buscarPorId(usuario.id))
    }, 'Login realizado com sucesso.');
  }),

  meuPerfil: asyncHandler(async (req, res) => {
    const usuario = await UsuarioModel.buscarPorId(req.usuario.id);
    if (!usuario) return naoEncontrado(res, 'Usuário não encontrado.');
    return sucesso(res, sanitizarUsuario(usuario));
  }),

  listarPendentes: asyncHandler(async (req, res) => sucesso(res, await UsuarioModel.listarPendentes())),
  listarTodos: asyncHandler(async (req, res) => sucesso(res, await UsuarioModel.listarTodos({ status: req.query.status, tipo: req.query.tipo }))),

  atualizarStatus: asyncHandler(async (req, res) => {
    const { status } = req.body;
    if (!['aprovado', 'rejeitado', 'pendente', 'bloqueado', 'dispensado'].includes(status)) return requisicaoInvalida(res, 'Status inválido.');
    if (!(await UsuarioModel.buscarPorId(req.params.id))) return naoEncontrado(res, 'Usuário não encontrado.');
    return sucesso(res, sanitizarUsuario(await UsuarioModel.atualizarStatus(req.params.id, status)), 'Status atualizado.');
  }),

  atualizarCargo: asyncHandler(async (req, res) => {
    const { tipo } = req.body;
    if (!['admin', 'diretoria', 'rh', 'motorista'].includes(tipo)) return requisicaoInvalida(res, 'Cargo inválido.');
    if (!(await UsuarioModel.buscarPorId(req.params.id))) return naoEncontrado(res, 'Usuário não encontrado.');
    await UsuarioModel.atualizarCargo(req.params.id, tipo);
    return sucesso(res, sanitizarUsuario(await UsuarioModel.buscarPorId(req.params.id)), 'Cargo atualizado com sucesso.');
  }),

  excluir: asyncHandler(async (req, res) => {
    if (!(await UsuarioModel.buscarPorId(req.params.id))) return naoEncontrado(res, 'Usuário não encontrado.');
    await UsuarioModel.excluir(req.params.id);
    return sucesso(res, null, 'Usuário removido com sucesso.');
  })
};

module.exports = AuthController;