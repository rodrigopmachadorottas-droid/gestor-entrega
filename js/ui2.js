/* ================= TELA: ÁREAS COMUNS ================= */
function telaAreas(){
  const q=S.acBusca.trim().toLowerCase();
  const as=DB.areas.filter(a=>a.id_obra===S.obraId&&(!q||a.descricao.toLowerCase().includes(q))).sort((a,b)=>a.descricao.localeCompare(b.descricao));
  const body=as.length?`<div class="tablewrap" id="tw-ac" data-keep-scroll><table class="grid"><thead><tr><th style="text-align:left">Local</th><th>Etapa</th><th>Vistoria Qualidade</th><th>Vistoria Arquitetura</th><th>Agendamento Síndico</th><th>Vistoria Síndico</th></tr></thead><tbody>
    ${as.map(a=>`<tr data-act="abrirac" data-id="${a.id}"><td class="l"><b>${esc(a.descricao)}</b></td><td>${esc(ETAPA_AC[a.sub_etapa].n)}</td>
      ${["rep_vistoria_qualidade","rep_vistoria_arq","agendamento","rep_vistoria_sindico"].map(c=>`<td class="c-st ${stClass(a[c])}">${esc(a[c])}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`
    :`<div class="panel empty"><b>Nenhuma área comum cadastrada nesta obra</b><span>Obras de casas normalmente não têm áreas comuns no fluxo.</span></div>`;
  return topbar("Áreas Comuns",buscaBox("acBusca",S.acBusca,"Pesquisar local"))+`<main class="screen">${body}</main>`;
}
function popupArea(){
  const a=DB.areas.find(x=>x.id===S.popup.id), secs=secoesArea(a,ME());
  return `<div class="modal" role="dialog" aria-modal="true" aria-label="${esc(a.descricao)}"><div class="scrim" data-act="fecharpop"></div><div class="box tall">
    <div class="mhead"><div class="t"><div class="crumb">${esc(OBRA().nome)} / <b>${esc(a.descricao)}</b></div></div><span class="pill s-neutral">${esc(ETAPA_AC[a.sub_etapa].n)}</span><button class="iconbtn" data-act="fecharpop" aria-label="Fechar">${IC.close}</button></div>
    <div class="mbody" id="mb-ac" data-keep-scroll>${secs.map(s=>secaoHTML(s,"ac")).join("")}</div></div></div>`;
}

/* ================= TELA: INDICADORES ================= */
function indEtapas(){
  const cfg=OBRA().config, L=[{id:"atual",nome:"Etapa atual (todas)",etapa:null,coluna:"",tipo:"atual"}];
  ["aguafria","esgoto","eletrico","dreno","gas"].filter(k=>cfg.testes.includes(k)).forEach(k=>{const t=TESTES.find(x=>x.k===k); L.push({id:t.col,nome:t.nome,etapa:2,coluna:t.col,tipo:"rep"});});
  L.push({id:"fin",nome:"Finalizando Unidade",etapa:3,coluna:"",tipo:"fin"},{id:"rep_vistoria_at",nome:"Vistoria Qualidade",etapa:4,coluna:"rep_vistoria_at",tipo:"rep"});
  if(cfg.previa) L.push({id:"rep_vistoria_previa",nome:"Vistoria Prévia",etapa:41,coluna:"rep_vistoria_previa",tipo:"rep"});
  L.push({id:"agendamento",nome:"Agendamento com Cliente",etapa:5,coluna:"agendamento",tipo:"ag"},{id:"rep_vistoria_cliente",nome:"Vistoria Cliente",etapa:6,coluna:"rep_vistoria_cliente",tipo:"rep"},{id:"corr",nome:"Correções de Obra",etapa:7,coluna:"",tipo:"corr"},{id:"finsit",nome:"Situação Financeira",etapa:null,coluna:"",tipo:"finsit"});
  return L;
}
const LEGENDAS={lib:["Pendente","Liberado"],rep:["Não Liberado","Pendente","Aprovado","Reprovado"],fin:["Não Liberado","Pendente","Finalizado"],ag:["Não Liberado","Pendente","Agendado","Concluído"],corr:["N/A","Pendente","Corrigido"]};
function statusInd(u,op,corr){
  const v=op.coluna?u[op.coluna]:"";
  switch(op.tipo){
    case "lib": return u.sub_etapa===1?"Pendente":"Liberado";
    case "fin": return u.sub_etapa<3?"Não Liberado":u.sub_etapa===3?"Pendente":"Finalizado";
    case "ag": return blank(v)?"Não Liberado":v==="Pendente"?"Pendente":has(v,"/")?"Agendado":"Concluído";
    case "corr": return u.sub_etapa===7?"Pendente":corr.has(u.id)?"Corrigido":"N/A";
    default: return blank(v)?"Não Liberado":has(v,"Pendente")?"Pendente":has(v,"Aprovado")?"Aprovado":"Reprovado";
  }
}
const corInd=s=>({ok:"var(--ok-s)",bad:"var(--bad-s)",info:"var(--info-s)",warn:"var(--warn-s)"}[stClass(s)]||"var(--neutral-s)");
function unidadesInd(){ const f=S.ind.fil; return unidadesObra().filter(x=>!f.blocos.length||f.blocos.includes(nivel1Nome(x))); }
function blocosInd(){ const f=S.ind.fil; return blocosObra().filter(b=>!f.blocos.length||f.blocos.includes(b)); }
function telaIndicadores(){
  const I=S.ind, todas=indEtapas(), ops=I.visao==="Visão Ações"?todas.filter(o=>o.etapa!=null):todas; if(!ops.find(o=>o.id===I.etapa)) I.etapa=I.visao==="Visão Ações"?ops[0].id:"atual"; if(I.visao==="Visão Ações"&&!can(ME(),"admin","lider")) I.visao="Visão Unidades";
  const op=ops.find(o=>o.id===I.etapa);
  const nFil=(I.fil.blocos.length?1:0)+(I.ini||I.fim?1:0);
  const comEtapa=I.visao==="Visão Unidades"||I.visao==="Visão Ações";
  const head=`<div class="row indhead">${comEtapa?`<label class="row" style="gap:7.2px"><b>Etapa:</b><select class="inp sf" id="ind-etapa" data-ind="etapa" style="width:auto;min-width:198px">${ops.map(o=>`<option value="${o.id}" ${o.id===I.etapa?"selected":""}>${esc(o.nome)}</option>`).join("")}</select></label>${I.visao==="Visão Unidades"&&repSuporta(op)?`<button class="tg-chip ${I.rep?"on":""}" data-act="indrep" aria-pressed="${!!I.rep}" data-tip="Separa a legenda pela vez: Aprovado 1°, Aprovado 2°... (1ª tentativa, 2ª tentativa...)"><span class="tg-box">${I.rep?IC.check:""}</span>Considerar repetição</button>`:""}`
      :`<b style="font-size:1.15rem">${I.visao==="Visão Geral"?(I.geralModo==="acum"?"Unidades que já passaram por cada etapa":"Número de unidades por Fase/Etapa (situação atual)"):"Número de unidades aprovadas por etapa"}</b>`}
    ${I.visao==="Visão Ações"?`<b>${I.ini||I.fim?`Período: ${I.ini?fmtData(new Date(I.ini+"T00:00")):"início"} até ${I.fim?fmtData(new Date(I.fim+"T00:00")):"hoje"}`:"Todo o período"}</b>`:""}
    <span class="spacer"></span>${I.visao==="Visão Geral"?`<div class="seg loc-abas ind-modo" role="tablist"><button class="${I.geralModo!=="acum"?"on":""}" role="tab" aria-selected="${I.geralModo!=="acum"}" data-act="indmodo" data-v="atual" data-tip="Quantas unidades estão em cada etapa agora">Situação atual</button><button class="${I.geralModo==="acum"?"on":""}" role="tab" aria-selected="${I.geralModo==="acum"}" data-act="indmodo" data-v="acum" data-tip="Quantas unidades já passaram por cada etapa (estando nela agora ou já tendo passado)">Acumulado</button></div>`:""}<select class="inp sf" id="ind-visao" data-ind="visao" style="width:auto">${["Visão Unidades","Visão Geral","Visão Aprovações",...(can(ME(),"admin","lider")?["Visão Ações"]:[])].map(v=>`<option ${v===I.visao?"selected":""}>${v}</option>`).join("")}</select></div>`;
  let body="";
  if(I.visao==="Visão Unidades") body=indUnidades(op);
  else if(I.visao==="Visão Geral") body=indGeral();
  else if(I.visao==="Visão Aprovações") body=indAprovacoes();
  else body=indAcoes(op);
  return topbar(`Indicadores (${OBRA().nome})`,`<button class="tb-btn" data-act="pdfcfg" title="Gerar PDF dos indicadores">${IC.pdf}<span>Gerar PDF</span></button>`+filtroBtn(nFil))+`<main class="screen ${I.visao==="Visão Unidades"?"":"wide"}">${head}${body}</main>`+drawerInd();
}
function corrigidosSet(){ return new Set(DB.tarefas.filter(t=>t.id_obra===S.obraId&&t.acao==="corrigir"&&t.etapa_antiga===7).map(t=>t.id_unidade)); }
function indUnidades(op){
  const corr=corrigidosSet(), us=unidadesInd(), rep=!!S.ind.rep&&repSuporta(op);
  const blocos=blocosInd(); if(!blocos.length) return `<div class="panel empty"><b>Nenhum bloco selecionado</b></div>`;
  const usB=us.filter(x=>blocos.includes(nivel1Nome(x))), stAll=usB.map(x=>statusUnd(x,op,corr,rep)), itens=itensLegenda(op,stAll,rep);
  const cor=Object.fromEntries(itens.map(i=>[i.l,i.cor]));
  return `<div class="panel ind-leg"><span class="ind-leg-t"><b>Resumo geral</b> <span class="small muted">· soma de ${blocos.length} ${OBRA().config.tipo==="casa"?"quadra":"bloco"}${blocos.length>1?"s":""} (${usB.length} unidades)</span></span>${legendaHTML(itens,usB.length,false)}</div><div class="blocos">${blocos.map(b=>{
    const ub=us.filter(x=>nivel1Nome(x)===b), linhas=linhasBloco(ub,OBRA().config), cols=Math.max(1,...linhas.map(r=>r.length));
    const st=ub.map(x=>statusUnd(x,op,corr,rep));
    return `<div class="bloco"><div class="tiles" data-cols="${cols}" style="grid-template-columns:repeat(${cols},var(--tw0))">${linhas.map(r=>r.map(x=>{const s=statusUnd(x,op,corr,rep); return `<button class="tile" style="background:${cor[s]||corItem(op,s)};border:0" data-act="abrirund" data-id="${x.id}" title="${esc(x.unidade)}: ${esc(s)}">${esc(x.unidade.replace(/^(AP|CASA) /,""))}</button>`;}).join("")+(r.length<cols?"<span></span>".repeat(cols-r.length):"")).join("")}</div>
      <h3>${esc(b)} (${ub.length} unidades)</h3>
      <div class="legend">${legendaHTML(itensLegenda(op,st,rep),ub.length,op.tipo!=="atual")}</div></div>`;}).join("")}</div>`;
}
function popupIndLista(){
  const L=S.indLista, us=L.ids.map(id=>DB.unidades.find(u=>u.id===id)).filter(Boolean), op={tipo:"atual"};
  const blocos=[...new Set(ordenarUnidades([...us]).map(nivel1Nome))];
  return `<div class="modal" role="dialog" aria-modal="true" aria-label="${esc(L.titulo)}"><div class="scrim" data-act="indlistafechar"></div><div class="box tall">
    <div class="mhead"><div class="t"><b class="conf-t">${esc(L.titulo)}</b><div class="small muted">${esc(L.local)} · ${L.vezes?`${L.n} passage${L.n!==1?"ns":"m"} em ${us.length} unidade${us.length!==1?"s":""}`:`${us.length} unidade${us.length!==1?"s":""}`} · toque numa unidade para ver os detalhes</div></div><button class="iconbtn" data-act="indlistafechar" aria-label="Fechar">${IC.close}</button></div>
    <div class="mbody" id="mb-indl" data-keep-scroll>${blocos.map(b=>{ const ub=ordenarUnidades(us.filter(x=>nivel1Nome(x)===b));
      return `<section class="indl-b">${blocos.length>1?`<h3>${esc(b)} <span class="muted small">(${ub.length})</span></h3>`:""}<div class="indl-tiles">${ub.map(x=>{ const e=(ETAPA[x.sub_etapa]||{}).n||""; const v=L.vezes&&L.vezes[x.id]; return `<button class="tile" data-act="abrirund" data-id="${x.id}" data-tip="${esc(nivel1Nome(x)+" · "+x.unidade+(v?` · ${v} vez${v>1?"es":""} nesta etapa`:"")+" · etapa atual: "+e)}">${esc(x.unidade.replace(/^(AP|CASA) /,""))}${v>1?`<sup>×${v}</sup>`:""}</button>`; }).join("")}</div></section>`; }).join("")}
</div></div></div>`;
}
/* Visão Unidades: monta as linhas de blocos e reparte a sobra da largura entre eles.
   Cada bloco cresce na mesma proporção (blocos de larguras diferentes continuam proporcionais);
   a última linha não fica maior que as de cima, e nada passa de 1,8x o tamanho normal. */
function layoutBlocos(){
  const box=document.querySelector(".blocos"); if(!box) return;
  const bl=[...box.querySelectorAll(":scope > .bloco")]; if(!bl.length) return;
  bl.forEach(b=>{ const t=b.querySelector(".tiles"); t.style.gridTemplateColumns=`repeat(${t.dataset.cols},var(--tw0))`; t.style.removeProperty("--th"); });
  const gap=parseFloat(getComputedStyle(box).columnGap)||16, W=box.clientWidth-1;
  const info=bl.map(b=>{ const t=b.querySelector(".tiles"); return {t,cols:+t.dataset.cols,g:parseFloat(getComputedStyle(t).columnGap)||5,w:b.getBoundingClientRect().width,tw:t.getBoundingClientRect().width}; });
  const linhas=[]; let cur=[], soma=0;
  info.forEach(i=>{ if(cur.length&&soma+gap+i.w>W){ linhas.push(cur); cur=[]; soma=0; } soma+=(cur.length?gap:0)+i.w; cur.push(i); });
  if(cur.length) linhas.push(cur);
  let fAnt=null;
  linhas.forEach((L,k)=>{
    const soma=L.reduce((a,i)=>a+i.w,0), livre=W-gap*(L.length-1);
    let f=Math.min(livre/soma,1.8);
    if(k===linhas.length-1&&linhas.length>1) f=Math.min(f,fAnt);
    fAnt=f; if(f<=1.01) return;
    L.forEach(i=>{ const tw=i.tw+i.w*(f-1), cw=Math.floor((tw-i.g*(i.cols-1))/i.cols*10)/10;
      i.t.style.gridTemplateColumns=`repeat(${i.cols},${cw}px)`; i.t.style.setProperty("--th",Math.round(Math.min(49,Math.max(36,cw*.55)))+"px"); });
  });
}
let _relayout; window.addEventListener("resize",()=>{ clearTimeout(_relayout); _relayout=setTimeout(layoutBlocos,120); });
// células clicáveis: cada número guarda a lista de unidades que entraram na conta
let IND_CEL=[];
const celInd=(n,titulo,local,ids,extra="",cls="",vezes=null)=>{ if(!n) return `<td class="${cls}">${n}${extra}</td>`; IND_CEL.push({titulo,local,ids,vezes,n}); return `<td class="${cls} ind-cel" data-act="indlista" data-i="${IND_CEL.length-1}" tabindex="0" title="Ver as unidades">${n}${extra}</td>`; };
// "Acumulado": a unidade já passou pela etapa (está nela, tem histórico nela, ou já está depois dela no fluxo obrigatório)
function passouFn(){
  const cfg=OBRA().config, REQ=[1,2,3,4,...(cfg.previa?[41]:[]),5,6,8,10,11], hist={};
  DB.tarefas.forEach(t=>{ if(t.id_obra!==S.obraId) return; const H=hist[t.id_unidade]||(hist[t.id_unidade]=new Set()); if(t.etapa_antiga!=null) H.add(t.etapa_antiga); if(t.etapa_nova!=null) H.add(t.etapa_nova); });
  const nivel=u=>{ const c=u.sub_etapa; if(REQ.includes(c)) return c; if(c===9) return 8; if(c===7) return has(u.rep_vistoria_cliente,"Reprovado")?6:has(u.rep_vistoria_previa,"Reprovado")?41:4; return c; };
  return (u,e)=>u.sub_etapa===e||(hist[u.id]&&hist[u.id].has(e))||(REQ.includes(e)&&REQ.indexOf(e)<REQ.indexOf(nivel(u)));
}
// quantas vezes cada unidade entrou em cada etapa (uma unidade vistoriada 3 vezes conta 3)
function vezesFn(){
  const passou=passouFn(), ent={};
  DB.tarefas.forEach(t=>{ if(t.id_obra!==S.obraId||t.etapa_nova==null||t.etapa_nova===t.etapa_antiga) return; const k=t.id_unidade+"|"+t.etapa_nova; ent[k]=(ent[k]||0)+1; });
  return (u,e)=>{ let n=(ent[u.id+"|"+e]||0)+(e===1?1:0); if(!n&&passou(u,e)) n=1; return n; };   // sem histórico (dados antigos): conta 1
}
function indGeral(){
  IND_CEL=[];
  const us=unidadesInd(), bl=blocosInd(), cfg=OBRA().config, f=S.ind.fil, tot=us.length, acum=S.ind.geralModo==="acum", vezes=acum?vezesFn():null;
  const etapas=ETAPAS.filter(e=>e.c!==41||cfg.previa);
  const pct=n=>tot&&n?` (${Math.round(n/tot*100)}%)`:"";
  const cel=(b,codes,nome,cls="",comPct)=>{ const L=us.filter(x=>b==null||nivel1Nome(x)===b);
    if(!acum){ const A=L.filter(x=>codes.includes(x.sub_etapa)); return celInd(A.length,nome,b||"Total da obra",A.map(x=>x.id),comPct?pct(A.length):"",cls); }
    const vz={}; let n=0; L.forEach(x=>{ const v=codes.reduce((s,c)=>s+vezes(x,c),0); if(v){ vz[x.id]=v; n+=v; } });
    return celInd(n,`${nome} · acumulado`,b||"Total da obra",Object.keys(vz).map(Number),"",cls,vz); };
  let rows="";
  [1,2,3].forEach(fa=>{ if(!f["f"+fa]) return; const es=etapas.filter(e=>e.f===fa), codes=es.map(e=>e.c), fe=S.ind.fechado[fa], nomeF=fa===1?"Em Produção":FASES[fa];
    rows+=`<tr class="grp"><th class="lbl"><button data-act="indgrp" data-f="${fa}" aria-expanded="${!fe}">${nomeF}${fe?IC.chevD:IC.chevU}</button></th>${bl.map(b=>cel(b,codes,nomeF)).join("")}${cel(null,codes,nomeF,"tot",true)}</tr>`;
    if(!fe) es.forEach(e=>{ rows+=`<tr><th class="lbl">${esc(e.n)}</th>${bl.map(b=>cel(b,[e.c],e.n)).join("")}${cel(null,[e.c],e.n,"tot")}</tr>`; });
  });
  const totB=b=>{ const L=us.filter(x=>nivel1Nome(x)===b); return celInd(L.length,"Todas as unidades",b,L.map(x=>x.id)); };
  return `<div class="panel" style="overflow-x:auto"><table class="kpi"><thead><tr><th style="background:none"></th>${bl.map(b=>`<th>${esc(b)}</th>`).join("")}<th class="tot">TOTAL</th></tr></thead><tbody>${rows}</tbody>
    <tfoot><tr><th>TOTAL</th>${bl.map(totB).join("")}${celInd(tot,"Todas as unidades","Total da obra",us.map(x=>x.id))}</tr></tfoot></table>
    ${acum?`<p class="small muted" style="margin:9px 3.6px 0">Acumulado: conta cada vez que uma unidade entrou na etapa (uma unidade vistoriada 3 vezes conta 3). A linha TOTAL continua sendo o número de unidades.</p>`:""}</div>`;
}
function indAprovacoes(){
  IND_CEL=[];
  const us=unidadesInd(), bl=blocosInd(), cfg=OBRA().config;
  const cols=[...cfg.testes.map(k=>TESTES.find(t=>t.k===k)).map(t=>[t.col,t.nome]),["rep_vistoria_at","Vistoria Qualidade"],...(cfg.previa?[["rep_vistoria_previa","Vistoria Prévia"]]:[]),["rep_vistoria_cliente","Vistoria Cliente"]];
  let rows="";
  cols.forEach(([c,nome])=>{
    const ap=us.filter(x=>has(x[c],"Aprovado")), niveis=[...new Set(ap.map(x=>x[c]))].sort((a,b)=>repN(a)-repN(b)), fe=S.ind.fechado[c];
    const cA=(L,tit,local,extra="",cls="")=>celInd(L.length,tit,local,L.map(x=>x.id),extra,cls);
    rows+=`<tr class="grp g2"><th class="lbl"><button data-act="indgrp" data-f="${c}" aria-expanded="${!fe}">${esc(nome)}${fe?IC.chevD:IC.chevU}</button></th>${bl.map(b=>cA(ap.filter(x=>nivel1Nome(x)===b),`${nome} · aprovadas`,b)).join("")}${cA(ap,`${nome} · aprovadas`,"Total da obra","","tot")}</tr>`;
    if(!fe) niveis.forEach(n=>{ const L=ap.filter(x=>x[c]===n), t=L.length; rows+=`<tr><th class="lbl">${esc(n)}</th>${bl.map(b=>cA(L.filter(x=>nivel1Nome(x)===b),`${nome} · ${n}`,b)).join("")}${cA(L,`${nome} · ${n}`,"Total da obra",ap.length?` (${Math.round(t/ap.length*100)}%)`:"","tot")}</tr>`; });
  });
  return `<div class="panel" style="overflow-x:auto"><table class="kpi"><thead><tr><th style="background:none"></th>${bl.map(b=>`<th>${esc(b)}</th>`).join("")}<th class="tot">TOTAL</th></tr></thead><tbody>${rows}</tbody></table>
    <p class="small muted" style="margin:9px 3.6px 0">Cada linha mostra em qual tentativa a unidade foi aprovada. "Aprovado 1°" é quem passou de primeira.</p></div>`;
}
const RANK_COLS={1:["liberar","cancelar"],2:["aprovar","reprovar","corrigir"],3:["finalizar","cancelar"],4:["aprovar","reprovar"],41:["aprovar","reprovar"],5:["agendar","cancelar"],6:["aprovar","reprovar"],7:["corrigir"]};
const ACAO_CLS={aprovar:"s-ok",reprovar:"s-bad",corrigir:"s-warn",liberar:"s-info",finalizar:"s-info",agendar:"s-info",cancelar:"s-neutral"};
function indAcoes(op){
  const I=S.ind, bl=new Set(blocosInd()), ini=I.ini?new Date(I.ini+"T00:00"):null, fim=I.fim?new Date(I.fim+"T23:59:59"):null;
  const um=new Map(unidadesObra().map(x=>[x.id,x]));
  const T=DB.tarefas.filter(t=>t.id_obra===S.obraId&&t.acao!=="financeiro"&&t.etapa_antiga===op.etapa&&(!op.coluna||t.coluna===op.coluna)&&bl.has(nivel1Nome(um.get(t.id_unidade)))&&(!ini||new Date(t.data)>=ini)&&(!fim||new Date(t.data)<=fim)).sort((a,b)=>b.data.localeCompare(a.data));
  const rc=RANK_COLS[op.etapa]||[], autores=[...new Set(T.map(t=>t.autor))].map(a=>({a,n:T.filter(t=>t.autor===a).length})).sort((x,y)=>y.n-x.n);
  const lista=T.slice(0,400);
  return `<div class="acoes"><section class="panel"><h2 class="h2" style="margin-bottom:10.8px">Movimentações <span class="muted small">(${T.length})</span></h2>
    ${T.length?`<div class="scrollbox" id="ind-mov" data-keep-scroll><table class="list"><thead><tr><th>Unidade</th><th class="n">Ação</th><th>Autor</th><th>Data</th><th>Observação</th></tr></thead><tbody>
      ${lista.map(t=>{const x=um.get(t.id_unidade); return `<tr><td style="white-space:nowrap">${esc(nivel1Nome(x))} - ${esc(x.unidade)}</td><td class="n"><span class="act ${ACAO_CLS[t.acao]||""}">${esc(t.acao)}</span></td><td>${esc(t.autor)}</td><td class="tnum" style="white-space:nowrap">${fmtDTL(new Date(t.data))}</td><td class="obs-c">${t.obs?`<div tabindex="0" data-tip="${esc(t.obs)}">${esc(t.obs)}</div>`:""}</td></tr>`;}).join("")}
      </tbody></table>${T.length>400?`<p class="small muted">Mostrando as 400 mais recentes.</p>`:""}</div>`:`<div class="empty"><b>Nenhuma movimentação</b><span>Mude a etapa ou o período.</span></div>`}</section>
    <section class="panel"><h2 class="h2" style="margin-bottom:10.8px">Dados por usuário</h2>
    <div style="overflow-x:auto"><table class="list"><thead><tr><th>Usuário</th>${rc.map(c=>`<th class="n"><span class="act ${ACAO_CLS[c]}" style="min-width:0">${c}</span></th>`).join("")}<th class="n">Total</th></tr></thead><tbody>
      ${autores.map(r=>`<tr><td>${esc(r.a)}</td>${rc.map(c=>`<td class="n">${T.filter(t=>t.autor===r.a&&t.acao===c).length}</td>`).join("")}<td class="n"><b>${r.n}</b></td></tr>`).join("")}</tbody>
      <tfoot><tr><td></td>${rc.map(c=>{const n=T.filter(t=>t.acao===c).length; return `<td class="n">${n}${T.length&&n?` (${Math.round(n/T.length*100)}%)`:""}</td>`;}).join("")}<td class="n">${T.length}</td></tr></tfoot></table></div></section></div>`;
}
function drawerInd(){
  if(!S.drawer) return "";
  const I=S.ind;
  return drawerShell(`${I.visao==="Visão Geral"?`<div class="fsec"><b class="flbl">Fases</b>${[["f1","Produção"],["f2","Vistorias"],["f3","Entrega"]].map(([k,t])=>fck("if-"+k,`data-indfil="${k}"`,I.fil[k],t)).join("")}</div><hr>`:""}
    ${blocosDD(I.fil.blocos,"indbloco")}
    ${I.visao==="Visão Ações"?`<hr><div class="fsec"><b class="flbl">Período</b><div class="field"><label for="ind-ini" class="small">Início</label><input type="date" class="inp" id="ind-ini" data-ind="ini" value="${I.ini}"></div><div class="field"><label for="ind-fim" class="small">Término</label><input type="date" class="inp" id="ind-fim" data-ind="fim" value="${I.fim}" min="${I.ini}"></div></div>`:""}`,"indlimpar");
}

/* ================= TELA: AGENDA ================= */
function eventosAgenda(){
  const um=new Map(unidadesObra().map(x=>[x.id,x])), ev=[];
  const porU={};
  DB.tarefas.filter(t=>t.id_obra===S.obraId&&t.coluna==="agendamento").sort((a,b)=>a.data.localeCompare(b.data)).forEach(t=>{(porU[t.id_unidade]=porU[t.id_unidade]||[]).push(t);});
  // resultado da vistoria marcada: a primeira aprovação/reprova do cliente depois do agendamento (antes de outro agendamento)
  const resUnd={}; DB.tarefas.filter(t=>t.id_obra===S.obraId&&t.coluna==="rep_vistoria_cliente"&&(t.acao==="aprovar"||t.acao==="reprovar")).forEach(t=>{(resUnd[t.id_unidade]=resUnd[t.id_unidade]||[]).push(t);});
  const resultado=(lista,t,prox)=>{ const r=(lista||[]).filter(z=>z.data>t.data&&(!prox||z.data<prox.data)).sort((a,b)=>a.data.localeCompare(b.data))[0]; return r?(r.acao==="aprovar"?"ok":"bad"):"warn"; };
  Object.values(porU).forEach(L=>L.forEach((t,i)=>{ if(t.acao!=="agendar") return; const d=parseAg(t.agendamento); if(!d) return; const x=um.get(t.id_unidade); if(!x) return; const c=clienteById(x.id_cliente);
    const prox=L.slice(i+1).find(z=>z.acao==="agendar");
    ev.push({d,hora:t.agendamento.slice(11),txt:`${nivel1Nome(x)} > ${x.unidade}`,sub:c?tituloCase(c.nome):"",rep:t.repeticao,cx:!!(L[i+1]&&L[i+1].acao==="cancelar"),id:x.id,st:resultado(resUnd[x.id],t,prox)}); }));
  const ac={}; DB.tarefas_ac.filter(t=>t.id_obra===S.obraId&&t.coluna==="agendamento").sort((a,b)=>a.data.localeCompare(b.data)).forEach(t=>{(ac[t.id_local]=ac[t.id_local]||[]).push(t);});
  const resAc={}; DB.tarefas_ac.filter(t=>t.id_obra===S.obraId&&t.coluna==="rep_vistoria_sindico"&&(t.acao==="aprovar"||t.acao==="reprovar")).forEach(t=>{(resAc[t.id_local]=resAc[t.id_local]||[]).push(t);});
  Object.values(ac).forEach(L=>L.forEach((t,i)=>{ if(t.acao!=="agendar") return; const d=parseAg(t.agendamento); const a=DB.areas.find(z=>z.id===t.id_local); if(!a) return;
    const prox=L.slice(i+1).find(z=>z.acao==="agendar");
    if(d) ev.push({d,hora:t.agendamento.length>10?t.agendamento.slice(11):"Áreas comuns",txt:a.descricao,sub:"Vistoria do síndico",rep:t.repeticao,cx:!!(L[i+1]&&L[i+1].acao==="cancelar"),ac:1,idac:a.id,st:resultado(resAc[a.id],t,prox)}); }));
  return ev;
}
function telaAgenda(){
  const A=S.agd, m=A.mes, ev=eventosAgenda(), hoje=startOfDay(new Date());
  const first=new Date(m.getFullYear(),m.getMonth(),1), ini=new Date(first); ini.setDate(1-first.getDay());
  const cells=[]; for(let i=0;i<42;i++){ const d=new Date(ini); d.setDate(ini.getDate()+i); cells.push(d); }
  const doDia=d=>ev.filter(e=>sameDay(e.d,d)).sort((a,b)=>a.hora.localeCompare(b.hora));
  const q=A.busca.trim().toLowerCase();
  const sel=doDia(A.dia).filter(e=>!q||(e.txt+" "+e.sub).toLowerCase().includes(q));
  const grupos=[...new Set(sel.map(e=>e.hora))];
  const info=`<button class="iconbtn" data-act="agdinfo" aria-label="Legenda das cores" aria-expanded="${!!S.agdInfo}" title="Legenda">${IC.info}</button>`;
  const leg=S.agdInfo?`<div class="dd-scrim" data-act="agdinfo"></div><div class="ag-pop" role="dialog" aria-label="Legenda"><b>Cores da vistoria</b>
    <span><i class="vdot st-warn"></i>Agendada, ainda não feita</span><span><i class="vdot st-ok"></i>Feita e aprovada</span><span><i class="vdot st-bad"></i>Feita e reprovada</span><span><i class="vdot st-cx"></i>Cancelada</span>
    <span class="small muted">No calendário é a bolinha; na lista do dia é o fundo do número da vistoria (1°, 2°...). Toque num card para abrir a unidade.</span></div>`:"";
  return topbar("Agenda Vistorias Clientes",info)+leg+`<main class="screen"><div class="agenda">
    <section class="month"><div class="row" style="margin-bottom:10.8px"><button class="iconbtn" data-act="agdmes" data-d="-1" aria-label="Mês anterior">${IC.chevL}</button><b style="font-size:1.3rem;min-width:153px;text-align:center">${esc(mesNome(m))}</b><button class="iconbtn" data-act="agdmes" data-d="1" aria-label="Próximo mês">${IC.chevR}</button>
      <span class="spacer"></span><button class="btn sm" data-act="agdhoje">Hoje</button></div>
      <div class="mgrid">${["dom","seg","ter","qua","qui","sex","sáb"].map(w=>`<div class="wd">${w}</div>`).join("")}
      ${cells.map(d=>{const es=doDia(d), out=d.getMonth()!==m.getMonth();
        return `<button class="d ${out?"out":""} ${d<hoje&&!out?"past":""} ${sameDay(d,A.dia)?"sel":""} ${sameDay(d,hoje)?"today":""}" data-act="agddia" data-t="${d.getTime()}" aria-label="${fmtData(d)}, ${es.length} vistorias"><span class="n">${d.getDate()}</span>
          ${es.slice(0,3).map(e=>`<span class="ev st-${e.st} ${e.cx?"cx":""}">${esc(e.txt)}</span>`).join("")}${es.length>3?`<span class="more">+${es.length-3} mais</span>`:""}
          <span class="dots">${es.slice(0,6).map(e=>`<i class="st-${e.cx?"cx":e.st}"></i>`).join("")}</span></button>`;}).join("")}</div></section>
    <aside class="side"><div class="row"><b style="font-size:1.1rem">${fmtData(A.dia)}</b><span class="spacer"></span><span class="muted small">${sel.filter(e=>!e.cx).length} vistoria(s)</span></div>
      ${buscaBox("agdBusca",A.busca,"Pesquisar unidade ou cliente").replace('class="search"','class="search" style="width:100%"')}
      ${grupos.length?grupos.map(h=>`<div class="slotgrp"><h4>${esc(h)}</h4>${sel.filter(e=>e.hora===h).map(e=>`<button class="vcard ${e.cx?"cx":""}" data-act="agdabrir" data-id="${e.ac?e.idac:e.id}" ${e.ac?'data-ac="1"':""} title="${e.cx?"Cancelada":e.st==="ok"?"Vistoria aprovada":e.st==="bad"?"Vistoria reprovada":"Vistoria agendada, ainda não feita"}"><b>${esc(e.txt)}</b><span class="tag st-${e.cx?"cx":e.st}">${e.rep||1}°</span><span>${e.cx?"Cancelado":esc(e.sub)}</span></button>`).join("")}</div>`).join("")
        :`<div class="empty" style="padding:36px 7.2px"><b>Nenhuma vistoria neste dia</b><span>Escolha outro dia no calendário.</span></div>`}
    </aside></div></main>`;
}

/* ================= TELA: LAUDOS (cliente com engenheiro na vistoria) ================= */
const laudosObra=()=>(DB.laudos||[]).filter(L=>L.id_obra===S.obraId);
function itemLaudos(){ const n=laudosObra().filter(L=>L.status==="pendente").length;
  return `<button class="sb-item ${S.screen==="laudos"?"on":""}" data-act="ir" data-to="laudos">${IC.pdf}Laudos${n?`<span class="sb-badge">${n}</span>`:""}</button>`; }
function telaLaudos(){
  const aba=S.laudoAba||"pendente", todos=laudosObra(), lista=todos.filter(L=>L.status===aba).sort((a,b)=>aba==="pendente"?a.criado_em.localeCompare(b.criado_em):String(b.recebido_em).localeCompare(String(a.recebido_em)));
  const rc=can(ME(),"rc"), dias=d=>Math.max(0,Math.floor((Date.now()-new Date(d))/864e5));
  const card=L=>{ const x=DB.unidades.find(u=>u.id===L.id_unidade), c=x&&clienteById(x.id_cliente);
    return `<div class="panel laudo"><button class="laudo-main" data-act="abrirund" data-id="${L.id_unidade}"><b>${esc(x?`${nivel1Nome(x)} · ${x.unidade}`:"Unidade")}</b>
      <span>${c?esc(tituloCase(c.nome)):"Sem cliente"}${c&&c.telefone?` · <span class="tnum">${esc(fmtTel(c.telefone))}</span>`:""}</span>
      <span class="small muted">Engenheiro: ${esc(L.engenheiro||"não informado")} · vistoria em ${fmtData(new Date(L.criado_em))}${L.status==="pendente"?` · <b class="${dias(L.criado_em)>7?"t-bad":""}">${dias(L.criado_em)} dia(s) esperando</b>`:` · recebido em ${fmtData(new Date(L.recebido_em))}${L.recebido_por?` por ${esc(nomeUsuario(L.recebido_por))}`:""}`}</span>
      ${L.obs?`<span class="small">${esc(L.obs)}</span>`:""}${L.anexos&&L.anexos.length?`<span class="small">${IC.clip}${L.anexos.map(a=>a.path?`<button class="linkbtn" data-act="anexo" data-path="${esc(a.path)}">${esc(a.nome)}</button>`:esc(a.nome)).join(", ")}</span>`:""}</button>
      ${L.status==="pendente"&&rc?`<button class="btn primary sm" data-act="laudoabrir" data-id="${L.id}">Marcar como recebido</button>`:""}</div>`; };
  const nP=todos.filter(L=>L.status==="pendente").length, nR=todos.length-nP;
  const info=`<button class="iconbtn" data-act="laudoinfo" aria-label="Sobre os laudos" aria-expanded="${!!S.laudoInfo}" title="Sobre os laudos">${IC.info}</button>`;
  const pop=S.laudoInfo?`<div class="dd-scrim" data-act="laudoinfo"></div><div class="ag-pop" role="dialog" aria-label="Sobre os laudos"><b>Laudos de vistoria</b>
    <span class="small">Quando o cliente traz um engenheiro ou responsável técnico na vistoria, o laudo dele precisa ser enviado para a Rottas. O RC cobra e marca aqui quando receber.</span></div>`:"";
  return topbar("Laudos de vistoria",info)+pop+`<main class="screen laudos">
    <div class="seg tabs" role="tablist"><button class="${aba==="pendente"?"on":""}" data-act="laudoaba" data-v="pendente">Pendentes (${nP})</button><button class="${aba==="recebido"?"on":""}" data-act="laudoaba" data-v="recebido">Recebidos (${nR})</button></div>
    ${lista.length?`<div class="laudos-lista">${lista.map(card).join("")}</div>`:`<div class="panel empty"><b>${aba==="pendente"?"Nenhum laudo pendente":"Nenhum laudo recebido ainda"}</b><span>Os laudos aparecem aqui quando a vistoria do cliente é registrada com engenheiro.</span></div>`}</main>`;
}
function modalLaudo(){
  const R=S.laudoRec, L=(DB.laudos||[]).find(z=>z.id===R.id); if(!L) return ""; const x=DB.unidades.find(u=>u.id===L.id_unidade);
  return `<div class="modal" role="dialog" aria-modal="true" aria-label="Laudo recebido"><div class="scrim" data-act="laudofechar"></div><div class="box sm2">
    <div class="mhead"><div class="t"><b class="conf-t">Laudo recebido</b><div class="small muted">${esc(x?`${nivel1Nome(x)} · ${x.unidade}`:"")}</div></div><button class="iconbtn" data-act="laudofechar" aria-label="Fechar">${IC.close}</button></div>
    <div class="mbody"><div class="field"><label for="laudo-obs">Observação (opcional)</label><textarea class="inp" id="laudo-obs" rows="3" placeholder="Ex.: recebido por e-mail">${esc(R.obs)}</textarea></div>
      <label class="anxbtn">${IC.clip}${R.arq?esc(R.arq.name):"Anexar o laudo (opcional)"}<input type="file" id="laudo-file" accept="application/pdf,image/*" hidden></label></div>
    <div class="mfoot"><button class="btn primary" data-act="laudook">Confirmar recebimento</button></div></div></div>`;
}

/* ================= TELA: LOCAIS ================= */
function telaLocais(){
  const L=S.loc, o=OBRA(), cfg=o.config, admin=can(ME(),"admin"), q=(L.busca||"").trim().toLowerCase();
  const locais=DB.locais.filter(l=>l.id_obra===S.obraId).sort((a,b)=>a.nivel1.localeCompare(b.nivel1));
  if(S.locAba==="ac") L.localId="ac";
  if(L.localId!=="ac"&&!localById(L.localId)&&locais.length){ L.localId=locais[0].id; L.n2=1; }
  const acs=DB.areas.filter(a=>a.id_obra===S.obraId).sort((a,b)=>a.descricao.localeCompare(b.descricao));
  const loc=localById(L.localId);
  const casa=cfg.tipo==="casa";
  const us=loc?ordenarUnidades(DB.unidades.filter(x=>x.nivel_1===loc.id&&(casa||x.nivel_2===L.n2))):[];
  const vis=locais.map(l=>{const ns=casa?[[`Casas (${DB.unidades.filter(u=>u.nivel_1===l.id).length})`,0]]:l.niveis2.split(", ").filter(Boolean).map((n,i)=>[n,i+1]); const ok=!q||l.nivel1.toLowerCase().includes(q); return [l,ok?ns:ns.filter(([n])=>n.toLowerCase().includes(q))];}).filter(([l,ns])=>ns.length);
  const cfgModal=L.cfgAberta&&admin?`<div class="modal" role="dialog" aria-modal="true" aria-label="Configuração da obra"><div class="scrim" data-act="cfgtoggle"></div><div class="box sm2">
    <div class="mhead"><div class="t"><b class="conf-t">Configurações Gerais</b><div class="small muted">${esc(o.nome)} · substitui as regras que antes eram fixas por ID de obra</div></div><button class="iconbtn" data-act="cfgtoggle" aria-label="Fechar">${IC.close}</button></div>
    <div class="mbody"><div class="field"><label>Foto de capa <span class="small muted" style="font-weight:400">· é a imagem do card da obra na tela inicial</span></label><div class="capa">${fotoObra(o)?`<img src="${esc(fotoObra(o))}" alt="Foto atual de ${esc(o.nome)}">`:`<div class="capa-vazia">Sem foto</div>`}
        <label class="btn sm ghost">${IC.camera}Alterar foto<input type="file" id="foto-obra" accept="image/*" hidden></label></div></div>
      <div class="field"><label>Tipo da obra</label><div class="seg" style="align-self:flex-start"><button class="${cfg.tipo==="predio"?"on":""}" data-act="cfgtipo" data-v="predio">Prédio</button><button class="${cfg.tipo==="casa"?"on":""}" data-act="cfgtipo" data-v="casa">Casas</button></div></div>
      ${cfg.tipo==="casa"?`<div class="field"><label for="cfg-cpl">Casas por linha na Visão Unidades</label><input class="inp tnum" type="number" min="1" max="40" id="cfg-cpl" data-cfgnum="casasPorLinha" value="${cfg.casasPorLinha||8}" style="max-width:108px"><span class="small muted">As casas de cada quadra aparecem em ordem, quebrando a linha a cada ${cfg.casasPorLinha||8}.</span></div>`:""}
      <div class="field"><label>Testes da validação técnica</label>${TESTES.map(t=>`<label class="chk"><input type="checkbox" id="cfg-${t.k}" data-cfgteste="${t.k}" ${cfg.testes.includes(t.k)?"checked":""}>${t.nome}</label>`).join("")}</div>
      <div class="field"><label>Etapas opcionais</label><label class="chk"><input type="checkbox" id="cfg-previa" data-cfg="previa" ${cfg.previa?"checked":""}>Vistoria Prévia depois da Qualidade</label><label class="chk"><input type="checkbox" id="cfg-direto" data-cfg="aprovarDireto" ${cfg.aprovarDireto?"checked":""}>Permitir "Aprovar direto" (pula a vistoria Qualidade)</label></div></div></div></div>`:"";
  const modal=L.modal?modalLocais():"";
  const right=admin?`<button class="tb-btn" data-act="cfgtoggle" title="Foto, tipo da obra, testes e etapas opcionais">${IC.settings||IC.edit}<span>Configurações Gerais</span></button>`:"";
  return topbar("Obra",right)+`<main class="locais">
    <aside class="loc-side">
      <div class="seg loc-abas" role="tablist"><button class="${S.locAba!=="ac"?"on":""}" role="tab" aria-selected="${S.locAba!=="ac"}" data-act="locaba" data-v="und">Unidades</button><button class="${S.locAba==="ac"?"on":""}" role="tab" aria-selected="${S.locAba==="ac"}" data-act="locaba" data-v="ac">Áreas comuns <span class="tnum">(${acs.length})</span></button></div>
      ${S.locAba==="ac"?`<div class="loc-list"><p class="muted small" style="padding:3.6px 7.2px 0;margin:0">Áreas que não pertencem a um bloco: salão de festas, piscina, guarita... Toque em uma para renomear ou no + para adicionar.</p></div>`:`
      <div class="row">${buscaBox("locBusca",L.busca||"","Pesquisar bloco ou pavimento").replace('class="search"','class="search loc-search"')}</div>
      <div class="loc-list" id="loc-list" data-keep-scroll>${vis.map(([l,ns])=>`<div class="loc-grp"><button class="loc-h" data-act="locedit" data-id="${l.id}" title="Editar ${esc(l.nivel1)}">${esc(l.nivel1)}${IC.edit}</button>
        ${ns.map(([n,i])=>`<button class="loc-p ${L.localId===l.id&&(casa||L.n2===i)?"on":""}" data-act="locsel" data-id="${l.id}" data-n="${i}">${esc(n)}</button>`).join("")}</div>`).join("")
        ||`<p class="muted small" style="padding:7.2px">Nada encontrado.</p>`}
        <button class="loc-novo" data-act="locnovo">${IC.plus}${casa?"Nova quadra":"Novo bloco"}</button></div>`}
    </aside>
    <section class="loc-main">${L.localId==="ac"?`<h2 class="loc-crumb">${esc(o.nome)} &gt; Áreas Comuns</h2>
      <div class="loc-units ac">${acs.map(a=>`<button data-act="acedit" data-id="${a.id}">${esc(a.descricao)}</button>`).join("")}<button class="add" data-act="acnova" aria-label="Adicionar área comum">${IC.plus}</button></div>`:loc?`<h2 class="loc-crumb">${esc(o.nome)} &gt; ${esc(loc.nivel1)}${casa?"":` &gt; ${esc(loc.niveis2.split(", ")[L.n2-1]||"")}`}</h2>
      <div class="loc-units">${us.map(x=>`<button data-act="undedit" data-id="${x.id}">${esc(x.unidade)}</button>`).join("")}<button class="add" data-act="undnova" aria-label="Adicionar unidade">${IC.plus}</button></div>`
      :`<div class="empty"><b>Nenhum local cadastrado</b><span>Crie o primeiro bloco ou quadra na lista à esquerda.</span></div>`}</section>
  </main>${modal}${cfgModal}`;
}
function modalLocais(){
  const M=S.loc.modal;
  if(M.tipo==="ac"){ const a=M.id?DB.areas.find(z=>z.id===M.id):null, adm=can(ME(),"admin"), podeExcluir=a&&(a.sub_etapa===1||adm);
    return `<div class="modal" role="dialog" aria-modal="true"><div class="scrim" data-act="locfechar"></div><div class="box sm"><div class="mhead"><b class="t h2">${a?"Editar área comum":"Adicionar área comum"}</b><button class="iconbtn" data-act="locfechar" aria-label="Fechar">${IC.close}</button></div>
      <div class="mbody"><div class="field"><label for="ac-nome">Nome da área comum</label><input class="inp" id="ac-nome" value="${esc(a?a.descricao:"")}" placeholder="Ex.: Salão de Festas"></div>
      ${a&&!podeExcluir?`<span class="small muted">Só dá para excluir áreas comuns que ainda estão na Liberação Local.</span>`:""}
      ${a&&adm&&a.sub_etapa!==1&&M.del?`<div class="aviso-box forte">Esta área já está em <b>${esc(ETAPA_AC[a.sub_etapa].n)}</b>. O histórico dela some das telas. Não dá para desfazer.</div>`:""}</div>
      <div class="mfoot">${podeExcluir?`<button class="btn ${M.del?"bad":"ghost"}" data-act="acdel">${M.del?"Confirmar exclusão":"Excluir"}</button><span class="spacer"></span>`:""}<button class="btn ghost" data-act="locfechar">Cancelar</button><button class="btn primary" data-act="acsalvar">Salvar</button></div></div></div>`; }
  if(M.tipo==="und"){ const x=M.id?DB.unidades.find(u=>u.id===M.id):null, podeExcluir=x&&x.sub_etapa===1;
    return `<div class="modal" role="dialog" aria-modal="true"><div class="scrim" data-act="locfechar"></div><div class="box sm"><div class="mhead"><b class="t h2">${x?"Editar unidade":"Adicionar unidade"}</b><button class="iconbtn" data-act="locfechar" aria-label="Fechar">${IC.close}</button></div>
      <div class="mbody"><div class="field"><label for="und-nome">Nome da unidade</label><input class="inp" id="und-nome" value="${esc(x?x.unidade:(M.sug||""))}" placeholder="${OBRA().config.tipo==="casa"?"Ex.: CASA 12":"Ex.: AP 305"}"></div>
      ${x&&!podeExcluir?`<span class="small muted">Só dá para excluir unidades que ainda estão na Liberação de Testes.</span>`:""}</div>
      <div class="mfoot">${podeExcluir?`<button class="btn ${M.del?"bad":"ghost"}" data-act="unddel">${M.del?"Confirmar exclusão":"Excluir"}</button><span class="spacer"></span>`:""}<button class="btn ghost" data-act="locfechar">Cancelar</button><button class="btn primary" data-act="undsalvar">Salvar</button></div></div></div>`; }
  const l=M.id?localById(M.id):null, casa=OBRA().config.tipo==="casa", usL=l?DB.unidades.filter(u=>u.nivel_1===l.id):[];
  const fora=usL.filter(u=>u.sub_etapa!==1&&!ehHall(u)).length, adm=can(ME(),"admin"), podeDel=l&&(!fora||adm);
  const F=M.f||(M.f=formLocal(l,casa)), plano=planoUnidades(F,l,casa);
  const campos=casa?`<div class="field"><label for="loc-n1">Nome da quadra</label><input class="inp" id="loc-n1" data-locf="n1" value="${esc(F.n1)}" placeholder="Ex.: Quadra 7"></div>
      <div class="row2"><div class="field"><label for="loc-qt">Número de casas</label><input class="inp tnum" type="number" min="0" max="300" id="loc-qt" data-locf="qt" value="${esc(F.qt)}"></div>
      <div class="field"><label for="loc-ini">Primeira casa</label><input class="inp tnum" type="number" min="1" id="loc-ini" data-locf="ini" value="${esc(F.ini)}"></div></div>`
    :`<div class="field"><label for="loc-n1">Nome do bloco</label><input class="inp" id="loc-n1" data-locf="n1" value="${esc(F.n1)}" placeholder="Ex.: Bloco H"></div>
      <div class="row2"><div class="field"><label for="loc-pav">Pavimentos</label><input class="inp tnum" type="number" min="1" max="40" id="loc-pav" data-locf="pav" value="${esc(F.pav)}"></div>
      <div class="field"><label for="loc-qt">Unidades por andar</label><input class="inp tnum" type="number" min="0" max="30" id="loc-qt" data-locf="qt" value="${esc(F.qt)}"></div></div>`;
  const prev=textoPlano(plano);
  return `<div class="modal" role="dialog" aria-modal="true"><div class="scrim" data-act="locfechar"></div><div class="box sm"><div class="mhead"><b class="t h2">${l?(casa?"Editar quadra":"Editar bloco"):(casa?"Nova quadra":"Novo bloco")}</b><button class="iconbtn" data-act="locfechar" aria-label="Fechar">${IC.close}</button></div>
    <div class="mbody">${campos}
      <label class="chk"><input type="checkbox" id="loc-gerar" data-locf="gerar" ${F.gerar?"checked":""}>${l?"Criar as unidades que faltam":"Criar as unidades automaticamente"}</label>
      ${casa?"":`<label class="chk"><input type="checkbox" id="loc-hall" data-locf="hall" ${F.hall?"checked":""}>Criar um HALL em cada andar</label>`}
      <div class="loc-prev small" id="loc-prev" ${F.gerar||F.hall?"":"hidden"}>${prev}</div>
      <span class="small muted">${casa?"Padrão de nome: CASA 1, CASA 2... em sequência na obra.":"Padrão de nome: AP + andar + número (1° andar, apto 1 = AP 101; 10° andar = AP 1001)."}</span></div>
      ${l&&fora&&!adm?`<span class="small muted">Só dá para excluir ${casa?"a quadra":"o bloco"} quando todas as unidades estão na Liberação de Testes (${fora} já avançaram).</span>`:""}
      ${l&&fora&&adm&&!M.del?`<span class="small muted">Como admin, você pode excluir mesmo com ${fora} unidade(s) que já avançaram no fluxo.</span>`:""}
      ${podeDel&&M.del&&usL.length?`<div class="aviso-box ${fora?"forte":""}">Vai excluir ${casa?"a quadra":"o bloco"} <b>${esc(l.nivel1)}</b> e as <b>${usL.length}</b> unidade(s) dele${usL.some(u=>u.id_cliente)?" (os clientes continuam cadastrados, só perdem o vínculo)":""}.${fora?` <b>${fora} unidade(s) já avançaram no fluxo: o histórico delas some das telas. Não dá para desfazer.</b>`:""}</div>`:""}
    <div class="mfoot">${podeDel?`<button class="btn ${M.del?"bad":"ghost"}" data-act="locdel">${M.del?"Confirmar exclusão":casa?"Excluir quadra":"Excluir bloco"}</button><span class="spacer"></span>`:""}<button class="btn ghost" data-act="locfechar">Cancelar</button><button class="btn primary" data-act="locsalvar">Salvar</button></div></div></div>`;
}
const numCasa=s=>{const m=/^CASA\s+(\d+)/i.exec(s||""); return m?+m[1]:0;};
function formLocal(l,casa){
  const us=l?DB.unidades.filter(u=>u.nivel_1===l.id):[];
  if(casa){ const nums=us.map(u=>numCasa(u.unidade)).filter(Boolean), todas=DB.unidades.filter(u=>u.id_obra===S.obraId).map(u=>numCasa(u.unidade)).filter(Boolean);
    return {n1:l?l.nivel1:`Quadra ${DB.locais.filter(x=>x.id_obra===S.obraId).length+1}`, qt:l?us.length:8, ini:l?(nums.length?Math.min(...nums):1):(todas.length?Math.max(...todas)+1:1), gerar:!l}; }
  const pav=l&&l.niveis2?l.niveis2.split(", ").filter(Boolean).length:4, porAndar={}; us.filter(u=>!/^HALL/i.test(u.unidade)).forEach(u=>{porAndar[u.nivel_2]=(porAndar[u.nivel_2]||0)+1;});
  return {n1:l?l.nivel1:"Bloco ", pav, qt:l?Math.max(0,...Object.values(porAndar)):4, gerar:!l, hall:false};
}
function atualizarPrevLocal(){
  const M=S.loc.modal; if(!M||!M.f) return; const el=document.getElementById("loc-prev"); if(!el) return;
  const l=M.id?localById(M.id):null; el.innerHTML=textoPlano(planoUnidades(M.f,l,OBRA().config.tipo==="casa"));
}
function textoPlano(plano){
  const aps=plano.novas.filter(x=>!x.hall), halls=plano.novas.filter(x=>x.hall);
  if(!plano.novas.length) return plano.total?"Todas essas unidades já existem.":"Nenhuma unidade para criar.";
  return [aps.length?`Vai criar <b>${aps.length}</b> unidade(s): ${esc(aps[0].nome)} até ${esc(aps.at(-1).nome)}`:"",halls.length?`<b>${halls.length}</b> HALL (um em cada andar)`:""].filter(Boolean).join(" e ")+(plano.existentes?`. ${plano.existentes} já existe(m) e fica(m) como está(ão)`:"")+".";
}
function planoUnidades(F,l,casa){
  const lista=[], qt=Math.max(0,Math.min(casa?300:30,parseInt(F.qt)||0));
  if(casa){ if(F.gerar){ const ini=Math.max(1,parseInt(F.ini)||1); for(let i=0;i<qt;i++) lista.push({nome:`CASA ${ini+i}`,pav:null}); } }
  else { const pav=Math.max(1,Math.min(40,parseInt(F.pav)||1));
    for(let p=1;p<=pav;p++){ if(F.gerar) for(let k=1;k<=qt;k++) lista.push({nome:`AP ${p}${pad(k)}`,pav:p}); if(F.hall) lista.push({nome:"HALL",pav:p,hall:1}); } }
  // no prédio a unidade é única por pavimento (o HALL se repete em cada andar)
  const chave=(nome,pav)=>casa?nome.toUpperCase():`${pav}|${nome.toUpperCase()}`;
  const existe=new Set(DB.unidades.filter(u=>casa?u.id_obra===S.obraId:(l&&u.nivel_1===l.id)).map(u=>chave(u.unidade,u.nivel_2)));
  const novas=lista.filter(x=>!existe.has(chave(x.nome,x.pav)));
  return {novas,total:lista.length,existentes:lista.length-novas.length};
}
function novaUnidade(nivel_1,nivel_2,nome){ return {id:nextId("unidades"),id_obra:S.obraId,nivel_1,nivel_2,unidade:nome,modulo:"",id_cliente:null,sub_etapa:1,rep_teste_esgoto:"",rep_teste_aguafria:"",rep_teste_dreno:"",rep_teste_gas:"",rep_teste_eletrico:"",rep_vistoria_at:"",rep_vistoria_previa:"",rep_vistoria_cliente:"",agendamento:"",financeiro_status:"",financeiro_motivo:"",prioridade:""}; }
function proximaUnidade(){
  if(OBRA().config.tipo==="casa"){ const t=DB.unidades.filter(u=>u.id_obra===S.obraId).map(u=>numCasa(u.unidade)); return `CASA ${Math.max(0,...t)+1}`; }
  const L=S.loc, ks=DB.unidades.filter(u=>u.nivel_1===L.localId&&u.nivel_2===L.n2).map(u=>{const m=new RegExp("^AP\\s*"+L.n2+"(\\d{2})$","i").exec(u.unidade); return m?+m[1]:0;});
  return `AP ${L.n2}${pad(Math.max(0,...ks)+1)}`;
}


/* ================= TELA: HORÁRIOS ================= */
function carregarHor(cfgId){
  const L=DB.horarios.filter(h=>h.id_obra===S.obraId).sort((a,b)=>String(a.valido_desde||"").localeCompare(String(b.valido_desde||"")));
  const atual=cfgHorarioNaData(S.obraId,isoData(new Date()));
  const cfg=cfgId?L.find(h=>h.id===cfgId):(atual||L[0]||null);
  S.hor={obraId:S.obraId,aba:(S.hor&&S.hor.obraId===S.obraId&&S.hor.aba)||"semana",cfgId:cfg?cfg.id:null,draft:Object.fromEntries(DIAS.map(([k])=>[k,cfg?parseHor(cfg[k]):[]])),exc:null,novaData:"",sujo:false};
}
const vistoriasNaData=iso=>{ const [y,m,d]=iso.split("-"), br=`${d}/${m}/${y}`; return DB.unidades.filter(u=>u.id_obra===S.obraId&&String(u.agendamento).startsWith(br)&&has(u.rep_vistoria_cliente,"Pendente")); };
function slotsEditor(L,k){
  return `${L.map((h,i)=>`<div class="slotrow"><button class="x" data-act="hordel" data-k="${k}" data-i="${i}" aria-label="Remover ${h.Horas}">×</button>
      <select class="inp" data-hor="${k}" data-i="${i}" data-f="Horas" aria-label="Horário">${HORAS.map(x=>`<option ${x===h.Horas?"selected":""}>${x}</option>`).join("")}</select>
      <input class="inp tnum" type="number" min="1" max="50" data-hor="${k}" data-i="${i}" data-f="Pessoas" value="${h.Pessoas}" aria-label="Pessoas disponíveis"></div>`).join("")}
      <button class="btn primary" data-act="horadd" data-k="${k}">Novo horário</button>`;
}
function telaHorarios(){
  if(!S.hor||S.hor.obraId!==S.obraId) carregarHor();
  const H=S.hor, D=H.draft, hoje=isoData(new Date());
  const cfgs=DB.horarios.filter(h=>h.id_obra===S.obraId).sort((a,b)=>String(a.valido_desde||"").localeCompare(String(b.valido_desde||"")));
  const atual=cfgHorarioNaData(S.obraId,hoje);
  const exc=(DB.horarios_excecoes||[]).filter(e=>e.id_obra===S.obraId).sort((a,b)=>a.data.localeCompare(b.data));
  const nomeCfg=h=>h.valido_desde?`A partir de ${fmtData(new Date(h.valido_desde+"T00:00"))}`:"Padrão (desde o início)";
  const tabs=`<div class="seg tabs" role="tablist"><button class="${H.aba==="semana"?"on":""}" data-act="horaba" data-v="semana">Semana padrão</button><button class="${H.aba==="exc"?"on":""}" data-act="horaba" data-v="exc">Exceções e feriados (${exc.filter(e=>e.data>=hoje).length})</button></div>`;
  let corpo="";
  if(H.aba==="semana"){
    const sel=cfgs.find(h=>h.id===H.cfgId);
    corpo=`<section class="panel" style="display:flex;flex-direction:column;gap:12px"><div class="hor-cfgs"><b>Configuração:</b>${cfgs.map(h=>`<button class="chip ${h.id===H.cfgId?"on":""}" data-act="horcfg" data-id="${h.id}">${nomeCfg(h)}${h===atual?" · valendo hoje":""}</button>`).join("")||`<span class="muted small">Nenhuma ainda (salve para criar a padrão)</span>`}</div>
      <div class="hor-novo"><span class="small muted">Programar uma semana diferente a partir de uma data (ex.: horário de dezembro):</span><input type="date" class="inp" id="hor-nova-data" value="${esc(H.novaData)}" min="${hoje}" style="width:auto"><button class="btn sm ghost" data-act="horcfgnova">Criar a partir desta data</button>
      ${sel&&sel.valido_desde?`<span class="spacer"></span><button class="btn sm ${H.delCfg?"bad":"ghost"}" data-act="horcfgdel">${H.delCfg?"Confirmar exclusão":"Excluir esta configuração"}</button>`:""}</div>
      ${sel&&sel.valido_desde?`<span class="small muted">Esta semana vale de ${fmtData(new Date(sel.valido_desde+"T00:00"))} em diante, até começar outra configuração. Antes disso vale a anterior.</span>`:""}</section>
      <div class="days panel">${DIAS.map(([k,n])=>`<div class="day"><h3>${n}</h3>${slotsEditor(D[k],k)}</div>`).join("")}</div>`;
  } else {
    const E=H.exc;
    const lista=exc.map(e=>{ const n=vistoriasNaData(e.data).length;
      return `<div class="exc ${e.data<hoje?"passada":""}"><span class="d">${fmtData(new Date(e.data+"T00:00"))}</span><span>${e.fechado?`<span class="pill s-bad">Sem vistorias</span>`:`<span class="pill s-info">${parseHor(e.horarios).map(h=>h.Horas).join(", ")||"sem horários"}</span>`}</span>
        <span class="muted">${esc(e.motivo||"")}</span>${n?`<span class="small t-bad">${n} vistoria(s) marcada(s) nesse dia</span>`:""}<span class="spacer"></span>
        <button class="iconbtn" data-act="excedit" data-id="${e.id}" aria-label="Editar">${IC.edit}</button></div>`; }).join("");
    let form="";
    if(E){ const n=E.data?vistoriasNaData(E.data).length:0;
      form=`<section class="panel" style="display:flex;flex-direction:column;gap:12px"><h2 class="h3" style="margin:0">${E.id?"Editar exceção":"Nova exceção"}</h2>
        <div class="row2"><div class="field"><label for="exc-data">Data</label><input type="date" class="inp" id="exc-data" data-exc="data" value="${esc(E.data)}"></div>
        <div class="field"><label for="exc-mot">Motivo</label><input class="inp" id="exc-mot" data-exc="motivo" value="${esc(E.motivo)}" placeholder="Ex.: Feriado de Natal"></div></div>
        <div class="seg" style="align-self:flex-start"><button class="${E.fechado?"on":""}" data-act="excfechado" data-v="1">Sem vistorias (feriado)</button><button class="${E.fechado?"":"on"}" data-act="excfechado" data-v="0">Horários diferentes</button></div>
        ${E.fechado?"":`<div class="day" style="min-height:0;border:0;padding:0">${slotsEditor(E.slots,"exc")}</div>`}
        ${n?`<div class="aviso-box">Já existem <b>${n}</b> vistoria(s) marcada(s) nesse dia. Elas não são canceladas automaticamente: o RC precisa remarcar ou cancelar.</div>`:""}
        <div class="row">${E.id?`<button class="btn ${E.del?"bad":"ghost"}" data-act="excdel">${E.del?"Confirmar exclusão":"Excluir"}</button>`:""}<span class="spacer"></span><button class="btn ghost" data-act="exccancel">Cancelar</button><button class="btn primary" data-act="excsalvar">Salvar exceção</button></div></section>`; }
    corpo=`${form}<section class="panel" style="display:flex;flex-direction:column;gap:12px"><div class="row"><span class="small muted">Dias que fogem da semana padrão: feriados, ponte, plantão no sábado... A exceção vale só para aquela data.</span><span class="spacer"></span>${E?"":`<button class="btn primary sm" data-act="excnova">${IC.plus}Nova exceção</button>`}</div>
      <div class="exc-list">${lista||`<div class="empty" style="padding:30px"><b>Nenhuma exceção cadastrada</b></div>`}</div></section>`;
  }
  return topbar("Horários",H.aba==="semana"?`<button class="tb-btn" data-act="horsalvar">${IC.check}<span>Salvar alterações</span></button>`:"")+`<main class="screen">${tabs}${corpo}</main>`;
}

/* ================= TELA: VERSÕES ================= */
function telaVersoes(){
  const V=[["v2.1.20 (21/10/2026)",["Etapas com checklist viram a ação Vistoriar: marca cada item como Aprovado ou Reprovado e decide no fim.","Itens do checklist com categoria (construtivo/habitabilidade ou acabamento); só acabamento reprovado deixa aprovar.","Foto obrigatória em cada item reprovado e em cada item corrigido.","Revistoria só dos itens reprovados antes.","Ver checklist completo, com fotos e correções, de qualquer etapa.","Ação sem campos acontece direto, sem popup de confirmação."]],["v2.1.19 (13/10/2026)",["Filtro \"Só as minhas pendências\" em Unidades.","Ações em lote para qualquer etapa liberada em Configurar campos (só ações com apenas Observações).","Exportar dados para Excel e backup completo.","Tela Obras: criar, renomear, ordenar e ativar/inativar."]],["v2.1.18 (13/10/2026)",["Nova função Visualizador: vê todas as etapas, sem ações."]],["v2.1.17 (13/10/2026)",["Acumulado conta cada passagem pela etapa (quantas vistorias foram feitas).","Lista de unidades sempre em laranja."]],["v2.1.16 (13/10/2026)",["Gerar PDF em qualquer visão dos indicadores.","Visão Geral: Situação atual ou Acumulado.","Visão Geral e Aprovações: tocar no número mostra as unidades."]],["v2.1.15 (13/10/2026)",["Agendar vistoria do síndico com calendário e hora.","Admin pode excluir área comum em qualquer etapa.","Nova tela de Versões."]],["v2.1.14 (13/10/2026)",["Configurar campos das etapas: abas Unidades e Áreas comuns."]],["v2.1.13 (13/10/2026)",["Celular: indicadores gerais com colunas legíveis, seletor de visão em cima, blocos com respiro e hierarquia mais limpa.","Visão Ações: observação longa com reticências e tooltip."]],["v2.1.12 (13/10/2026)",["Tema claro desde o primeiro instante (sem piscar escuro ao recarregar).","Tela de abertura com textos de uma linha."]],["v2.1.11 (13/10/2026)",["Visão hierarquia: começa fechada, nome da obra no topo, títulos em linha e novo destaque no bloco.","Foto de capa na largura original.","Celular: só as obras com acesso na tela inicial.","Menu lateral com divisória antes da pessoa; perfil com descrição de funções ajustada."]],["v2.1.10 (13/10/2026)",["Definir frases da tela inicial (admin) e sortear outra frase clicando nela.","Configurações Admin com a seção Funções.","Líder do RC acessa Clientes e Análise Financeira.","Indicadores: Resumo geral só com itens diferentes de zero; blocos com todas as opções.","Listas dos seletores com hover laranja e linhas zebradas."]],["v2.1.9 (13/10/2026)",["Celular: tela inicial com uma obra por linha e foto mais larga; novo cabeçalho no popup da unidade."]],["v2.1.8 (13/10/2026)",["Apelidos por pessoa e frases da tela inicial por horário e dia da semana.","HALL aparece com as unidades, mas sem fluxo.","Admin pode excluir bloco com unidades avançadas.","Motivos financeiros: Inadimplente e Permuta.","Tabela de unidades com linhas mais marcadas."]],["v2.1.7 (13/10/2026)",["Popups de ação configuráveis pelo admin (campos, obrigatoriedade, listas, checklist, anexo, assinatura, sim/não).","Indicadores: considerar repetição, legenda com explicação, origem das correções, etapa atual e situação financeira; saiu a Liberação de Testes.","Nova tela Análise Financeira (tabela e importação de planilha).","Locais virou Obra (Configurações Gerais); botões do cabeçalho padronizados.","Laudos com informação no ícone; horários com espaço antes do Novo horário; hierarquia sem barra de fases."]],["v2.1.6 (09/10/2026)",["Unidades: divisões por bloco e pavimento e nova Visão hierarquia (menu dos 3 pontinhos).","Popup da unidade com botões de ação menores.","Locais: excluir bloco/quadra, HALL sem número, botões menores.","Horários com altura automática e seletor de data laranja.","Foto da obra enviada sem corte."]],["v2.1.5 (08/10/2026)",["Criação de blocos: corrigido o número de unidades por andar e opção de HALL em cada andar.","Clientes por obra e importação de planilha (Excel/CSV) ou de outra obra.","Horários com exceções (feriados, dias especiais) e semanas programadas por data.","PDF dos indicadores baixado direto, com escolha de visões e etapas.","Função Líder de área: Informações Extras, Visão Ações e (com RC) cadastro de clientes.","Nova tela de abertura e cards de obras bloqueadas com fundo."]],["v2.1.4 (08/10/2026)",["Tudo 10% menor (como o zoom de 90% do navegador).","Indicadores Gerais (status atual) para quem tem mais de uma obra, só com as etapas das fases de cada perfil.","Unidades: margens fixas ao rolar a tabela, coluna Quadra corrigida, busca A101 e Informações Extras só para admin (desmarcado).","Áreas Comuns some do menu quando a obra não tem nenhuma.","Gerar PDF no cabeçalho dos Indicadores.","Agenda: legenda no ícone de informação, cor no número da vistoria e card abre a unidade; agendamento só com 24 horas de antecedência.","Vistoria do cliente registra se veio engenheiro; laudos pendentes na tela Laudos."]],["v2.1.3 (08/10/2026)",["Funções: Excelência virou Qualidade e a função Gerente saiu; Admin é só do Rodrigo.","Indicadores gerais abrem por um ícone na tela inicial.","Visão Unidades quebra os blocos em linhas (rolagem vertical) e reparte a largura da tela entre os blocos de cada linha.","Obras de casas: só quadras, com N casas por linha (configuração da obra).","Locais: cria bloco com pavimentos e unidades por andar (AP 101...) e quadra com casas em sequência (CASA 1...).","Celular: cabeçalho da tela inicial em uma linha, Horários e Cadastro de clientes ajustados."]],["v2.1.2 (07/10/2026)",["Ícone do app para instalar no celular e ícone redondo na aba do navegador.","Configurações Admin (logo da tela inicial): simular acesso e gerenciar usuários.","Sair pelo ícone ao lado do seu nome no menu; foto do usuário e cores nas iniciais.","Preferências no perfil: tela inicial da obra e tema (claro é o padrão).","Locais, Clientes e Usuários só para admin; Locais com abas Unidades e Áreas comuns.","Foto de capa da obra na configuração.","Agenda: cor da vistoria pelo resultado (agendada, aprovada, reprovada).","Indicadores gerais redesenhados e PDF A4 da Visão Unidades.","Atualização em segundo plano sem a tela de Sincronizando; nova tela de abertura."]],["v2.1.1 (05/10/2026)",["Usuários do app antigo já entram cadastrados e aprovados, com as mesmas funções e obras.","Senha provisória obriga a criar uma senha própria no primeiro login."]],["v2.1.0 (05/10/2026)",["Versão web em produção: Vercel + Supabase, com os dados importados do SharePoint.","Login com e-mail e senha; novos acessos ficam pendentes até o admin aprovar.","Tela Usuários (admin): aprovar, escolher funções e obras, bloquear e definir senha provisória.","Função Gerente (antigo \"supervisor\"): vê os indicadores gerais na tela inicial.","Anexos guardados de verdade (teste de gás) e assinatura do cliente carregada sob demanda.","Ações conferidas no servidor: permissão por função e aviso quando outra pessoa mexeu antes."]],["v2.0.4 (05/10/2026)",["Cadastro de áreas comuns na tela de Locais."]],["v2.0.3 (05/10/2026)",["Painel de filtros no design do app original."]],["v2.0.2 (05/10/2026)",["Tela de Locais no layout do app original; configuração da obra em botão no cabeçalho.","Modo escuro mantém o cabeçalho laranja e o fundo desfocado do menu.","Novas cores do cabeçalho das etapas e da tabela de unidades."]],["v2.0.1 (05/10/2026)",["Tela de perfil com acessos, obras e tarefas feitas.","Nova tela de clientes: vínculo por unidade com busca de cliente e cadastro rápido.","Checklist também na reprova da Qualidade e na Vistoria do Cliente, com assinatura do cliente.","Anexos só na aprovação do teste de Gás.","Popup mantém a rolagem depois de uma ação; botões alinhados à direita; linha do tempo nas movimentações.","Ajustes para celular e proporções das telas."]],["v2.0.0 (05/10/2026)",["Botões de ação abrem uma confirmação com observação e anexos. Reprova de teste pede o motivo e a aprovação da Qualidade pede o checklist.","Agendamento abre como uma aba do próprio popup da unidade.","Indicadores gerais de todas as obras na tela inicial (admin).","Ícones originais no menu, linhas verticais nas tabelas e ajustes de rolagem."]],
    ["v1.1.0 (12/02/2025)",["Indicadores"]],["v1.0.0 (18/11/2025)",["Versão inicial!","Criação do banco de dados","Criação do logo","Tela Home, seletor de obras"]]];
  const itens=V.map(([t,l])=>{ const m=/^(v[\d.]+)\s*\(([^)]+)\)/.exec(t)||[t,t,""]; return {v:m[1],d:m[2],l}; });
  const grupos=[]; itens.forEach(x=>{ const g=x.v.split(".").slice(0,2).join("."); let G=grupos.find(z=>z.g===g); if(!G) grupos.push(G={g,L:[]}); G.L.push(x); });
  const nomeG={"v2.1":"Gestor de Entrega web","v2.0":"Migração para a web","v1.1":"Power Apps","v1.0":"Power Apps"};
  return topbar("Versões")+`<main class="screen versoes"><div class="ver-wrap">
    <section class="ver-hero"><span class="eyebrow">Versão atual</span><b>${esc(VERSAO)}</b><span class="muted">${esc(itens[0].d)} · ${itens.length} versões desde ${esc(itens[itens.length-1].d)}</span></section>
    ${grupos.map(G=>`<section class="ver-grupo"><h2 class="ver-gh">${esc(G.g)}.x <span class="muted">${esc(nomeG[G.g]||"")}</span></h2><ol class="ver-tl">
      ${G.L.map((x,i)=>`<li class="${x.v===VERSAO?"atual":""}"><div class="ver-dot"></div><div class="ver-card"><div class="ver-top"><b>${esc(x.v)}</b><span class="muted small">${esc(x.d)}</span>${x.v===VERSAO?`<span class="pill s-ok">Atual</span>`:""}</div>
        <ul>${x.l.map(t=>`<li>${esc(t)}</li>`).join("")}</ul></div></li>`).join("")}</ol></section>`).join("")}</div></main>`;
}

/* ================= RENDER ================= */
const isDark=()=>!!S.dark;   // padrão: claro
function render(){
  const ae=document.activeElement, fid=ae&&ae.id, sel=fid&&ae.selectionStart!=null?[ae.selectionStart,ae.selectionEnd]:null;
  const scr={}; document.querySelectorAll("[data-keep-scroll]").forEach(e=>{scr[e.id]=[e.scrollTop,e.scrollLeft];});
  const winY=window.scrollY, winX=window.scrollX;
  let h=""; FOTOS_TELA=[];
  if(S.auth.tela){ h=telaAuth(); }
  else if(S.screen==="usuarios"){ h=telaUsuarios(); }
  else if(S.screen==="popups"&&S.pcfg){ h=telaPopups(); }
  else if(S.screen==="frases"&&S.fcfg){ h=telaFrases(); }
  else if(S.screen==="obrasadm"&&S.oadm){ h=telaObrasAdm(); }
  else if(S.screen==="home"||!S.obraId){ h=telaHome(); }
  else{
    h={laudos:telaLaudos,unidades:telaUnidades,areas:telaAreas,indicadores:telaIndicadores,agenda:telaAgenda,locais:telaLocais,financeiro:telaFinanceiro,clientes:telaClientes,horarios:telaHorarios,versoes:telaVersoes,perfil:telaPerfil}[S.screen]();
    if(S.indLista&&S.screen==="indicadores") h+=popupIndLista();
    if(S.popup&&S.popup.tipo==="und") h+=popupUnidade();
    if(S.popup&&S.popup.tipo==="ac") h+=popupArea();
    if(S.lote&&S.lote.conf) h+=popupLoteConf();
    if(S.conf) h+=confirmDialog();
    if(S.ckVer) h+=popupCkVer();
    if(S.fotoVer) h+=fotoLightbox();
    if(S.laudoRec) h+=modalLaudo();
    if(S.pdfCfg) h+=popupPdfCfg();
    if(S.imp) h+=popupImportar();
    h+=menuLateral();
  }
  if(!S.auth.tela) h+=extrasAuth();
  if(S.exp&&!S.auth.tela) h+=popupExport();
  document.documentElement.classList.toggle("lock",!!(S.senhaModal||S.popup||S.nav||S.drawer||S.adminPanel||S.loc.modal||S.loc.cfgAberta||S.homeInd||S.conf||S.indLista||S.exp||(S.lote&&S.lote.conf)||S.ckVer||S.fotoVer));
  document.getElementById("app").innerHTML=h;
  if(!S.auth.tela){ desenharFotos(); initSig(); layoutBlocos(); }
  Object.entries(scr).forEach(([id,[t,l]])=>{const e=document.getElementById(id); if(e){e.scrollTop=t;e.scrollLeft=l;}});
  window.scrollTo(winX,winY);
  if(fid){ const e=document.getElementById(fid); if(e){ e.focus({preventScroll:true}); if(sel&&e.setSelectionRange) try{e.setSelectionRange(sel[0],sel[1]);}catch(_){} } }
}
