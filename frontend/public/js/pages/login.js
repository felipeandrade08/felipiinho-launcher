// =====================================================================
// FELIPINHO LAUNCHER - Página: Login / Cadastro + Empresas na Home
// =====================================================================

const PLANOS_DISPONIVEIS = {
  individual: { nome: 'Individual', tipoConta: 'individual' },
  profissional: { nome: 'Profissional', tipoConta: 'empresa' },
  empresa: { nome: 'Empresa', tipoConta: 'empresa' }
};

function obterPlanoSelecionado() {
  const params = new URLSearchParams(window.location.search);
  const planoUrl = (params.get('plano') || '').toLowerCase();
  const planoStorage = (localStorage.getItem('felipinho_plano_escolhido') || '').toLowerCase();
  const codigo = PLANOS_DISPONIVEIS[planoUrl] ? planoUrl : planoStorage;
  return PLANOS_DISPONIVEIS[codigo] ? { codigo, ...PLANOS_DISPONIVEIS[codigo] } : null;
}

function atualizarPlanoCadastro() {
  const plano = obterPlanoSelecionado();
  const subtitulo = document.querySelector('#telaCadastro .card-login-subtitulo');
  if (!subtitulo || !plano) return;
  subtitulo.innerHTML = `Plano <strong style="color:var(--verde-limao)">${plano.nome}</strong> selecionado · <strong style="color:#fff">7 dias grátis</strong>`;
}

function renderEmpresasHome(empresas) {
  const stats = document.querySelector('.stats-row');
  if (!stats) return;

  const fallback = [
    { slug: 'gr-expresso', nome: 'GR Expresso Virtual', local: 'Brasil · São Paulo', logo: 'img/logo/logo-gr-expresso.png', capa: 'img/backgrounds/frota-login.jpg', rating: '4.9', motoristas: 48, pontos: 15840 },
    { slug: 'transportadora-alpha', nome: 'Transportadora Alpha', local: 'Brasil · Paraná', logo: 'img/logo/logo-gr-expresso.png', capa: 'img/backgrounds/frota-login.jpg', rating: '4.8', motoristas: 32, pontos: 12450 },
    { slug: 'brasil-logistics', nome: 'Brasil Logistics', local: 'Brasil · Minas Gerais', logo: 'img/logo/logo-gr-expresso.png', capa: 'img/backgrounds/frota-login.jpg', rating: '4.7', motoristas: 26, pontos: 10220 }
  ];

  const normalizados = (Array.isArray(empresas) && empresas.length ? empresas : fallback).map(e => ({
    slug: e.slug || '', nome: e.nome || 'Empresa virtual', local: e.local || e.localizacao || 'Brasil',
    logo: e.logo || e.logo_url || fallback[0].logo, capa: e.capa || e.capa_url || fallback[0].capa,
    rating: e.rating || e.avaliacao || '—', motoristas: Number(e.motoristas ?? e.total_motoristas ?? 0), pontos: Number(e.pontos || e.pontuacao_ranking || 0)
  }));

  stats.innerHTML = `<div class="home-empresas-box">
    <div class="home-empresas-head"><span><i class="fa-solid fa-building"></i> Empresas em destaque</span><a href="empresas.html">Explorar todas <i class="fa-solid fa-arrow-right"></i></a></div>
    <div class="home-empresas-viewport"><div class="home-empresas-track">${normalizados.map(e => `<article class="home-empresa-slide">
      <div class="home-empresa-capa" style="background-image:url('${e.capa}')"><img src="${e.logo}" alt="" onerror="this.style.display='none'"></div>
      <div class="home-empresa-info"><h3>${e.nome}</h3><div class="home-empresa-meta"><i class="fa-solid fa-location-dot"></i> ${e.local} &nbsp; <i class="fa-solid fa-star"></i> ${e.rating}</div><div class="home-empresa-score"><strong>${e.pontos.toLocaleString('pt-BR')} pts</strong> · ${e.motoristas} motoristas</div></div>
      <a class="home-empresa-btn" href="empresa.html?slug=${encodeURIComponent(e.slug)}">VER PERFIL</a>
    </article>`).join('')}</div></div>
    <button class="home-empresa-arrow left" aria-label="Empresa anterior"><i class="fa-solid fa-chevron-left"></i></button><button class="home-empresa-arrow right" aria-label="Próxima empresa"><i class="fa-solid fa-chevron-right"></i></button>
    <div class="home-empresa-dots">${normalizados.map((_, i) => `<button data-index="${i}" class="${i === 0 ? 'active' : ''}" aria-label="Empresa ${i + 1}"></button>`).join('')}</div>
  </div>`;

  const box = stats.querySelector('.home-empresas-box');
  let index = 0;
  const track = box.querySelector('.home-empresas-track');
  const dots = [...box.querySelectorAll('.home-empresa-dots button')];
  let timer;
  function go(next) {
    index = (next + normalizados.length) % normalizados.length;
    track.style.transform = `translateX(-${index * 100}%)`;
    dots.forEach((d, i) => d.classList.toggle('active', i === index));
    clearInterval(timer);
    timer = setInterval(() => go(index + 1), 5000);
  }
  box.querySelector('.home-empresa-arrow.left').onclick = () => go(index - 1);
  box.querySelector('.home-empresa-arrow.right').onclick = () => go(index + 1);
  dots.forEach(d => d.onclick = () => go(Number(d.dataset.index)));
  if (normalizados.length > 1) timer = setInterval(() => go(index + 1), 5000);
}

async function carregarEmpresasHome() {
  try {
    const base = typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : '/api';
    const resposta = await fetch(`${base}/empresas`);
    if (!resposta.ok) throw new Error('API indisponível');
    const json = await resposta.json();
    renderEmpresasHome(json.dados || json.data || []);
  } catch (erro) {
    console.warn('[Home] Empresas: usando dados de demonstração.', erro.message);
    renderEmpresasHome([]);
  }
}

(function () {
  if (typeof AuthService !== 'undefined' && AuthService.estaAutenticado()) {
    window.location.href = 'dashboard.html';
    return;
  }

  document.getElementById('linkIrParaCadastro').addEventListener('click', (e) => {
    e.preventDefault();
    atualizarPlanoCadastro();
    mostrarTela('telaCadastro');
  });
  document.getElementById('linkIrParaLogin').addEventListener('click', (e) => { e.preventDefault(); mostrarTela('telaLogin'); });
  document.getElementById('btnVoltarParaLoginDeAguardando').addEventListener('click', () => mostrarTela('telaLogin'));
  document.getElementById('formLogin').addEventListener('submit', fazerLogin);
  document.getElementById('formCadastro').addEventListener('submit', fazerCadastro);
  if (obterPlanoSelecionado()) { atualizarPlanoCadastro(); mostrarTela('telaCadastro'); }
  if (document.querySelector('.stats-row')) {
    const style = document.createElement('style');
    style.textContent = `.home-empresas-box{position:relative;width:100%;border:1px solid rgba(255,255,255,.11);border-radius:18px;background:rgba(5,10,8,.55);backdrop-filter:blur(12px);overflow:hidden}.home-empresas-head{display:flex;justify-content:space-between;align-items:center;padding:11px 15px 7px;font-size:.66rem;text-transform:uppercase;letter-spacing:.12em;font-weight:800;color:rgba(255,255,255,.7)}.home-empresas-head i{color:var(--verde-limao)}.home-empresas-head a{color:var(--verde-limao);text-decoration:none;letter-spacing:.03em}.home-empresas-viewport{overflow:hidden}.home-empresas-track{display:flex;transition:transform .55s cubic-bezier(.2,.8,.2,1)}.home-empresa-slide{min-width:100%;display:grid;grid-template-columns:120px 1fr auto;align-items:center;gap:14px;padding:6px 42px 10px 15px}.home-empresa-capa{height:72px;border-radius:12px;background-size:cover;background-position:center;position:relative;overflow:hidden}.home-empresa-capa:after{content:'';position:absolute;inset:0;background:linear-gradient(135deg,transparent,rgba(0,0,0,.65))}.home-empresa-capa img{position:absolute;z-index:2;left:8px;bottom:8px;width:38px;height:38px;object-fit:cover;border-radius:9px;border:2px solid rgba(255,255,255,.75);background:#07100c}.home-empresa-info h3{font-size:.95rem;margin:0 0 4px;font-weight:800}.home-empresa-meta,.home-empresa-score{font-size:.64rem;color:rgba(255,255,255,.52)}.home-empresa-meta i{color:var(--verde-limao)}.home-empresa-score{margin-top:6px}.home-empresa-score strong{color:var(--verde-limao)}.home-empresa-btn{padding:8px 10px;border:1px solid rgba(212,160,23,.35);border-radius:9px;color:var(--verde-limao);font-size:.62rem;font-weight:800;text-decoration:none;white-space:nowrap}.home-empresa-arrow{position:absolute;z-index:5;top:50%;transform:translateY(-25%);width:27px;height:27px;border:1px solid rgba(255,255,255,.15);border-radius:50%;background:rgba(5,10,8,.85);color:#fff;cursor:pointer}.home-empresa-arrow:hover{color:var(--verde-limao);border-color:var(--verde-limao)}.home-empresa-arrow.left{left:7px}.home-empresa-arrow.right{right:7px}.home-empresa-dots{display:flex;justify-content:center;gap:5px;padding:0 0 8px}.home-empresa-dots button{width:5px;height:5px;border:0;border-radius:50%;padding:0;background:rgba(255,255,255,.3);cursor:pointer}.home-empresa-dots button.active{width:15px;border-radius:8px;background:var(--verde-limao)}@media(max-width:991px){.home-empresa-slide{grid-template-columns:100px 1fr}.home-empresa-btn{display:none}}@media(max-width:600px){.home-empresa-slide{grid-template-columns:85px 1fr;padding-right:34px}.home-empresa-capa{height:66px}.home-empresa-info h3{font-size:.82rem}.home-empresa-meta,.home-empresa-score{font-size:.57rem}.home-empresas-head{font-size:.58rem}}`;
    document.head.appendChild(style);
    carregarEmpresasHome();
  }
})();

function mostrarTela(idTela) {
  document.querySelectorAll('.alternar-tela').forEach((el) => el.classList.remove('ativa'));
  document.getElementById(idTela).classList.add('ativa');
}

async function fazerLogin(evento) {
  evento.preventDefault();
  const email = document.getElementById('campoEmailLogin').value.trim();
  const senha = document.getElementById('campoSenhaLogin').value;
  const botao = document.getElementById('btnEntrar');
  botao.disabled = true;
  botao.innerHTML = 'Entrando... <i class="fa-solid fa-spinner fa-spin"></i>';
  try {
    const resultado = await ApiService.post('/auth/login', { email, senha });
    AuthService.salvarSessao(resultado.token, resultado.usuario);
    window.location.href = 'dashboard.html';
  } catch (erro) {
    console.error(erro);
    Swal.fire({ icon: 'error', title: 'Não foi possível entrar', text: erro.message, confirmButtonColor: '#0B0B0B' });
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
  const plano = obterPlanoSelecionado();
  const botao = document.getElementById('btnCadastrar');
  if (senha.length < 6) { Swal.fire({ icon: 'warning', title: 'Senha muito curta', text: 'A senha precisa ter pelo menos 6 caracteres.', confirmButtonColor: '#0B0B0B' }); return; }
  if (!plano) { Swal.fire({ icon: 'info', title: 'Escolha um plano', text: 'Selecione um plano antes de criar sua conta.', confirmButtonColor: '#0B0B0B' }); window.location.href = 'planos.html'; return; }
  botao.disabled = true;
  botao.innerHTML = 'Iniciando seu teste grátis... <i class="fa-solid fa-spinner fa-spin"></i>';
  try {
    await ApiService.post('/auth/registrar', { nome, email, senha, telefone, cnh, tipoConta: plano.tipoConta, planoCodigo: plano.codigo });
    localStorage.removeItem('felipinho_plano_escolhido');
    document.getElementById('formCadastro').reset();
    mostrarTela('telaAguardando');
  } catch (erro) {
    console.error(erro);
    Swal.fire({ icon: 'error', title: 'Não foi possível concluir o cadastro', text: erro.message, confirmButtonColor: '#0B0B0B' });
  } finally {
    botao.disabled = false;
    botao.innerHTML = 'Criar minha conta <i class="fa-solid fa-user-plus"></i>';
  }
}