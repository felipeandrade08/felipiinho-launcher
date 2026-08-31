// =====================================================================
// FELIPINHO LAUNCHER - Ranking mensal por quilometragem
// =====================================================================

(async function () {
  montarLayout({
    paginaAtiva: 'ranking',
    titulo: 'Ranking de Quilometragem',
    subtitulo: 'Quem rodar mais quilômetros concluídos lidera o desafio do mês'
  });

  AOS.init({ duration: 500, once: true });

  try {
    const resposta = await fetch(`${API_BASE_URL}/ranking-publico?limite=50`);
    const corpo = await resposta.json();
    if (!resposta.ok || !corpo.sucesso) throw new Error(corpo.mensagem || 'Não foi possível carregar o ranking.');

    const dados = corpo.dados;
    renderizarStatusPremio(dados);
    renderizarPodio(dados.ranking.slice(0, 3));
    renderizarTabela(dados.ranking);
  } catch (erro) {
    console.error('[Ranking]', erro);
    UI.estadoErro('#podioTop3', erro.message);
    document.getElementById('corpoTabelaRanking').innerHTML =
      `<tr><td colspan="6"><div class="estado-vazio"><i class="fa-solid fa-plug-circle-xmark"></i><h4>Ranking indisponível</h4><p>${erro.message}</p></div></td></tr>`;
  }
})();

function renderizarStatusPremio(dados) {
  const badge = document.getElementById('statusPremio');
  if (!badge) return;

  if (dados.premio_habilitado) {
    badge.innerHTML = `<i class="fa-solid fa-gift"></i> Premiação habilitada · ${dados.total_participantes} participantes`;
    badge.style.background = 'rgba(46,204,113,.14)';
    badge.style.borderColor = 'rgba(46,204,113,.35)';
  } else {
    badge.innerHTML = `<i class="fa-solid fa-users"></i> ${dados.total_participantes}/10 participantes · faltam ${dados.faltam_para_premio}`;
  }
}

function renderizarPodio(top3) {
  const container = document.getElementById('podioTop3');

  if (!top3.length) {
    UI.estadoVazio(container, {
      icone: 'fa-trophy',
      titulo: 'O desafio ainda não começou',
      texto: 'Conclua uma viagem neste mês para entrar no ranking.'
    });
    return;
  }

  const ordemVisual = [top3[1], top3[0], top3[2]].filter(Boolean);

  container.innerHTML = `
    <div class="podio-destaque">
      ${ordemVisual.map(m => {
        const classe = m.posicao === 1 ? 'primeiro' : (m.posicao === 2 ? 'segundo' : 'terceiro');
        const medalha = m.posicao === 1 ? '🥇' : (m.posicao === 2 ? '🥈' : '🥉');

        return `
          <div class="podio-coluna ${classe}">
            <div style="font-size:1.7rem;">${medalha}</div>
            <div class="podio-coluna__avatar">${Formatador.iniciais(m.nome)}</div>
            <div class="fw-bold" style="font-size:.9rem;">${m.apelido || m.nome}</div>
            <div class="text-muted" style="font-size:.76rem;margin-bottom:8px;">${m.viagens_mes} viagens concluídas</div>
            <div class="podio-coluna__base">
              <div class="podio-coluna__posicao">${Formatador.km(m.km_mes)}</div>
              <div style="font-size:.7rem;opacity:.85;">quilômetros no mês</div>
            </div>
          </div>`;
      }).join('')}
    </div>`;
}

function renderizarTabela(ranking) {
  const corpo = document.getElementById('corpoTabelaRanking');

  if (!ranking.length) {
    corpo.innerHTML = `<tr><td colspan="6"><div class="estado-vazio"><i class="fa-solid fa-road"></i><h4>Ninguém entrou no ranking ainda</h4><p>O ranking é alimentado automaticamente pelas viagens concluídas.</p></div></td></tr>`;
    return;
  }

  corpo.innerHTML = ranking.map(m => `
    <tr>
      <td class="fw-bold fonte-display" style="font-size:1rem;">${m.posicao}º</td>
      <td>
        <div class="d-flex align-items-center gap-2">
          <div class="podio-avatar" style="width:34px;height:34px;font-size:.8rem;">${Formatador.iniciais(m.nome)}</div>
          <div>
            <div class="fw-semibold" style="font-size:.86rem;">${m.apelido || m.nome}</div>
            <div class="text-muted" style="font-size:.74rem;">Motorista participante</div>
          </div>
        </div>
      </td>
      <td class="fw-bold" style="color:var(--verde-limao)">${Formatador.km(m.km_mes)}</td>
      <td>${m.viagens_mes}</td>
      <td><span class="badge bg-secondary">KM é o critério principal</span></td>
      <td>${m.posicao === 1 ? '<span class="badge bg-warning text-dark">LÍDER DO MÊS</span>' : '—'}</td>
    </tr>
  `).join('');
}
