// FELIPINHO LAUNCHER — Central de Operações / Frota em tempo real
// Camada visual independente: não altera a API nem a lógica das páginas existentes.
(function () {
  'use strict';

  function esc(valor) {
    return String(valor ?? '').replace(/[&<>'"]/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[c]));
  }

  function montarBloco() {
    if (document.getElementById('centralFrotaLive')) return;
    const indicadores = document.getElementById('gridIndicadores');
    if (!indicadores) return;

    const bloco = document.createElement('section');
    bloco.id = 'centralFrotaLive';
    bloco.className = 'row g-3 mb-4';
    bloco.setAttribute('data-aos', 'fade-up');
    bloco.innerHTML = `
      <div class="col-lg-8">
        <div class="card-gr h-100">
          <div class="card-gr__header d-flex align-items-center justify-content-between">
            <div><h3 class="mb-1"><i class="fa-solid fa-location-crosshairs me-2"></i>Frota em tempo real</h3><small class="text-muted">Visão operacional dos veículos</small></div>
            <span class="badge-live"><span class="badge-live__dot"></span>ONLINE</span>
          </div>
          <div class="card-gr__body p-3">
            <div class="fleet-live" id="fleetLiveMap">
              <div class="fleet-road"></div><div class="fleet-road r2"></div>
              <div class="fleet-truck t1"><i class="fa-solid fa-truck"></i></div>
              <div class="fleet-truck t2"><i class="fa-solid fa-truck"></i></div>
              <div class="fleet-truck t3"><i class="fa-solid fa-truck"></i></div>
              <div class="fleet-truck t4"><i class="fa-solid fa-truck"></i></div>
              <div class="fleet-live__legend"><strong id="fleetCount">Frota conectada</strong> · atualização automática</div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-lg-4">
        <div class="card-gr h-100">
          <div class="card-gr__header d-flex justify-content-between align-items-center"><h3><i class="fa-solid fa-truck-fast me-2"></i>Veículos ativos</h3><small id="fleetUpdated" class="text-muted">agora</small></div>
          <div class="card-gr__body p-0" id="fleetLiveList"><div class="text-center text-muted py-5">Sincronizando frota...</div></div>
        </div>
      </div>`;

    indicadores.insertAdjacentElement('afterend', bloco);
  }

  function preencher(viagens) {
    const lista = document.getElementById('fleetLiveList');
    const count = document.getElementById('fleetCount');
    if (!lista) return;

    const dados = (viagens || []).filter(v => v && v.caminhao_placa).slice(0, 5);
    if (count) count.textContent = `${dados.length || 0} veículo(s) monitorado(s)`;

    if (!dados.length) {
      lista.innerHTML = '<div class="text-center text-muted py-5"><i class="fa-solid fa-truck-moving mb-2 d-block"></i>Nenhum veículo em operação registrado.</div>';
      return;
    }

    lista.innerHTML = dados.map((v, i) => `
      <div class="fleet-side-item">
        <div class="fleet-side-icon"><i class="fa-solid fa-truck"></i></div>
        <div class="fleet-side-main">
          <strong>${esc(v.caminhao_placa)}</strong>
          <span>${esc(v.motorista_nome || 'Motorista não informado')} · ${esc(v.origem || 'Origem')} → ${esc(v.destino || 'Destino')}</span>
        </div>
        <span class="fleet-side-status">${String(v.status || '').toLowerCase() === 'em_andamento' ? 'EM VIAGEM' : esc(v.status || 'ATIVO')}</span>
      </div>`).join('');

    const atualizado = document.getElementById('fleetUpdated');
    if (atualizado) atualizado.textContent = `atualizado ${new Date().toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}`;
  }

  async function sincronizar() {
    try {
      const resumo = await ApiService.get('/dashboard/resumo');
      preencher(resumo.ultimas_viagens || []);
    } catch (erro) {
      console.warn('Central de Operações: não foi possível sincronizar a frota.', erro);
    }
  }

  function iniciar() {
    if (!window.AuthService || !AuthService.ehAdmin()) return;
    montarBloco();
    sincronizar();
    setInterval(sincronizar, 30000);
  }

  const observer = new MutationObserver(() => {
    if (document.getElementById('gridIndicadores')) {
      observer.disconnect();
      iniciar();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
  setTimeout(iniciar, 1200);
})();
