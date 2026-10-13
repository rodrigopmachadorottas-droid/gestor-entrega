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
  checklist:  { nome:"Checklist de itens", desc:"Cada item recebe uma das opções",       max:1 },
  data:       { nome:"Data", desc:"", max:1, oculto:true }   // agendar vistoria do síndico (fixo)
};
const CK_PADRAO = () => [{ id:"ok", rotulo:"Aprovado", tipo:"ok" }, { id:"construtivo", rotulo:"Construtivo", tipo:"problema" }, { id:"acabamento", rotulo:"Acabamento", tipo:"problema" }];
const NOME_ACAO = { liberar:"Liberar", cancelar:"Cancelar", aprovar:"Aprovar", reprovar:"Reprovar", corrigir:"Pendências corrigidas", finalizar:"Finalizar unidade", aprovarDireto:"Aprovar direto", agendar:"Agendar vistoria" };

// todas as ações configuráveis, agrupadas pela etapa (na ordem do fluxo)
// áreas comuns: chave "ac:<etapa>:<ação>"
function grupoAcoesAC(){
  const v = [["aprovar","Aprovar"],["reprovar","Reprovar"],["corrigir","Pendências corrigidas"]];
  return [{ k:"ac:lib", nome:"Liberação Local", acoes:[["liberar","Liberar local"],["cancelar","Cancelar liberação"]] },
    { k:"ac:rep_vistoria_qualidade", nome:"Vistoria Qualidade", acoes:v },
    { k:"ac:rep_vistoria_arq", nome:"Vistoria Arquitetura", acoes:v },
    { k:"ac:agendamento", nome:"Agendamento com Síndico", acoes:[["agendar","Agendar vistoria"],["cancelar","Cancelar agendamento"]] },
    { k:"ac:rep_vistoria_sindico", nome:"Vistoria do Síndico", acoes:v }];
}
const todasAcoesCfg = () => [...grupoAcoes(), ...grupoAcoesAC()];
function grupoAcoes(){
  const G = TESTES.map(t => ({ k:t.col, nome:t.nome, acoes:[["liberar","Liberar teste"],["cancelar","Cancelar liberação"],["aprovar","Aprovar"],["reprovar","Reprovar"],["corrigir","Pendências corrigidas"]] }));
  G.push({ k:"finalizando", nome:"Finalizando Unidade", acoes:[["finalizar","Finalizar unidade"],["aprovarDireto","Aprovar direto"],["cancelar","Cancelar finalização"]] });
  G.push({ k:"rep_vistoria_at", nome:"Vistoria Qualidade", acoes:[["aprovar","Aprovar"],["reprovar","Reprovar"],["corrigir","Pendências corrigidas"]] });
  G.push({ k:"rep_vistoria_previa", nome:"Vistoria Prévia", acoes:[["aprovar","Aprovar"],["reprovar","Reprovar"],["corrigir","Pendências corrigidas"]] });
  G.push({ k:"agendamento", nome:"Agendamento com Cliente", acoes:[["agendar","Agendar vistoria"],["cancelar","Cancelar agendamento"]] });
  G.push({ k:"rep_vistoria_cliente", nome:"Vistoria do Cliente", acoes:[["aprovar","Aprovar"],["reprovar","Reprovar"],["corrigir","Pendências corrigidas"]] });
  return G;
}
const novoIdCampo = () => "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
function campoNovo(tipo){
  const c = { id:novoIdCampo(), tipo, rotulo:TIPOS_CAMPO[tipo].nome, obrig:false };
  if(tipo === "lista") Object.assign(c, { rotulo:"Escolha uma opção", opcoes:["Opção 1","Opção 2"], principal:false });
  if(tipo === "simnao") Object.assign(c, { rotulo:"Pergunta?", textoSim:"", laudo:false });
  if(tipo === "anexo") c.rotulo = "Anexos";
  if(tipo === "assinatura") Object.assign(c, { rotulo:"Assinatura do cliente", obrig:true });
  if(tipo === "checklist") Object.assign(c, { rotulo:"Checklist", obrig:true, itens:["Item 1"], ckops:CK_PADRAO(), todos:true, ajuda:"" });
  return c;
}
// padrão de fábrica de cada ação (o que o app fazia antes da configuração)
function camposPadrao(key){
  if(key.startsWith("ac:")) return camposArea(key.split(":")[2]);
  const [sec, a] = key.split(":"), obs = () => ({ id:"obs", tipo:"obs", rotulo:"Observações", obrig:false });
  const teste = TESTES.find(t => t.col === sec);
  if(teste){
    if(a === "reprovar" && MOTIVOS[teste.k]) return [{ id:"motivo", tipo:"lista", rotulo:"Motivo da reprova", obrig:true, opcoes:[...MOTIVOS[teste.k]], principal:true }];
    if(a === "aprovar" && teste.k === "gas") return [obs(), { id:"anexo", tipo:"anexo", rotulo:"Anexos", obrig:false }];
    return [obs()];
  }
  const ck = () => ({ id:"checklist", tipo:"checklist", rotulo:"Checklist da vistoria", obrig:true, itens:[...CHECKLIST_QUALIDADE], ckops:CK_PADRAO(), todos:true,
    ajuda:"Construtivo afeta a moradia do cliente; Acabamento é ajuste estético." });
  if(sec === "rep_vistoria_at" && (a === "aprovar" || a === "reprovar")) return [ck()];
  if(sec === "rep_vistoria_cliente" && (a === "aprovar" || a === "reprovar")) return [ck(),
    { id:"assinatura", tipo:"assinatura", rotulo:"Assinatura do cliente", obrig:true },
    { id:"eng", tipo:"simnao", rotulo:"O cliente veio com engenheiro ou responsável técnico?", obrig:false, textoSim:"Nome do engenheiro (opcional)", laudo:true }];
  return [obs()];
}
const cfgPopups = () => (DB.config && DB.config.popups) || {};
const camposDe = key => { const c = cfgPopups()[key]; return c && Array.isArray(c.campos) ? c.campos : camposPadrao(key); };
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
    if(c.tipo === "checklist"){ const ck = F.ck[c.id] || {}, ops = c.ckops || CK_PADRAO(), feitos = (c.itens || []).filter((_, i) => ck[i]).length, ok = ops.find(o => o.tipo === "ok");
      return `<div class="field"><div class="row"><b>${esc(c.rotulo)}${ob}</b><span class="spacer"></span>${c.todos && ok ? `<button class="btn sm" data-act="ckall" data-id="${c.id}">Marcar restantes como ${esc(ok.rotulo.toLowerCase())}</button>` : ""}</div>
        ${c.ajuda ? `<span class="small muted">${esc(c.ajuda)}</span>` : ""}
        <div class="cklist">${(c.itens || []).map((it, i) => `<div class="ckrow"><span>${esc(it)}</span><div class="seg ck" role="group" aria-label="${esc(it)}">${ops.map((o, j) => `<button class="${ck[i] === o.id ? "on " + ckCls(o, ops) : ""}" data-act="ckset" data-id="${c.id}" data-i="${i}" data-v="${esc(o.id)}">${esc(o.rotulo)}</button>`).join("")}</div></div>`).join("")}</div>
        <span class="small muted tnum">${feitos} de ${(c.itens || []).length} itens marcados</span></div>`; }
    return "";
  }).join("");
}
// cor do botão marcado: opção "ok" verde; problemas alternam vermelho/laranja
function ckCls(o, ops){ if(o.tipo === "ok") return "ck-ok"; const k = ops.filter(x => x.tipo !== "ok").indexOf(o); return k % 2 ? "ck-acabamento" : "ck-construtivo"; }

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
    else if(c.tipo === "checklist"){ const ck = F.ck[c.id] || {}, ops = c.ckops || CK_PADRAO(), n = (c.itens || []).length;
      if(acao === "reprovar"){ const prob = new Set(ops.filter(o => o.tipo !== "ok").map(o => o.id));
        if(c.obrig && prob.size && !Object.values(ck).some(v => prob.has(v))) return `Marque pelo menos um item com problema (${ops.filter(o => o.tipo !== "ok").map(o => o.rotulo).join(" ou ")})`; }
      else if(c.obrig && (c.itens || []).some((_, i) => !ck[i])) return `Marque todos os itens: ${c.rotulo}`;
      if(!n) continue; }
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
    else if(c.tipo === "checklist"){ const ck = F.ck[c.id] || {}, ops = c.ckops || CK_PADRAO(), ok = ops.find(x => x.tipo === "ok") || ops[0];
      o.checklist = (c.itens || []).map((item, i) => { const op = ops.find(x => x.id === ck[i]) || ok; return { item, r:op.id, rl:op.rotulo, p:op.tipo !== "ok" }; }); }
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
  S.pcfg = { aba:"und", sel:`${G[0].k}:${G[0].acoes[0][0]}`, rasc:JSON.parse(JSON.stringify(cfgPopups())), sujo:false, add:false, abertos:{ [G[0].k]:true } };
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
  const cards = def.map((c, i) => campoEditor(c, i, def.length)).join("") || `<div class="empty" style="padding:24px"><b>Sem campos</b><span>O popup só vai pedir a confirmação.</span></div>`;
  if(!P.prev) P.prev = formVazio();
  return head + `<main class="screen pcfg">
    <aside class="panel pc-side" id="pc-side" data-keep-scroll><div class="seg loc-abas" role="tablist"><button class="${P.aba !== "ac" ? "on" : ""}" role="tab" aria-selected="${P.aba !== "ac"}" data-act="pcfgaba" data-v="und">Unidades</button><button class="${P.aba === "ac" ? "on" : ""}" role="tab" aria-selected="${P.aba === "ac"}" data-act="pcfgaba" data-v="ac">Áreas comuns</button></div>
      <p class="small muted" style="margin:8px 0">Vale para todas as obras. Escolha a ação para editar os campos do popup.</p>${lista}</aside>
    <section class="pc-main"><div class="panel pc-ed" id="pc-ed"><div class="row"><div><div class="small muted">${esc(nm.etapa)}</div><h2 class="h2" style="margin:0">${esc(nm.acao)}</h2></div><span class="spacer"></span>
        ${ehPadrao(key) ? `<span class="pill s-neutral">Padrão</span>` : `<button class="btn sm ghost" data-act="pcfgpadrao">Voltar ao padrão</button>`}</div>
      <div class="pc-cards">${cards}</div>
      <div class="dd-wrap" style="align-self:flex-start"><button class="btn primary sm btn-ic" data-act="pcfgadd">${IC.plus}Adicionar campo</button>${addMenu}</div></div>
    <div class="panel pc-prev"><b class="small muted">Pré-visualização</b><div class="pc-box"><div class="mhead"><div class="t"><b class="conf-t">${esc(nm.acao)} · ${esc(nm.etapa)}</b><div class="small muted">${nm.area ? "Salão de Festas" : "Bloco A · AP 101"}</div></div></div>
      <div class="mbody" id="pc-prev-body">${prevHTML(def)}</div></div></div></section></main>`;
}
function campoEditor(c, i, n){
  const m = TIPOS_CAMPO[c.tipo] || { nome:c.tipo }, base = `data-ci="${i}"`;
  let extra = "";
  if(c.tipo === "lista") extra = `<div class="field"><label>Opções (uma por linha)</label><textarea class="inp" rows="4" ${base} data-cfe="opcoes">${esc((c.opcoes || []).join("\n"))}</textarea></div>
    <label class="chk"><input type="checkbox" ${base} data-cfe="principal" ${c.principal ? "checked" : ""}>Usar como texto principal da tarefa (aparece no histórico, como o motivo da reprova)</label>`;
  if(c.tipo === "simnao") extra = `<div class="field"><label>Pedir um texto quando a resposta for Sim (deixe vazio para não pedir)</label><input class="inp" ${base} data-cfe="textoSim" value="${esc(c.textoSim || "")}" placeholder="Ex.: Nome do engenheiro"></div>
    ${S.pcfg.sel.startsWith("rep_vistoria_cliente:") ? `<label class="chk"><input type="checkbox" ${base} data-cfe="laudo" ${c.laudo ? "checked" : ""}>Quando Sim, criar um laudo pendente (tela Laudos)</label>` : ""}
    <span class="small muted">Obrigatória = a pessoa precisa escolher Sim ou Não. Opcional = já vem marcado Não.</span>`;
  if(c.tipo === "checklist"){ const ops = c.ckops || CK_PADRAO();
    extra = `<div class="field"><label>Itens (um por linha)</label><textarea class="inp" rows="6" ${base} data-cfe="itens">${esc((c.itens || []).join("\n"))}</textarea></div>
    <div class="field"><label>Opções de cada item</label><div class="pc-ops">${ops.map((o, j) => `<div class="pc-op"><input class="inp" ${base} data-cko="${j}" value="${esc(o.rotulo)}" aria-label="Nome da opção">
      <select class="inp" ${base} data-ckt="${j}" aria-label="Tipo da opção"><option value="ok" ${o.tipo === "ok" ? "selected" : ""}>Conta como aprovado</option><option value="problema" ${o.tipo !== "ok" ? "selected" : ""}>Conta como problema</option></select>
      <button class="iconbtn" data-act="pcfgopdel" ${base} data-j="${j}" aria-label="Remover opção" ${ops.length <= 2 ? "disabled" : ""}>${IC.close}</button></div>`).join("")}
      <button class="btn sm ghost btn-ic" data-act="pcfgopadd" ${base} style="align-self:flex-start">${IC.plus}Nova opção</button></div>
      <span class="small muted">Ao aprovar, todos os itens precisam ser marcados; ao reprovar, pelo menos um item precisa ter uma opção de problema.</span></div>
    <div class="field"><label>Texto de ajuda (opcional)</label><input class="inp" ${base} data-cfe="ajuda" value="${esc(c.ajuda || "")}"></div>
    <label class="chk"><input type="checkbox" ${base} data-cfe="todos" ${c.todos ? "checked" : ""}>Mostrar o botão "Marcar restantes como aprovado"</label>`; }
  return `<div class="pc-card"><div class="pc-ch"><span class="pc-tipo">${esc(m.nome)}</span><span class="spacer"></span>
      <button class="iconbtn" data-act="pcfgmov" ${base} data-d="-1" aria-label="Subir" ${i ? "" : "disabled"}>${IC.chevU}</button><button class="iconbtn" data-act="pcfgmov" ${base} data-d="1" aria-label="Descer" ${i < n - 1 ? "" : "disabled"}>${IC.chevD}</button>
      ${c.fixo ? "" : `<button class="iconbtn" data-act="pcfgdel" ${base} aria-label="Remover campo">${IC.trash || IC.close}</button>`}</div>${c.fixo ? `<span class="small muted">Campo fixo: é a data em que a vistoria fica agendada.</span>` : ""}
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
  pcfgpadrao(){ delete S.pcfg.rasc[S.pcfg.sel]; S.pcfg.sujo = true; S.pcfg.prev = formVazio(); },
  pcfgopadd(el){ const c = camposEdit(S.pcfg.sel)[+el.dataset.ci]; c.ckops = c.ckops || CK_PADRAO(); c.ckops.push({ id:"op" + Date.now().toString(36), rotulo:"Nova opção", tipo:"problema" }); S.pcfg.sujo = true; },
  pcfgopdel(el){ const c = camposEdit(S.pcfg.sel)[+el.dataset.ci]; if(c.ckops.length <= 2) return; c.ckops.splice(+el.dataset.j, 1); if(!c.ckops.some(o => o.tipo === "ok")) c.ckops[0].tipo = "ok"; S.pcfg.sujo = true; },
  async pcfgsalvar(){
    const R = S.pcfg.rasc, erro = Object.entries(R).map(([k, v]) => { const n = nomeAcaoCfg(k);
      for(const c of v.campos){ if(!String(c.rotulo || "").trim()) return `${n.etapa} · ${n.acao}: um campo está sem título`;
        if(c.tipo === "lista" && !(c.opcoes || []).length) return `${n.etapa} · ${n.acao}: a lista "${c.rotulo}" não tem opções`;
        if(c.tipo === "checklist" && !(c.itens || []).length) return `${n.etapa} · ${n.acao}: o checklist não tem itens`;
        if(c.tipo === "checklist" && !(c.ckops || []).some(o => o.tipo === "ok")) return `${n.etapa} · ${n.acao}: o checklist precisa de uma opção que conta como aprovado`; }
      if(v.campos.filter(c => c.tipo === "lista" && c.principal).length > 1) return `${n.etapa} · ${n.acao}: só uma lista pode ser o texto principal`;
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
  ckall(el){ const F = formAtual(); if(!F) return; const c = defAtual().find(x => x.id === el.dataset.id); if(!c) return; const ok = (c.ckops || CK_PADRAO()).find(o => o.tipo === "ok"); const ck = F.ck[c.id] = F.ck[c.id] || {}; (c.itens || []).forEach((_, i) => { if(!ck[i]) ck[i] = ok.id; }); },
  siglimpar(){ const F = formAtual(); if(F) F.sig = ""; },
  anxdel(el){ const F = formAtual(); if(F) F.anexos.splice(+el.dataset.i, 1); }
});
const defAtual = () => S.conf ? S.conf.def : S.ag ? S.ag.def : [];

/* ---------- digitação/troca nos campos ---------- */
INPUT_EXTRA.push(t => {
  if(t.dataset.hp){ const F = formAtual(); if(F){ const [h, m] = (F.v[t.dataset.cf] || "09:00").split(":"); F.v[t.dataset.cf] = t.dataset.hp === "h" ? `${t.value}:${m}` : `${h}:${t.value}`; return true; } }
  if(t.dataset.cf != null){ const F = formAtual(); if(F){ F.v[t.dataset.cf] = t.value; return true; } }
  if(t.dataset.cft != null){ const F = formAtual(); if(F){ F.snt[t.dataset.cft] = t.value; return true; } }
  if(S.pcfg && t.dataset.ci != null){
    const c = camposEdit(S.pcfg.sel)[+t.dataset.ci]; if(!c) return true; const f = t.dataset.cfe;
    if(f === "rotulo" || f === "textoSim" || f === "ajuda") c[f] = t.value;
    else if(f === "opcoes" || f === "itens") c[f] = t.value.split("\n").map(s => s.trim()).filter(Boolean);
    else if(f === "obrig" || f === "principal" || f === "laudo" || f === "todos"){ c[f] = t.checked; if(f === "principal" && t.checked) camposEdit(S.pcfg.sel).forEach(x => { if(x !== c && x.tipo === "lista") x.principal = false; }); }
    else if(t.dataset.cko != null) c.ckops[+t.dataset.cko].rotulo = t.value;
    else if(t.dataset.ckt != null){ c.ckops[+t.dataset.ckt].tipo = t.value; if(!c.ckops.some(o => o.tipo === "ok")) c.ckops[0].tipo = "ok"; }
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
const prevHTML = def => camposHTML(def, S.pcfg.prev || formVazio(), "prev").replace(/data-act="[^"]*"/g, "").replace(/ id="(sig|conf-file|cf-[^"]*)"/g, "") || `<span class="small muted">Sem campos: só o botão de confirmar.</span>`;
