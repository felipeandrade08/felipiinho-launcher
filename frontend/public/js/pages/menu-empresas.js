// Menu administrativo: Solicitações de Empresas + Equipe da transportadora
(function () {
  function instalar() {
    const nav = document.querySelector('.sidebar-nav');
    if (!nav) return;
    const grupo = [...nav.querySelectorAll('.sidebar-grupo-titulo')].find(x => x.textContent.trim() === 'Sistema');
    if (!grupo) return;

    if (window.AuthService && AuthService.ehAdmin() && !document.getElementById('menuSolicitacoesEmpresas')) {
      const link = document.createElement('a');
      link.id='menuSolicitacoesEmpresas';
      link.href='solicitacoes-empresas.html';
      link.className='sidebar-link';
      link.innerHTML='<i class="fa-solid fa-building-circle-check"></i><span>Solicitações de Empresas</span><span class="sidebar-badge" id="badgeEmpresasPendentes" style="display:none"></span>';
      grupo.insertAdjacentElement('afterend', link);
      atualizarEmpresas();
    }

    if (!document.getElementById('menuEquipeEmpresa')) verificarGestaoEmpresa(grupo);
  }

  async function atualizarEmpresas(){
    try{
      const lista=await ApiService.get('/empresas/solicitacoes');
      const badge=document.getElementById('badgeEmpresasPendentes');
      if(badge && lista.length){badge.textContent=lista.length;badge.style.display='inline-flex';}
    }catch(e){console.warn('Não foi possível atualizar pendências de empresas:',e.message)}
  }

  async function verificarGestaoEmpresa(grupo){
    if(!window.AuthService || !AuthService.estaAutenticado()) return;
    try{
      const dados=await ApiService.get('/contratacoes/empresa/solicitacoes?status=pendente');
      if(document.getElementById('menuEquipeEmpresa')) return;
      const link=document.createElement('a');
      link.id='menuEquipeEmpresa';
      link.href='equipe.html';
      link.className='sidebar-link';
      const total=(dados.solicitacoes||[]).length;
      link.innerHTML='<i class="fa-solid fa-users-gear"></i><span>Equipe / Contratações</span><span class="sidebar-badge" id="badgeMotoristasPendentes" style="display:none"></span>';
      grupo.insertAdjacentElement('afterend',link);
      const badge=document.getElementById('badgeMotoristasPendentes');
      if(badge && total){badge.textContent=total;badge.style.display='inline-flex';}
    }catch(e){
      // Motoristas e usuários sem empresa simplesmente não recebem o item.
    }
  }

  const timer=setInterval(()=>{if(document.querySelector('.sidebar-nav')){clearInterval(timer);instalar()}},100);
})();
