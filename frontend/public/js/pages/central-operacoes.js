// FELIPINHO LAUNCHER — Central de Operações
// Painel visual complementar do dashboard administrativo.
(function () {
  'use strict';

  function injetarEstilos() {
    if (document.getElementById('centralOperacoesStyles')) return;
    const style = document.createElement('style');
    style.id = 'centralOperacoesStyles';
    style.textContent = `
      .central-op{margin:18px 0 26px}
      .central-op-card{background:linear-gradient(135deg,#101914,#17231c);border:1px solid rgba(255,255,255,.08);border-radius:22px;padding:22px;box-shadow:0 18px 45px rgba(11,20,15,.18);overflow:hidden;position:relative}
      .central-op-card:before{content:'';position:absolute;width:280px;height:280px;border-radius:50%;right:-120px;top:-180px;background:radial-gradient(circle,rgba(212,160,23,.22),transparent 68%);pointer-events:none}
      .central-op-top{position:relative;z-index:1;display:flex;justify-content:space-between;align-items:center;gap:20px;margin-bottom:20px}
      .central-op-kicker{display:flex;align-items:center;gap:7px;color:#D4A017;font-size:.62rem;font-weight:900;letter-spacing:.14em}
      .central-op-live{width:7px;height:7px;border-radius:50%;background:#4acb72;box-shadow:0 0 0 5px rgba(74,203,114,.12)}
      .central-op-top h2{margin:6px 0 3px;color:#fff;font-size:1.5rem;font-weight:850;letter-spacing:-.025em}
      .central-op-top p{margin:0;color:rgba(255,255,255,.52);font-size:.78rem}
      .central-op-clock{padding:10px 13px;border-radius:13px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.055);font-variant-numeric:tabular-nums;color:#fff;font-size:.92rem;font-weight:800;letter-spacing:.05em;white-space:nowrap}
      .central-op-stats{position:relative;z-index:1;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
      .central-op-stat{display:flex;align-items:center;gap:10px;min-width:0;padding:14px 12px;border:1px solid rgba(255,255,255,.075);border-radius:15px;background:rgba(255,255,255,.045)}
      .central-op-icon{width:38px;height:38px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex:0 0 38px}
      .central-op-icon.rota{background:rgba(58,166,255,.13);color:#57b5ff}.central-op-icon.disponivel{background:rgba(74,203,114,.12);color:#62d886}.central-op-icon.parado{background:rgba(255,176,32,.12);color:#ffbf4b}.central-op-icon.alerta{background:rgba(255,77,79,.12);color:#ff7779}
      .central-op-stat strong{display:block;color:#fff;font-size:1.22rem;line-height:1;font-weight:850}
      .central-op-stat small{display:block;color:rgba(255,255,255,.45);font-size:.54rem;letter-spacing:.08em;font-weight:800;margin-top:5px;white-space:nowrap}
      .central-op-footer{position:relative;z-index:1;display:flex;flex-wrap:wrap;gap:10px 20px;margin-top:18px;padding-top:15px;border-top:1px solid rgba(255,255,255,.08);color:rgba(255,255,255,.48);font-size:.67rem}
      .central-op-footer span{display:flex;align-items:center;gap:6px}.central-op-footer i{color:#D4A017}.central-op-footer b{color:#dce7df;font-size:.61rem;letter-spacing:.06em}
      @media(max-width:900px){.central-op-stats{grid-template-columns:repeat(2,minmax(0,1fr))}}
      @media(max-width:575px){.central-op{margin:14px 0 20px}.central-op-card{padding:17px;border-radius:18px}.central-op-top{align-items:flex-start}.central-op-top h2{font-size:1.2rem}.central-op-clock{font-size:.75rem;padding:9px}.central-op-stat{padding:12px 10px}.central-op-icon{width:34px;height:34px;flex-basis:34px;border-radius:10px}.central-op-stat strong{font-size:1.05rem}.central-op-stat small{font-size:.5rem}.central-op-footer{flex-direction:column;gap:8px}}
    `;
    document.head.appendChild(style);
  }

  function iniciar() {
    const grid = document.getElementById('gridIndicadores');
    if (!grid || document.getElementById('centralOperacoes')) return;

    injetarEstilos();

    const area = document.createElement('section');
    area.id = 'centralOperacoes';
    area.className = 'central-op';
    area.innerHTML = `
      <div class="central-op-card">
        <div class="central-op-top">
          <div>
            <span class="central-op-kicker"><span class="central-op-live"></span> OPERAÇÃO AGORA</span>
            <h2>Central de Operações</h2>
            <p>Visão rápida da situação atual da operação.</p>
          </div>
          <div class="central-op-clock" id="centralOpClock">--:--:--</div>
        </div>

        <div class="central-op-stats">
          <div class="central-op-stat"><span class="central-op-icon rota"><i class="fa-solid fa-route"></i></span><div><strong id="opViagens">0</strong><small>EM VIAGEM</small></div></div>
          <div class="central-op-stat"><span class="central-op-icon disponivel"><i class="fa-solid fa-truck"></i></span><div><strong id="opDisponiveis">0</strong><small>DISPONÍVEIS</small></div></div>
          <div class="central-op-stat"><span class="central-op-icon parado"><i class="fa-solid fa-circle-pause"></i></span><div><strong id="opParados">0</strong><small>PARADOS</small></div></div>
          <div class="central-op-stat"><span class="central-op-icon alerta"><i class="fa-solid fa-triangle-exclamation"></i></span><div><strong id="opAlertas">0</strong><small>ALERTAS</small></div></div>
        </div>

        <div class="central-op-footer">
          <span><i class="fa-solid fa-satellite-dish"></i> Telemetria <b>ONLINE</b></span>
          <span><i class="fa-solid fa-shield-halved"></i> Sistema <b>OPERACIONAL</b></span>
          <span><i class="fa-solid fa-arrows-rotate"></i> Atualização automática</span>
        </div>
      </div>
    `;

    grid.insertAdjacentElement('afterend', area);
    atualizar();
  }

  function atualizar() {
    const cards = Array.from(document.querySelectorAll('#gridIndicadores .card-indicador'));
    const buscar = termo => cards.find(c => c.textContent.toLowerCase().includes(termo));
    const valor = card => card?.querySelector('.card-indicador__valor')?.textContent.trim() || '0';

    const viagens = parseInt(valor(buscar('viagens em andamento')).replace(/\D/g, ''), 10) || 0;
    const partes = valor(buscar('caminhões disponíveis')).split('/').map(x => parseInt(x.replace(/\D/g, ''), 10) || 0);
    const disponiveis = partes[0] || 0;
    const total = partes[1] || 0;
    const alertas = document.querySelectorAll('#corpoAlertas .col-md-4').length;

    const set = (id, value) => {
      const elemento = document.getElementById(id);
      if (elemento) elemento.textContent = value;
    };

    set('opViagens', viagens);
    set('opDisponiveis', disponiveis);
    set('opParados', Math.max(0, total - disponiveis - viagens));
    set('opAlertas', alertas);
    set('centralOpClock', new Date().toLocaleTimeString('pt-BR', { hour12: false }));
  }

  function boot() {
    const alvo = document.getElementById('conteudoPagina');
    if (!alvo) return setTimeout(boot, 200);

    const observer = new MutationObserver(() => {
      iniciar();
      atualizar();
    });

    observer.observe(alvo, { childList: true, subtree: true });
    iniciar();
    setInterval(atualizar, 15000);
  }

  boot();
})();