/* ================= CONFIRMAÇÃO DE AÇÃO ================= */
const ACAO_IC={aprovar:IC.check,aprovarDireto:IC.check,liberar:IC.arrow,finalizar:IC.arrow,corrigir:IC.arrow,cancelar:IC.undo,agendar:IC.calendar};
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
    S.ag=novoAg(item); return; }
  const def=isU?camposDe(`${s.key}:${a}`):camposDe(`ac:${s.key}:${a}`);
  S.conf={ctx,a,col:s.col,k,label:ac.l,kind:ac.k,titulo:tituloAcao(a,s,ctx),
    sub:isU?`${nivel1Nome(item)} · ${item.unidade}`:item.descricao,
    cliente:isU&&item.id_cliente?tituloCase((clienteById(item.id_cliente)||{}).nome||""):"",
    def, f:formVazio()};
}
function confirmDialog(){
  const C=S.conf, grande=C.def.some(c=>c.tipo==="checklist"||c.tipo==="assinatura");
  const body=camposHTML(C.def,C.f,C.ctx)||`<span class="muted">Confirma esta ação?</span>`;
  return `<div class="modal conf" role="dialog" aria-modal="true" aria-label="${esc(C.titulo)}"><div class="scrim" data-act="conffechar"></div><div class="box ${grande?"tall":"sm2"}">
    <div class="mhead"><div class="t"><b class="conf-t">${esc(C.titulo)}</b><div class="small muted">${esc(C.sub)}</div></div><button class="iconbtn" data-act="conffechar" aria-label="Fechar">${IC.close}</button></div>
    <div class="mbody" id="mb-conf" data-keep-scroll>${body}</div>
    <div class="mfoot"><button class="btn ${C.kind} btn-ic conf-ok" data-act="confok">${ACAO_IC[C.a]||""}${esc(C.label)}</button></div></div></div>`;
}
function initSig(){
  const cv=document.getElementById("sig"); if(!cv||!formAtual()) return;
  const dpr=window.devicePixelRatio||1, w=cv.clientWidth, h=cv.clientHeight;
  cv.width=w*dpr; cv.height=h*dpr; const g=cv.getContext("2d"); g.scale(dpr,dpr);
  g.lineWidth=2.4; g.lineCap="round"; g.lineJoin="round"; g.strokeStyle=getComputedStyle(cv).color;
  const F=formAtual(); if(!F) return;
  if(F.sig){ const im=new Image(); im.onload=()=>g.drawImage(im,0,0,w,h); im.src=F.sig; }
  let on=false;
  const pt=e=>{const r=cv.getBoundingClientRect(); return [e.clientX-r.left,e.clientY-r.top];};
  cv.onpointerdown=e=>{ on=true; cv.setPointerCapture(e.pointerId); const [x,y]=pt(e); g.beginPath(); g.moveTo(x,y); g.lineTo(x+.1,y+.1); g.stroke(); };
  cv.onpointermove=e=>{ if(!on) return; const [x,y]=pt(e); g.lineTo(x,y); g.stroke(); };
  cv.onpointerup=cv.onpointercancel=()=>{ if(!on) return; on=false;
    const o=document.createElement("canvas"); o.width=w; o.height=h; o.getContext("2d").drawImage(cv,0,0,w,h); F.sig=o.toDataURL("image/png"); };
}
const CK_NOMES={ok:"Aprovado",construtivo:"Construtivo",acabamento:"Acabamento"};
function ckResumo(ck){
  const prob=ck.filter(x=>x.p!=null?x.p:x.r!=="ok"), grupos=[...new Set(prob.map(x=>x.rl||CK_NOMES[x.r]||x.r))];
  return `<div class="obs">Checklist: ${ck.length} itens${grupos.map((g,i)=>{const n=prob.filter(x=>(x.rl||CK_NOMES[x.r]||x.r)===g).length; return ` · ${i?"":`<b style="color:var(--bad-t)">`}${n} ${esc(g.toLowerCase())}${i?"":"</b>"}`;}).join("")}${prob.length?` (${esc(prob.map(x=>x.item).join(", "))})`:" · todos aprovados"}</div>`;
}
function confirmarAcao(){
  const C=S.conf, erro=validarCampos(C.def,C.f,C.a);
  if(erro){ toast("Erro",erro); return; }
  const o={autor:S.user,...coletarCampos(C.def,C.f)};
  if(o.agendamento==null) o.agendamento="";
  if(C.ctx==="und"){ const x=DB.unidades.find(u=>u.id===S.popup.id), antes=x.sub_etapa; executarAcao(x,C.a,C.col,o);
    toast("Sucesso",`${C.label}: ${x.unidade}`, x.sub_etapa!==antes?`Unidade passou para ${ETAPA[x.sub_etapa].n}`:""); }
  else { const a=DB.areas.find(z=>z.id===S.popup.id); executarAcaoAC(a,C.a,C.col,o); toast("Sucesso",`${C.label}: ${a.descricao}`); }
  saveDB(); S.conf=null;
}

/* ================= INDICADORES GERAIS (tela inicial, admin) ================= */
function opcoesGerais(u){
  const todas=[...TESTES.map(t=>({id:t.col,nome:t.nome,tipo:"rep",coluna:t.col,teste:t.k,fase:"f1"})),
    {id:"fin",nome:"Finalizando Unidade",tipo:"fin",coluna:"",fase:"f1"},{id:"rep_vistoria_at",nome:"Vistoria Qualidade",tipo:"rep",coluna:"rep_vistoria_at",fase:"f2"},
    {id:"rep_vistoria_previa",nome:"Vistoria Prévia",tipo:"rep",coluna:"rep_vistoria_previa",previa:1,fase:"f2"},
    {id:"agendamento",nome:"Agendamento com Cliente",tipo:"ag",coluna:"agendamento",fase:"f2"},{id:"rep_vistoria_cliente",nome:"Vistoria Cliente",tipo:"rep",coluna:"rep_vistoria_cliente",fase:"f2"},
    {id:"corr",nome:"Correções de Obra",tipo:"corr",coluna:"",fase:"f2"}];
  const v=fasesVisiveis(u||ME()); return todas.filter(o=>v[o.fase]);
}
function popupIndGerais(){
  const ops=opcoesGerais(), op=ops.find(o=>o.id===S.homeInd.etapa)||ops[0], leg=LEGENDAS[op.tipo];
  const cel=(n,t)=>`<td class="${n?"":"z"}">${n}${n&&t?` <span class="pct">${Math.round(n/t*100)}%</span>`:""}</td>`;
  const corr=new Set(DB.tarefas.filter(t=>t.acao==="corrigir"&&t.etapa_antiga===7).map(t=>t.id_unidade));
  const tot=Object.fromEntries(leg.map(l=>[l,0])); let totAll=0;
  const rows=obrasDoUsuario(ME()).sort((a,b)=>a.ordem-b.ordem).map(o=>{
    const aplica=(!op.teste||o.config.testes.includes(op.teste))&&(!op.previa||o.config.previa);
    const us=DB.unidades.filter(u=>u.id_obra===o.id&&!ehHall(u));
    if(!aplica) return `<tr><th class="lbl">${esc(o.nome)}</th><td colspan="${leg.length+1}" class="na">Não se aplica a esta obra</td></tr>`;
    const st=us.map(u=>statusInd(u,op,corr)); totAll+=us.length;
    return `<tr><th class="lbl">${esc(o.nome)}</th>${leg.map(l=>{const n=st.filter(s=>s===l).length; tot[l]+=n; return cel(n,us.length);}).join("")}<td class="tot">${us.length}</td></tr>`;
  }).join("");
  return `<div class="modal" role="dialog" aria-modal="true" aria-label="Indicadores gerais"><div class="scrim" data-act="homeind"></div><div class="box tall">
    <div class="mhead"><div class="t"><b class="conf-t">Indicadores Gerais (status atual)</b><div class="small muted">Como as unidades estão hoje, por obra, na etapa escolhida</div></div>
      <label class="hi-sel"><span>Etapa:</span><select class="inp" id="hi-etapa" data-hi="1">${ops.map(o=>`<option value="${o.id}" ${o.id===op.id?"selected":""}>${esc(o.nome)}</option>`).join("")}</select></label>
      <button class="iconbtn" data-act="homeind" aria-label="Fechar">${IC.close}</button></div>
    <div class="mbody">
    <div class="gerais-wrap"><table class="kpi gerais"><colgroup><col class="c-obra">${leg.map(()=>"<col>").join("")}<col class="c-tot"></colgroup><thead><tr><th class="lbl-h">Obra</th>${leg.map(l=>`<th style="background:${corInd(l)}">${esc(l)}</th>`).join("")}<th class="tot">Unidades</th></tr></thead>
    <tbody>${rows}</tbody><tfoot><tr><th>TOTAL</th>${leg.map(l=>`<td class="${tot[l]?"":"z"}">${tot[l]}${tot[l]&&totAll?` (${Math.round(tot[l]/totAll*100)}%)`:""}</td>`).join("")}<td>${totAll}</td></tr></tfoot></table></div></div></div></div>`;
}
