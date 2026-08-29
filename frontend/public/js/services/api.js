// =====================================================================
// FELIPINHO LAUNCHER - Serviço de API
// =====================================================================

const API_BASE_URL = (() => {
  if (window.GR_API_URL) return window.GR_API_URL;
  return 'http://localhost:3000/api';
})();

async function apiRequest(caminho, opcoes = {}) {
  const url = `${API_BASE_URL}${caminho}`;
  const token = window.AuthService ? window.AuthService.obterToken() : null;

  const config = {
    method: opcoes.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opcoes.headers || {})
    }
  };

  if (opcoes.body !== undefined && opcoes.body !== null) {
    config.body = typeof opcoes.body === 'string'
      ? opcoes.body
      : JSON.stringify(opcoes.body);
  }

  let resposta;
  try {
    resposta = await fetch(url, config);
  } catch (erroRede) {
    const erro = new Error('Não foi possível conectar à API do FELIPINHO LAUNCHER. Verifique se o servidor backend está online.');
    erro.tipo = 'rede';
    throw erro;
  }

  let corpo;
  try {
    corpo = await resposta.json();
  } catch (erroParse) {
    corpo = { sucesso: false, mensagem: 'Resposta inválida do servidor.' };
  }

  if (resposta.status === 401 && window.AuthService) {
    const ehRotaDeAuth = caminho.startsWith('/auth/login') || caminho.startsWith('/auth/registrar');
    if (!ehRotaDeAuth) {
      window.AuthService.encerrarSessao();
      window.location.href = 'index.html';
    }
  }

  if (!resposta.ok || !corpo.sucesso) {
    const erro = new Error(corpo.mensagem || `Erro ${resposta.status} ao consultar a API.`);
    erro.status = resposta.status;
    erro.detalhes = corpo.detalhes;
    throw erro;
  }

  return corpo.dados;
}

const ApiService = {
  get: (caminho) => apiRequest(caminho, { method: 'GET' }),
  post: (caminho, body) => apiRequest(caminho, { method: 'POST', body }),
  put: (caminho, body) => apiRequest(caminho, { method: 'PUT', body }),
  patch: (caminho, body) => apiRequest(caminho, { method: 'PATCH', body }),
  delete: (caminho) => apiRequest(caminho, { method: 'DELETE' })
};
