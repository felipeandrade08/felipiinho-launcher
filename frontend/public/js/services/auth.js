// =====================================================================
// FELIPINHO LAUNCHER - Serviço de Autenticação (frontend)
// =====================================================================

const CHAVE_TOKEN = 'gr_expresso_token';
const CHAVE_USUARIO = 'gr_expresso_usuario';

// Mantemos compatibilidade com sessões antigas em sessionStorage e usamos
// localStorage como persistência para o login não desaparecer ao trocar de
// página/aba ou ao reabrir o sistema.
function lerArmazenamento(chave) {
  return sessionStorage.getItem(chave) || localStorage.getItem(chave);
}

const AuthService = {
  salvarSessao(token, usuario) {
    sessionStorage.setItem(CHAVE_TOKEN, token);
    sessionStorage.setItem(CHAVE_USUARIO, JSON.stringify(usuario));
    localStorage.setItem(CHAVE_TOKEN, token);
    localStorage.setItem(CHAVE_USUARIO, JSON.stringify(usuario));
  },

  obterToken() {
    return lerArmazenamento(CHAVE_TOKEN);
  },

  obterUsuario() {
    const bruto = lerArmazenamento(CHAVE_USUARIO);
    if (!bruto) return null;
    try {
      return JSON.parse(bruto);
    } catch (_) {
      return null;
    }
  },

  estaAutenticado() {
    return !!this.obterToken();
  },

  ehAdmin() {
    const u = this.obterUsuario();
    return u?.tipo === 'admin';
  },

  /** Diretoria tem os mesmos acessos que admin */
  ehDiretoria() {
    const u = this.obterUsuario();
    return u?.tipo === 'admin' || u?.tipo === 'diretoria';
  },

  ehRH() {
    const u = this.obterUsuario();
    return ['admin', 'diretoria', 'rh'].includes(u?.tipo);
  },

  /** Verifica se tem acesso gerencial (admin, diretoria ou rh) */
  ehGestor() {
    const u = this.obterUsuario();
    return ['admin', 'diretoria', 'rh'].includes(u?.tipo);
  },

  obterCargoBadge() {
    const u = this.obterUsuario();
    const cargos = {
      admin: 'Administrador',
      diretoria: 'Diretoria',
      rh: 'RH',
      motorista: 'Motorista'
    };
    return cargos[u?.tipo] || 'Motorista';
  },

  encerrarSessao() {
    sessionStorage.removeItem(CHAVE_TOKEN);
    sessionStorage.removeItem(CHAVE_USUARIO);
    localStorage.removeItem(CHAVE_TOKEN);
    localStorage.removeItem(CHAVE_USUARIO);
  },

  protegerPagina() {
    if (!this.estaAutenticado()) {
      window.location.href = 'index.html';
      return false;
    }
    return true;
  },

  protegerPaginaAdmin() {
    if (!this.protegerPagina()) return false;
    if (!this.ehDiretoria()) {
      window.location.href = 'dashboard.html';
      return false;
    }
    return true;
  },

  protegerPaginaRH() {
    if (!this.protegerPagina()) return false;
    if (!this.ehRH()) {
      window.location.href = 'dashboard.html';
      return false;
    }
    return true;
  }
};

window.AuthService = AuthService;
