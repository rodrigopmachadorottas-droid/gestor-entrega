/* =====================================================================
   CAMPOS DOS POPUPS DE AÇÃO (configuração global, feita pelo admin)
   Cada ação de uma etapa (ex.: "Reprovar · Teste Esgoto") tem uma lista
   de campos. Tipos: observações, lista suspensa, anexo, assinatura,
   pergunta sim/não e checklist. O admin muda em Configurações Admin >
   Configurar campos das etapas (Unidades e Áreas comuns); sem configuração vale o padrão (igual ao app antigo).
   Onde cada resposta fica gravada na tarefa:
     obs        → lista "principal" (ex.: motivo da reprova) ou Observações
     anexos     → campo Anexo           checklist → campo Checklist
     assinatura → campo Assinatura      campos    → todo o resto [{r,v}]
   ===================================================================== */
const TIPOS_CAMPO = {
  obs:        { nome:"Observações",        desc:"Texto livre",                          max:1 },
  lista:      { nome:"Lista suspensa",     desc:"Escolher uma opção de uma lista",       max:9 },
  simnao:     { nome:"Pergunta Sim/Não",   desc:"Ex.: o cliente veio com engenheiro?",   max:9 },
  anexo:      { nome:"Anexo",              desc:"Fotos, PDF ou outros arquivos",          max:1 },
  assinatura: { nome:"Assinatura",         desc:"Assinatura do cliente na tela",         max:1 },
  checklist:  { nome:"Checklist de itens", desc:"Cada item: Aprovado ou Reprovado com foto", max:1, oculto:true },   // só na ação Vistoriar
  ckcorr:     { nome:"Itens a corrigir", desc:"", max:1, oculto:true },   // correção de vistoria com checklist (automático)
  data:       { nome:"Data", desc:"", max:1, oculto:true }   // agendar vistoria do síndico (fixo)
};
const NOME_ACAO = { vistoriar:"Vistoriar", liberar:"Liberar", cancelar:"Cancelar", aprovar:"Aprovar", reprovar:"Reprovar", corrigir:"Pendências corrigidas", finalizar:"Finalizar unidade", aprovarDireto:"Aprovar direto", agendar:"Agendar vistoria" };

// todas as ações configuráveis, agrupadas pela etapa (na ordem do fluxo)
// áreas comuns: chave "ac:<etapa>:<ação>"
function grupoAcoesAC(){
  const v = [["aprovar","Aprovar"],["reprovar","Reprovar"],["corrigir","Pendências corrigidas"]];
  return [{ k:"ac:lib", nome:"Liberação Local", acoes:[["liberar","Liberar local"],["cancelar","Cancelar liberação"]] },
    { k:"ac:rep_vistoria_qualidade", nome:"Vistoria Qualidade", acoes:v },
    { k:"ac:rep_vistoria_arq", nome:"Vistoria Arquitetura", acoes:v },
    { k:"ac:agendamento", nome:"Agendamento com Síndico", acoes:[["agendar","Agendar vistoria"],["cancelar","Cancelar agendamento"]] },
    { k:"ac:rep_vistoria_sindico", nome:"Vistoria do Síndico", acoes:v }].map(grupoVist);
}
const todasAcoesCfg = () => [...grupoAcoes(), ...grupoAcoesAC()];
// durante a edição vale o rascunho; fora dela, a configuração salva
function camposVigentes(key){
  if(!S.pcfg) return camposDe(key);
  const r = rascCampos(key); if(r) return r;
  return camposPadrao(key);
}
// etapa com checklist: Aprovar/Reprovar viram "Vistoriar"
function grupoVist(g){
  const ids = g.acoes.map(a => a[0]); if(!ids.includes("aprovar") || !ids.includes("reprovar")) return g;
  const vist = camposVigentes(g.k + ":vistoriar").some(c => c.tipo === "checklist");
  return { ...g, podeVist:true, vist, acoes:vist ? g.acoes.filter(a => a[0] !== "reprovar").map(a => a[0] === "aprovar" ? ["vistoriar","Vistoriar"] : a) : g.acoes };
}
function grupoAcoes(){
  const G = TESTES.map(t => ({ k:t.col, nome:t.nome, acoes:[["liberar","Liberar teste"],["cancelar","Cancelar liberação"],["aprovar","Aprovar"],["reprovar","Reprovar"],["corrigir","Pendências corrigidas"]] }));
  G.push({ k:"finalizando", nome:"Finalizando Unidade", acoes:[["finalizar","Finalizar unidade"],["aprovarDireto","Aprovar direto"],["cancelar","Cancelar finalização"]] });
  G.push({ k:"rep_vistoria_at", nome:"Vistoria Qualidade", acoes:[["aprovar","Aprovar"],["reprovar","Reprovar"],["corrigir","Pendências corrigidas"]] });
  G.push({ k:"rep_vistoria_previa", nome:"Vistoria Prévia", acoes:[["aprovar","Aprovar"],["reprovar","Reprovar"],["corrigir","Pendências corrigidas"]] });
  G.push({ k:"agendamento", nome:"Agendamento com Cliente", acoes:[["agendar","Agendar vistoria"],["cancelar","Cancelar agendamento"]] });
  G.push({ k:"rep_vistoria_cliente", nome:"Vistoria do Cliente", acoes:[["aprovar","Aprovar"],["reprovar","Reprovar"],["corrigir","Pendências corrigidas"]] });
  return G.map(grupoVist);
}
const novoIdCampo = () => "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
function campoNovo(tipo){
  const c = { id:novoIdCampo(), tipo, rotulo:TIPOS_CAMPO[tipo].nome, obrig:false };
  if(tipo === "lista") Object.assign(c, { rotulo:"Escolha uma opção", opcoes:["Opção 1","Opção 2"], principal:false });
  if(tipo === "simnao") Object.assign(c, { rotulo:"Pergunta?", textoSim:"", laudo:false });
  if(tipo === "anexo") c.rotulo = "Anexos";
  if(tipo === "assinatura") Object.assign(c, { rotulo:"Assinatura do cliente", obrig:true });
  if(tipo === "checklist") Object.assign(c, { id:"checklist", rotulo:"Checklist da vistoria", obrig:true, itens:[{ t:"Item 1", cat:"construtivo" }], todos:true, ajuda:"", fotoRep:true, fotoCor:true });
  return c;
}
// padrão de fábrica de cada ação (o que o app fazia antes da configuração)
function camposPadrao(key){
  if(key.startsWith("ac:")) return key.endsWith(":vistoriar") ? [] : camposArea(key.split(":")[2]);
  const [sec, a] = key.split(":"), obs = () => ({ id:"obs", tipo:"obs", rotulo:"Observações", obrig:false });
  const teste = TESTES.find(t => t.col === sec);
  if(teste){
    if(a === "reprovar" && MOTIVOS[teste.k]) return [{ id:"motivo", tipo:"lista", rotulo:"Motivo da reprova", obrig:true, opcoes:[...MOTIVOS[teste.k]], principal:true }];
    if(a === "aprovar" && teste.k === "gas") return [obs(), { id:"anexo", tipo:"anexo", rotulo:"Anexos", obrig:false }];
    return [obs()];
  }
  const ck = () => ({ id:"checklist", tipo:"checklist", rotulo:"Checklist da vistoria", obrig:true, itens:CHECKLIST_QUALIDADE.map(t => ({ t, cat:CK_CAT_PADRAO[t] || "construtivo" })), todos:true,
    ajuda:"Construtivo/habitabilidade reprovado obriga a reprovar a etapa. Só acabamento reprovado: dá para aprovar mesmo assim." });
  if(a === "vistoriar" && sec === "rep_vistoria_at") return [ck()];
  if(a === "vistoriar" && sec === "rep_vistoria_cliente") return [{ ...ck(), fotoRep:false, fotoCor:false },
    { id:"assinatura", tipo:"assinatura", rotulo:"Assinatura do cliente", obrig:true },
    { id:"eng", tipo:"simnao", rotulo:"O cliente veio com engenheiro ou responsável técnico?", obrig:false, textoSim:"Nome do engenheiro (opcional)", laudo:true }];
  if(a === "vistoriar") return [];   // sem checklist = etapa normal (Aprovar/Reprovar)
  return [obs()];
}
const cfgPopups = () => (DB.config && DB.config.popups) || {};
const camposDe = key => { const C = cfgPopups(), c = C[key]; if(c && Array.isArray(c.campos)) return c.campos;
  // configuração antiga: o checklist ficava em "Aprovar"
  if(key.endsWith(":vistoriar")){ const ap = C[key.replace(/vistoriar$/, "aprovar")]; if(ap && Array.isArray(ap.campos) && ap.campos.some(x => x.tipo === "checklist")) return ap.campos; }
  return camposPadrao(key); };
// áreas comuns não são configuráveis: agendar pede a data, o resto observação
function camposArea(a){ return a === "agendar" ? [{ id:"data", tipo:"data", rotulo:"Data da vistoria", obrig:true, fixo:true }, { id:"obs", tipo:"obs", rotulo:"Observações", obrig:false }] : [{ id:"obs", tipo:"obs", rotulo:"Observações", obrig:false }]; }

/* ---------- estado do formulário (popup de ação ou agenda) ---------- */
const formVazio = () => ({ v:{}, sn:{}, snt:{}, ck:{}, sig:"", anexos:[] });
const novoAg = x => { const n = new Date(); return { id:x.id, mes:new Date(n.getFullYear(), n.getMonth(), 1), dia:null, hora:null, def:camposDe("agendamento:agendar"), f:formVazio() }; };
const formAtual = () => (S.conf && S.conf.f) || (S.ag && S.ag.f) || null;

/* ---------- desenho dos campos ---------- */
function camposHTML(def, F, ctx){
  return def.map(c => {
    const ob = c.obrig ? ` <span class="obr" title="Obrigatório">*</span>` : "", id = `cf-${c.id}`;
    if(c.tipo === "obs") return `<div class="field"><label for="${id}">${esc(c.rotulo)}${ob}</label><textarea class="inp" id="${id}" data-cf="${c.id}" rows="3" placeholder="${c.obrig ? "Obrigatório" : "Opcional"}">${esc(F.v[c.id] || "")}</textarea></div>`;
    if(c.tipo === "data") return campoDataHora(c, F, ob);
    if(c.tipo === "lista") return `<div class="field"><label for="${id}">${esc(c.rotulo)}${ob}</label><select class="inp" id="${id}" data-cf="${c.id}"><option value="">Selecione</option>${(c.opcoes || []).map(o => `<option ${o === F.v[c.id] ? "selected" : ""}>${esc(o)}</option>`).join("")}</select></div>`;
    if(c.tipo === "simnao"){ const v = F.sn[c.id] || (c.obrig ? "" : "Não");
      return `<div class="engbox"><div class="row"><b>${esc(c.rotulo)}${ob}</b><span class="spacer"></span><div class="seg"><button class="${v === "Não" ? "on" : ""}" data-act="cfsim" data-id="${c.id}" data-v="Não">Não</button><button class="${v === "Sim" ? "on" : ""}" data-act="cfsim" data-id="${c.id}" data-v="Sim">Sim</button></div></div>
        ${v === "Sim" && c.textoSim ? `<div class="field"><label for="${id}-t">${esc(c.textoSim)}</label><input class="inp" id="${id}-t" data-cft="${c.id}" value="${esc(F.snt[c.id] || "")}"></div>` : ""}
        ${v === "Sim" && c.laudo && ctx === "und" ? `<span class="small muted">Fica um laudo pendente de envio, que o RC acompanha em Laudos.</span>` : ""}</div>`; }
    if(c.tipo === "anexo") return `<div class="field"><label>${esc(c.rotulo)}${ob}</label><div class="anxarea">${F.anexos.length ? `<ul>${F.anexos.map((a, i) => `<li>${IC.clip}<span>${esc(a.nome)}</span><span class="muted small">${Math.max(1, Math.round(a.tam / 1024))} KB</span><button class="x" data-act="anxdel" data-i="${i}" aria-label="Remover ${esc(a.nome)}">×</button></li>`).join("")}</ul>` : `<span>${c.obrig ? "Anexe pelo menos um arquivo." : "Você não anexou nada, mas pode fazer isso se precisar."}</span>`}
        <label class="anxbtn">${IC.clip}Anexar arquivos<input type="file" id="conf-file" multiple hidden></label></div></div>`;
    if(c.tipo === "assinatura"){ const cli = ctx === "und" && S.conf ? S.conf.cliente : "";
      return `<div class="sigwrap"><div class="row"><b>${esc(c.rotulo)}${cli ? ` · ${esc(cli)}` : ""}${ob}</b><span class="spacer"></span><button class="btn sm ghost" data-act="siglimpar">Limpar</button></div>
        <canvas id="sig" class="sig" aria-label="Área para assinar"></canvas><span class="small muted">Assine com o dedo ou com a caneta do tablet.</span></div>`; }
    if(c.tipo === "checklist") return ckFormHTML(c, F, ctx);
    if(c.tipo === "ckcorr") return ckCorrHTML(c, F);
    return "";
  }).join("");
}

/* ---------- data e hora com calendário (agendar vistoria do síndico) ---------- */
const MESES_PT = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
function campoDataHora(c, F, ob){
  const v = F.v[c.id] || "", hora = F.v[c.id + "_h"] || "09:00", [hh, mm] = hora.split(":"), aberto = F.cal && F.cal.id === c.id;
  const txt = v ? (() => { const [y, m, d] = v.split("-"); return `${d}/${m}/${y}`; })() : "Escolher data";
  let cal = "";
  if(aberto){ const M = F.cal.mes, ini = new Date(M.getFullYear(), M.getMonth(), 1), hoje = isoData(new Date()), dias = [];
    for(let i = 0; i < ini.getDay(); i++) dias.push("<span></span>");
    const n = new Date(M.getFullYear(), M.getMonth() + 1, 0).getDate();
    for(let d = 1; d <= n; d++){ const iso = isoData(new Date(M.getFullYear(), M.getMonth(), d));
      dias.push(`<button type="button" class="${iso === v ? "sel" : ""} ${iso === hoje ? "hoje" : ""}" data-act="cfcaldia" data-id="${c.id}" data-v="${iso}">${d}</button>`); }
    cal = `<div class="mcal" role="dialog" aria-label="Calendário"><div class="mcal-h"><button type="button" class="iconbtn" data-act="cfcalmes" data-d="-1" aria-label="Mês anterior">${IC.chevL}</button>
      <b>${MESES_PT[M.getMonth()]} ${M.getFullYear()}</b><button type="button" class="iconbtn" data-act="cfcalmes" data-d="1" aria-label="Próximo mês">${IC.chevR}</button></div>
      <div class="mcal-g">${["D","S","T","Q","Q","S","S"].map(w => `<span class="wd">${w}</span>`).join("")}${dias.join("")}</div></div>`; }
  const horas = Array.from({ length:24 }, (_, h) => pad(h)), mins = Array.from({ length:12 }, (_, k) => pad(k * 5));
  return `<div class="field cf-dh"><label>${esc(c.rotulo)}${ob}</label><div class="cf-dh-row">
    <div class="cf-dh-dt"><button type="button" class="inp cf-dh-btn ${v ? "" : "ph"}" data-act="cfcal" data-id="${c.id}" aria-expanded="${aberto}">${IC.calendar}<span>${esc(txt)}</span></button>${cal}</div>
    <select class="inp cf-dh-sel" data-cf="${c.id}_h" data-hp="h" aria-label="Hora">${horas.map(h => `<option ${h === hh ? "selected" : ""}>${h}</option>`).join("")}</select><b class="cf-dh-sep">:</b>
    <select class="inp cf-dh-sel" data-cf="${c.id}_h" data-hp="m" aria-label="Minutos">${mins.map(m => `<option ${m === mm ? "selected" : ""}>${m}</option>`).join("")}</select></div></div>`;
}
Object.assign(ACOES_EXTRA, {
  cfcal(el){ const F = formAtual(); if(!F) return; if(F.cal && F.cal.id === el.dataset.id){ F.cal = null; return; } const v = F.v[el.dataset.id], b = v ? new Date(v + "T00:00") : new Date(); F.cal = { id:el.dataset.id, mes:new Date(b.getFullYear(), b.getMonth(), 1) }; },
  cfcalmes(el){ const F = formAtual(); if(!F || !F.cal) return; const m = F.cal.mes; F.cal.mes = new Date(m.getFullYear(), m.getMonth() + +el.dataset.d, 1); },
  cfcaldia(el){ const F = formAtual(); if(!F) return; F.v[el.dataset.id] = el.dataset.v; if(!F.v[el.dataset.id + "_h"]) F.v[el.dataset.id + "_h"] = "09:00"; F.cal = null; }
});

/* ---------- validação e coleta ---------- */
function validarCampos(def, F, acao){
  for(const c of def){
    if(c.tipo === "obs" || c.tipo === "lista" || c.tipo === "data"){ if(c.obrig && !String(F.v[c.id] || "").trim()) return c.tipo === "lista" ? `Selecione: ${c.rotulo}` : `Preencha: ${c.rotulo}`; }
    else if(c.tipo === "simnao"){ if(c.obrig && !F.sn[c.id]) return `Responda: ${c.rotulo}`; }
    else if(c.tipo === "anexo"){ if(c.obrig && !F.anexos.length) return `Anexe o arquivo: ${c.rotulo}`; }
    else if(c.tipo === "assinatura"){ if(c.obrig && !F.sig) return `Falta a ${c.rotulo.toLowerCase()}`; }
    else if(c.tipo === "checklist"){ const e = ckValidar(c, F, acao); if(e) return e; }
    else if(c.tipo === "ckcorr"){ const e = ckCorrValidar(c, F); if(e) return e; }
  }
  return null;
}
function coletarCampos(def, F){
  const o = { obs:"", anexos:[], campos:[] }; let obsTxt = "", principal = "";
  def.forEach(c => {
    const v = String(F.v[c.id] || "").trim();
    if(c.tipo === "obs"){ if(!obsTxt) obsTxt = v; else if(v) o.campos.push({ r:c.rotulo, v }); }
    else if(c.tipo === "data"){ if(v){ const [y, m, d] = v.split("-"); o.agendamento = `${d}/${m}/${y} ${F.v[c.id + "_h"] || "09:00"}`; } }
    else if(c.tipo === "lista"){ if(c.principal && !principal) principal = v; else if(v) o.campos.push({ r:c.rotulo, v }); }
    else if(c.tipo === "simnao"){ const r = F.sn[c.id] || (c.obrig ? "" : "Não"); if(!r) return; const t = (F.snt[c.id] || "").trim();
      o.campos.push({ r:c.rotulo, v:r + (r === "Sim" && t ? ` · ${t}` : "") }); if(r === "Sim" && c.laudo) o.laudo = { engenheiro:t }; }
    else if(c.tipo === "anexo") o.anexos = F.anexos;
    else if(c.tipo === "assinatura"){ if(F.sig) o.assinatura = F.sig; }
    else if(c.tipo === "checklist") o.checklist = ckColetar(c, F);
    else if(c.tipo === "ckcorr") o.checklist = ckCorrColetar(c, F);
  });
  // a lista principal (ex.: motivo da reprova) vai no texto da tarefa; as observações também, se não tiver lista
  if(principal){ o.obs = principal; if(obsTxt) o.campos.unshift({ r:"Observações", v:obsTxt }); } else o.obs = obsTxt;
  if(!o.campos.length) delete o.campos;
  return o;
}
// resumo das respostas extras no histórico da unidade
function camposResumo(L){ return L && L.length ? `<div class="obs cf-res">${L.map(x => `<span><b>${esc(x.r)}:</b> ${esc(x.v)}</span>`).join("")}</div>` : ""; }

/* =====================================================================
   TELA DO ADMIN: Popups de ação
   ===================================================================== */
function abrirPopupsCfg(){
  const G = grupoAcoes();
  const rasc = JSON.parse(JSON.stringify(cfgPopups()));
  // configuração antiga: checklist em Aprovar/Reprovar → passa para Vistoriar (itens com categoria)
  Object.keys(rasc).forEach(k => { const m = /^(.+):(aprovar|reprovar)$/.exec(k), r = rasc[k];
    if(!m || !r || !Array.isArray(r.campos) || !r.campos.some(c => c.tipo === "checklist")) return;
    if(m[2] === "aprovar" && !rasc[m[1] + ":vistoriar"]) rasc[m[1] + ":vistoriar"] = { campos:r.campos };
    r.campos = r.campos.filter(c => c.tipo !== "checklist" && c.tipo !== "assinatura"); if(!r.campos.length) r.campos = [{ id:"obs", tipo:"obs", rotulo:"Observações", obrig:false }]; });
  Object.values(rasc).forEach(r => (r && r.campos || []).forEach(c => { if(c.tipo === "checklist"){ c.itens = ckItens(c); delete c.ckops; } }));
  S.pcfg = { aba:"und", sel:`${G[0].k}:${G[0].acoes[0][0]}`, rasc, sujo:false, add:false, abertos:{ [G[0].k]:true } };
  S.adminPanel = false; S.voltarPcfg = S.obraId ? S.screen : "home"; S.screen = "popups"; S.nav = false; S.popup = null;
}
const rascCampos = key => { const r = S.pcfg.rasc[key]; return r && Array.isArray(r.campos) ? r.campos : null; };
function camposEdit(key){ // garante uma cópia editável no rascunho
  if(!rascCampos(key)) S.pcfg.rasc[key] = { campos:JSON.parse(JSON.stringify(camposPadrao(key))) };
  return S.pcfg.rasc[key].campos;
}
const ehPadrao = key => !rascCampos(key);
function nomeAcaoCfg(key){ const i = key.lastIndexOf(":"), sec = key.slice(0, i), a = key.slice(i + 1), g = todasAcoesCfg().find(x => x.k === sec), ac = g && g.acoes.find(x => x[0] === a);
  return { etapa:g ? g.nome : sec, acao:ac ? ac[1] : a, area:key.startsWith("ac:") }; }

function telaPopups(){
  const P = S.pcfg, G = P.aba === "ac" ? grupoAcoesAC() : grupoAcoes(), key = P.sel, def = rascCampos(key) || camposPadrao(key), nm = nomeAcaoCfg(key);
  const head = `<header class="topbar"><button class="iconbtn" data-act="pcfgvoltar" aria-label="Voltar">${IC.back}</button><h1>Configurar campos das etapas</h1>
    <button class="tb-btn" data-act="pcfgsalvar" ${P.sujo ? "" : "disabled"} title="Salvar para todas as obras">${IC.check}<span>Salvar alterações</span></button></header><div class="topspace"></div>`;
  const lista = G.map(g => { const ab = P.abertos[g.k] || key.startsWith(g.k + ":");
    return `<div class="pc-grp"><button class="pc-gh" data-act="pcfggrp" data-k="${g.k}" aria-expanded="${ab}"><span class="hchev ${ab ? "on" : ""}">${IC.chevD}</span>${esc(g.nome)}</button>
      ${ab ? g.acoes.map(([a, t]) => { const k = `${g.k}:${a}`; return `<button class="pc-it ${k === key ? "on" : ""}" data-act="pcfgsel" data-k="${k}">${esc(t)}${ehPadrao(k) ? "" : `<i class="pc-mod" title="Personalizado"></i>`}</button>`; }).join("") : ""}</div>`; }).join("");
  const conta = t => def.filter(c => c.tipo === t).length;
  const addMenu = P.add ? `<div class="dd-scrim" data-act="pcfgadd"></div><div class="dropdown pc-addmenu" role="menu">${Object.entries(TIPOS_CAMPO).filter(([, m]) => !m.oculto).map(([t, m]) => `<button data-act="pcfgnovo" data-t="${t}" ${conta(t) >= m.max ? "disabled" : ""}><span><b>${m.nome}</b><small>${conta(t) >= m.max ? "Já tem um nesta ação" : m.desc}</small></span></button>`).join("")}</div>` : "";
  const cards = def.map((c, i) => campoEditor(c, i, def.length)).join("") || `<div class="empty" style="padding:24px"><b>Sem campos</b><span>A ação acontece direto ao tocar no botão, sem popup de confirmação.</span></div>`;
  if(!P.prev) P.prev = formVazio();
  return head + `<main class="screen pcfg">
    <aside class="panel pc-side" id="pc-side" data-keep-scroll><div class="seg loc-abas" role="tablist"><button class="${P.aba !== "ac" ? "on" : ""}" role="tab" aria-selected="${P.aba !== "ac"}" data-act="pcfgaba" data-v="und">Unidades</button><button class="${P.aba === "ac" ? "on" : ""}" role="tab" aria-selected="${P.aba === "ac"}" data-act="pcfgaba" data-v="ac">Áreas comuns</button></div>
      <p class="small muted" style="margin:8px 0">Vale para todas as obras. Escolha a ação para editar os campos do popup.</p>${lista}</aside>
    <section class="pc-main"><div class="panel pc-ed" id="pc-ed"><div class="row"><div><div class="small muted">${esc(nm.etapa)}</div><h2 class="h2" style="margin:0">${esc(nm.acao)}</h2></div><span class="spacer"></span>
        ${ehPadrao(key) ? `<span class="pill s-neutral">Padrão</span>` : `<button class="btn sm ghost" data-act="pcfgpadrao">Voltar ao padrão</button>`}</div>
      ${vistCfgHTML(key)}${loteCfgHTML(key, def)}<div class="pc-cards">${cards}</div>
      <div class="dd-wrap" style="align-self:flex-start"><button class="btn primary sm btn-ic" data-act="pcfgadd">${IC.plus}Adicionar campo</button>${addMenu}</div></div>
    <div class="panel pc-prev"><b class="small muted">Pré-visualização</b><div class="pc-box"><div class="mhead"><div class="t"><b class="conf-t">${esc(nm.acao)} · ${esc(nm.etapa)}</b><div class="small muted">${nm.area ? "Salão de Festas" : "Bloco A · AP 101"}</div></div></div>
      <div class="mbody" id="pc-prev-body">${prevHTML(def)}</div></div></div></section></main>`;
}
// etapa com checklist (Vistoriar) ou normal (Aprovar/Reprovar)
function vistCfgHTML(key){
  const i = key.lastIndexOf(":"), pre = key.slice(0, i), a = key.slice(i + 1), g = todasAcoesCfg().find(x => x.k === pre);
  if(!g || !g.podeVist) return "";
  if(a === "vistoriar") return `<div class="pc-vist on"><div><b>Vistoria com checklist</b><div class="small muted">No popup da unidade, Aprovar e Reprovar viram um botão só, <b>Vistoriar</b>. A pessoa marca cada item como Aprovado ou Reprovado (com foto) e decide no fim. Item construtivo/habitabilidade reprovado obriga a reprovar. Na correção, a obra envia a foto de cada item corrigido.</div></div>
    <button class="btn sm ghost" data-act="pcfgvistoff">Voltar para Aprovar / Reprovar</button></div>`;
  if(a === "aprovar" || a === "reprovar") return `<div class="pc-vist"><div><b>Usar checklist nesta etapa?</b><div class="small muted">Troca Aprovar e Reprovar por <b>Vistoriar</b>, com checklist de itens e foto de cada item reprovado.</div></div>
    <button class="btn sm ghost" data-act="pcfgvist">Usar checklist</button></div>`;
  return "";
}
// "Permitir fazer em lote": só nas ações das unidades, e só se o popup tiver apenas Observações
function loteCfgHTML(key, def){
  if(key.startsWith("ac:") || key.endsWith(":agendar") || key.endsWith(":vistoriar")) return "";
  if(exigeFotosCfg(key)) return `<div class="pc-lote off"><label class="sw"><input type="checkbox" disabled><span></span></label><div><b>Permitir fazer em lote</b><div class="small muted">A correção de uma vistoria com checklist pede a foto de cada item corrigido, então é uma unidade por vez.</div></div></div>`;
  const r = S.pcfg.rasc[key], on = r && typeof r.lote === "boolean" ? r.lote : lotePadrao(key), ok = camposSimples(def);
  return `<div class="pc-lote ${ok ? "" : "off"}"><label class="sw"><input type="checkbox" data-lotecfg ${on && ok ? "checked" : ""} ${ok ? "" : "disabled"}><span></span></label>
    <div><b>Permitir fazer em lote</b><div class="small muted">${ok ? "Aparece em Unidades > ⋯ > Ações em lote, para fazer esta ação em várias unidades de uma vez (com uma observação para todas)." : "Só dá para ações que têm apenas Observações. Esta tem outros campos, então fica só uma por vez."}</div></div></div>`;
}
const exigeFotosCfg = key => { const m = /^(.+):corrigir$/.exec(key); return !!m && ckFotoCor(camposVigentes(m[1] + ":vistoriar").find(c => c.tipo === "checklist")); };
function campoEditor(c, i, n){
  const m = TIPOS_CAMPO[c.tipo] || { nome:c.tipo }, base = `data-ci="${i}"`;
  let extra = "";
  if(c.tipo === "lista") extra = `<div class="field"><label>Opções (uma por linha)</label><textarea class="inp" rows="4" ${base} data-cfe="opcoes">${esc((c.opcoes || []).join("\n"))}</textarea></div>
    <label class="chk"><input type="checkbox" ${base} data-cfe="principal" ${c.principal ? "checked" : ""}>Usar como texto principal da tarefa (aparece no histórico, como o motivo da reprova)</label>`;
  if(c.tipo === "simnao") extra = `<div class="field"><label>Pedir um texto quando a resposta for Sim (deixe vazio para não pedir)</label><input class="inp" ${base} data-cfe="textoSim" value="${esc(c.textoSim || "")}" placeholder="Ex.: Nome do engenheiro"></div>
    ${S.pcfg.sel.startsWith("rep_vistoria_cliente:") ? `<label class="chk"><input type="checkbox" ${base} data-cfe="laudo" ${c.laudo ? "checked" : ""}>Quando Sim, criar um laudo pendente (tela Laudos)</label>` : ""}
    <span class="small muted">Obrigatória = a pessoa precisa escolher Sim ou Não. Opcional = já vem marcado Não.</span>`;
  if(c.tipo === "checklist"){ const L = ckItens(c);
    extra = `<div class="field"><label>Itens e categoria</label><div class="ck-ed">${L.map((it, j) => `<div class="ck-ed-row"><input class="inp" ${base} data-cki="${j}" value="${esc(it.t)}" aria-label="Item ${j + 1}">
      <select class="inp" ${base} data-ckcat="${j}" aria-label="Categoria de ${esc(it.t)}"><option value="construtivo" ${it.cat === "construtivo" ? "selected" : ""}>Construtivo/habitabilidade</option><option value="acabamento" ${it.cat === "acabamento" ? "selected" : ""}>Acabamento</option></select>
      <span class="ck-ed-mv"><button class="iconbtn" data-act="pcfgitmov" ${base} data-j="${j}" data-d="-1" aria-label="Subir" ${j ? "" : "disabled"}>${IC.chevU}</button><button class="iconbtn" data-act="pcfgitmov" ${base} data-j="${j}" data-d="1" aria-label="Descer" ${j < L.length - 1 ? "" : "disabled"}>${IC.chevD}</button>
      <button class="iconbtn" data-act="pcfgitdel" ${base} data-j="${j}" aria-label="Remover item" ${L.length <= 1 ? "disabled" : ""}>${IC.trash || IC.close}</button></span></div>`).join("")}
      <button class="btn sm ghost btn-ic" data-act="pcfgitadd" ${base} style="align-self:flex-start">${IC.plus}Novo item</button></div>
      <span class="small muted">Construtivo/habitabilidade reprovado impede aprovar a etapa. Se só itens de acabamento forem reprovados, dá para aprovar mesmo assim (fica registrado).</span></div>
    <label class="chk"><input type="checkbox" ${base} data-cfe="fotoRep" ${c.fotoRep !== false ? "checked" : ""}>Foto obrigatória em cada item reprovado</label>
    <label class="chk"><input type="checkbox" ${base} data-cfe="fotoCor" ${c.fotoCor !== false ? "checked" : ""}>Foto obrigatória na correção de cada item (Pendências corrigidas)</label>
    <span class="small muted">Desmarcado, o botão de foto continua aparecendo, mas é opcional.</span>
    <div class="field"><label>Texto de ajuda (opcional)</label><input class="inp" ${base} data-cfe="ajuda" value="${esc(c.ajuda || "")}"></div>
    <label class="chk"><input type="checkbox" ${base} data-cfe="todos" ${c.todos ? "checked" : ""}>Mostrar o botão "Marcar restantes como aprovado"</label>`; }
  return `<div class="pc-card"><div class="pc-ch"><span class="pc-tipo">${esc(m.nome)}</span><span class="spacer"></span>
      <button class="iconbtn" data-act="pcfgmov" ${base} data-d="-1" aria-label="Subir" ${i ? "" : "disabled"}>${IC.chevU}</button><button class="iconbtn" data-act="pcfgmov" ${base} data-d="1" aria-label="Descer" ${i < n - 1 ? "" : "disabled"}>${IC.chevD}</button>
      ${c.fixo || c.tipo === "checklist" ? "" : `<button class="iconbtn" data-act="pcfgdel" ${base} aria-label="Remover campo">${IC.trash || IC.close}</button>`}</div>${c.fixo ? `<span class="small muted">Campo fixo: é a data em que a vistoria fica agendada.</span>` : ""}
    <div class="row2"><div class="field"><label>${c.tipo === "simnao" ? "Pergunta" : "Título do campo"}</label><input class="inp" ${base} data-cfe="rotulo" value="${esc(c.rotulo)}"></div>
      <label class="chk" style="align-self:end;margin-bottom:9px"><input type="checkbox" ${base} data-cfe="obrig" ${c.obrig ? "checked" : ""} ${c.fixo ? "disabled" : ""}>Obrigatório</label></div>${extra}</div>`;
}

/* ---------- ações (cliques) ---------- */
Object.assign(ACOES_EXTRA, {
  popupscfg(){ if(!can(userByLogin(REAL_USER), "admin")) return; abrirPopupsCfg(); },
  pcfgvoltar(){ if(S.pcfg && S.pcfg.sujo && !S.pcfg.sair){ S.pcfg.sair = true; toast("Aviso", "Há alterações não salvas", "Toque em voltar de novo para sair sem salvar."); return; } S.pcfg = null; S.screen = S.obraId ? (S.voltarPcfg || "unidades") : "home"; },
  pcfggrp(el){ const k = el.dataset.k; S.pcfg.abertos[k] = el.getAttribute("aria-expanded") !== "true"; },
  pcfgaba(el){ const P = S.pcfg; if(P.aba === el.dataset.v) return; P.aba = el.dataset.v; const G = P.aba === "ac" ? grupoAcoesAC() : grupoAcoes(); P.sel = `${G[0].k}:${G[0].acoes[0][0]}`; P.abertos[G[0].k] = true; P.add = false; P.prev = formVazio(); },
  pcfgsel(el){ S.pcfg.sel = el.dataset.k; S.pcfg.add = false; S.pcfg.prev = formVazio(); },
  pcfgadd(){ S.pcfg.add = !S.pcfg.add; },
  pcfgnovo(el){ camposEdit(S.pcfg.sel).push(campoNovo(el.dataset.t)); S.pcfg.add = false; S.pcfg.sujo = true; },
  pcfgdel(el){ camposEdit(S.pcfg.sel).splice(+el.dataset.ci, 1); S.pcfg.sujo = true; },
  pcfgmov(el){ const L = camposEdit(S.pcfg.sel), i = +el.dataset.ci, j = i + +el.dataset.d; if(j < 0 || j >= L.length) return; [L[i], L[j]] = [L[j], L[i]]; S.pcfg.sujo = true; },
  pcfgpadrao(){ const r = S.pcfg.rasc[S.pcfg.sel]; if(r && typeof r.lote === "boolean") S.pcfg.rasc[S.pcfg.sel] = { lote:r.lote }; else delete S.pcfg.rasc[S.pcfg.sel]; S.pcfg.sujo = true; S.pcfg.prev = formVazio(); },
  pcfgitadd(el){ const c = camposEdit(S.pcfg.sel)[+el.dataset.ci]; c.itens = ckItens(c); c.itens.push({ t:"Novo item", cat:"construtivo" }); S.pcfg.sujo = true;
    setTimeout(() => { const L = document.querySelectorAll("[data-cki]"); const u = L[L.length - 1]; if(u){ u.focus(); u.select(); } }, 30); },
  pcfgitdel(el){ const c = camposEdit(S.pcfg.sel)[+el.dataset.ci]; c.itens = ckItens(c); if(c.itens.length <= 1) return; c.itens.splice(+el.dataset.j, 1); S.pcfg.sujo = true; },
  pcfgitmov(el){ const c = camposEdit(S.pcfg.sel)[+el.dataset.ci]; c.itens = ckItens(c); const i = +el.dataset.j, j = i + +el.dataset.d; if(j < 0 || j >= c.itens.length) return; [c.itens[i], c.itens[j]] = [c.itens[j], c.itens[i]]; S.pcfg.sujo = true; },
  pcfgvist(){ const P = S.pcfg, pre = P.sel.slice(0, P.sel.lastIndexOf(":")), k = pre + ":vistoriar";
    const atual = camposVigentes(k); P.rasc[k] = { campos:atual.some(c => c.tipo === "checklist") ? JSON.parse(JSON.stringify(atual)) : [campoNovo("checklist")] };
    P.sel = k; P.sujo = true; P.prev = formVazio(); toast("Aviso", "Esta etapa agora é Vistoriar", "Cadastre os itens do checklist e salve."); },
  pcfgvistoff(){ const P = S.pcfg, pre = P.sel.slice(0, P.sel.lastIndexOf(":")); P.rasc[pre + ":vistoriar"] = { campos:[] }; P.sel = pre + ":aprovar"; P.sujo = true; P.prev = formVazio(); },
  async pcfgsalvar(){
    const R = S.pcfg.rasc, erro = Object.entries(R).map(([k, v]) => { const n = nomeAcaoCfg(k);
      for(const c of v.campos || []){ if(!String(c.rotulo || "").trim()) return `${n.etapa} · ${n.acao}: um campo está sem título`;
        if(c.tipo === "lista" && !(c.opcoes || []).length) return `${n.etapa} · ${n.acao}: a lista "${c.rotulo}" não tem opções`;
        if(c.tipo === "checklist" && !ckItens(c).length) return `${n.etapa} · ${n.acao}: o checklist não tem itens`;
        if(c.tipo === "checklist" && ckItens(c).some(x => !x.t.trim())) return `${n.etapa} · ${n.acao}: tem item do checklist sem nome`; }
      if((v.campos || []).filter(c => c.tipo === "lista" && c.principal).length > 1) return `${n.etapa} · ${n.acao}: só uma lista pode ser o texto principal`;
      return null; }).find(Boolean);
    if(erro){ toast("Erro", "Corrija antes de salvar", erro); return; }
    S.carregando = "Salvando..."; render();
    try{ await API.salvarConfig("popups", JSON.parse(JSON.stringify(R))); S.pcfg.sujo = false; S.pcfg.sair = false; toast("Sucesso", "Popups salvos", "Valem para todas as obras a partir de agora."); }
    catch(e){ toast("Erro", "Não foi possível salvar", msgErro(e)); }
    S.carregando = "";
  },
  // no popup de ação / agenda
  cfsim(el){ const F = formAtual(); if(F) F.sn[el.dataset.id] = el.dataset.v; },
  ckset(el){ const F = formAtual(); if(!F) return; const id = el.dataset.id; (F.ck[id] = F.ck[id] || {})[+el.dataset.i] = el.dataset.v; },
  ckall(el){ const F = formAtual(); if(!F) return; const c = defAtual().find(x => x.id === el.dataset.id); if(!c) return; const ck = F.ck[c.id] = F.ck[c.id] || {}; ckItensForm(c, F).forEach((x, i) => { if(!x.h && !ck[i]) ck[i] = "ok"; }); },
  siglimpar(){ const F = formAtual(); if(F) F.sig = ""; },
  anxdel(el){ const F = formAtual(); if(F) F.anexos.splice(+el.dataset.i, 1); }
});
const defAtual = () => S.conf ? S.conf.def : S.ag ? S.ag.def : [];

/* ---------- digitação/troca nos campos ---------- */
INPUT_EXTRA.push(t => {
  if(t.dataset.hp){ const F = formAtual(); if(F){ const [h, m] = (F.v[t.dataset.cf] || "09:00").split(":"); F.v[t.dataset.cf] = t.dataset.hp === "h" ? `${t.value}:${m}` : `${h}:${t.value}`; return true; } }
  if(t.dataset.cf != null){ const F = formAtual(); if(F){ F.v[t.dataset.cf] = t.value; return true; } }
  if(t.dataset.cft != null){ const F = formAtual(); if(F){ F.snt[t.dataset.cft] = t.value; return true; } }
  if(S.pcfg && t.hasAttribute("data-lotecfg")){ if(t.type === "checkbox"){ const k = S.pcfg.sel; S.pcfg.rasc[k] = { ...(S.pcfg.rasc[k] || {}), lote:t.checked }; S.pcfg.sujo = true; S.pcfg.sair = false; } return "render"; }
  if(S.pcfg && t.dataset.ci != null){
    const c = camposEdit(S.pcfg.sel)[+t.dataset.ci]; if(!c) return true; const f = t.dataset.cfe;
    if(f === "rotulo" || f === "textoSim" || f === "ajuda") c[f] = t.value;
    else if(f === "opcoes" || f === "itens") c[f] = t.value.split("\n").map(s => s.trim()).filter(Boolean);
    else if(f === "obrig" || f === "principal" || f === "laudo" || f === "todos" || f === "fotoRep" || f === "fotoCor"){ c[f] = t.checked; if(f === "principal" && t.checked) camposEdit(S.pcfg.sel).forEach(x => { if(x !== c && x.tipo === "lista") x.principal = false; }); }
    else if(t.dataset.cki != null){ c.itens = ckItens(c); c.itens[+t.dataset.cki].t = t.value; }
    else if(t.dataset.ckcat != null){ c.itens = ckItens(c); c.itens[+t.dataset.ckcat].cat = t.value; }
    S.pcfg.sujo = true; S.pcfg.sair = false;
    // caixas e listas redesenham a tela; nos textos só atualiza a prévia (não perde o cursor nem o clique seguinte)
    if(t.type === "checkbox" || t.tagName === "SELECT") return "render";
    atualizarPrevPcfg(); return true;
  }
  return false;
});
function atualizarPrevPcfg(){
  const b = document.querySelector("[data-act=pcfgsalvar]"); if(b) b.disabled = false;
  const box = document.getElementById("pc-prev-body"); if(!box) return;
  const def = rascCampos(S.pcfg.sel) || camposPadrao(S.pcfg.sel);
  box.innerHTML = prevHTML(def);
}
const prevHTML = def => camposHTML(def, S.pcfg.prev || formVazio(), "prev").replace(/data-act="[^"]*"/g, "").replace(/ id="(sig|conf-file|cf-[^"]*)"/g, "") || `<span class="small muted">Sem campos: a ação acontece direto, sem este popup.</span>`;
