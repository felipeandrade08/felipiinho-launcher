// FELIPINHO LAUNCHER - Gestão de equipe / contratação
const estadoEquipe = { empresa:null, status:'pendente', solicitacoes:[], recusando:null };
const esc = (v='') => String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const fmtDate = v => v ? new Date(String(v).replace(' ','T')).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'}) : '—';

function render(){
  const e=estadoEquipe.empresa||{};
  document.getElementById('empresaBox').innerHTML=`<span>SUA TRANSPORTADORA</span><strong>${esc(e.nome||'Empresa')}</strong>`;
  const pend=estadoEquipe.status==='pendente'?estadoEquipe.solicitacoes.length:0;
  document.getElementById('resumo').innerHTML=`<div class="stat"><strong>${fmt(e.motoristas)}</strong><span>Motoristas ativos</span></div><div class="stat"><strong>${pend}</strong><span>Solicitações pendentes</span></div><div class="stat"><strong>${fmt(e.caminhoes)}</strong><span>Caminhões cadastrados</span></div>`;
  const lista=document.getElementById('lista');
  if(!estadoEquipe.solicitacoes.length){lista.innerHTML=`<div class="empty"><i class="fa-solid fa-user-check"></i><p>Nenhuma solicitação ${estadoEquipe.status==='pendente'?'pendente':''} encontrada.</p><small>Quando um motorista solicitar entrada, ele aparecerá aqui.</small></div>`;return;}
  lista.innerHTML=estadoEquipe.solicitacoes.map(s=>`<article class="request"><div><h3><i class="fa-solid fa-id-card"></i> ${esc(s.nome||'Motorista')}</h3><div class="meta">${esc(s.email||'E-mail não informado')} · Cadastro #${s.usuario_id} · ${fmtDate(s.criado_em)}</div>${s.mensagem?`<div class="message"><strong>Mensagem:</strong> ${esc(s.mensagem)}</div>`:''}<span class="status">${s.status.toUpperCase()}</span>${s.motivo_recusa?`<div class="message"><strong>Motivo:</strong> ${esc(s.motivo_recusa)}</div>`:''}</div><div class="actions-row">${estadoEquipe.status==='pendente'?`<button class="btn primary" data-aprovar="${s.id}"><i class="fa-solid fa-check"></i> Aprovar</button><button class="btn danger" data-recusar="${s.id}"><i class="fa-solid fa-xmark"></i> Recusar</button>`:''}</div></article>`).join('');
  lista.querySelectorAll('[data-aprovar]').forEach(b=>b.onclick=()=>aprovar(b.dataset.aprovar));
  lista.querySelectorAll('[data-recusar]').forEach(b=>b.onclick=()=>abrirRecusa(b.dataset.recusar));
}
async function carregar(){
  try{const dados=await ApiService.get(`/contratacoes/empresa/solicitacoes?status=${encodeURIComponent(estadoEquipe.status)}`);estadoEquipe.empresa=dados.empresa;estadoEquipe.solicitacoes=dados.solicitacoes||[];render();}
  catch(err){document.getElementById('lista').innerHTML=`<div class="error"><i class="fa-solid fa-lock"></i><p>${esc(err.message||'Não foi possível carregar sua equipe.')}</p><small>Esta área é exclusiva do proprietário, administrador ou gestor de uma empresa ativa.</small></div>`;document.getElementById('empresaBox').textContent='Acesso restrito';}
}
async function aprovar(id){
  const ok=await Swal.fire({icon:'question',title:'Aprovar motorista?',text:'O motorista será contratado e passará a fazer parte da equipe.',showCancelButton:true,confirmButtonText:'Sim, aprovar',cancelButtonText:'Cancelar',confirmButtonColor:'#a8d400'});
  if(!ok.isConfirmed)return;
  try{await ApiService.patch(`/contratacoes/empresa/solicitacoes/${id}/aprovar`,{});await carregar();Swal.fire({icon:'success',title:'Motorista contratado!',text:'O motorista agora faz parte da sua equipe.',timer:1800,showConfirmButton:false});}catch(err){Swal.fire({icon:'error',title:'Não foi possível aprovar',text:err.message});}
}
function abrirRecusa(id){estadoEquipe.recusando=id;document.getElementById('motivo').value='';document.getElementById('recusaModal').classList.add('open');document.getElementById('motivo').focus();}
function fecharRecusa(){estadoEquipe.recusando=null;document.getElementById('recusaModal').classList.remove('open');}
async function recusar(){if(!estadoEquipe.recusando)return;const id=estadoEquipe.recusando;const motivo=document.getElementById('motivo').value.trim();try{await ApiService.patch(`/contratacoes/empresa/solicitacoes/${id}/recusar`,{motivo});fecharRecusa();await carregar();Swal.fire({icon:'success',title:'Solicitação recusada',timer:1500,showConfirmButton:false});}catch(err){Swal.fire({icon:'error',title:'Não foi possível recusar',text:err.message});}}

document.addEventListener('DOMContentLoaded',()=>{document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));b.classList.add('active');estadoEquipe.status=b.dataset.status;carregar();});document.getElementById('cancelarRecusa').onclick=fecharRecusa;document.getElementById('confirmarRecusa').onclick=recusar;document.getElementById('recusaModal').onclick=e=>{if(e.target.id==='recusaModal')fecharRecusa();};carregar();});