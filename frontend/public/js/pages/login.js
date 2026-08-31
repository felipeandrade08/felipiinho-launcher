// FELIPINHO LAUNCHER - Login e cadastro gratuito

function mostrarTela(id) {
  document.querySelectorAll('.alternar-tela').forEach(el => el.classList.remove('ativa'));
  const tela = document.getElementById(id);
  if (tela) tela.classList.add('ativa');
}

(function iniciar() {
  if (typeof AuthService !== 'undefined' && AuthService.estaAutenticado()) {
    window.location.href = 'dashboard.html';
    return;
  }

  document.getElementById('linkIrParaCadastro')?.addEventListener('click', e => {
    e.preventDefault();
    mostrarTela('telaCadastro');
  });

  document.getElementById('linkIrParaLogin')?.addEventListener('click', e => {
    e.preventDefault();
    mostrarTela('telaLogin');
  });

  document.getElementById('formLogin')?.addEventListener('submit', fazerLogin);
  document.getElementById('formCadastro')?.addEventListener('submit', fazerCadastro);
})();

async function fazerLogin(evento) {
  evento.preventDefault();

  const email = document.getElementById('campoEmailLogin').value.trim();
  const senha = document.getElementById('campoSenhaLogin').value;
  const botao = document.getElementById('btnEntrar');

  if (!email || !senha) return;

  botao.disabled = true;
  botao.innerHTML = 'Entrando... <i class="fa-solid fa-spinner fa-spin"></i>';

  try {
    const resultado = await ApiService.post('/auth/login', { email, senha });
    AuthService.salvarSessao(resultado.token, resultado.usuario);
    window.location.href = 'dashboard.html';
  } catch (erro) {
    console.error('[Login]', erro);
    Swal.fire({
      icon: 'error',
      title: 'Não foi possível entrar',
      text: erro.message || 'Verifique seus dados e tente novamente.',
      confirmButtonColor: '#0B0B0B'
    });
  } finally {
    botao.disabled = false;
    botao.innerHTML = 'Entrar no sistema <i class="fa-solid fa-arrow-right"></i>';
  }
}

async function fazerCadastro(evento) {
  evento.preventDefault();

  const nome = document.getElementById('campoNomeCadastro').value.trim();
  const email = document.getElementById('campoEmailCadastro').value.trim();
  const telefone = document.getElementById('campoTelefoneCadastro').value.trim();
  const cnh = document.getElementById('campoCnhCadastro').value.trim();
  const senha = document.getElementById('campoSenhaCadastro').value;
  const botao = document.getElementById('btnCadastrar');

  if (!nome || !email || !senha) {
    Swal.fire({
      icon: 'warning',
      title: 'Preencha os campos obrigatórios',
      text: 'Nome, e-mail e senha são necessários.'
    });
    return;
  }

  if (senha.length < 6) {
    Swal.fire({
      icon: 'warning',
      title: 'Senha muito curta',
      text: 'A senha precisa ter pelo menos 6 caracteres.'
    });
    return;
  }

  botao.disabled = true;
  botao.innerHTML = 'Criando sua conta... <i class="fa-solid fa-spinner fa-spin"></i>';

  try {
    // O backend já cria o usuário como APROVADO e o motorista como ATIVO.
    await ApiService.post('/auth/registrar', { nome, email, senha, telefone, cnh });

    // Faz login automaticamente: cadastro concluído = sistema liberado.
    const resultadoLogin = await ApiService.post('/auth/login', { email, senha });
    AuthService.salvarSessao(resultadoLogin.token, resultadoLogin.usuario);

    // Esta flag faz o dashboard mostrar o onboarding do Launcher somente
    // para quem acabou de criar a conta.
    localStorage.setItem('felipinho_novo_usuario', '1');

    window.location.href = 'dashboard.html';
  } catch (erro) {
    console.error('[Cadastro]', erro);
    Swal.fire({
      icon: 'error',
      title: 'Não foi possível criar sua conta',
      text: erro.message || 'Tente novamente em instantes.',
      confirmButtonColor: '#0B0B0B'
    });
  } finally {
    botao.disabled = false;
    botao.innerHTML = 'Criar minha conta grátis <i class="fa-solid fa-user-plus"></i>';
  }
}