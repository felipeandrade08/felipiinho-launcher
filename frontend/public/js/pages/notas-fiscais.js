let modalNota, modalVisualizarNota;
let notasAtuais = [];

(async function(){
  if (typeof AuthService !== 'undefined' && AuthService.protegerPaginaAdmin && !AuthService.protegerPaginaAdmin()) return;
  if (typeof montarLayout === 'function') montarLayout({paginaAtiva:'notas-fiscais',titulo:'Notas Fiscais',subtitulo:'Controle e documentação fiscal das viagens'});
  if (typeof AOS !== 'undefined') AOS.init({duration:500,once:true});
  modalNota = new bootstrap.Modal(document.getElementById('modalNota'));
  modalVisualizarNota = new bootstrap.Modal(document.getElementById('modalVisualizarNota'));
  document.getElementById('btnNovaNota')?.addEventListener('click', abrirNovaNota);
  document.getElementById('formNota')?.addEventListener('submit', salvarNota);
  document.getElementById('campoBusca')?.addEventListener('input', renderizar);
  document.getElementById('filtroStatus')?.addEventListener('change', renderizar);
  document.getElementById('btnImprimirNota')?.addEventListener('click', imprimirNota);
  await Promise.all([carregarViagens(), carregarNotas()]);
})();

async function carregarViagens(){
  const select=document.getElementById('campoViagemId'); if(!select) return;
  try{const viagens=await ApiService.get('/viagens'); select.innerHTML='<option value="">Nenhuma</option>'+ (Array.isArray(viagens)?viagens:[]).map(v=>`<option value="${v.id}">${v.origem||'Origem'} → ${v.destino||'Destino'}${v.id?' #'+v.id:''}</option>`).join('');}catch(e){console.warn('Não foi possível carregar viagens:',e);}
}
async function carregarNotas(){
  const corpo=document.getElementById('corpoTabelaNotas');
  try{const dados=await ApiService.get('/notas-fiscais'); notasAtuais=Array.isArray(dados)?dados:(dados?.items||dados?.data||[]); renderizar();}
  catch(e){console.error(e); if(corpo) corpo.innerHTML=`<tr><td colspan="7"><div class="estado-vazio"><i class="fa-solid fa-plug-circle-xmark"></i><h4>Não foi possível carregar as notas</h4><p>${e.message||'Verifique a conexão com a API.'}</p></div></td></tr>`;}
}
function renderizar(){
  const corpo=document.getElementById('corpoTabelaNotas'); if(!corpo) return;
  const busca=(document.getElementById('campoBusca')?.value||'').toLowerCase().trim(); const status=document.getElementById('filtroStatus')?.value||'';
  const lista=notasAtuais.filter(n=>{const texto=[n.numero,n.numero_nota,n.cliente,n.nome_cliente].filter(Boolean).join(' ').toLowerCase(); return (!busca||texto.includes(busca))&&(!status||String(n.status||'').toLowerCase()===status);});
  if(!lista.length){corpo.innerHTML='<tr><td colspan="7"><div class="estado-vazio"><i class="fa-solid fa-file-circle-xmark"></i><h4>Nenhuma nota fiscal encontrada</h4><p>Cadastre uma nota fiscal para começar.</p></div></td></tr>';return;}
  corpo.innerHTML=lista.map(n=>`<tr><td class="fw-semibold">${esc(n.numero||n.numero_nota||'—')}</td><td>${esc(n.cliente||n.nome_cliente||'—')}</td><td>${esc(n.viagem_id?'#'+n.viagem_id:'—')}</td><td class="fw-semibold">${moeda(n.valor_total??n.valor)}</td><td>${data(n.data_emissao)}</td><td><span class="nf-status nf-${esc(n.status||'pendente')}">${esc(n.status||'pendente')}</span></td><td><div class="d-flex gap-2"><button class="btn-gr-icone" title="Visualizar" onclick="visualizarNota(${n.id})"><i class="fa-solid fa-eye"></i></button><button class="btn-gr-icone perigo" title="Excluir" onclick="excluirNota(${n.id})"><i class="fa-solid fa-trash"></i></button></div></td></tr>`).join('');
}
function abrirNovaNota(){document.getElementById('formNota').reset();document.getElementById('notaId').value='';document.getElementById('tituloModalNota').textContent='Emitir Nota Fiscal';document.getElementById('campoDataEmissao').value=new Date().toISOString().slice(0,10);modalNota.show();}
function preencher(n){document.getElementById('notaId').value=n.id||'';document.getElementById('campoCliente').value=n.cliente||n.nome_cliente||'';document.getElementById('campoCnpjCpf').value=n.cnpj_cpf||n.cnpj||n.cpf||'';document.getElementById('campoViagemId').value=n.viagem_id||'';document.getElementById('campoDescricaoCarga').value=n.descricao_carga||n.carga||'';document.getElementById('campoValorTotal').value=n.valor_total??n.valor??'';document.getElementById('campoDataEmissao').value=n.data_emissao?n.data_emissao.slice(0,10):'';document.getElementById('campoStatus').value=n.status||'pendente';document.getElementById('campoObservacoes').value=n.observacoes||'';document.getElementById('tituloModalNota').textContent='Editar Nota Fiscal';modalNota.show();}
async function salvarNota(e){e.preventDefault();const id=document.getElementById('notaId').value;const dados={cliente:document.getElementById('campoCliente').value.trim(),cnpj_cpf:document.getElementById('campoCnpjCpf').value.trim(),viagem_id:document.getElementById('campoViagemId').value||null,descricao_carga:document.getElementById('campoDescricaoCarga').value.trim(),valor_total:document.getElementById('campoValorTotal').value,data_emissao:document.getElementById('campoDataEmissao').value,status:document.getElementById('campoStatus').value,observacoes:document.getElementById('campoObservacoes').value.trim()};try{if(id) await ApiService.put('/notas-fiscais/'+id,dados);else await ApiService.post('/notas-fiscais',dados);modalNota.hide();UI.toastSucesso(id?'Nota atualizada com sucesso!':'Nota fiscal emitida com sucesso!');await carregarNotas();}catch(e){console.error(e);UI.toastErro(e.message||'Erro ao salvar nota fiscal.');}}
function visualizarNota(id){const n=notasAtuais.find(x=>x.id===id);if(!n)return;document.getElementById('documentoNotaFiscal').innerHTML=`<div class="nf-documento"><div class="nf-doc-head"><strong>FELIPINHO LAUNCHER</strong><span>NOTA FISCAL</span></div><div class="nf-doc-grid"><div><small>Número</small><strong>${esc(n.numero||n.numero_nota||'—')}</strong></div><div><small>Status</small><strong>${esc(n.status||'pendente')}</strong></div><div><small>Cliente</small><strong>${esc(n.cliente||n.nome_cliente||'—')}</strong></div><div><small>Documento</small><strong>${esc(n.cnpj_cpf||n.cnpj||n.cpf||'—')}</strong></div><div><small>Valor</small><strong>${moeda(n.valor_total??n.valor)}</strong></div><div><small>Emissão</small><strong>${data(n.data_emissao)}</strong></div></div><div class="nf-doc-desc"><small>Descrição da carga</small><p>${esc(n.descricao_carga||n.carga||'Não informado')}</p></div><div class="nf-doc-desc"><small>Observações</small><p>${esc(n.observacoes||'Nenhuma')}</p></div></div>`;modalVisualizarNota.show();}
function imprimirNota(){const doc=document.getElementById('documentoNotaFiscal');if(!doc)return;const w=window.open('','_blank','width=900,height=700');if(!w)return;w.document.write('<html><head><title>Nota Fiscal</title><style>body{font-family:Arial;padding:35px;color:#18211c}small{display:block;color:#777;font-size:11px;text-transform:uppercase;letter-spacing:1px}.nf-doc-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:20px;margin:25px 0}.nf-doc-grid div{padding:12px;border:1px solid #ddd;border-radius:8px}.nf-doc-head{display:flex;justify-content:space-between;border-bottom:2px solid #222;padding-bottom:15px}.nf-doc-desc{margin-top:15px;padding:12px;background:#f6f7f6}</style></head><body>'+doc.innerHTML+'</body></html>');w.document.close();w.print();}
async function excluirNota(id){const ok=typeof UI?.confirmarExclusao==='function'?await UI.confirmarExclusao('esta nota fiscal'):confirm('Excluir esta nota fiscal?');if(!ok)return;try{await ApiService.delete('/notas-fiscais/'+id);UI.toastSucesso('Nota fiscal excluída.');await carregarNotas();}catch(e){UI.toastErro(e.message||'Erro ao excluir nota.');}}
function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));}function moeda(v){const n=Number(v||0);return n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});}function data(v){if(!v)return'—';const d=new Date(v);return isNaN(d)?esc(v):d.toLocaleDateString('pt-BR');}
