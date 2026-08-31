// =====================================================================
// FELIPINHO LAUNCHER - Desafio mensal por quilometragem
// =====================================================================

let dadosTemporadaAtual = null;
let intervaloContador = null;

(async function iniciarDesafio() {
  montarLayout({
    paginaAtiva: 'ranking',
    titulo: 'Desafio do Mês',
    subtitulo: 'Dispute o topo pela maior quilometragem concluída'
  });

  AOS.init({ duration: 500, once: true });
  await carregarDesafio();
  setInterval(carregarDesafio, 60000);
})();

async function carregarDesafio() {
  try {
    const resposta = await fetch(\`${API_BASE_URL}/ranking-publico?limite=50\`);
    const corpo = await resposta.json();

    if (!resposta.ok || !corpo.sucesso) {
      throw new Error(corpo.mensagem || 'Não foi possível carregar o desafio.');
    }

    dadosTemporadaAtual = corpo.dados;
    renderizarTemporada(dadosTemporadaAtual);
    renderizarResumo(dadosTemporadaAtual);
    renderizarStatusPremio(dadosTemporadaAtual);
    renderizarPodio(dadosTemporadaAtual.ranking.slice(0, 3));
    renderizarTabela(dadosTemporadaAtual.ranking);
  } catch (erro) {
    console.error('[Desafio]', erro);
    const podio = document.getElementById('podioTop3');
    if (podio) {
      podio.innerHTML = \`<div class="estado-vazio"><i class="fa-solid fa-plug-circle-xmark"></i><h4>Desafio indisponível</h4><p>${erro.message}</p></div>\`;
    }
  }
}

function renderizarTemporada(dados) {
  const temporada = dados.temporada || {};
  document.getElementById('seasonTitle').textContent = temporada.nome || 'Desafio do Mês';

  const inicio = formatarData(temporada.inicio || dados.periodo?.inicio);
  const fim = formatarData(temporada.fim || dados.periodo?.fim);
  document.getElementById('periodoTemporada').textContent = inicio && fim ? \`${inicio} → ${fim}\` : 'Temporada mensal';

  iniciarContador(temporada.fim || dados.periodo?.fim);
}

function renderizarResumo(dados) {
  const ranking = dados.ranking || [];
  const minimo = Number(dados.temporada?.participantes_minimos || dados.periodo?.minimo_participantes_premio || 10);
  const total = Number(dados.total_participantes || 0);
  const faltam = Math.max(0, minimo - total);
  const progresso = Math.min(100, (total / minimo) * 100);

  document.getElementById('participantesNumero').textContent = \`${total}/${minimo}\`;
  document.getElementById('participantesTexto').textContent =
    dados.premio_habilitado
      ? 'Meta atingida. A temporada está elegível para premiação.'
      : \`Faltam ${faltam} participante(s) para habilitar a premiação.\`;
  document.getElementById('barraParticipantes').style.width = \`${progresso}%\`;

  const lider = ranking[0];
  document.getElementById('liderNome').textContent = lider ? (lider.apelido || lider.nome) : 'Aguardando o primeiro motorista';
  document.getElementById('liderKm').textContent = lider
    ? \`${Formatador.km(lider.km_mes)} · ${lider.viagens_mes} viagem(ns)\`
    : 'Conclua uma viagem para liderar o desafio.';

  document.getElementById('premioTitulo').textContent =
    dados.temporada?.premio?.titulo || (dados.premio_habilitado ? 'Premiação habilitada' : 'Premiação em breve');
  document.getElementById('premioDescricao').textContent =
    dados.temporada?.premio?.descricao ||
    (dados.premio_habilitado
      ? 'O campeão poderá concorrer à futura recompensa definida pela organização.'
      : 'São necessários 10 participantes ativos no mês.');
}

function iniciarContador(dataFim) {
  if (intervaloContador) clearInterval(intervaloContador);
  if (!dataFim) return;

  const destino = new Date(\`${dataFim}T00:00:00\`);

  const atualizar = () => {
    const restante = destino.getTime() - Date.now();
    const el = document.getElementById('contadorTemporada');
    if (!el) return;

    if (restante <= 0) {
      el.textContent = 'ENCERRADA';
      return;
    }

    const totalMinutos = Math.floor(restante / 60000);
    const dias = Math.floor(totalMinutos / 1440);
    const horas = Math.floor((totalMinutos % 1440) / 60);
    const minutos = totalMinutos % 60;

    el.textContent = \`${dias}d ${String(horas).padStart(2, '0')}h ${String(minutos).padStart(2, '0')}m\`;
  };

  atualizar();
  intervaloContador = setInterval(atualizar, 30000);
}

function formatarData(valor) {
  if (!valor) return '';
  const [ano, mes, dia] = String(valor).slice(0, 10).split('-');
  if (!ano || !mes || !dia) return '';
  return \`${dia}/${mes}/${ano}\`;
}

function renderizarStatusPremio(dados) {
  const badge = document.getElementById('statusPremio');
  if (!badge) return;

  if (dados.premio_habilitado) {
    badge.innerHTML = \`<i class="fa-solid fa-gift"></i> Premiação habilitada · ${dados.total_participantes} participantes\`;
    badge.classList.add('rank-badge--active');
  } else {
    badge.innerHTML = \`<i class="fa-solid fa-users"></i> ${dados.total_participantes}/10 participantes · faltam ${dados.faltam_para_premio}\`;
    badge.classList.remove('rank-badge--active');
  }
}

function renderizarPodio(top3) {
  const container = document.getElementById('podioTop3');

  if (!top3.length) {
    container.innerHTML = \`
      <div class="estado-vazio challenge-empty">
        <i class="fa-solid fa-flag-checkered"></i>
        <h4>A temporada está esperando o primeiro competidor</h4>
        <p>Conclua uma viagem com a telemetria conectada para entrar no ranking.</p>
      </div>\`;
    return;
  }

  const ordemVisual = [top3[1], top3[0], top3[2]].filter(Boolean);

  container.innerHTML = \`
    <div class="podio-destaque">
      ${ordemVisual.map(m => {
        const classe = m.posicao === 1 ? 'primeiro' : (m.posicao === 2 ? 'segundo' : 'terceiro');
        const medalha = m.posicao === 1 ? '🥇' : (m.posicao === 2 ? '🥈' : '🥉');

        return \`
          <div class="podio-coluna ${classe}">
            <div class="podio-medalha">${medalha}</div>
            <div class="podio-coluna__avatar">${Formatador.iniciais(m.nome)}</div>
            <div class="fw-bold podio-nome">${m.apelido || m.nome}</div>
            <div class="text-muted podio-viagens">${m.viagens_mes} viagens concluídas</div>
            <div class="podio-coluna__base">
              <div class="podio-coluna__posicao">${Formatador.km(m.km_mes)}</div>
              <div>quilômetros na temporada</div>
            </div>
          </div>\`;
      }).join('')}
    </div>\`;
}

function renderizarTabela(ranking) {
  const corpo = document.getElementById('corpoTabelaRanking');

  if (!ranking.length) {
    corpo.innerHTML = \`<tr><td colspan="6"><div class="estado-vazio"><i class="fa-solid fa-road"></i><h4>Ninguém entrou no ranking ainda</h4><p>O ranking é alimentado automaticamente pelas viagens concluídas.</p></div></td></tr>\`;
    return;
  }

  corpo.innerHTML = ranking.map(m => \`
    <tr class="${m.posicao <= 3 ? 'linha-top' : ''}">
      <td class="fw-bold fonte-display rank-position">${m.posicao === 1 ? '🥇' : m.posicao === 2 ? '🥈' : m.posicao === 3 ? '🥉' : m.posicao + 'º'}</td>
      <td>
        <div class="d-flex align-items-center gap-2">
          <div class="podio-avatar" style="width:34px;height:34px;font-size:.8rem;">${Formatador.iniciais(m.nome)}</div>
          <div>
            <div class="fw-semibold" style="font-size:.86rem;">${m.apelido || m.nome}</div>
            <div class="text-muted" style="font-size:.74rem;">Competidor da temporada</div>
          </div>
        </div>
      </td>
      <td class="fw-bold rank-km">${Formatador.km(m.km_mes)}</td>
      <td>${m.viagens_mes}</td>
      <td><span class="criterio-pill"><i class="fa-solid fa-road"></i> Quilometragem</span></td>
      <td>${m.posicao === 1 ? '<span class="leader-pill"><i class="fa-solid fa-crown"></i> LÍDER</span>' : '<span class="participante-pill">PARTICIPANDO</span>'}</td>
    </tr>
  \`).join('');
}
