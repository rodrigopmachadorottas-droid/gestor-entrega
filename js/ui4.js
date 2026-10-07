/* ================= TELA: CLIENTES (vínculo por unidade + cadastro) ================= */
function telaClientes(){
  const C=S.cli;
  const tabs=`<div class="seg tabs" role="tablist"><button class="${C.aba==="vinc"?"on":""}" data-act="cliaba" data-v="vinc" role="tab" aria-selected="${C.aba==="vinc"}">Unidades e clientes</button><button class="${C.aba==="cad"?"on":""}" data-act="cliaba" data-v="cad" role="tab" aria-selected="${C.aba==="cad"}">Cadastro de clientes</button></div>`;
  return topbar("Clientes")+`<main class="screen">${tabs}${C.aba==="vinc"?cliVinculo():cliCadastro()}</main>`;
}
function cliVinculo(){
  const C=S.cli, todas=ordenarUnidades(unidadesObra()), com=todas.filter(x=>x.id_cliente).length;
  const q=C.ubusca.trim().toLowerCase();
  const lista=todas.filter(x=>(C.filtro==="todas"||(C.filtro==="sem"?!x.id_cliente:!!x.id_cliente))&&(!q||(x.unidade+" "+((clienteById(x.id_cliente)||{}).nome||"")).toLowerCase().includes(q)));
  const grupos=[...new Set(lista.map(nivel1Nome))];
  const pct=todas.length?Math.round(com/todas.length*100):0;
  const left=`<section class="panel cli-left">
    <div class="cli-meter"><div class="row"><b class="tnum">${com} de ${todas.length} unidades com cliente</b><span class="spacer"></span><span class="muted tnum">${pct}%</span></div><div class="bar"><i style="width:${pct}%"></i></div></div>
    <div class="row">${buscaBox("cliUBusca",C.ubusca,"Buscar unidade ou cliente").replace('class="search"','class="search in"')}</div>
    <div class="seg" role="group" aria-label="Filtrar unidades">${[["todas","Todas"],["sem","Sem cliente"],["com","Com cliente"]].map(([v,l])=>`<button class="${C.filtro===v?"on":""}" data-act="clifiltro" data-v="${v}">${l}</button>`).join("")}</div>
    <div class="cli-units" id="cli-units" data-keep-scroll>${grupos.length?grupos.map(g=>{const us=lista.filter(x=>nivel1Nome(x)===g), tot=todas.filter(x=>nivel1Nome(x)===g); return `<div class="cli-grp"><div class="cli-grp-h"><b>${esc(g)}</b><span class="muted small tnum">${tot.filter(x=>x.id_cliente).length}/${tot.length} com cliente</span></div>
      ${us.map(x=>{const c=clienteById(x.id_cliente); return `<button class="cli-row ${C.und===x.id?"on":""}" data-act="cliund" data-id="${x.id}"><b>${esc(x.unidade)}</b><span class="muted small">${esc(nivel2Nome(x))}</span><span class="spacer"></span>${c?`<span class="cli-name">${esc(tituloCase(c.nome))}</span>`:`<span class="pill s-warn">Sem cliente</span>`}</button>`;}).join("")}</div>`;}).join("")
      :`<div class="empty"><b>Nenhuma unidade encontrada</b><span>Mude o filtro ou a busca.</span></div>`}</div></section>`;
  return `<div class="split cli-split">${left}${cliDetalhe()}</div>`;
}
function cliDetalhe(){
  const C=S.cli, x=C.und?DB.unidades.find(u=>u.id===C.und):null;
  if(!x) return `<section class="panel cli-detail"><div class="empty"><b>Selecione uma unidade</b><span>Escolha uma unidade na lista para vincular, trocar ou remover o cliente.</span></div></section>`;
  const c=clienteById(x.id_cliente), q=C.q.trim().toLowerCase(), qd=q.replace(/\D/g,"");
  const res=q.length>=2?DB.clientes.filter(k=>k.id!==x.id_cliente&&(k.nome.toLowerCase().includes(q)||k.email.includes(q)||(qd.length>=4&&k.telefone.includes(qd)))).sort((a,b)=>a.nome.localeCompare(b.nome)).slice(0,25):[];
  const outras=k=>DB.unidades.filter(u=>u.id_cliente===k.id&&u.id!==x.id);
  return `<section class="panel cli-detail open">
    <div class="row"><button class="iconbtn only-mobile" data-act="cliundfechar" aria-label="Voltar para a lista">${IC.back}</button><div><div class="muted small">${esc(nivel1Nome(x))}${nivel2Nome(x)?" · "+esc(nivel2Nome(x)):""}</div><h2 class="h2" style="font-size:1.5rem">${esc(x.unidade)}</h2></div><span class="spacer"></span>${pill(ETAPA[x.sub_etapa].n).replace(/s-\w+"/,'s-neutral"')}</div>
    <div class="cli-card ${c?"":"vazio"}">${c?`<div style="min-width:0"><b>${esc(tituloCase(c.nome))}</b><div class="small muted tnum">${esc(fmtTel(c.telefone))}</div><div class="small muted" style="overflow-wrap:anywhere">${esc(c.email)}</div></div><span class="spacer"></span><button class="btn sm ghost" data-act="clidesv">Remover vínculo</button>`
      :`<span class="muted">Nenhum cliente vinculado a esta unidade.</span>`}</div>
    <div class="field"><label for="cliQ">${c?"Trocar por outro cliente":"Vincular cliente"}</label>${buscaBox("cliQ",C.q,"Digite nome, telefone ou e-mail").replace('class="search"','class="search in"')}</div>
    ${q.length>=2?(res.length?`<ul class="cli-res">${res.map(k=>{const o=outras(k); return `<li><div style="min-width:0"><b>${esc(tituloCase(k.nome))}</b><div class="small muted tnum">${esc(fmtTel(k.telefone))} · ${esc(k.email)}</div>${o.length?`<div class="small" style="color:var(--primary-d)">Já vinculado a ${esc(o.map(u=>nivel1Nome(u)+" · "+u.unidade).join(", "))}</div>`:""}</div><button class="btn sm primary" data-act="clivinc2" data-c="${k.id}">Vincular</button></li>`;}).join("")}</ul>`
      :`<p class="muted small" style="margin:0">Nenhum cliente encontrado com "${esc(C.q)}".</p>`):`<p class="muted small" style="margin:0">Digite pelo menos 2 letras para buscar.</p>`}
    <div class="cli-novo">${C.novo?`<form data-form="clinovo" class="cli-form"><b>Cadastrar novo cliente e vincular</b>
        <div class="field"><label for="nc-nome">Nome</label><input class="inp" id="nc-nome" data-ncli="nome" value="${esc(C.nform.nome)}" required></div>
        <div class="row" style="align-items:flex-start"><div class="field" style="flex:1 1 180px"><label for="nc-tel">Telefone</label><input class="inp tnum" id="nc-tel" data-ncli="telefone" value="${esc(C.nform.telefone)}" inputmode="numeric" maxlength="13" placeholder="5541995254849"></div>
        <div class="field" style="flex:2 1 220px"><label for="nc-email">E-mail</label><input class="inp" id="nc-email" type="email" data-ncli="email" value="${esc(C.nform.email)}"></div></div>
        <div class="row"><span class="spacer"></span><button type="button" class="btn ghost" data-act="clinovotg">Cancelar</button><button type="submit" class="btn primary">Cadastrar e vincular</button></div></form>`
      :`<button class="btn" data-act="clinovotg">${IC.plus}Cadastrar novo cliente</button>`}</div>
  </section>`;
}
function cliCadastro(){
  const C=S.cli, q=C.busca.trim().toLowerCase();
  const lista=DB.clientes.filter(c=>!q||(c.nome+" "+c.email+" "+c.telefone).toLowerCase().includes(q)).sort((a,b)=>a.nome.localeCompare(b.nome));
  const ed=C.edit;
  return `<div class="split" style="grid-template-columns:minmax(0,1fr) 360px"><section class="panel"><div class="row" style="margin-bottom:12px"><h2 class="h2">Clientes <span class="muted small">(${lista.length})</span></h2><span class="spacer"></span>${buscaBox("cliBusca",C.busca,"Pesquisar cliente").replace('class="search"','class="search in"')}<button class="btn primary" data-act="clinovo">${IC.plus}Novo</button></div>
      <div class="scrollbox" id="cli-lista" data-keep-scroll><table class="list"><thead><tr><th>Nome</th><th>Telefone</th><th>E-mail</th><th>Unidades</th><th></th></tr></thead><tbody>
      ${lista.slice(0,300).map(c=>{const us=DB.unidades.filter(u=>u.id_cliente===c.id); return `<tr class="${ed===c.id?"sel":""}"><td><b>${esc(tituloCase(c.nome))}</b></td><td class="tnum" style="white-space:nowrap">${esc(fmtTel(c.telefone))}</td><td>${esc(c.email)}</td><td class="small">${us.length?esc(us.map(u=>(obraById(u.id_obra)||{}).nome+" · "+u.unidade).join(", ")):`<span class="muted">Nenhuma</span>`}</td><td><button class="iconbtn" style="width:32px;height:32px" data-act="cliedit" data-id="${c.id}" aria-label="Editar ${esc(c.nome)}">${IC.edit}</button></td></tr>`;}).join("")}</tbody></table>${lista.length>300?`<p class="small muted">Mostrando 300 de ${lista.length}. Use a busca.</p>`:""}</div></section>
    <section class="panel cli-detail ${ed!=null?"open":""}">${ed!=null?`<div class="row" style="margin-bottom:14px"><button class="iconbtn only-mobile" data-act="clicancel" aria-label="Voltar">${IC.back}</button><h2 class="h2">${ed==="novo"?"Novo cliente":"Editar cliente"}</h2></div>
      <form data-form="cli" class="cli-form"><div class="field"><label for="cli-nome">Nome</label><input class="inp" id="cli-nome" data-cli="nome" value="${esc(C.form.nome)}" required></div>
      <div class="field"><label for="cli-tel">Telefone</label><input class="inp tnum" id="cli-tel" data-cli="telefone" value="${esc(C.form.telefone)}" inputmode="numeric" maxlength="13" placeholder="Só números, ex.: 5541995254849"></div>
      <div class="field"><label for="cli-email">E-mail</label><input class="inp" id="cli-email" data-cli="email" type="email" value="${esc(C.form.email)}"></div>
      <div class="row">${ed!=="novo"?`<button type="button" class="btn ${C.del?"bad":"ghost"}" data-act="clidel">${C.del?"Confirmar exclusão":"Excluir"}</button>`:""}<span class="spacer"></span><button type="button" class="btn ghost" data-act="clicancel">Cancelar</button><button type="submit" class="btn primary">Salvar</button></div></form>`
      :`<div class="empty"><b>Nenhum cliente selecionado</b><span>Toque no lápis de um cliente para editar, ou crie um novo.</span></div>`}</section></div>`;
}

/* ================= TELA: PERFIL ================= */
const PERM_DESC={admin:"Acesso total: todas as obras, todas as ações e as configurações.",obra:"Libera testes, corrige pendências, finaliza unidades e cadastra locais e horários.",instalacoes:"Aprova e reprova os testes de esgoto, água fria, dreno, gás e elétrico.",excelencia:"Faz as vistorias Qualidade, Prévia e do Cliente e configura os horários.",rc:"Agenda as vistorias com os clientes e cuida do cadastro de clientes.",financeiro:"Acompanha a fase de Entrega e o status financeiro das unidades.",arquitetura:"Aprova e reprova a vistoria de Arquitetura das áreas comuns.",gerente:"Vê os indicadores gerais das suas obras na tela inicial."};
function prefsPerfil(u){
  const P=(S.perfil||{}).prefs||{}, tela=telaInicialObra(), ops=TELAS_INICIAIS.filter(([k])=>k!=="agenda"||can(u,"admin","obra","excelencia","rc"));
  return `<section class="panel prefs"><h2 class="h3">Preferências</h2>
    <div class="pref-row"><div><b>Foto</b><span class="small muted">Aparece no menu e no histórico das unidades.</span></div><div class="row" style="gap:8px"><label class="btn sm ghost">${IC.camera}${u.foto?"Trocar foto":"Colocar foto"}<input type="file" id="foto-eu" accept="image/*" hidden></label>${u.foto?`<button class="btn sm ghost" data-act="fotodel">Remover</button>`:""}</div></div>
    <div class="pref-row"><div><b>Tela ao entrar na obra</b><span class="small muted">Qual tela abre primeiro quando você escolhe uma obra.</span></div><div class="seg">${ops.map(([k,l])=>`<button class="${tela===k?"on":""}" data-act="telaini" data-v="${k}">${l}</button>`).join("")}</div></div>
    <div class="pref-row"><div><b>Tema</b><span class="small muted">Fica salvo para as próximas vezes.</span></div><div class="seg"><button class="${isDark()?"":"on"}" data-act="tema" data-v="light">Claro</button><button class="${isDark()?"on":""}" data-act="tema" data-v="dark">Escuro</button></div></div>
    ${MODO_DEMO?"":`<div class="pref-row"><div><b>Senha</b><span class="small muted">Troque quando quiser.</span></div><div class="row" style="gap:8px"><button class="btn sm ghost" data-act="senhamodal">Alterar senha</button><button class="btn sm ghost" data-act="sair">${IC.logout}Sair do app</button></div></div>`}
  </section>`;
}
function telaPerfil(){
  const u=ME(), agora=new Date();
  const T=[...DB.tarefas.filter(t=>t.autor===u.login).map(t=>({...t,ac:0})),...DB.tarefas_ac.filter(t=>t.autor===u.login).map(t=>({...t,ac:1}))].sort((a,b)=>b.data.localeCompare(a.data));
  const dias=n=>T.filter(t=>agora-new Date(t.data)<=n*864e5).length;
  const obrasAcesso=DB.obras.filter(o=>can(u,"admin")||(", "+o.usuarios+", ").includes(", "+u.login+", ")).sort((a,b)=>a.ordem-b.ordem);
  const porAcao=["liberar","aprovar","reprovar","corrigir","finalizar","agendar","cancelar"].map(a=>[a,T.filter(t=>t.acao===a).length]).filter(x=>x[1]);
  const porObra=obrasAcesso.map(o=>[o,T.filter(t=>t.id_obra===o.id).length]).filter(x=>x[1]).sort((a,b)=>b[1]-a[1]);
  const max=Math.max(1,...porAcao.map(x=>x[1]));
  const desc=t=>{ if(t.ac){const a=DB.areas.find(z=>z.id===t.id_local); return `${a?a.descricao:"Área comum"}`;} const x=DB.unidades.find(z=>z.id===t.id_unidade); return x?`${nivel1Nome(x)} · ${x.unidade}`:""; };
  const colNome=c=>({"":"Finalização",agendamento:"Agendamento",rep_vistoria_at:"Vistoria Qualidade",rep_vistoria_previa:"Vistoria Prévia",rep_vistoria_cliente:"Vistoria Cliente",rep_vistoria_qualidade:"Vistoria Qualidade",rep_vistoria_arq:"Vistoria Arquitetura",rep_vistoria_sindico:"Vistoria Síndico"}[c]||(TESTES.find(x=>x.col===c)||{}).nome||c);
  return topbar("Meu perfil")+`<main class="screen perfil">
    <section class="panel perfil-head">${u.login===REAL_USER?`<label class="av-edit" title="Trocar foto">${avatarU(u,"big")}<span class="av-cam">${IC.camera}</span><input type="file" id="foto-eu" accept="image/*" hidden></label>`:avatarU(u,"big")}<div><h2 class="h2" style="font-size:1.5rem">${esc(u.nome)}</h2><div class="muted">${esc(u.email||u.login+"@rottasconstrutora.com.br")}</div>
      <div class="row" style="margin-top:10px;gap:6px">${u.perms.map(p=>`<span class="pill s-neutral">${esc(PERM_NOME[p]||p)}</span>`).join("")}</div></div>${acoesPerfil(u)}</section>
    ${u.login===REAL_USER?prefsPerfil(u):""}
    <div class="kpis">${[["Tarefas feitas",T.length],["Últimos 30 dias",dias(30)],["Últimos 7 dias",dias(7)],["Obras com atividade",new Set(T.map(t=>t.id_obra)).size]].map(([l,v])=>`<div class="panel kpi-tile"><span class="eyebrow">${l}</span><b class="tnum">${v}</b></div>`).join("")}</div>
    <div class="perfil-grid">
      <section class="panel"><h2 class="h3">O que você pode fazer</h2><ul class="perm-list">${u.perms.map(p=>`<li><b>${esc(PERM_NOME[p]||p)}</b><span class="muted small">${esc(PERM_DESC[p]||"")}</span></li>`).join("")}</ul></section>
      <section class="panel"><h2 class="h3">Tarefas por tipo</h2>${porAcao.length?`<ul class="bars">${porAcao.map(([a,n])=>`<li><span>${a}</span><i><b class="${ACAO_CLS[a]}" style="width:${Math.max(3,n/max*100)}%"></b></i><span class="tnum">${n}</span></li>`).join("")}</ul>`:`<p class="muted">Você ainda não fez nenhuma tarefa.</p>`}
        ${porObra.length?`<h2 class="h3" style="margin-top:18px">Por obra</h2><ul class="perm-list">${porObra.map(([o,n])=>`<li class="row" style="flex-direction:row"><span>${esc(o.nome)}</span><span class="spacer"></span><b class="tnum">${n}</b></li>`).join("")}</ul>`:""}</section>
    </div>
    <section class="panel"><h2 class="h3" style="margin-bottom:12px">Obras com acesso <span class="muted small">(${obrasAcesso.length})</span></h2><div class="mini-obras">${obrasAcesso.map(o=>`<button class="mini-obra" data-act="obra" data-id="${o.id}">${fotoObra(o)?`<img src="${fotoObra(o)}" alt="">`:`<span class="ph"></span>`}<span><b>${esc(o.nome)}</b><span class="small muted">${esc(o.cidade)}</span></span></button>`).join("")}</div></section>
    <section class="panel"><h2 class="h3" style="margin-bottom:12px">Últimas tarefas</h2>${T.length?`<div style="overflow-x:auto"><table class="list"><thead><tr><th>Data</th><th>Ação</th><th>Etapa</th><th>Unidade / local</th><th>Obra</th></tr></thead><tbody>${T.slice(0,15).map(t=>`<tr><td class="tnum" style="white-space:nowrap">${fmtDTL(new Date(t.data))}</td><td><span class="act ${ACAO_CLS[t.acao]||""}">${esc(t.acao)}</span></td><td>${esc(t.ac&&t.coluna===""?"Liberação Local":colNome(t.coluna))}</td><td>${esc(desc(t))}</td><td>${esc((obraById(t.id_obra)||{}).nome||"")}</td></tr>`).join("")}</tbody></table></div>`:`<p class="muted">Nada por aqui ainda.</p>`}</section>
  </main>`;
}
