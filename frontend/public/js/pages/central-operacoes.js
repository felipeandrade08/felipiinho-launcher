// FELIPINHO LAUNCHER — Etapa 1: Operação Agora
// Camada visual isolada. Não altera login, API, rotas ou o dashboard original.
(function () {
  'use strict';
  function iniciar() {
    const grid = document.getElementById('gridIndicadores');
    if (!grid || document.getElementById('centralOperacoes')) return;
    const area = document.createElement('section');
    area.id = 'centralOperacoes';
    area.className = 'central-op mt-3 mb-4';
    area.innerHTML = '<div class="central-op-card"><div class="central-op-top"><div><span class="central-op-kicker"><span class="central-op-live"></span> OPERAÇÃO AGORA</span><h2>Central de Operações</h2><p>Visão rápida da situação atual da frota.</p></div><div class="central-op-clock" id="centralOpClock">--:--:--</div></div><div class="central-op-stats"><div class="central-op-stat"><span class="central-op-icon rota"><i class="fa-solid fa-route"></i></span><div><strong id="opViagens">0</strong><small>EM VIAGEM</small></div></div><div class="central-op-stat"><span class="central-op-icon disponivel"><i class="fa-solid fa-truck"></i></span><div><strong id="opDisponiveis">0</strong><small>DISPONÍVEIS</small></div></div><div class="central-op-stat"><span class="central-op-icon parado"><i class="fa-solid fa-circle-pause"></i></span><div><strong id="opParados">0</strong><small>PARADOS</small></div></div><div class="central-op-stat"><span class="central-op-icon alerta"><i class="fa-solid fa-triangle-exclamation"></i></span><div><strong id="opAlertas">0</strong><small>ALERTAS</small></div></div></div><div class="central-op-footer"><span><i class="fa-solid fa-satellite-dish"></i> Telemetria <b>ONLINE</b></span><span><i class="fa-solid fa-shield-halved"></i> Sistema <b>OPERACIONAL</b></span><span><i class="fa-solid fa-arrows-rotate"></i> Atualização automática</span></div></div>';
    grid.insertAdjacentElement('afterend', area);
    atualizar();
    setInterval(atualizar, 15000);
  }
  function atualizar() {
    const cards = Array.from(document.querySelectorAll('#gridIndicadores .card-indicador'));
    const buscar = termo => cards.find(c => c.textContent.toLowerCase().includes(termo));
    const valor = card => card?.querySelector('.card-indicador__valor')?.textContent.trim() || '0';
    const viagens = parseInt(valor(buscar('viagens em andamento')).replace(/\D/g, ''), 10) || 0;
    const p = valor(buscar('caminhões disponíveis')).split('/').map(x => parseInt(x.replace(/\D/g, ''), 10) || 0);
    const disponiveis = p[0] || 0, total = p[1] || 0;
    const alertas = document.querySelectorAll('#corpoAlertas .col-md-4').length;
    const set = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
    set('opViagens', viagens); set('opDisponiveis', disponiveis); set('opParados', Math.max(0, total - disponiveis - viagens)); set('opAlertas', alertas);
    set('centralOpClock', new Date().toLocaleTimeString('pt-BR', { hour12: false }));
  }
  function boot() {
    const alvo = document.getElementById('conteudoPagina');
    if (!alvo) return setTimeout(boot, 250);
    new MutationObserver(iniciar).observe(alvo, { childList: true, subtree: true });
    iniciar();
  }
  boot();
})();
