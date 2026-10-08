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
  const cfg=OBRA().config, L=[{id:"lib",nome:"Liberação de Testes",etapa:1,coluna:"",tipo:"lib"}];
  ["aguafria","esgoto","eletrico","dreno","gas"].filter(k=>cfg.testes.includes(k)).forEach(k=>{const t=TESTES.find(x=>x.k===k); L.push({id:t.col,nome:t.nome,etapa:2,coluna:t.col,tipo:"rep"});});
  L.push({id:"fin",nome:"Finalizando Unidade",etapa:3,coluna:"",tipo:"fin"},{id:"rep_vistoria_at",nome:"Vistoria Qualidade",etapa:4,coluna:"rep_vistoria_at",tipo:"rep"});
  if(cfg.previa) L.push({id:"rep_vistoria_previa",nome:"Vistoria Prévia",etapa:41,coluna:"rep_vistoria_previa",tipo:"rep"});
  L.push({id:"agendamento",nome:"Agendamento com Cliente",etapa:5,coluna:"agendamento",tipo:"ag"},{id:"rep_vistoria_cliente",nome:"Vistoria Cliente",etapa:6,coluna:"rep_vistoria_cliente",tipo:"rep"},{id:"corr",nome:"Correções de Obra",etapa:7,coluna:"",tipo:"corr"});
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
  const I=S.ind, ops=indEtapas(); if(!ops.find(o=>o.id===I.etapa)) I.etapa="lib"; if(I.visao==="Visão Ações"&&!can(ME(),"admin","lider")) I.visao="Visão Unidades";
  const op=ops.find(o=>o.id===I.etapa);
  const nFil=(I.fil.blocos.length?1:0)+(I.ini||I.fim?1:0);
  const comEtapa=I.visao==="Visão Unidades"||I.visao==="Visão Ações";
  const head=`<div class="row indhead">${comEtapa?`<label class="row" style="gap:7.2px"><b>Etapa:</b><select class="inp sf" id="ind-etapa" data-ind="etapa" style="width:auto;min-width:198px">${ops.map(o=>`<option value="${o.id}" ${o.id===I.etapa?"selected":""}>${esc(o.nome)}</option>`).join("")}</select></label>`
      :`<b style="font-size:1.15rem">${I.visao==="Visão Geral"?"Número de unidades por Fase/Etapa":"Número de unidades aprovadas por etapa"}</b>`}
    ${I.visao==="Visão Ações"?`<b>${I.ini||I.fim?`Período: ${I.ini?fmtData(new Date(I.ini+"T00:00")):"início"} até ${I.fim?fmtData(new Date(I.fim+"T00:00")):"hoje"}`:"Todo o período"}</b>`:""}
    <span class="spacer"></span><select class="inp sf" id="ind-visao" data-ind="visao" style="width:auto">${["Visão Unidades","Visão Geral","Visão Aprovações",...(can(ME(),"admin","lider")?["Visão Ações"]:[])].map(v=>`<option ${v===I.visao?"selected":""}>${v}</option>`).join("")}</select></div>`;
  let body="";
  if(I.visao==="Visão Unidades") body=indUnidades(op);
  else if(I.visao==="Visão Geral") body=indGeral();
  else if(I.visao==="Visão Aprovações") body=indAprovacoes();
  else body=indAcoes(op);
  return topbar(`Indicadores (${OBRA().nome})`,(I.visao==="Visão Unidades"?`<button class="tb-btn" data-act="pdfcfg" title="Gerar PDF dos indicadores">${IC.pdf}<span>Gerar PDF</span></button>`:"")+filtroBtn(nFil))+`<main class="screen ${I.visao==="Visão Unidades"?"":"wide"}">${head}${body}</main>`+drawerInd();
}
function corrigidosSet(){ return new Set(DB.tarefas.filter(t=>t.id_obra===S.obraId&&t.acao==="corrigir"&&t.etapa_antiga===7).map(t=>t.id_unidade)); }
function indUnidades(op){
  const corr=corrigidosSet(), us=unidadesInd(), leg=LEGENDAS[op.tipo];
  const blocos=blocosInd(); if(!blocos.length) return `<div class="panel empty"><b>Nenhum bloco selecionado</b></div>`;
  return `<div class="blocos">${blocos.map(b=>{
    const ub=us.filter(x=>nivel1Nome(x)===b), linhas=linhasBloco(ub,OBRA().config), cols=Math.max(1,...linhas.map(r=>r.length));
    const st=ub.map(x=>statusInd(x,op,corr));
    return `<div class="bloco"><div class="tiles" data-cols="${cols}" style="grid-template-columns:repeat(${cols},var(--tw0))">${linhas.map(r=>r.map(x=>{const s=statusInd(x,op,corr); return `<button class="tile" style="background:${corInd(s)};border:0" data-act="abrirund" data-id="${x.id}" title="${esc(x.unidade)}: ${esc(s)}">${esc(x.unidade.replace(/^(AP|CASA) /,""))}</button>`;}).join("")+(r.length<cols?"<span></span>".repeat(cols-r.length):"")).join("")}</div>
      <h3>${esc(b)} (${ub.length} unidades)</h3>
      <div class="legend">${leg.map(l=>{const n=st.filter(s=>s===l).length; return `<span><i class="dot" style="background:${corInd(l)}"></i>${esc(l)}: <b class="tnum">${n}</b>${n&&ub.length?` <span class="muted tnum">(${Math.round(n/ub.length*100)}%)</span>`:""}</span>`;}).join("")}</div></div>`;}).join("")}</div>`;
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
function indGeral(){
  const us=unidadesInd(), bl=blocosInd(), cfg=OBRA().config, f=S.ind.fil, tot=us.length;
  const etapas=ETAPAS.filter(e=>e.c!==41||cfg.previa);
  const cnt=(b,codes)=>us.filter(x=>(b==null||nivel1Nome(x)===b)&&codes.includes(x.sub_etapa)).length;
  const pct=n=>tot&&n?` (${Math.round(n/tot*100)}%)`:"";
  let rows="";
  [1,2,3].forEach(fa=>{ if(!f["f"+fa]) return; const es=etapas.filter(e=>e.f===fa), codes=es.map(e=>e.c), fe=S.ind.fechado[fa];
    const ft=cnt(null,codes);
    rows+=`<tr class="grp"><th class="lbl"><button data-act="indgrp" data-f="${fa}" aria-expanded="${!fe}">${fa===1?"Em Produção":FASES[fa]}${fe?IC.chevD:IC.chevU}</button></th>${bl.map(b=>`<td>${cnt(b,codes)}</td>`).join("")}<td class="tot">${ft}${pct(ft)}</td></tr>`;
    if(!fe) es.forEach(e=>{ rows+=`<tr><th class="lbl">${esc(e.n)}</th>${bl.map(b=>`<td>${cnt(b,[e.c])}</td>`).join("")}<td class="tot">${cnt(null,[e.c])}</td></tr>`; });
  });
  return `<div class="panel" style="overflow-x:auto"><table class="kpi"><thead><tr><th style="background:none"></th>${bl.map(b=>`<th>${esc(b)}</th>`).join("")}<th class="tot">TOTAL</th></tr></thead><tbody>${rows}</tbody>
    <tfoot><tr><th>TOTAL</th>${bl.map(b=>`<td>${us.filter(x=>nivel1Nome(x)===b).length}</td>`).join("")}<td>${tot}</td></tr></tfoot></table></div>`;
}
function indAprovacoes(){
  const us=unidadesInd(), bl=blocosInd(), cfg=OBRA().config;
  const cols=[...cfg.testes.map(k=>TESTES.find(t=>t.k===k)).map(t=>[t.col,t.nome]),["rep_vistoria_at","Vistoria Qualidade"],...(cfg.previa?[["rep_vistoria_previa","Vistoria Prévia"]]:[]),["rep_vistoria_cliente","Vistoria Cliente"]];
  let rows="";
  cols.forEach(([c,nome])=>{
    const ap=us.filter(x=>has(x[c],"Aprovado")), niveis=[...new Set(ap.map(x=>x[c]))].sort((a,b)=>repN(a)-repN(b)), fe=S.ind.fechado[c];
    rows+=`<tr class="grp g2"><th class="lbl"><button data-act="indgrp" data-f="${c}" aria-expanded="${!fe}">${esc(nome)}${fe?IC.chevD:IC.chevU}</button></th>${bl.map(b=>`<td>${ap.filter(x=>nivel1Nome(x)===b).length}</td>`).join("")}<td class="tot">${ap.length}</td></tr>`;
    if(!fe) niveis.forEach(n=>{ const t=ap.filter(x=>x[c]===n).length; rows+=`<tr><th class="lbl">${esc(n)}</th>${bl.map(b=>`<td>${ap.filter(x=>x[c]===n&&nivel1Nome(x)===b).length}</td>`).join("")}<td class="tot">${t}${ap.length?` (${Math.round(t/ap.length*100)}%)`:""}</td></tr>`; });
  });
  return `<div class="panel" style="overflow-x:auto"><table class="kpi"><thead><tr><th style="background:none"></th>${bl.map(b=>`<th>${esc(b)}</th>`).join("")}<th class="tot">TOTAL</th></tr></thead><tbody>${rows}</tbody></table>
    <p class="small muted" style="margin:9px 3.6px 0">Cada linha mostra em qual tentativa a unidade foi aprovada. "Aprovado 1°" é quem passou de primeira.</p></div>`;
}
const RANK_COLS={1:["liberar","cancelar"],2:["aprovar","reprovar","corrigir"],3:["finalizar","cancelar"],4:["aprovar","reprovar"],41:["aprovar","reprovar"],5:["agendar","cancelar"],6:["aprovar","reprovar"],7:["corrigir"]};
const ACAO_CLS={aprovar:"s-ok",reprovar:"s-bad",corrigir:"s-warn",liberar:"s-info",finalizar:"s-info",agendar:"s-info",cancelar:"s-neutral"};
function indAcoes(op){
  const I=S.ind, bl=new Set(blocosInd()), ini=I.ini?new Date(I.ini+"T00:00"):null, fim=I.fim?new Date(I.fim+"T23:59:59"):null;
  const um=new Map(unidadesObra().map(x=>[x.id,x]));
  const T=DB.tarefas.filter(t=>t.id_obra===S.obraId&&t.etapa_antiga===op.etapa&&(!op.coluna||t.coluna===op.coluna)&&bl.has(nivel1Nome(um.get(t.id_unidade)))&&(!ini||new Date(t.data)>=ini)&&(!fim||new Date(t.data)<=fim)).sort((a,b)=>b.data.localeCompare(a.data));
  const rc=RANK_COLS[op.etapa]||[], autores=[...new Set(T.map(t=>t.autor))].map(a=>({a,n:T.filter(t=>t.autor===a).length})).sort((x,y)=>y.n-x.n);
  const lista=T.slice(0,400);
  return `<div class="acoes"><section class="panel"><h2 class="h2" style="margin-bottom:10.8px">Movimentações <span class="muted small">(${T.length})</span></h2>
    ${T.length?`<div class="scrollbox" id="ind-mov" data-keep-scroll><table class="list"><thead><tr><th>Unidade</th><th class="n">Ação</th><th>Autor</th><th>Data</th><th>Observação</th></tr></thead><tbody>
      ${lista.map(t=>{const x=um.get(t.id_unidade); return `<tr><td style="white-space:nowrap">${esc(nivel1Nome(x))} - ${esc(x.unidade)}</td><td class="n"><span class="act ${ACAO_CLS[t.acao]||""}">${esc(t.acao)}</span></td><td>${esc(t.autor)}</td><td class="tnum" style="white-space:nowrap">${fmtDTL(new Date(t.data))}</td><td>${esc(t.obs)}</td></tr>`;}).join("")}
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
    if(d) ev.push({d,hora:"Áreas comuns",txt:a.descricao,sub:"Vistoria do síndico",rep:t.repeticao,cx:!!(L[i+1]&&L[i+1].acao==="cancelar"),ac:1,idac:a.id,st:resultado(resAc[a.id],t,prox)}); }));
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
  return topbar("Laudos de vistoria")+`<main class="screen laudos"><p class="muted small" style="margin:0">Quando o cliente traz um engenheiro ou responsável técnico na vistoria, o laudo dele precisa ser enviado para a Rottas. O RC cobra e marca aqui quando receber.</p>
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
    <div class="mhead"><div class="t"><b class="conf-t">Configuração da obra</b><div class="small muted">${esc(o.nome)} · substitui as regras que antes eram fixas por ID de obra</div></div><button class="iconbtn" data-act="cfgtoggle" aria-label="Fechar">${IC.close}</button></div>
    <div class="mbody"><div class="field"><label>Foto de capa</label><div class="capa">${fotoObra(o)?`<img src="${esc(fotoObra(o))}" alt="Foto atual de ${esc(o.nome)}">`:`<div class="capa-vazia">Sem foto</div>`}
        <label class="btn sm ghost">${IC.camera}Alterar foto<input type="file" id="foto-obra" accept="image/*" hidden></label></div><span class="small muted">É a imagem do card da obra na tela inicial.</span></div>
      <div class="field"><label>Tipo da obra</label><div class="seg" style="align-self:flex-start"><button class="${cfg.tipo==="predio"?"on":""}" data-act="cfgtipo" data-v="predio">Prédio</button><button class="${cfg.tipo==="casa"?"on":""}" data-act="cfgtipo" data-v="casa">Casas</button></div></div>
      ${cfg.tipo==="casa"?`<div class="field"><label for="cfg-cpl">Casas por linha na Visão Unidades</label><input class="inp tnum" type="number" min="1" max="40" id="cfg-cpl" data-cfgnum="casasPorLinha" value="${cfg.casasPorLinha||8}" style="max-width:108px"><span class="small muted">As casas de cada quadra aparecem em ordem, quebrando a linha a cada ${cfg.casasPorLinha||8}.</span></div>`:""}
      <div class="field"><label>Testes da validação técnica</label>${TESTES.map(t=>`<label class="chk"><input type="checkbox" id="cfg-${t.k}" data-cfgteste="${t.k}" ${cfg.testes.includes(t.k)?"checked":""}>${t.nome}</label>`).join("")}</div>
      <div class="field"><label>Etapas opcionais</label><label class="chk"><input type="checkbox" id="cfg-previa" data-cfg="previa" ${cfg.previa?"checked":""}>Vistoria Prévia depois da Qualidade</label><label class="chk"><input type="checkbox" id="cfg-direto" data-cfg="aprovarDireto" ${cfg.aprovarDireto?"checked":""}>Permitir "Aprovar direto" (pula a vistoria Qualidade)</label></div></div></div></div>`:"";
  const modal=L.modal?modalLocais():"";
  const right=admin?`<button class="btn" data-act="cfgtoggle" style="background:var(--surface);color:var(--fg)">Configurar obra</button>`:"";
  return topbar("Locais",right)+`<main class="locais">
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
      <div class="loc-units ac">${acs.map(a=>`<button data-act="acedit" data-id="${a.id}">${esc(a.descricao)}<span class="small muted">${esc(ETAPA_AC[a.sub_etapa].n)}</span></button>`).join("")}<button class="add" data-act="acnova" aria-label="Adicionar área comum">${IC.plus}</button></div>`:loc?`<h2 class="loc-crumb">${esc(o.nome)} &gt; ${esc(loc.nivel1)}${casa?"":` &gt; ${esc(loc.niveis2.split(", ")[L.n2-1]||"")}`}</h2>
      <div class="loc-units">${us.map(x=>`<button data-act="undedit" data-id="${x.id}">${esc(x.unidade)}</button>`).join("")}<button class="add" data-act="undnova" aria-label="Adicionar unidade">${IC.plus}</button></div>`
      :`<div class="empty"><b>Nenhum local cadastrado</b><span>Crie o primeiro bloco ou quadra na lista à esquerda.</span></div>`}</section>
  </main>${modal}${cfgModal}`;
}
function modalLocais(){
  const M=S.loc.modal;
  if(M.tipo==="ac"){ const a=M.id?DB.areas.find(z=>z.id===M.id):null, podeExcluir=a&&a.sub_etapa===1;
    return `<div class="modal" role="dialog" aria-modal="true"><div class="scrim" data-act="locfechar"></div><div class="box sm"><div class="mhead"><b class="t h2">${a?"Editar área comum":"Adicionar área comum"}</b><button class="iconbtn" data-act="locfechar" aria-label="Fechar">${IC.close}</button></div>
      <div class="mbody"><div class="field"><label for="ac-nome">Nome da área comum</label><input class="inp" id="ac-nome" value="${esc(a?a.descricao:"")}" placeholder="Ex.: Salão de Festas"></div>
      ${a&&!podeExcluir?`<span class="small muted">Só dá para excluir áreas comuns que ainda estão na Liberação Local.</span>`:""}</div>
      <div class="mfoot">${podeExcluir?`<button class="btn ${M.del?"bad":"ghost"}" data-act="acdel">${M.del?"Confirmar exclusão":"Excluir"}</button><span class="spacer"></span>`:""}<button class="btn ghost" data-act="locfechar">Cancelar</button><button class="btn primary" data-act="acsalvar">Salvar</button></div></div></div>`; }
  if(M.tipo==="und"){ const x=M.id?DB.unidades.find(u=>u.id===M.id):null, podeExcluir=x&&x.sub_etapa===1;
    return `<div class="modal" role="dialog" aria-modal="true"><div class="scrim" data-act="locfechar"></div><div class="box sm"><div class="mhead"><b class="t h2">${x?"Editar unidade":"Adicionar unidade"}</b><button class="iconbtn" data-act="locfechar" aria-label="Fechar">${IC.close}</button></div>
      <div class="mbody"><div class="field"><label for="und-nome">Nome da unidade</label><input class="inp" id="und-nome" value="${esc(x?x.unidade:(M.sug||""))}" placeholder="${OBRA().config.tipo==="casa"?"Ex.: CASA 12":"Ex.: AP 305"}"></div>
      ${x&&!podeExcluir?`<span class="small muted">Só dá para excluir unidades que ainda estão na Liberação de Testes.</span>`:""}</div>
      <div class="mfoot">${podeExcluir?`<button class="btn ${M.del?"bad":"ghost"}" data-act="unddel">${M.del?"Confirmar exclusão":"Excluir"}</button><span class="spacer"></span>`:""}<button class="btn ghost" data-act="locfechar">Cancelar</button><button class="btn primary" data-act="undsalvar">Salvar</button></div></div></div>`; }
  const l=M.id?localById(M.id):null, temUnd=l&&DB.unidades.some(u=>u.nivel_1===l.id), casa=OBRA().config.tipo==="casa";
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
    <div class="mfoot">${l&&!temUnd?`<button class="btn ${M.del?"bad":"ghost"}" data-act="locdel">${M.del?"Confirmar exclusão":"Excluir"}</button><span class="spacer"></span>`:""}<button class="btn ghost" data-act="locfechar">Cancelar</button><button class="btn primary" data-act="locsalvar">Salvar</button></div></div></div>`;
}
const numCasa=s=>{const m=/^CASA\s+(\d+)/i.exec(s||""); return m?+m[1]:0;};
function formLocal(l,casa){
  const us=l?DB.unidades.filter(u=>u.nivel_1===l.id):[];
  if(casa){ const nums=us.map(u=>numCasa(u.unidade)).filter(Boolean), todas=DB.unidades.filter(u=>u.id_obra===S.obraId).map(u=>numCasa(u.unidade)).filter(Boolean);
    return {n1:l?l.nivel1:`Quadra ${DB.locais.filter(x=>x.id_obra===S.obraId).length+1}`, qt:l?us.length:8, ini:l?(nums.length?Math.min(...nums):1):(todas.length?Math.max(...todas)+1:1), gerar:!l}; }
  const pav=l&&l.niveis2?l.niveis2.split(", ").filter(Boolean).length:4, porAndar={}; us.filter(u=>!/^HALL/i.test(u.unidade)).forEach(u=>{porAndar[u.nivel_2]=(porAndar[u.nivel_2]||0)+1;});
  return {n1:l?l.nivel1:"", pav, qt:l?Math.max(0,...Object.values(porAndar)):4, gerar:!l, hall:false};
}
function atualizarPrevLocal(){
  const M=S.loc.modal; if(!M||!M.f) return; const el=document.getElementById("loc-prev"); if(!el) return;
  const l=M.id?localById(M.id):null; el.innerHTML=textoPlano(planoUnidades(M.f,l,OBRA().config.tipo==="casa"));
}
function textoPlano(plano){
  const aps=plano.novas.filter(x=>!x.hall), halls=plano.novas.filter(x=>x.hall);
  if(!plano.novas.length) return plano.total?"Todas essas unidades já existem.":"Nenhuma unidade para criar.";
  return [aps.length?`Vai criar <b>${aps.length}</b> unidade(s): ${esc(aps[0].nome)} até ${esc(aps.at(-1).nome)}`:"",halls.length?`<b>${halls.length}</b> hall(s): ${esc(halls[0].nome)} até ${esc(halls.at(-1).nome)}`:""].filter(Boolean).join(" e ")+(plano.existentes?`. ${plano.existentes} já existe(m) e fica(m) como está(ão)`:"")+".";
}
function planoUnidades(F,l,casa){
  const lista=[], qt=Math.max(0,Math.min(casa?300:30,parseInt(F.qt)||0));
  if(casa){ if(F.gerar){ const ini=Math.max(1,parseInt(F.ini)||1); for(let i=0;i<qt;i++) lista.push({nome:`CASA ${ini+i}`,pav:null}); } }
  else { const pav=Math.max(1,Math.min(40,parseInt(F.pav)||1));
    for(let p=1;p<=pav;p++){ if(F.gerar) for(let k=1;k<=qt;k++) lista.push({nome:`AP ${p}${pad(k)}`,pav:p}); if(F.hall) lista.push({nome:`HALL ${p}`,pav:p,hall:1}); } }
  const existe=new Set(DB.unidades.filter(u=>casa?u.id_obra===S.obraId:(l&&u.nivel_1===l.id)).map(u=>u.unidade.toUpperCase()));
  const novas=lista.filter(x=>!existe.has(x.nome));
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
  return topbar("Horários",H.aba==="semana"?`<button class="btn" data-act="horsalvar" style="background:var(--surface)">Salvar alterações</button>`:"")+`<main class="screen"><p class="muted small" style="margin:0">Horários em que o RC pode marcar vistoria com o cliente nesta obra, e quantos engenheiros atendem em cada um.</p>${tabs}${corpo}</main>`;
}

/* ================= TELA: VERSÕES ================= */
function telaVersoes(){
  const V=[["v2.1.5 (09/10/2026)",["Criação de blocos: corrigido o número de unidades por andar e opção de HALL em cada andar.","Clientes por obra e importação de planilha (Excel/CSV) ou de outra obra.","Horários com exceções (feriados, dias especiais) e semanas programadas por data.","PDF dos indicadores baixado direto, com escolha de visões e etapas.","Função Líder de área: Informações Extras, Visão Ações e (com RC) cadastro de clientes.","Nova tela de abertura e cards de obras bloqueadas com fundo."]],["v2.1.4 (08/10/2026)",["Tudo 10% menor (como o zoom de 90% do navegador).","Indicadores Gerais (status atual) para quem tem mais de uma obra, só com as etapas das fases de cada perfil.","Unidades: margens fixas ao rolar a tabela, coluna Quadra corrigida, busca A101 e Informações Extras só para admin (desmarcado).","Áreas Comuns some do menu quando a obra não tem nenhuma.","Gerar PDF no cabeçalho dos Indicadores.","Agenda: legenda no ícone de informação, cor no número da vistoria e card abre a unidade; agendamento só com 24 horas de antecedência.","Vistoria do cliente registra se veio engenheiro; laudos pendentes na tela Laudos."]],["v2.1.3 (08/10/2026)",["Funções: Excelência virou Qualidade e a função Gerente saiu; Admin é só do Rodrigo.","Indicadores gerais abrem por um ícone na tela inicial.","Visão Unidades quebra os blocos em linhas (rolagem vertical) e reparte a largura da tela entre os blocos de cada linha.","Obras de casas: só quadras, com N casas por linha (configuração da obra).","Locais: cria bloco com pavimentos e unidades por andar (AP 101...) e quadra com casas em sequência (CASA 1...).","Celular: cabeçalho da tela inicial em uma linha, Horários e Cadastro de clientes ajustados."]],["v2.1.2 (07/10/2026)",["Ícone do app para instalar no celular e ícone redondo na aba do navegador.","Configurações Admin (logo da tela inicial): simular acesso e gerenciar usuários.","Sair pelo ícone ao lado do seu nome no menu; foto do usuário e cores nas iniciais.","Preferências no perfil: tela inicial da obra e tema (claro é o padrão).","Locais, Clientes e Usuários só para admin; Locais com abas Unidades e Áreas comuns.","Foto de capa da obra na configuração.","Agenda: cor da vistoria pelo resultado (agendada, aprovada, reprovada).","Indicadores gerais redesenhados e PDF A4 da Visão Unidades.","Atualização em segundo plano sem a tela de Sincronizando; nova tela de abertura."]],["v2.1.1 (05/10/2026)",["Usuários do app antigo já entram cadastrados e aprovados, com as mesmas funções e obras.","Senha provisória obriga a criar uma senha própria no primeiro login."]],["v2.1.0 (05/10/2026)",["Versão web em produção: Vercel + Supabase, com os dados importados do SharePoint.","Login com e-mail e senha; novos acessos ficam pendentes até o admin aprovar.","Tela Usuários (admin): aprovar, escolher funções e obras, bloquear e definir senha provisória.","Função Gerente (antigo \"supervisor\"): vê os indicadores gerais na tela inicial.","Anexos guardados de verdade (teste de gás) e assinatura do cliente carregada sob demanda.","Ações conferidas no servidor: permissão por função e aviso quando outra pessoa mexeu antes."]],["v2.0.4 (05/10/2026)",["Cadastro de áreas comuns na tela de Locais."]],["v2.0.3 (05/10/2026)",["Painel de filtros no design do app original."]],["v2.0.2 (05/10/2026)",["Tela de Locais no layout do app original; configuração da obra em botão no cabeçalho.","Modo escuro mantém o cabeçalho laranja e o fundo desfocado do menu.","Novas cores do cabeçalho das etapas e da tabela de unidades."]],["v2.0.1 (05/10/2026)",["Tela de perfil com acessos, obras e tarefas feitas.","Nova tela de clientes: vínculo por unidade com busca de cliente e cadastro rápido.","Checklist também na reprova da Qualidade e na Vistoria do Cliente, com assinatura do cliente.","Anexos só na aprovação do teste de Gás.","Popup mantém a rolagem depois de uma ação; botões alinhados à direita; linha do tempo nas movimentações.","Ajustes para celular e proporções das telas."]],["v2.0.0 (05/10/2026)",["Botões de ação abrem uma confirmação com observação e anexos. Reprova de teste pede o motivo e a aprovação da Qualidade pede o checklist.","Agendamento abre como uma aba do próprio popup da unidade.","Indicadores gerais de todas as obras na tela inicial (admin).","Ícones originais no menu, linhas verticais nas tabelas e ajustes de rolagem."]],["v2.0 · protótipo web (05/10/2026)",["Recriação do app como site, com os mesmos fluxos e telas.","Regras por obra viraram configuração: testes ativos, Vistoria Prévia e Aprovar direto.","Correções: cores e contagens de Gás, Dreno e Vistoria Prévia nos indicadores; Visão Aprovações inclui Gás e Prévia.","Liberação em lote passa a registrar as tarefas no histórico.","Horário cheio fica bloqueado no agendamento; cancelar agendamento mantém o número da vistoria.","Agenda com busca funcionando e vistorias das áreas comuns."]],
    ["v1.1.0 (12/02/2025)",["Indicadores"]],["v1.0.0 (18/11/2025)",["Versão inicial!","Criação do banco de dados","Criação do logo","Tela Home, seletor de obras"]]];
  return topbar("Versões")+`<main class="screen"><section class="panel" style="max-width:684px">${V.map(([t,l])=>`<h2 class="h3" style="margin:5.4px 0">${esc(t)}</h2><ul style="margin:0 0 16.2px;padding-left:18px">${l.map(i=>`<li>${esc(i)}</li>`).join("")}</ul>`).join("")}</section></main>`;
}

/* ================= RENDER ================= */
const isDark=()=>S.dark!=null?S.dark:!!(window.matchMedia&&matchMedia("(prefers-color-scheme: dark)").matches);
function render(){
  const ae=document.activeElement, fid=ae&&ae.id, sel=fid&&ae.selectionStart!=null?[ae.selectionStart,ae.selectionEnd]:null;
  const scr={}; document.querySelectorAll("[data-keep-scroll]").forEach(e=>{scr[e.id]=[e.scrollTop,e.scrollLeft];});
  const winY=window.scrollY, winX=window.scrollX;
  let h="";
  if(S.auth.tela){ h=telaAuth(); }
  else if(S.screen==="usuarios"){ h=telaUsuarios(); }
  else if(S.screen==="home"||!S.obraId){ h=telaHome(); }
  else{
    h={laudos:telaLaudos,unidades:telaUnidades,areas:telaAreas,indicadores:telaIndicadores,agenda:telaAgenda,locais:telaLocais,clientes:telaClientes,horarios:telaHorarios,versoes:telaVersoes,perfil:telaPerfil}[S.screen]();
    if(S.popup&&S.popup.tipo==="und") h+=popupUnidade();
    if(S.popup&&S.popup.tipo==="ac") h+=popupArea();
    if(S.conf) h+=confirmDialog();
    if(S.laudoRec) h+=modalLaudo();
    if(S.pdfCfg) h+=popupPdfCfg();
    if(S.imp) h+=popupImportar();
    h+=menuLateral();
  }
  if(!S.auth.tela) h+=extrasAuth();
  document.documentElement.classList.toggle("lock",!!(S.senhaModal||S.popup||S.nav||S.drawer||S.adminPanel||S.loc.modal||S.loc.cfgAberta||S.homeInd||S.conf));
  document.getElementById("app").innerHTML=h;
  if(!S.auth.tela){ desenharFotos(); initSig(); layoutBlocos(); }
  Object.entries(scr).forEach(([id,[t,l]])=>{const e=document.getElementById(id); if(e){e.scrollTop=t;e.scrollLeft=l;}});
  window.scrollTo(winX,winY);
  if(fid){ const e=document.getElementById(fid); if(e){ e.focus({preventScroll:true}); if(sel&&e.setSelectionRange) try{e.setSelectionRange(sel[0],sel[1]);}catch(_){} } }
}
