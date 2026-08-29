// FELIPINHO LAUNCHER - Gestão administrativa de empresas
const estadoEmpresas = { lista: [], editando: null };

const esc = (v='') => String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const fmt = n => Number(n || 0).toLocaleString('pt-BR');

function abrirModal(empresa=null) {
  estadoEmpresas.editando = empresa;
  document.getElementById('empresaModal').classList.add('open');
  document.getElementById('empresaModal').setAttribute('aria-hidden','false');
  document.getElementById('modalTitulo').textContent = empresa ? 'Editar empresa' : 'Nova empresa';
  document.getElementById('btnSalvarTexto').textContent = empresa ? 'Salvar alterações' : 'Criar empresa';
  const campos = ['empresaId','nome','slug','descricao','localizacao','data_fundacao','logo_url','capa_url','discord','instagram','site','caminhoes','motoristas','pontuacao_ranking','posicao_ranking'];
  const mapa = {empresaId:'id',nome:'nome',slug:'slug',descricao:'descricao',localizacao:'localizacao',data_fundacao:'data_fundacao',logo_url:'logo_url',capa_url:'capa_url',discord:'discord',instagram:'instagram',site:'site',caminhoes:'caminhoes',motoristas:'motoristas',pontuacao_ranking:'pontuacao_ranking',posicao_ranking:'posicao_ranking'};
  campos.forEach(id => { const el=document.getElementById(id); if(el) el.value = empresa ? (empresa[mapa[id]] ?? '') : (id==='caminhoes'||id==='motoristas'||id==='pontuacao_ranking' ? '0' : ''); });
  document.getElementById('destaque').checked = !!empresa?.destaque;
  document.getElementById('status').checked = empresa ? empresa.status !== 'inativa' : true;
  document.getElementById('nome').focus();
}
function fecharModal(){ document.getElementById('empresaModal').classList.remove('open'); document.getElementById('empresaModal').setAttribute('aria-hidden','true'); }

function card(e){
  const capa=e.capa_url || e.capa || 'img/backgrounds/frota-login.jpg';
  const logo=e.logo_url || e.logo || 'img/logo/logo-gr-expresso.png';
  const ativa=e.status !== 'inativa';
  return `<article class="ge-card"><div class="ge-cover" style="background-image:url('${esc(capa)}')"></div><div class="ge-card-body"><div class="ge-card-top"><div><img class="ge-card-logo" src="${esc(logo)}" alt="" onerror="this.style.display='none'"><h3>${esc(e.nome)}</h3><div class="ge-location"><i class="fa-solid fa-location-dot"></i> ${esc(e.localizacao || 'Localização não informada')}</div></div><span class="ge-badge ${ativa?'':'off'}">${ativa?'ATIVA':'INATIVA'}</span></div><div class="ge-metrics"><span><strong>${fmt(e.motoristas)}</strong>motoristas</span><span><strong>${fmt(e.caminhoes)}</strong>caminhões</span><span><strong>${fmt(e.pontuacao_ranking)}</strong>pontos</span><span><strong>#${e.posicao_ranking || '—'}</strong>ranking</span></div><div class="ge-card-actions"><button data-editar="${e.id}" class="gold"><i class="fa-solid fa-pen"></i> Editar</button><a href="empresa.html?slug=${encodeURIComponent(e.slug)}" target="_blank"><i class="fa-solid fa-arrow-up-right-from-square"></i> Ver perfil</a></div></div></article>`;
}
function render(){
  const q=document.getElementById('geBusca').value.toLowerCase().trim(); const s=document.getElementById('geStatus').value;
  const lista=estadoEmpresas.lista.filter(e=>(!q || `${e.nome} ${e.localizacao||''}`.toLowerCase().includes(q)) && (!s || e.status===s));
  document.getElementById('geLista').innerHTML=lista.length?lista.map(card).join(''):'<div class="empty"><i class="fa-solid fa-building-circle-exclamation" style="font-size:2rem"></i><p>Nenhuma empresa encontrada.</p></div>';
  const ativas=estadoEmpresas.lista.filter(e=>e.status!=='inativa').length; const motoristas=estadoEmpresas.lista.reduce((a,e)=>a+Number(e.motoristas||0),0);
  document.getElementById('geResumo').innerHTML=`<div class="ge-stat"><strong>${fmt(estadoEmpresas.lista.length)}</strong><span>Empresas cadastradas</span></div><div class="ge-stat"><strong>${fmt(ativas)}</strong><span>Empresas ativas</span></div><div class="ge-stat"><strong>${fmt(motoristas)}</strong><span>Motoristas vinculados</span></div>`;
  document.querySelectorAll('[data-editar]').forEach(b=>b.addEventListener('click',()=>abrirModal(estadoEmpresas.lista.find(e=>String(e.id)===b.dataset.editar))));
}
async function carregar(){
  try { estadoEmpresas.lista=await ApiService.get('/empresas'); render(); }
  catch(err){ document.getElementById('geLista').innerHTML=`<div class="empty"><i class="fa-solid fa-lock" style="font-size:2rem"></i><p>${esc(err.message || 'Não foi possível carregar as empresas.')}</p><small>Se você não estiver logado como administrador, entre no sistema e abra novamente esta página.</small></div>`; }
}
function dadosFormulario(){
  const val=id=>document.getElementById(id).value.trim();
  return {nome:val('nome'),slug:val('slug')||undefined,descricao:val('descricao'),localizacao:val('localizacao'),data_fundacao:val('data_fundacao')||null,logo_url:val('logo_url'),capa_url:val('capa_url'),discord:val('discord'),instagram:val('instagram'),site:val('site'),caminhoes:Number(val('caminhoes')||0),motoristas:Number(val('motoristas')||0),pontuacao_ranking:Number(val('pontuacao_ranking')||0),posicao_ranking:val('posicao_ranking')?Number(val('posicao_ranking')):null,destaque:document.getElementById('destaque').checked,status:document.getElementById('status').checked?'ativa':'inativa'};
}
document.addEventListener('DOMContentLoaded',()=>{
  document.getElementById('btnNovaEmpresa').onclick=()=>abrirModal(); document.getElementById('btnFecharModal').onclick=fecharModal; document.getElementById('btnCancelar').onclick=fecharModal;
  document.getElementById('empresaModal').addEventListener('click',e=>{if(e.target.id==='empresaModal')fecharModal()}); document.getElementById('geBusca').oninput=render; document.getElementById('geStatus').onchange=render;
  document.getElementById('empresaForm').onsubmit=async e=>{e.preventDefault(); const dados=dadosFormulario(); try{ if(estadoEmpresas.editando) await ApiService.put(`/empresas/${estadoEmpresas.editando.id}`,dados); else await ApiService.post('/empresas',dados); fecharModal(); await carregar(); Swal.fire({icon:'success',title:'Empresa salva',text:'Os dados foram atualizados com sucesso.',timer:1800,showConfirmButton:false}); }catch(err){Swal.fire({icon:'error',title:'Não foi possível salvar',text:err.message||'Erro ao comunicar com a API.'});} };
  carregar();
});
