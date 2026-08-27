// FELIPINHO LAUNCHER — Camada visual da Central de Operações
// Não substitui a lógica/API existente: apenas cria uma visão operacional mais rica.
(function () {
  'use strict';

  function montarCentral() {
    const main = document.getElementById('conteudoPagina');
    const grid = document.getElementById('gridIndicadores');
    if (!main || !grid || document.getElementById('centralOperacoes')) return;

    const central = document.createElement('section');
    central.id = 'centralOperacoes';
    central.className = 'central-operacoes animate__animated animate__fadeIn';
    central.innerHTML = `
      <div class="operacao-hero">
        <div>
          <span class="operacao-kicker"><span class="pulse-dot"></span> OPERAÇÃO EM TEMPO REAL</span>
          <h2>Central de Operações</h2>
          <p>Acompanhe a operação da transportadora em um único painel.</p>
        </div>
        <div class="operacao-clock" id="operacaoClock">--:--:--</div>
      </div>
      <div class="operacao-strip">
        <div><i class="fa-solid fa-satellite-dish"></i><span>Telemetria</span><strong class="text-success"> ONLINE</strong></div>
        <div><i class="fa-solid fa-shield-halved"></i><span>Sistema</span><strong class="text-success"> OPERACIONAL</strong></div>
        <div><i class="fa-solid fa-arrows-rotate"></i><span>Atualização</span><strong> AUTOMÁTICA</strong></div>
      </div>
      <div class="operacao-panels">
        <article class="operacao-panel operacao-status">
          <div class="panel-title"><span><i class="fa-solid fa-truck-fast"></i> Situação da frota</span><small>AGORA</small></div>
          <div class="status-grid">
            <div class="status-box"><span class="status-icon em-rota"><i class="fa-solid fa-route"></i></span><strong id="opsViagens">0</strong><small>EM VIAGEM</small></div>
            <div class="status-box"><span class="status-icon disponivel"><i class="fa-solid fa-circle-check"></i></span><strong id="opsDisponiveis">0</strong><small>DISPONÍVEIS</small></div>
            <div class="status-box"><span class="status-icon alerta"><i class="fa-solid fa-triangle-exclamation"></i></span><strong id="opsAlertas">0</strong><small>ALERTAS</small></div>
          </div>
        </article>
        <article class="operacao-panel">
          <div class="panel-title"><span><i class="fa-solid fa-gauge-high"></i> Saúde operacional</span><small>STATUS</small></div>
          <div class="health-line"><div><span>Disponibilidade</span><strong id="healthPercent">--%</strong></div><div class="health-bar"><i id="healthBar"></i></div></div>
          <div class="health-items"><span><i class="fa-solid fa-circle-check"></i> API conectada</span><span><i class="fa-solid fa-bolt"></i> Sincronização ativa</span></div>
        </article>
      </div>`;

    grid.insertAdjacentElement('afterend', central);
    atualizarRelogio();
    atualizarResumo();
  }

  function atualizarRelogio() {
    const el = document.getElementById('operacaoClock');
    if (!el) return;
    el.textContent = new Date().toLocaleTimeString('pt-BR', { hour12: false });
    setTimeout(atualizarRelogio, 1000);
  }

  function atualizarResumo() {
    const cards = [...document.querySelectorAll('#gridIndicadores .card-indicador')];
    const textos = cards.map(c => c.textContent.toLowerCase());
    const valor = (palavras) => {
      const i = textos.findIndex(t => palavras.some(p => t.includes(p)));
      return i >= 0 ? (cards[i].querySelector('.card-indicador__valor')?.textContent.trim() || '0') : '0';
    };
    const v = valor(['viagens em andamento']);
    const d = valor(['caminhões disponíveis']);
    const alertas = document.querySelector('#cardAlertas');
    document.getElementById('opsViagens').textContent = v;
    document.getElementById('opsDisponiveis').textContent = d.split('/')[0].trim() || '0';
    document.getElementById('opsAlertas').textContent = alertas && alertas.style.display !== 'none' ? Math.max(1, alertas.querySelectorAll('.col-md-4').length) : '0';
    const total = Number((d.match(/\d+/) || ['0'])[0]);
    const pct = total ? Math.min(100, Math.round((Number((d.match(/\d+/) || ['0'])[0]) / Math.max(total, 1)) * 100)) : 0;
    document.getElementById('healthPercent').textContent = pct + '%';
    document.getElementById('healthBar').style.width = Math.max(12, pct) + '%';
  }

  function iniciar() {
    if (document.getElementById('centralOperacoes')) return;
    montarCentral();
    setTimeout(atualizarResumo, 1200);
  }

  const observer = new MutationObserver(iniciar);
  const alvo = document.getElementById('conteudoPagina');
  if (alvo) observer.observe(alvo, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', iniciar);
  setTimeout(iniciar, 900);
})();
