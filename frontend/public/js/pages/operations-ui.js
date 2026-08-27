// FELIPINHO LAUNCHER — Central de Operações
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
          <p>Visão operacional da frota, viagens e desempenho da transportadora.</p>
        </div>
        <div class="operacao-clock" id="operacaoClock">--:--:--</div>
      </div>
      <div class="operacao-strip">
        <div><i class="fa-solid fa-satellite-dish"></i><span>Telemetria</span><strong class="text-success"> ONLINE</strong></div>
        <div><i class="fa-solid fa-shield-halved"></i><span>Sistema</span><strong class="text-success"> OPERACIONAL</strong></div>
        <div><i class="fa-solid fa-arrows-rotate"></i><span>Sincronização</span><strong> AUTOMÁTICA</strong></div>
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
          <div class="health-line"><div><span>Disponibilidade da frota</span><strong id="healthPercent">--%</strong></div><div class="health-bar"><i id="healthBar"></i></div></div>
          <div class="health-items"><span><i class="fa-solid fa-circle-check"></i> API conectada</span><span><i class="fa-solid fa-bolt"></i> Sincronização ativa</span></div>
        </article>
      </div>
      <div class="operacao-frota-grid">
        <article class="operacao-panel fleet-map-panel">
          <div class="panel-title"><span><i class="fa-solid fa-map-location-dot"></i> Frota em operação</span><small><span class="pulse-dot"></span> AO VIVO</small></div>
          <div class="fleet-live" id="fleetLive">
            <div class="fleet-road"></div><div class="fleet-road r2"></div>
            <div class="fleet-truck t1"><i class="fa-solid fa-truck"></i></div>
            <div class="fleet-truck t2"><i class="fa-solid fa-truck"></i></div>
            <div class="fleet-truck t3"><i class="fa-solid fa-truck"></i></div>
            <div class="fleet-truck t4"><i class="fa-solid fa-truck"></i></div>
            <div class="fleet-live__legend"><strong>Monitoramento visual</strong> · posições exibidas quando a telemetria disponibilizar coordenadas.</div>
          </div>
        </article>
        <article class="operacao-panel fleet-side-panel">
          <div class="panel-title"><span><i class="fa-solid fa-truck-front"></i> Veículos ativos</span><small id="fleetCount">0</small></div>
          <div id="fleetList"><div class="text-center text-muted py-4" style="font-size:.75rem">Sincronizando frota...</div></div>
        </article>
      </div>`;

    grid.insertAdjacentElement('afterend', central);
    atualizarRelogio();
    atualizarResumo();
    montarListaFrota();
  }

  function atualizarRelogio() {
    const el = document.getElementById('operacaoClock');
    if (!el) return;
    el.textContent = new Date().toLocaleTimeString('pt-BR', { hour12: false });
    setTimeout(atualizarRelogio, 1000);
  }

  function obterNumero(texto) {
    const m = String(texto || '').match(/\d+/);
    return m ? Number(m[0]) : 0;
  }

  function atualizarResumo() {
    const cards = [...document.querySelectorAll('#gridIndicadores .card-indicador')];
    const encontrar = (termos) => cards.find(c => termos.some(t => c.textContent.toLowerCase().includes(t)));
    const viagem = encontrar(['viagens em andamento']);
    const disponibilidade = encontrar(['caminhões disponíveis']);
    const alertas = document.querySelector('#cardAlertas');
    const v = viagem?.querySelector('.card-indicador__valor')?.textContent.trim() || '0';
    const d = disponibilidade?.querySelector('.card-indicador__valor')?.textContent.trim() || '0 / 0';
    const partes = d.split('/').map(x => obterNumero(x));
    const disponiveis = partes[0] || 0;
    const total = partes[1] || 0;
    const qtdAlertas = alertas && alertas.style.display !== 'none' ? alertas.querySelectorAll('.col-md-4').length : 0;
    const pct = total ? Math.min(100, Math.round((disponiveis / total) * 100)) : 0;
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('opsViagens', v); set('opsDisponiveis', disponiveis); set('opsAlertas', qtdAlertas);
    set('healthPercent', pct + '%');
    const bar = document.getElementById('healthBar'); if (bar) bar.style.width = Math.max(8, pct) + '%';
  }

  function montarListaFrota() {
    const list = document.getElementById('fleetList');
    if (!list) return;
    const linhas = [...document.querySelectorAll('#corpoUltimasViagens tr')].filter(tr => tr.children.length >= 4);
    const itens = linhas.slice(0, 5).map(tr => {
      const td = tr.children;
      return { motorista: td[1]?.textContent?.trim() || 'Motorista', rota: td[2]?.textContent?.replace(/\s+/g, ' ').trim() || 'Rota em atualização', caminhao: td[3]?.textContent?.trim() || 'Veículo' };
    });
    if (!itens.length) {
      list.innerHTML = '<div class="text-center text-muted py-4" style="font-size:.75rem">Nenhum veículo em viagem no momento.</div>';
      const c = document.getElementById('fleetCount'); if (c) c.textContent = '0';
      return;
    }
    const count = document.getElementById('fleetCount'); if (count) count.textContent = itens.length;
    list.innerHTML = itens.map(i => `<div class="fleet-side-item"><div class="fleet-side-icon"><i class="fa-solid fa-truck"></i></div><div class="fleet-side-main"><strong>${i.caminhao}</strong><span>${i.motorista} · ${i.rota}</span></div><span class="fleet-side-status">EM ROTA</span></div>`).join('');
  }

  function iniciar() {
    if (document.getElementById('centralOperacoes')) return;
    montarCentral();
    setTimeout(() => { atualizarResumo(); montarListaFrota(); }, 1500);
  }

  const observer = new MutationObserver(() => { if (!document.getElementById('centralOperacoes')) iniciar(); else { atualizarResumo(); montarListaFrota(); } });
  const alvo = document.getElementById('conteudoPagina');
  if (alvo) observer.observe(alvo, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', iniciar);
  setTimeout(iniciar, 900);
})();
