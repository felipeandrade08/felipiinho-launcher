// Menu administrativo: Solicitações de Empresas
(function () {
  function instalar() {
    if (!window.AuthService || !AuthService.ehAdmin()) return;
    const nav = document.querySelector('.sidebar-nav');
    if (!nav || document.getElementById('menuSolicitacoesEmpresas')) return;
    const grupo = [...nav.querySelectorAll('.sidebar-grupo-titulo')].find(x => x.textContent.trim() === 'Sistema');
    if (!grupo) return;
    const link = document.createElement('a');
    link.id='menuSolicitacoesEmpresas';
    link.href='solicitacoes-empresas.html';
    link.className='sidebar-link';
    link.innerHTML='<i class="fa-solid fa-building-circle-check"></i><span>Solicitações de Empresas</span><span class="sidebar-badge" id="badgeEmpresasPendentes" style="display:none"></span>';
    grupo.insertAdjacentElement('afterend', link);
    atualizar();
  }
  async function atualizar(){
    try{
      const lista=await ApiService.get('/empresas/solicitacoes');
      const badge=document.getElementById('badgeEmpresasPendentes');
      if(badge && lista.length){badge.textContent=lista.length;badge.style.display='inline-flex';}
    }catch(e){console.warn('Não foi possível atualizar pendências de empresas:',e.message)}
  }
  const timer=setInterval(()=>{if(document.querySelector('.sidebar-nav')){clearInterval(timer);instalar()}},100);
})();
