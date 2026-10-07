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
  const I=S.ind, ops=indEtapas(); if(!ops.find(o=>o.id===I.etapa)) I.etapa="lib";
  const op=ops.find(o=>o.id===I.etapa);
  const nFil=(I.fil.blocos.length?1:0)+(I.ini||I.fim?1:0);
  const comEtapa=I.visao==="Visão Unidades"||I.visao==="Visão Ações";
  const head=`<div class="row indhead">${comEtapa?`<label class="row" style="gap:8px"><b>Etapa:</b><select class="inp sf" id="ind-etapa" data-ind="etapa" style="width:auto;min-width:220px">${ops.map(o=>`<option value="${o.id}" ${o.id===I.etapa?"selected":""}>${esc(o.nome)}</option>`).join("")}</select></label>`
      :`<b style="font-size:1.15rem">${I.visao==="Visão Geral"?"Número de unidades por Fase/Etapa":"Número de unidades aprovadas por etapa"}</b>`}
    ${I.visao==="Visão Ações"?`<b>${I.ini||I.fim?`Período: ${I.ini?fmtData(new Date(I.ini+"T00:00")):"início"} até ${I.fim?fmtData(new Date(I.fim+"T00:00")):"hoje"}`:"Todo o período"}</b>`:""}
    <span class="spacer"></span>${I.visao==="Visão Unidades"?`<button class="btn sm ghost pdfbtn" data-act="pdfund">Gerar PDF</button>`:""}<select class="inp sf" id="ind-visao" data-ind="visao" style="width:auto">${["Visão Unidades","Visão Geral","Visão Aprovações","Visão Ações"].map(v=>`<option ${v===I.visao?"selected":""}>${v}</option>`).join("")}</select></div>`;
  let body="";
  if(I.visao==="Visão Unidades") body=indUnidades(op);
  else if(I.visao==="Visão Geral") body=indGeral();
  else if(I.visao==="Visão Aprovações") body=indAprovacoes();
  else body=indAcoes(op);
  return topbar(`Indicadores (${OBRA().nome})`,filtroBtn(nFil))+`<main class="screen wide">${head}${body}</main>`+drawerInd();
}
function corrigidosSet(){ return new Set(DB.tarefas.filter(t=>t.id_obra===S.obraId&&t.acao==="corrigir"&&t.etapa_antiga===7).map(t=>t.id_unidade)); }
function indUnidades(op){
  const corr=corrigidosSet(), us=unidadesInd(), leg=LEGENDAS[op.tipo];
  const blocos=blocosInd(); if(!blocos.length) return `<div class="panel empty"><b>Nenhum bloco selecionado</b></div>`;
  return `<div class="blocos">${blocos.map(b=>{
    const ub=us.filter(x=>nivel1Nome(x)===b), rows={};
    ub.forEach(x=>{(rows[x.nivel_2]=rows[x.nivel_2]||[]).push(x);});
    const ks=Object.keys(rows).map(Number).sort((a,b)=>b-a), cols=Math.max(1,...ks.map(k=>rows[k].length));
    const st=ub.map(x=>statusInd(x,op,corr));
    return `<div class="bloco"><div class="tiles" style="grid-template-columns:repeat(${cols},minmax(52px,1fr))">${ks.map(k=>rows[k].sort((a,b)=>numUnd(a.unidade)-numUnd(b.unidade)).map(x=>{const s=statusInd(x,op,corr); return `<button class="tile" style="background:${corInd(s)};border:0" data-act="abrirund" data-id="${x.id}" title="${esc(x.unidade)}: ${esc(s)}">${esc(x.unidade.replace(/^(AP|CASA) /,""))}</button>`;}).join("")+(rows[k].length<cols?"<span></span>".repeat(cols-rows[k].length):"")).join("")}</div>
      <h3>${esc(b)} (${ub.length} unidades)</h3>
      <div class="legend">${leg.map(l=>{const n=st.filter(s=>s===l).length; return `<span><i class="dot" style="background:${corInd(l)}"></i>${esc(l)}: <b class="tnum">${n}</b>${n&&ub.length?` <span class="muted tnum">(${Math.round(n/ub.length*100)}%)</span>`:""}</span>`;}).join("")}</div></div>`;}).join("")}</div>`;
}
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
    <p class="small muted" style="margin:10px 4px 0">Cada linha mostra em qual tentativa a unidade foi aprovada. "Aprovado 1°" é quem passou de primeira.</p></div>`;
}
const RANK_COLS={1:["liberar","cancelar"],2:["aprovar","reprovar","corrigir"],3:["finalizar","cancelar"],4:["aprovar","reprovar"],41:["aprovar","reprovar"],5:["agendar","cancelar"],6:["aprovar","reprovar"],7:["corrigir"]};
const ACAO_CLS={aprovar:"s-ok",reprovar:"s-bad",corrigir:"s-warn",liberar:"s-info",finalizar:"s-info",agendar:"s-info",cancelar:"s-neutral"};
function indAcoes(op){
  const I=S.ind, bl=new Set(blocosInd()), ini=I.ini?new Date(I.ini+"T00:00"):null, fim=I.fim?new Date(I.fim+"T23:59:59"):null;
  const um=new Map(unidadesObra().map(x=>[x.id,x]));
  const T=DB.tarefas.filter(t=>t.id_obra===S.obraId&&t.etapa_antiga===op.etapa&&(!op.coluna||t.coluna===op.coluna)&&bl.has(nivel1Nome(um.get(t.id_unidade)))&&(!ini||new Date(t.data)>=ini)&&(!fim||new Date(t.data)<=fim)).sort((a,b)=>b.data.localeCompare(a.data));
  const rc=RANK_COLS[op.etapa]||[], autores=[...new Set(T.map(t=>t.autor))].map(a=>({a,n:T.filter(t=>t.autor===a).length})).sort((x,y)=>y.n-x.n);
  const lista=T.slice(0,400);
  return `<div class="acoes"><section class="panel"><h2 class="h2" style="margin-bottom:12px">Movimentações <span class="muted small">(${T.length})</span></h2>
    ${T.length?`<div class="scrollbox" id="ind-mov" data-keep-scroll><table class="list"><thead><tr><th>Unidade</th><th class="n">Ação</th><th>Autor</th><th>Data</th><th>Observação</th></tr></thead><tbody>
      ${lista.map(t=>{const x=um.get(t.id_unidade); return `<tr><td style="white-space:nowrap">${esc(nivel1Nome(x))} - ${esc(x.unidade)}</td><td class="n"><span class="act ${ACAO_CLS[t.acao]||""}">${esc(t.acao)}</span></td><td>${esc(t.autor)}</td><td class="tnum" style="white-space:nowrap">${fmtDTL(new Date(t.data))}</td><td>${esc(t.obs)}</td></tr>`;}).join("")}
      </tbody></table>${T.length>400?`<p class="small muted">Mostrando as 400 mais recentes.</p>`:""}</div>`:`<div class="empty"><b>Nenhuma movimentação</b><span>Mude a etapa ou o período.</span></div>`}</section>
    <section class="panel"><h2 class="h2" style="margin-bottom:12px">Rank de usuários</h2>
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
    if(d) ev.push({d,hora:"Áreas comuns",txt:a.descricao,sub:"Vistoria do síndico",rep:t.repeticao,cx:!!(L[i+1]&&L[i+1].acao==="cancelar"),ac:1,st:resultado(resAc[a.id],t,prox)}); }));
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
  return topbar("Agenda Vistorias Clientes")+`<main class="screen"><div class="agenda">
    <section class="month"><div class="row" style="margin-bottom:12px"><button class="iconbtn" data-act="agdmes" data-d="-1" aria-label="Mês anterior">${IC.chevL}</button><b style="font-size:1.3rem;min-width:170px;text-align:center">${esc(mesNome(m))}</b><button class="iconbtn" data-act="agdmes" data-d="1" aria-label="Próximo mês">${IC.chevR}</button>
      <span class="spacer"></span><button class="btn sm" data-act="agdhoje">Hoje</button></div>
      <div class="mgrid">${["dom","seg","ter","qua","qui","sex","sáb"].map(w=>`<div class="wd">${w}</div>`).join("")}
      ${cells.map(d=>{const es=doDia(d), out=d.getMonth()!==m.getMonth();
        return `<button class="d ${out?"out":""} ${d<hoje&&!out?"past":""} ${sameDay(d,A.dia)?"sel":""} ${sameDay(d,hoje)?"today":""}" data-act="agddia" data-t="${d.getTime()}" aria-label="${fmtData(d)}, ${es.length} vistorias"><span class="n">${d.getDate()}</span>
          ${es.slice(0,3).map(e=>`<span class="ev st-${e.st} ${e.cx?"cx":""}">${esc(e.txt)}</span>`).join("")}${es.length>3?`<span class="more">+${es.length-3} mais</span>`:""}
          <span class="dots">${es.slice(0,6).map(e=>`<i class="st-${e.cx?"cx":e.st}"></i>`).join("")}</span></button>`;}).join("")}</div></section>
    <aside class="side"><div class="row"><b style="font-size:1.1rem">${fmtData(A.dia)}</b><span class="spacer"></span><span class="muted small">${sel.filter(e=>!e.cx).length} vistoria(s)</span></div>
      ${buscaBox("agdBusca",A.busca,"Pesquisar unidade ou cliente").replace('class="search"','class="search" style="width:100%"')}
      ${grupos.length?grupos.map(h=>`<div class="slotgrp"><h4>${esc(h)}</h4>${sel.filter(e=>e.hora===h).map(e=>`<div class="vcard ${e.cx?"cx":""}"><b><i class="vdot st-${e.cx?"cx":e.st}" title="${e.cx?"Cancelada":e.st==="ok"?"Vistoria aprovada":e.st==="bad"?"Vistoria reprovada":"Vistoria ainda não feita"}"></i>${esc(e.txt)}</b><span class="tag">${e.rep||1}°</span><span>${e.cx?"Cancelado":esc(e.sub)}</span></div>`).join("")}</div>`).join("")
        :`<div class="empty" style="padding:40px 8px"><b>Nenhuma vistoria neste dia</b><span>Escolha outro dia no calendário.</span></div>`}
    <div class="ag-leg"><span><i class="vdot st-warn"></i>Agendada</span><span><i class="vdot st-ok"></i>Aprovada</span><span><i class="vdot st-bad"></i>Reprovada</span><span><i class="vdot st-cx"></i>Cancelada</span></div>
    </aside></div></main>`;
}

/* ================= TELA: LOCAIS ================= */
function telaLocais(){
  const L=S.loc, o=OBRA(), cfg=o.config, admin=can(ME(),"admin"), q=(L.busca||"").trim().toLowerCase();
  const locais=DB.locais.filter(l=>l.id_obra===S.obraId).sort((a,b)=>a.nivel1.localeCompare(b.nivel1));
  if(S.locAba==="ac") L.localId="ac";
  if(L.localId!=="ac"&&!localById(L.localId)&&locais.length){ L.localId=locais[0].id; L.n2=1; }
  const acs=DB.areas.filter(a=>a.id_obra===S.obraId).sort((a,b)=>a.descricao.localeCompare(b.descricao));
  const loc=localById(L.localId);
  const us=loc?ordenarUnidades(DB.unidades.filter(x=>x.nivel_1===loc.id&&x.nivel_2===L.n2)):[];
  const vis=locais.map(l=>{const ns=l.niveis2.split(", ").map((n,i)=>[n,i+1]); const ok=!q||l.nivel1.toLowerCase().includes(q); return [l,ok?ns:ns.filter(([n])=>n.toLowerCase().includes(q))];}).filter(([l,ns])=>ns.length);
  const cfgModal=L.cfgAberta&&admin?`<div class="modal" role="dialog" aria-modal="true" aria-label="Configuração da obra"><div class="scrim" data-act="cfgtoggle"></div><div class="box sm2">
    <div class="mhead"><div class="t"><b class="conf-t">Configuração da obra</b><div class="small muted">${esc(o.nome)} · substitui as regras que antes eram fixas por ID de obra</div></div><button class="iconbtn" data-act="cfgtoggle" aria-label="Fechar">${IC.close}</button></div>
    <div class="mbody"><div class="field"><label>Foto de capa</label><div class="capa">${fotoObra(o)?`<img src="${esc(fotoObra(o))}" alt="Foto atual de ${esc(o.nome)}">`:`<div class="capa-vazia">Sem foto</div>`}
        <label class="btn sm ghost">${IC.camera}Alterar foto<input type="file" id="foto-obra" accept="image/*" hidden></label></div><span class="small muted">É a imagem do card da obra na tela inicial.</span></div>
      <div class="field"><label>Tipo da obra</label><div class="seg" style="align-self:flex-start"><button class="${cfg.tipo==="predio"?"on":""}" data-act="cfgtipo" data-v="predio">Prédio</button><button class="${cfg.tipo==="casa"?"on":""}" data-act="cfgtipo" data-v="casa">Casas</button></div></div>
      <div class="field"><label>Testes da validação técnica</label>${TESTES.map(t=>`<label class="chk"><input type="checkbox" id="cfg-${t.k}" data-cfgteste="${t.k}" ${cfg.testes.includes(t.k)?"checked":""}>${t.nome}</label>`).join("")}</div>
      <div class="field"><label>Etapas opcionais</label><label class="chk"><input type="checkbox" id="cfg-previa" data-cfg="previa" ${cfg.previa?"checked":""}>Vistoria Prévia depois da Qualidade</label><label class="chk"><input type="checkbox" id="cfg-direto" data-cfg="aprovarDireto" ${cfg.aprovarDireto?"checked":""}>Permitir "Aprovar direto" (pula a vistoria Qualidade)</label></div></div></div></div>`:"";
  const modal=L.modal?modalLocais():"";
  const right=admin?`<button class="btn" data-act="cfgtoggle" style="background:var(--surface);color:var(--fg)">Configurar obra</button>`:"";
  return topbar("Locais",right)+`<main class="locais">
    <aside class="loc-side">
      <div class="seg loc-abas" role="tablist"><button class="${S.locAba!=="ac"?"on":""}" role="tab" aria-selected="${S.locAba!=="ac"}" data-act="locaba" data-v="und">Unidades</button><button class="${S.locAba==="ac"?"on":""}" role="tab" aria-selected="${S.locAba==="ac"}" data-act="locaba" data-v="ac">Áreas comuns <span class="tnum">(${acs.length})</span></button></div>
      ${S.locAba==="ac"?`<div class="loc-list"><p class="muted small" style="padding:4px 8px 0;margin:0">Áreas que não pertencem a um bloco: salão de festas, piscina, guarita... Toque em uma para renomear ou no + para adicionar.</p></div>`:`
      <div class="row">${buscaBox("locBusca",L.busca||"","Pesquisar bloco ou pavimento").replace('class="search"','class="search loc-search"')}</div>
      <div class="loc-list" id="loc-list" data-keep-scroll>${vis.map(([l,ns])=>`<div class="loc-grp"><button class="loc-h" data-act="locedit" data-id="${l.id}" title="Editar ${esc(l.nivel1)}">${esc(l.nivel1)}${IC.edit}</button>
        ${ns.map(([n,i])=>`<button class="loc-p ${L.localId===l.id&&L.n2===i?"on":""}" data-act="locsel" data-id="${l.id}" data-n="${i}">${esc(n)}</button>`).join("")}</div>`).join("")
        ||`<p class="muted small" style="padding:8px">Nada encontrado.</p>`}
        <button class="loc-novo" data-act="locnovo">${IC.plus}Nova ${cfg.tipo==="casa"?"quadra":"bloco"}</button></div>`}
    </aside>
    <section class="loc-main">${L.localId==="ac"?`<h2 class="loc-crumb">${esc(o.nome)} &gt; Áreas Comuns</h2>
      <div class="loc-units ac">${acs.map(a=>`<button data-act="acedit" data-id="${a.id}">${esc(a.descricao)}<span class="small muted">${esc(ETAPA_AC[a.sub_etapa].n)}</span></button>`).join("")}<button class="add" data-act="acnova" aria-label="Adicionar área comum">${IC.plus}</button></div>`:loc?`<h2 class="loc-crumb">${esc(o.nome)} &gt; ${esc(loc.nivel1)} &gt; ${esc(loc.niveis2.split(", ")[L.n2-1]||"")}</h2>
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
      <div class="mbody"><div class="field"><label for="und-nome">Nome da unidade</label><input class="inp" id="und-nome" value="${esc(x?x.unidade:"")}" placeholder="${OBRA().config.tipo==="casa"?"Ex.: CASA 12":"Ex.: AP 305"}"></div>
      ${x&&!podeExcluir?`<span class="small muted">Só dá para excluir unidades que ainda estão na Liberação de Testes.</span>`:""}</div>
      <div class="mfoot">${podeExcluir?`<button class="btn ${M.del?"bad":"ghost"}" data-act="unddel">${M.del?"Confirmar exclusão":"Excluir"}</button><span class="spacer"></span>`:""}<button class="btn ghost" data-act="locfechar">Cancelar</button><button class="btn primary" data-act="undsalvar">Salvar</button></div></div></div>`; }
  const l=M.id?localById(M.id):null, temUnd=l&&DB.unidades.some(u=>u.nivel_1===l.id);
  return `<div class="modal" role="dialog" aria-modal="true"><div class="scrim" data-act="locfechar"></div><div class="box sm"><div class="mhead"><b class="t h2">${l?"Editar local":"Novo local"}</b><button class="iconbtn" data-act="locfechar" aria-label="Fechar">${IC.close}</button></div>
    <div class="mbody"><div class="field"><label for="loc-n1">Nome (bloco ou quadra)</label><input class="inp" id="loc-n1" value="${esc(l?l.nivel1:"")}" placeholder="Ex.: Bloco H"></div>
    <div class="field"><label for="loc-n2">Pavimentos ou fileiras, separados por vírgula</label><input class="inp" id="loc-n2" value="${esc(l?l.niveis2:"")}" placeholder="1° Pavimento, 2° Pavimento, 3° Pavimento"><span class="small muted">A ordem define como as unidades aparecem nos indicadores (o primeiro fica embaixo).</span></div></div>
    <div class="mfoot">${l&&!temUnd?`<button class="btn ${M.del?"bad":"ghost"}" data-act="locdel">${M.del?"Confirmar exclusão":"Excluir"}</button><span class="spacer"></span>`:""}<button class="btn ghost" data-act="locfechar">Cancelar</button><button class="btn primary" data-act="locsalvar">Salvar</button></div></div></div>`;
}

/* ================= TELA: HORÁRIOS ================= */
function carregarHor(){ S.hor={obraId:S.obraId,draft:Object.fromEntries(DIAS.map(([k])=>[k,horariosDia(S.obraId,k)]))}; }
function telaHorarios(){
  if(!S.hor||S.hor.obraId!==S.obraId) carregarHor();
  const D=S.hor.draft;
  return topbar("Horários",`<button class="btn" data-act="horsalvar" style="background:var(--surface)">Salvar alterações</button>`)+`<main class="screen"><p class="muted small" style="margin:0">Horários em que o RC pode marcar vistoria com o cliente nesta obra, e quantos engenheiros atendem em cada um.</p><div class="days panel">
    ${DIAS.map(([k,n])=>`<div class="day"><h3>${n}</h3>${D[k].map((h,i)=>`<div class="slotrow"><button class="x" data-act="hordel" data-k="${k}" data-i="${i}" aria-label="Remover ${h.Horas}">×</button>
      <select class="inp" id="h-${k}-${i}" data-hor="${k}" data-i="${i}" data-f="Horas" aria-label="Horário">${HORAS.map(x=>`<option ${x===h.Horas?"selected":""}>${x}</option>`).join("")}</select>
      <input class="inp tnum" type="number" min="1" max="50" id="p-${k}-${i}" data-hor="${k}" data-i="${i}" data-f="Pessoas" value="${h.Pessoas}" aria-label="Pessoas disponíveis"></div>`).join("")}
      <button class="btn primary" data-act="horadd" data-k="${k}">Novo horário</button></div>`).join("")}</div></main>`;
}

/* ================= TELA: VERSÕES ================= */
function telaVersoes(){
  const V=[["v2.1.2 (07/10/2026)",["Ícone do app para instalar no celular e ícone redondo na aba do navegador.","Configurações Admin (logo da tela inicial): simular acesso e gerenciar usuários.","Sair pelo ícone ao lado do seu nome no menu; foto do usuário e cores nas iniciais.","Preferências no perfil: tela inicial da obra e tema (claro é o padrão).","Locais, Clientes e Usuários só para admin; Locais com abas Unidades e Áreas comuns.","Foto de capa da obra na configuração.","Agenda: cor da vistoria pelo resultado (agendada, aprovada, reprovada).","Indicadores gerais redesenhados e PDF A4 da Visão Unidades.","Atualização em segundo plano sem a tela de Sincronizando; nova tela de abertura."]],["v2.1.1 (05/10/2026)",["Usuários do app antigo já entram cadastrados e aprovados, com as mesmas funções e obras.","Senha provisória obriga a criar uma senha própria no primeiro login."]],["v2.1.0 (05/10/2026)",["Versão web em produção: Vercel + Supabase, com os dados importados do SharePoint.","Login com e-mail e senha; novos acessos ficam pendentes até o admin aprovar.","Tela Usuários (admin): aprovar, escolher funções e obras, bloquear e definir senha provisória.","Função Gerente (antigo \"supervisor\"): vê os indicadores gerais na tela inicial.","Anexos guardados de verdade (teste de gás) e assinatura do cliente carregada sob demanda.","Ações conferidas no servidor: permissão por função e aviso quando outra pessoa mexeu antes."]],["v2.0.4 (05/10/2026)",["Cadastro de áreas comuns na tela de Locais."]],["v2.0.3 (05/10/2026)",["Painel de filtros no design do app original."]],["v2.0.2 (05/10/2026)",["Tela de Locais no layout do app original; configuração da obra em botão no cabeçalho.","Modo escuro mantém o cabeçalho laranja e o fundo desfocado do menu.","Novas cores do cabeçalho das etapas e da tabela de unidades."]],["v2.0.1 (05/10/2026)",["Tela de perfil com acessos, obras e tarefas feitas.","Nova tela de clientes: vínculo por unidade com busca de cliente e cadastro rápido.","Checklist também na reprova da Qualidade e na Vistoria do Cliente, com assinatura do cliente.","Anexos só na aprovação do teste de Gás.","Popup mantém a rolagem depois de uma ação; botões alinhados à direita; linha do tempo nas movimentações.","Ajustes para celular e proporções das telas."]],["v2.0.0 (05/10/2026)",["Botões de ação abrem uma confirmação com observação e anexos. Reprova de teste pede o motivo e a aprovação da Qualidade pede o checklist.","Agendamento abre como uma aba do próprio popup da unidade.","Indicadores gerais de todas as obras na tela inicial (admin).","Ícones originais no menu, linhas verticais nas tabelas e ajustes de rolagem."]],["v2.0 · protótipo web (05/10/2026)",["Recriação do app como site, com os mesmos fluxos e telas.","Regras por obra viraram configuração: testes ativos, Vistoria Prévia e Aprovar direto.","Correções: cores e contagens de Gás, Dreno e Vistoria Prévia nos indicadores; Visão Aprovações inclui Gás e Prévia.","Liberação em lote passa a registrar as tarefas no histórico.","Horário cheio fica bloqueado no agendamento; cancelar agendamento mantém o número da vistoria.","Agenda com busca funcionando e vistorias das áreas comuns."]],
    ["v1.1.0 (12/02/2025)",["Indicadores"]],["v1.0.0 (18/11/2025)",["Versão inicial!","Criação do banco de dados","Criação do logo","Tela Home, seletor de obras"]]];
  return topbar("Versões")+`<main class="screen"><section class="panel" style="max-width:760px">${V.map(([t,l])=>`<h2 class="h3" style="margin:6px 0">${esc(t)}</h2><ul style="margin:0 0 18px;padding-left:20px">${l.map(i=>`<li>${esc(i)}</li>`).join("")}</ul>`).join("")}</section></main>`;
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
    h={unidades:telaUnidades,areas:telaAreas,indicadores:telaIndicadores,agenda:telaAgenda,locais:telaLocais,clientes:telaClientes,horarios:telaHorarios,versoes:telaVersoes,perfil:telaPerfil}[S.screen]();
    if(S.popup&&S.popup.tipo==="und") h+=popupUnidade();
    if(S.popup&&S.popup.tipo==="ac") h+=popupArea();
    if(S.conf) h+=confirmDialog();
    h+=menuLateral();
  }
  if(!S.auth.tela) h+=extrasAuth();
  document.documentElement.classList.toggle("lock",!!(S.senhaModal||S.popup||S.nav||S.drawer||S.adminPanel||S.loc.modal||S.loc.cfgAberta||S.homeInd||S.conf));
  document.getElementById("app").innerHTML=h;
  if(!S.auth.tela){ desenharFotos(); initSig(); }
  Object.entries(scr).forEach(([id,[t,l]])=>{const e=document.getElementById(id); if(e){e.scrollTop=t;e.scrollLeft=l;}});
  window.scrollTo(winX,winY);
  if(fid){ const e=document.getElementById(fid); if(e){ e.focus({preventScroll:true}); if(sel&&e.setSelectionRange) try{e.setSelectionRange(sel[0],sel[1]);}catch(_){} } }
}
