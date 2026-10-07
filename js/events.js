/* ================= EVENTOS ================= */
function trocarUsuario(login){ S.user=login; S.confirmReset=false; resetFiltros(); S.popup=null; S.lote={on:false,q:[]}; S.obraId=null; S.screen="home"; S.nav=false;
  toast("Info",login===REAL_USER?"Voltou para o seu acesso":"Simulando acesso",ME().nome); }
function aplicarTema(){ document.documentElement.dataset.theme=S.dark?"dark":"light"; const m=document.querySelector('meta[name="theme-color"]'); if(m) m.content=S.dark?"#212329":"#FF9114"; }
function aplicarPrefs(p){ p=p||{}; if(p.tema){ S.dark=p.tema==="dark"; aplicarTema(); try{localStorage.setItem("ge-tema",p.tema);}catch(_){} } }
const TELAS_INICIAIS=[["indicadores","Indicadores"],["unidades","Unidades"],["areas","Áreas Comuns"],["agenda","Agenda"]];
function telaInicialObra(){ const t=((S.perfil||{}).prefs||{}).tela; if(t==="agenda"&&!can(ME(),"admin","obra","excelencia","rc")) return "indicadores"; return TELAS_INICIAIS.some(x=>x[0]===t)?t:"indicadores"; }
function bloqueadoPorLote(){ if(S.lote.q.length){ toast("Aviso","Você tem liberações não salvas","Toque em Liberar ou Cancelar antes de sair."); return true; } return false; }
function entrarObra(id){ S.obraId=id; S.screen=telaInicialObra(); S.nav=false; S.navObras=false; S.popup=null; S.busca=""; S.lote={on:false,q:[]}; S.loc={localId:null,n2:null,modal:null,cfgAberta:false}; S.hor=null; S.agd={mes:new Date(new Date().getFullYear(),new Date().getMonth(),1),dia:startOfDay(new Date()),busca:""}; resetFiltros(); }

document.addEventListener("click",e=>{
  const el=e.target.closest("[data-act]"); if(!el) return;
  const act=el.dataset.act, id=el.dataset.id?+el.dataset.id:null;
  const run={
    nav(){ if(!bloqueadoPorLote()){ S.nav=true; S.confirmReset=false; } },
    navclose(){ S.nav=false; S.navObras=false; },
    navobras(){ S.navObras=!S.navObras; },
    home(){ if(bloqueadoPorLote()) return; S.screen="home"; S.nav=false; S.navObras=false; S.popup=null; S.drawer=false; },
    adminpanel(){ if(!can(userByLogin(REAL_USER),"admin")) return; S.adminPanel=!S.adminPanel; S.simSel=""; S.confirmReset=false; },
    simular(){ if(!S.simSel){ toast("Erro","Selecione o usuário"); return; } trocarUsuario(S.simSel); S.adminPanel=false; },
    simvoltar(){ trocarUsuario(REAL_USER); S.adminPanel=false; },
    menuacoes(){ S.menuAcoes=!S.menuAcoes; },
    trocaobra(){ if(bloqueadoPorLote()) return; entrarObra(id); toast("Sucesso","Obra alterada",OBRA().nome); },
    ir(){ if(bloqueadoPorLote()) return; S.screen=el.dataset.to; S.nav=false; S.popup=null; S.drawer=false; if(S.screen==="horarios") S.hor=null; },
    tema(){ const v=el.dataset.v; S.dark = v? v==="dark" : !isDark(); aplicarTema(); try{localStorage.setItem("ge-tema",S.dark?"dark":"light");}catch(_){} API.salvarPrefs({tema:S.dark?"dark":"light"}); },
    telaini(){ API.salvarPrefs({tela:el.dataset.v}); toast("Sucesso","Tela inicial salva",TELAS_INICIAIS.find(x=>x[0]===el.dataset.v)[1]); },
    locaba(){ S.locAba=el.dataset.v; if(S.locAba==="ac") S.loc.localId="ac"; else if(S.loc.localId==="ac") S.loc.localId=null; },
    fotodel(){ API.removerMinhaFoto().then(()=>{ toast("Sucesso","Foto removida"); render(); }).catch(err=>toast("Erro","Não foi possível remover a foto",msgErro(err))); },
    pdfund(){ gerarPdfUnidades(); },
    sync(){ S.nav=false; if(MODO_DEMO){ carregarLocal(); toast("Sucesso","Informações da obra sincronizadas"); } else API.recarregar(true); },
    reset(){ if(!S.confirmReset){ S.confirmReset=true; return; } S.confirmReset=false; if(!MODO_DEMO) return; DB=gerarDadosTeste(); salvarLocal(); if(S.obraId) entrarObra(S.obraId); toast("Info","Dados de teste restaurados"); },
    obra(){ entrarObra(id); },
    drawer(){ S.drawer=!S.drawer; S.ddBloco=false; },
    ddbloco(){ S.ddBloco=!S.ddBloco; },
    limparfil(){ S.fil=filtrosPadrao(ME()); },
    filbloco(){ const b=el.dataset.b, L=S.fil.blocos; S.fil.blocos=L.includes(b)?L.filter(x=>x!==b):[...L,b]; },
    indbloco(){ const b=el.dataset.b, L=S.ind.fil.blocos; S.ind.fil.blocos=L.includes(b)?L.filter(x=>x!==b):[...L,b]; },
    indlimpar(){ S.ind.fil=filtrosPadrao(ME()); S.ind.ini=""; S.ind.fim=""; },
    indgrp(){ const f=el.dataset.f; S.ind.fechado[f]=!S.ind.fechado[f]; },
    abrirund(){ S.popup={tipo:"und",id}; },
    abrirac(){ S.popup={tipo:"ac",id}; },
    fecharpop(){ S.popup=null; S.ag=null; S.conf=null; },
    abrirconf(){ abrirConf(el.dataset.ctx,el.dataset.a,el.dataset.k); },
    conffechar(){ S.conf=null; },
    confok(){ confirmarAcao(); },
    ckset(){ S.conf.ck[+el.dataset.i]=el.dataset.v; },
    ckall(){ CHECKLIST_QUALIDADE.forEach((_,i)=>{ if(!S.conf.ck[i]) S.conf.ck[i]="ok"; }); },
    siglimpar(){ S.conf.sig=""; },
    anxdel(){ S.conf.anexos.splice(+el.dataset.i,1); },
    homeind(){ S.homeInd=S.homeInd?null:{etapa:"rep_teste_esgoto"}; },
    acaound(){
      const x=DB.unidades.find(u=>u.id===S.popup.id), a=el.dataset.a, col=el.dataset.col, k=el.dataset.k;
      if(a==="agendar"){ if(!x.id_cliente){ toast("Aviso","Essa unidade ainda não possui cliente cadastrado","Vincule o cliente em Clientes."); return; }
        const n=new Date(); S.ag={id:x.id,mes:new Date(n.getFullYear(),n.getMonth(),1),dia:null,hora:null}; return; }
      const f=document.getElementById(`obs-und-${k}`), isSel=f&&f.tagName==="SELECT";
      let obs=f?f.value.trim():"";
      if(isSel&&a==="reprovar"&&!obs){ toast("Erro","Selecione o motivo da reprova"); return; }
      if(isSel&&a!=="reprovar") obs="";
      const antes=x.sub_etapa; executarAcao(x,a,col,{autor:S.user,obs}); saveDB();
      toast("Sucesso",`${el.textContent.trim()}: ${x.unidade}`, x.sub_etapa!==antes?`Unidade passou para ${ETAPA[x.sub_etapa].n}`:"");
    },
    acaoac(){
      const ar=DB.areas.find(z=>z.id===S.popup.id), a=el.dataset.a, col=el.dataset.col, k=el.dataset.k;
      const obs=(document.getElementById(`obs-ac-${k}`)||{}).value||"";
      let ag="";
      if(a==="agendar"){ const v=(document.getElementById(`data-ac-${k}`)||{}).value; if(!v){ toast("Erro","Escolha a data da vistoria do síndico"); return; } const [y,m,d]=v.split("-"); ag=`${d}/${m}/${y}`; }
      executarAcaoAC(ar,a,col,{autor:S.user,obs:obs.trim(),agendamento:ag}); saveDB(); toast("Sucesso",`${el.textContent.trim()}: ${ar.descricao}`);
    },
    agfechar(){ S.ag=null; },
    agmes(){ const m=S.ag.mes; S.ag.mes=new Date(m.getFullYear(),m.getMonth()+ +el.dataset.d,1); },
    agdia(){ S.ag.dia=new Date(+el.dataset.t); S.ag.hora=null; },
    aghora(){ S.ag.hora=el.dataset.h; },
    agsalvar(){
      const A=S.ag; if(!A.dia||!A.hora){ toast("Erro","Selecione uma data e um horário"); return; }
      const x=DB.unidades.find(u=>u.id===A.id), str=fmtData(A.dia)+" "+A.hora, h=horariosDia(S.obraId,DIA_KEY[A.dia.getDay()]).find(z=>z.Horas===A.hora);
      if(h&&ocupacao(S.obraId,str,x.id)>=h.Pessoas){ toast("Erro","Esse horário já está lotado","Escolha outro horário."); return; }
      executarAcao(x,"agendar","agendamento",{autor:S.user,obs:(document.getElementById("ag-obs")||{}).value||"",agendamento:str}); saveDB();
      S.ag=null; toast("Sucesso","Vistoria agendada",`${x.unidade} · ${str}`);
    },
    loteon(){ S.lote={on:true,q:[]}; S.menuAcoes=false; },
    lotecancel(){ S.lote={on:false,q:[]}; },
    lotecell(){ e.stopPropagation(); const col=el.dataset.col, q=S.lote.q, i=q.findIndex(z=>z.id===id&&z.col===col); if(i>=0) q.splice(i,1); else q.push({id,col}); },
    lotesalvar(){ let n=0; S.lote.q.forEach(({id,col})=>{const x=DB.unidades.find(u=>u.id===id); if(x&&blank(x[col])){ executarAcao(x,"liberar",col,{autor:S.user,obs:"Liberação em lote"}); n++; }}); saveDB(); S.lote={on:false,q:[]}; toast("Sucesso",`${n} teste(s) liberado(s)`); },
    agdmes(){ const m=S.agd.mes; S.agd.mes=new Date(m.getFullYear(),m.getMonth()+ +el.dataset.d,1); },
    agdhoje(){ const n=new Date(); S.agd.mes=new Date(n.getFullYear(),n.getMonth(),1); S.agd.dia=startOfDay(n); },
    agddia(){ const d=new Date(+el.dataset.t); S.agd.dia=d; if(d.getMonth()!==S.agd.mes.getMonth()) S.agd.mes=new Date(d.getFullYear(),d.getMonth(),1); },
    cfgtoggle(){ S.loc.cfgAberta=!S.loc.cfgAberta; },
    cfgtipo(){ OBRA().config.tipo=el.dataset.v; saveDB(); },
    locsel(){ S.loc.localId=id; S.loc.n2=+el.dataset.n; },
    locac(){ S.loc.localId="ac"; S.locAba="ac"; },
    acnova(){ S.loc.modal={tipo:"ac",id:null}; },
    acedit(){ S.loc.modal={tipo:"ac",id}; },
    acsalvar(){ const nome=document.getElementById("ac-nome").value.trim(); if(!nome){ toast("Erro","Informe o nome da área comum"); return; }
      const M=S.loc.modal;
      if(DB.areas.some(a=>a.id_obra===S.obraId&&a.id!==M.id&&a.descricao.toLowerCase()===nome.toLowerCase())){ toast("Erro","Já existe uma área comum com esse nome"); return; }
      if(M.id) DB.areas.find(a=>a.id===M.id).descricao=nome;
      else DB.areas.push({id:nextId("areas"),id_obra:S.obraId,descricao:nome,sub_etapa:1,rep_vistoria_qualidade:"",rep_vistoria_arq:"",agendamento:"",rep_vistoria_sindico:""});
      saveDB(); S.loc.modal=null; toast("Sucesso","Área comum salva",nome); },
    acdel(){ const M=S.loc.modal; if(!M.del){ M.del=true; return; } DB.areas=DB.areas.filter(a=>a.id!==M.id); saveDB(); S.loc.modal=null; toast("Sucesso","Área comum excluída"); },
    locedit(){ S.loc.modal={tipo:"local",id}; },
    locnovo(){ S.loc.modal={tipo:"local",id:null}; },
    undedit(){ S.loc.modal={tipo:"und",id}; },
    undnova(){ S.loc.modal={tipo:"und",id:null}; },
    locfechar(){ S.loc.modal=null; },
    undsalvar(){ const nome=document.getElementById("und-nome").value.trim().toUpperCase(); if(!nome){ toast("Erro","Informe o nome da unidade"); return; }
      const M=S.loc.modal;
      if(M.id){ DB.unidades.find(u=>u.id===M.id).unidade=nome; }
      else{ if(DB.unidades.some(u=>u.nivel_1===S.loc.localId&&u.unidade===nome)){ toast("Erro","Já existe uma unidade com esse nome neste local"); return; }
        DB.unidades.push({id:nextId("unidades"),id_obra:S.obraId,nivel_1:S.loc.localId,nivel_2:S.loc.n2,unidade:nome,modulo:"",id_cliente:null,sub_etapa:1,rep_teste_esgoto:"",rep_teste_aguafria:"",rep_teste_dreno:"",rep_teste_gas:"",rep_teste_eletrico:"",rep_vistoria_at:"",rep_vistoria_previa:"",rep_vistoria_cliente:"",agendamento:"",financeiro_status:"",financeiro_motivo:"",prioridade:""}); }
      saveDB(); S.loc.modal=null; toast("Sucesso","Unidade salva",nome); },
    unddel(){ const M=S.loc.modal; if(!M.del){ M.del=true; return; } DB.unidades=DB.unidades.filter(u=>u.id!==M.id); saveDB(); S.loc.modal=null; toast("Sucesso","Unidade excluída"); },
    locsalvar(){ const n1=document.getElementById("loc-n1").value.trim(), n2=document.getElementById("loc-n2").value.split(",").map(s=>s.trim()).filter(Boolean).join(", ");
      if(!n1||!n2){ toast("Erro","Preencha o nome e pelo menos um pavimento"); return; }
      const M=S.loc.modal; if(M.id){ const l=localById(M.id); l.nivel1=n1; l.niveis2=n2; } else DB.locais.push({id:nextId("locais"),id_obra:S.obraId,nivel1:n1,niveis2:n2});
      saveDB(); S.loc.modal=null; toast("Sucesso","Local salvo",n1); },
    locdel(){ const M=S.loc.modal; if(!M.del){ M.del=true; return; } DB.locais=DB.locais.filter(l=>l.id!==M.id); if(S.loc.localId===M.id) S.loc.localId=null; saveDB(); S.loc.modal=null; toast("Sucesso","Local excluído"); },
    cliaba(){ S.cli.aba=el.dataset.v; S.cli.edit=null; },
    clifiltro(){ S.cli.filtro=el.dataset.v; },
    cliund(){ S.cli.und=id; S.cli.q=""; S.cli.novo=false; },
    cliundfechar(){ S.cli.und=null; },
    clidesv(){ const x=DB.unidades.find(u=>u.id===S.cli.und); x.id_cliente=null; saveDB(); toast("Sucesso","Vínculo removido",x.unidade); },
    clivinc2(){ const x=DB.unidades.find(u=>u.id===S.cli.und), c=clienteById(+el.dataset.c); x.id_cliente=c.id; S.cli.q=""; saveDB(); toast("Sucesso","Cliente vinculado",`${x.unidade} · ${tituloCase(c.nome)}`); },
    clinovotg(){ S.cli.novo=!S.cli.novo; S.cli.nform={nome:S.cli.novo?tituloCase(S.cli.q):"",telefone:"",email:""}; },
    clinovo(){ S.cli.edit="novo"; S.cli.form={nome:"",telefone:"",email:""}; S.cli.del=false; },
    cliedit(){ const c=clienteById(id); S.cli.edit=id; S.cli.form={nome:tituloCase(c.nome),telefone:c.telefone,email:c.email}; S.cli.del=false; },
    clicancel(){ S.cli.edit=null; },
    clidel(){ if(!S.cli.del){ S.cli.del=true; return; } const cid=S.cli.edit; DB.clientes=DB.clientes.filter(c=>c.id!==cid); DB.unidades.forEach(u=>{if(u.id_cliente===cid) u.id_cliente=null;}); saveDB(); S.cli.edit=null; toast("Sucesso","Cliente excluído"); },
    clivinc(){ S.cli.vincular=!S.cli.vincular; },
    horadd(){ const L=S.hor.draft[el.dataset.k]; L.push({ID:Math.max(0,...L.map(h=>h.ID))+1,Horas:"07:00",Pessoas:1}); },
    hordel(){ S.hor.draft[el.dataset.k].splice(+el.dataset.i,1); },
    horsalvar(){ const D=S.hor.draft; const dup=DIAS.some(([k])=>new Set(D[k].map(h=>h.Horas)).size!==D[k].length);
      if(dup){ toast("Erro","Existem horários duplicados, corrija"); return; }
      const rec=DB.horarios.find(h=>h.id_obra===S.obraId)||(DB.horarios.push({id:nextId("horarios"),id_obra:S.obraId}),DB.horarios[DB.horarios.length-1]);
      DIAS.forEach(([k])=>{ rec[k]=JSON.stringify([...D[k]].sort((a,b)=>a.Horas.localeCompare(b.Horas))); }); saveDB(); S.hor=null; toast("Sucesso","Horários salvos"); }
  }[act];
  if(run){ e.preventDefault(); run(); render(); }
});

document.addEventListener("input",e=>{
  const t=e.target, b=t.dataset.bind;
  if(b==="busca"){ S.busca=t.value; render(); }
  else if(b==="acBusca"){ S.acBusca=t.value; render(); }
  else if(b==="agdBusca"){ S.agd.busca=t.value; render(); }
  else if(b==="cliBusca"){ S.cli.busca=t.value; render(); }
  else if(b==="locBusca"){ S.loc.busca=t.value; render(); }
  else if(b==="cliUBusca"){ S.cli.ubusca=t.value; render(); }
  else if(b==="cliQ"){ S.cli.q=t.value; render(); }
  else if(t.dataset.ncli){ S.cli.nform[t.dataset.ncli]= t.dataset.ncli==="telefone"? t.value.replace(/\D/g,"") : t.value; if(t.dataset.ncli==="telefone") t.value=S.cli.nform.telefone; }
  else if(t.dataset.conf&&S.conf){ S.conf[t.dataset.conf]=t.value; }
  else if(t.dataset.cli){ S.cli.form[t.dataset.cli]= t.dataset.cli==="telefone"? t.value.replace(/\D/g,"") : t.value; if(t.dataset.cli==="telefone") t.value=S.cli.form.telefone; }
});
document.addEventListener("change",e=>{
  const t=e.target;
  if(t.dataset.actChange==="simsel"){ S.simSel=t.value; return; }
  if(t.id==="foto-eu"&&t.files[0]){ const f=t.files[0]; t.value=""; S.carregando="Enviando a foto..."; render();
    API.trocarMinhaFoto(f).then(()=>toast("Sucesso","Foto atualizada")).catch(err=>toast("Erro","Não foi possível trocar a foto",msgErro(err))).finally(()=>{ S.carregando=""; render(); }); return; }
  if(t.id==="foto-obra"&&t.files[0]){ const f=t.files[0]; t.value=""; S.carregando="Enviando a foto da obra..."; render();
    API.trocarFotoObra(OBRA(),f).then(()=>toast("Sucesso","Foto da obra atualizada")).catch(err=>toast("Erro","Não foi possível trocar a foto",msgErro(err))).finally(()=>{ S.carregando=""; render(); }); return; }
  if(t.id==="conf-file"&&S.conf){ [...t.files].forEach(f=>{ if(f.size>20*1024*1024){ toast("Erro","Arquivo muito grande",f.name+" passa de 20 MB"); return; } S.conf.anexos.push({nome:f.name,tam:f.size,file:f}); }); render(); return; }
  if(t.dataset.conf&&S.conf){ S.conf[t.dataset.conf]=t.value; return; }
  if(t.dataset.hi){ S.homeInd.etapa=t.value; render(); return; }
  if(t.dataset.fil){ S.fil[t.dataset.fil]=t.checked; render(); return; }
  if(t.dataset.indfil){ S.ind.fil[t.dataset.indfil]=t.checked; render(); return; }
  if(t.dataset.ind){ S.ind[t.dataset.ind]=t.value; render(); return; }
  if(t.dataset.cfgteste){ const c=OBRA().config, k=t.dataset.cfgteste; c.testes=t.checked?TESTES.map(x=>x.k).filter(x=>x===k||c.testes.includes(x)):c.testes.filter(x=>x!==k); if(!c.testes.length){ c.testes=[k]; toast("Aviso","A obra precisa de pelo menos um teste"); } saveDB(); render(); return; }
  if(t.dataset.cfg){ OBRA().config[t.dataset.cfg]=t.checked; saveDB(); render(); return; }
  if(t.dataset.hor){ const h=S.hor.draft[t.dataset.hor][+t.dataset.i]; h[t.dataset.f]= t.dataset.f==="Pessoas"? Math.max(1,+t.value||1) : t.value; return; }
  if(t.dataset.link){ const x=DB.unidades.find(u=>u.id===+t.dataset.link), m=/#(\d+)\s*$/.exec(t.value);
    if(!t.value.trim()){ x.id_cliente=null; saveDB(); toast("Sucesso","Cliente removido",x.unidade); return; }
    if(m&&clienteById(+m[1])){ x.id_cliente=+m[1]; saveDB(); toast("Sucesso","Cliente vinculado",`${x.unidade} · ${tituloCase(clienteById(+m[1]).nome)}`); }
    else toast("Erro","Escolha um cliente da lista"); return; }
});
document.addEventListener("submit",e=>{
  if(e.target.dataset.form==="clinovo"){ e.preventDefault(); const F=S.cli.nform;
    if(!F.nome.trim()){ toast("Erro","Informe o nome do cliente"); return; }
    if(F.telefone&&(F.telefone.length<12||F.telefone.length>13)){ toast("Erro","Telefone incompleto","Use DDI + DDD + número, ex.: 5541995254849"); return; }
    const c={id:nextId("clientes"),nome:F.nome.trim().toUpperCase(),telefone:F.telefone,email:F.email.trim().toLowerCase()}; DB.clientes.push(c);
    const x=DB.unidades.find(u=>u.id===S.cli.und); x.id_cliente=c.id; S.cli.novo=false; S.cli.q=""; saveDB(); toast("Sucesso","Cliente cadastrado e vinculado",`${x.unidade} · ${tituloCase(c.nome)}`); render(); return; }
  if(e.target.dataset.form!=="cli") return; e.preventDefault();
  const F=S.cli.form; if(!F.nome.trim()){ toast("Erro","Informe o nome do cliente"); return; }
  if(F.telefone&&(F.telefone.length<12||F.telefone.length>13)){ toast("Erro","Telefone incompleto","Use DDI + DDD + número, ex.: 5541995254849"); return; }
  if(S.cli.edit==="novo") DB.clientes.push({id:nextId("clientes"),nome:F.nome.trim().toUpperCase(),telefone:F.telefone,email:F.email.trim().toLowerCase()});
  else Object.assign(clienteById(S.cli.edit),{nome:F.nome.trim().toUpperCase(),telefone:F.telefone,email:F.email.trim().toLowerCase()});
  saveDB(); S.cli.edit=null; toast("Sucesso","Cliente salvo"); render();
});
document.addEventListener("keydown",e=>{ if(e.key!=="Escape") return;
  if(S.conf) S.conf=null; else if(S.homeInd) S.homeInd=null; else if(S.menuAcoes) S.menuAcoes=false; else if(S.adminPanel) S.adminPanel=false; else if(S.navObras) S.navObras=false; else if(S.ag) S.ag=null; else if(S.popup) S.popup=null; else if(S.loc.modal) S.loc.modal=null; else if(S.popup) S.popup=null; else if(S.drawer) S.drawer=false; else if(S.nav) S.nav=false; else return; render(); });

/* O início do app fica em main.js */
