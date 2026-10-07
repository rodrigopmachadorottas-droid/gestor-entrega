/* ================= CONFIRMAÇÃO DE AÇÃO ================= */
const ACAO_IC={aprovar:IC.check,aprovarDireto:IC.check,reprovar:IC.x,liberar:IC.arrow,finalizar:IC.arrow,corrigir:IC.arrow,cancelar:IC.undo,agendar:IC.calendar};
function tituloAcao(a,s,ctx){
  const t=s.titulo;
  if(a==="liberar") return ctx==="ac"?"Liberar local para vistoria Qualidade":`Liberar ${t}`;
  if(a==="cancelar") return s.key==="finalizando"?"Cancelar finalização":s.col==="agendamento"?"Cancelar agendamento":"Cancelar liberação";
  if(a==="aprovar") return `Aprovar ${t}`;
  if(a==="reprovar") return `Reprovar ${t}`;
  if(a==="corrigir") return `Pendências corrigidas · ${t}`;
  if(a==="finalizar") return "Finalizar unidade";
  if(a==="aprovarDireto") return "Aprovar direto para agendamento";
  if(a==="agendar") return "Agendar vistoria do síndico";
  return t;
}
function abrirConf(ctx,a,k){
  const isU=ctx==="und", item=isU?DB.unidades.find(u=>u.id===S.popup.id):DB.areas.find(z=>z.id===S.popup.id);
  const secs=isU?secoesUnidade(item,ME(),S.fil):secoesArea(item,ME());
  const s=secs.find(x=>x.key===k); if(!s) return; const ac=s.acts.find(x=>x.a===a); if(!ac) return;
  if(isU&&a==="agendar"){ if(!item.id_cliente){ toast("Aviso","Essa unidade ainda não possui cliente cadastrado","Vincule o cliente em Clientes."); return; }
    const n=new Date(); S.ag={id:item.id,mes:new Date(n.getFullYear(),n.getMonth(),1),dia:null,hora:null}; return; }
  const vist=isU&&(s.col==="rep_vistoria_at"||s.col==="rep_vistoria_cliente")&&(a==="aprovar"||a==="reprovar");
  S.conf={ctx,a,col:s.col,k,label:ac.l,kind:ac.k,titulo:tituloAcao(a,s,ctx),
    sub:isU?`${nivel1Nome(item)} · ${item.unidade}`:item.descricao,
    motivos:a==="reprovar"&&s.motivos?s.motivos:null,
    checklist:vist, assinatura:vist&&s.col==="rep_vistoria_cliente",
    cliente:isU&&item.id_cliente?tituloCase((clienteById(item.id_cliente)||{}).nome||""):"",
    anexo:isU&&a==="aprovar"&&s.col==="rep_teste_gas",
    data:!isU&&a==="agendar", obs:"",anexos:[],mot:"",ck:{},dt:"",sig:""};
}
function confirmDialog(){
  const C=S.conf, grande=C.checklist; let body="";
  if(C.motivos){
    body=`<div class="field"><label for="conf-mot">Motivo da reprova</label><select class="inp" id="conf-mot" data-conf="mot"><option value="">Selecione o motivo</option>${C.motivos.map(m=>`<option ${m===C.mot?"selected":""}>${esc(m)}</option>`).join("")}</select></div>`;
  } else if(C.checklist){
    const feitos=CHECKLIST_QUALIDADE.filter((_,i)=>C.ck[i]).length;
    body=`<div class="row"><span class="small muted">${C.a==="reprovar"?"Marque os itens com problema. ":""}<b>Construtivo</b> afeta a moradia do cliente; <b>Acabamento</b> é ajuste estético.</span><span class="spacer"></span><button class="btn sm" data-act="ckall">Marcar restantes como aprovados</button></div>
      <div class="cklist">${CHECKLIST_QUALIDADE.map((it,i)=>`<div class="ckrow"><span>${esc(it)}</span><div class="seg ck" role="group" aria-label="${esc(it)}">${CK_OPCOES.map(([v,l])=>`<button class="${C.ck[i]===v?"on ck-"+v:""}" data-act="ckset" data-i="${i}" data-v="${v}">${l}</button>`).join("")}</div></div>`).join("")}</div>
      <span class="small muted tnum">${feitos} de ${CHECKLIST_QUALIDADE.length} itens marcados</span>
      ${C.assinatura?`<div class="sigwrap"><div class="row"><b>Assinatura do cliente${C.cliente?` · ${esc(C.cliente)}`:""}</b><span class="spacer"></span><button class="btn sm ghost" data-act="siglimpar">Limpar</button></div>
        <canvas id="sig" class="sig" aria-label="Área para o cliente assinar"></canvas><span class="small muted">Peça para o cliente assinar com o dedo ou com a caneta do tablet.</span></div>`:""}`;
  } else {
    body=`${C.data?`<div class="field"><label for="conf-data">Data da vistoria</label><input type="date" class="inp" id="conf-data" data-conf="dt" value="${C.dt}" style="max-width:220px"></div>`:""}
      <div class="obsbox"><textarea id="conf-obs" data-conf="obs" placeholder="Observação (opcional)" rows="4">${esc(C.obs)}</textarea>
      ${C.anexo?`<div class="anxarea">${C.anexos.length?`<ul>${C.anexos.map((a,i)=>`<li>${IC.clip}<span>${esc(a.nome)}</span><span class="muted small">${Math.max(1,Math.round(a.tam/1024))} KB</span><button class="x" data-act="anxdel" data-i="${i}" aria-label="Remover ${esc(a.nome)}">×</button></li>`).join("")}</ul>`:`<span>Você não anexou nada, mas pode fazer isso se precisar.</span>`}
        <label class="anxbtn">${IC.clip}Anexar arquivos<input type="file" id="conf-file" multiple hidden></label></div>`:""}</div>`;
  }
  return `<div class="modal conf" role="dialog" aria-modal="true" aria-label="${esc(C.titulo)}"><div class="scrim" data-act="conffechar"></div><div class="box ${grande?"tall":"sm2"}">
    <div class="mhead"><div class="t"><b class="conf-t">${esc(C.titulo)}</b><div class="small muted">${esc(C.sub)}</div></div><button class="iconbtn" data-act="conffechar" aria-label="Fechar">${IC.close}</button></div>
    <div class="mbody" id="mb-conf" data-keep-scroll>${body}</div>
    <div class="mfoot"><button class="btn ${C.kind} btn-ic conf-ok" data-act="confok">${ACAO_IC[C.a]||""}${esc(C.label)}</button></div></div></div>`;
}
function initSig(){
  const cv=document.getElementById("sig"); if(!cv||!S.conf) return;
  const dpr=window.devicePixelRatio||1, w=cv.clientWidth, h=cv.clientHeight;
  cv.width=w*dpr; cv.height=h*dpr; const g=cv.getContext("2d"); g.scale(dpr,dpr);
  g.lineWidth=2.4; g.lineCap="round"; g.lineJoin="round"; g.strokeStyle=getComputedStyle(cv).color;
  if(S.conf.sig){ const im=new Image(); im.onload=()=>g.drawImage(im,0,0,w,h); im.src=S.conf.sig; }
  let on=false;
  const pt=e=>{const r=cv.getBoundingClientRect(); return [e.clientX-r.left,e.clientY-r.top];};
  cv.onpointerdown=e=>{ on=true; cv.setPointerCapture(e.pointerId); const [x,y]=pt(e); g.beginPath(); g.moveTo(x,y); g.lineTo(x+.1,y+.1); g.stroke(); };
  cv.onpointermove=e=>{ if(!on) return; const [x,y]=pt(e); g.lineTo(x,y); g.stroke(); };
  cv.onpointerup=cv.onpointercancel=()=>{ if(!on) return; on=false;
    const o=document.createElement("canvas"); o.width=w; o.height=h; o.getContext("2d").drawImage(cv,0,0,w,h); S.conf.sig=o.toDataURL("image/png"); };
}
function ckResumo(ck){
  const c=ck.filter(x=>x.r==="construtivo"), a=ck.filter(x=>x.r==="acabamento");
  return `<div class="obs">Checklist: ${ck.length} itens${c.length?` · <b style="color:var(--bad-t)">${c.length} construtivo</b>`:""}${a.length?` · ${a.length} de acabamento`:""}${c.length||a.length?` (${esc([...c,...a].map(x=>x.item).join(", "))})`:" · todos aprovados"}</div>`;
}
function confirmarAcao(){
  const C=S.conf;
  if(C.motivos&&!C.mot){ toast("Erro","Selecione o motivo da reprova"); return; }
  if(C.checklist){
    if(C.a==="aprovar"&&CHECKLIST_QUALIDADE.some((_,i)=>!C.ck[i])){ toast("Erro","Marque todos os itens do checklist"); return; }
    if(C.a==="reprovar"&&!CHECKLIST_QUALIDADE.some((_,i)=>C.ck[i]&&C.ck[i]!=="ok")){ toast("Erro","Marque pelo menos um item com problema","Construtivo ou Acabamento."); return; }
    if(C.assinatura&&!C.sig){ toast("Erro","Falta a assinatura do cliente"); return; }
  }
  let ag="";
  if(C.data){ if(!C.dt){ toast("Erro","Escolha a data da vistoria"); return; } const [y,m,d]=C.dt.split("-"); ag=`${d}/${m}/${y}`; }
  const o={autor:S.user,obs:C.motivos?C.mot:C.obs.trim(),anexos:C.anexo?C.anexos:[],agendamento:ag};
  if(C.checklist){ o.checklist=CHECKLIST_QUALIDADE.map((item,i)=>({item,r:C.ck[i]||"ok"})); o.obs=""; if(C.assinatura) o.assinatura=C.sig; }
  if(C.ctx==="und"){ const x=DB.unidades.find(u=>u.id===S.popup.id), antes=x.sub_etapa; executarAcao(x,C.a,C.col,o);
    toast("Sucesso",`${C.label}: ${x.unidade}`, x.sub_etapa!==antes?`Unidade passou para ${ETAPA[x.sub_etapa].n}`:""); }
  else { const a=DB.areas.find(z=>z.id===S.popup.id); executarAcaoAC(a,C.a,C.col,o); toast("Sucesso",`${C.label}: ${a.descricao}`); }
  saveDB(); S.conf=null;
}

/* ================= INDICADORES GERAIS (tela inicial, admin) ================= */
function opcoesGerais(){
  return [{id:"lib",nome:"Liberação de Testes",tipo:"lib",coluna:""},
    ...TESTES.map(t=>({id:t.col,nome:t.nome,tipo:"rep",coluna:t.col,teste:t.k})),
    {id:"fin",nome:"Finalizando Unidade",tipo:"fin",coluna:""},{id:"rep_vistoria_at",nome:"Vistoria Qualidade",tipo:"rep",coluna:"rep_vistoria_at"},
    {id:"rep_vistoria_previa",nome:"Vistoria Prévia",tipo:"rep",coluna:"rep_vistoria_previa",previa:1},
    {id:"agendamento",nome:"Agendamento com Cliente",tipo:"ag",coluna:"agendamento"},{id:"rep_vistoria_cliente",nome:"Vistoria Cliente",tipo:"rep",coluna:"rep_vistoria_cliente"},
    {id:"corr",nome:"Correções de Obra",tipo:"corr",coluna:""}];
}
function popupIndGerais(){
  const ops=opcoesGerais(), op=ops.find(o=>o.id===S.homeInd.etapa)||ops[0], leg=LEGENDAS[op.tipo];
  const corr=new Set(DB.tarefas.filter(t=>t.acao==="corrigir"&&t.etapa_antiga===7).map(t=>t.id_unidade));
  const tot=Object.fromEntries(leg.map(l=>[l,0])); let totAll=0;
  const rows=[...DB.obras].sort((a,b)=>a.ordem-b.ordem).map(o=>{
    const aplica=(!op.teste||o.config.testes.includes(op.teste))&&(!op.previa||o.config.previa);
    const us=DB.unidades.filter(u=>u.id_obra===o.id);
    if(!aplica) return `<tr><th class="lbl">${esc(o.nome)}</th><td colspan="${leg.length+1}" class="na">Não se aplica a esta obra</td></tr>`;
    const st=us.map(u=>statusInd(u,op,corr)); totAll+=us.length;
    return `<tr><th class="lbl">${esc(o.nome)}</th>${leg.map(l=>{const n=st.filter(s=>s===l).length; tot[l]+=n; return `<td>${n}${n&&us.length?` <span class="pct">${Math.round(n/us.length*100)}%</span>`:""}</td>`;}).join("")}<td class="tot">${us.length}</td></tr>`;
  }).join("");
  return `<div class="modal" role="dialog" aria-modal="true" aria-label="Indicadores gerais"><div class="scrim" data-act="homeind"></div><div class="box tall">
    <div class="mhead"><div class="t"><b class="conf-t">Indicadores gerais</b><div class="small muted">Unidades de todas as obras por status na etapa escolhida</div></div><button class="iconbtn" data-act="homeind" aria-label="Fechar">${IC.close}</button></div>
    <div class="mbody"><label class="row" style="gap:8px"><b>Etapa:</b><select class="inp" id="hi-etapa" data-hi="1" style="width:auto;min-width:240px">${ops.map(o=>`<option value="${o.id}" ${o.id===op.id?"selected":""}>${esc(o.nome)}</option>`).join("")}</select></label>
    <div style="overflow-x:auto"><table class="kpi gerais"><thead><tr><th style="background:none"></th>${leg.map(l=>`<th><span class="row" style="gap:6px;justify-content:center;flex-wrap:nowrap"><i class="dot" style="background:${corInd(l)}"></i>${esc(l)}</span></th>`).join("")}<th class="tot">Unidades</th></tr></thead>
    <tbody>${rows}</tbody><tfoot><tr><th>TOTAL</th>${leg.map(l=>`<td>${tot[l]}${tot[l]&&totAll?` (${Math.round(tot[l]/totAll*100)}%)`:""}</td>`).join("")}<td>${totAll}</td></tr></tfoot></table></div></div></div></div>`;
}
