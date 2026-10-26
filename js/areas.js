/* =====================================================================
   ÁREAS COMUNS POR TIPO
   geral (salão, piscina...), hall (bloco + pavimento), cobertura e entorno
   (bloco). Hall/cobertura/entorno só passam por Liberação, Vistoria
   Qualidade e Correções; Arquitetura e Síndico ficam N/A.
   O nome é gerado: "Bloco A · 3° Pav · Hall", "Bloco A · Cobertura".
   ===================================================================== */
const TIPOS_AREA = { geral:"Geral", hall:"Hall", cobertura:"Cobertura", entorno:"Entorno" };
const tipoArea = a => (a && a.tipo) || "geral";
const areaDeBloco = a => tipoArea(a) !== "geral";
const AC_NA = ["rep_vistoria_arq", "agendamento", "rep_vistoria_sindico"];
const naArea = (a, col) => areaDeBloco(a) && AC_NA.includes(col);
const pavCurto = n => String(n || "").replace(/ Pavimento$/, " Pav");
function nomeAutoArea(a){
  const l = localById(a.nivel_1), t = tipoArea(a); if(!l || t === "geral") return a.descricao;
  const pav = t === "hall" ? pavCurto((l.niveis2 || "").split(", ")[(a.nivel_2 || 0) - 1]) : "";
  return [l.nivel1, pav, TIPOS_AREA[t]].filter(Boolean).join(" · ");
}
const ORD_TIPO = { hall:0, cobertura:1, entorno:2 };
// blocos primeiro (bloco > pavimento > tipo), depois as áreas gerais em ordem alfabética
function ordenarAreas(L){
  return L.sort((a, b) => { const ga = areaDeBloco(a), gb = areaDeBloco(b); if(ga !== gb) return ga ? -1 : 1;
    if(!ga) return a.descricao.localeCompare(b.descricao);
    return nivel1Nome(a).localeCompare(nivel1Nome(b), undefined, { numeric:true }) || ORD_TIPO[tipoArea(a)] - ORD_TIPO[tipoArea(b)] || (a.nivel_2 || 0) - (b.nivel_2 || 0); });
}
// grupo da área (para a divisória e o filtro): nome do bloco, ou "Áreas gerais"
const GRUPO_GERAL = "Áreas gerais";
const grupoArea = a => areaDeBloco(a) ? nivel1Nome(a) : GRUPO_GERAL;
const passaFiltroArea = a => !(S.acFil || []).length || S.acFil.includes(grupoArea(a));
function gruposAreas(){ const L = ordenarAreas(DB.areas.filter(a => a.id_obra === S.obraId)); return [...new Set(L.map(grupoArea))]; }
// filtro igual ao da tela Unidades (ícone no cabeçalho → painel com os blocos)
function drawerAreas(){
  if(!S.drawer) return "";
  const sel = S.acFil || [], G = gruposAreas(), txt = sel.length ? sel.join(", ") : "Selecione", casa = OBRA().config.tipo === "casa";
  return drawerShell(`<div class="fsec"><b class="flbl">${casa ? "Quadras" : "Blocos"}</b><div class="dd2"><button class="dd2-btn ${sel.length ? "" : "ph"}" data-act="ddbloco" aria-expanded="${!!S.ddBloco}"><span>${esc(txt)}</span>${IC.chevD}</button>
    ${S.ddBloco ? `<div class="dd2-list">${G.map(b => `<button data-act="acfilbloco" data-b="${esc(b)}" class="fck-row"><span class="fck ${sel.includes(b) ? "on" : ""}">${IC.check}</span>${esc(b)}</button>`).join("")}</div>` : ""}</div></div>`, "aclimpar");
}
/* ---------- cadastro (tela Obra > Áreas comuns) ---------- */
function modalArea(){
  const M = S.loc.modal, a = M.id ? DB.areas.find(z => z.id === M.id) : null, adm = can(ME(), "admin"), podeExcluir = a && (a.sub_etapa === 1 || adm);
  if(!M.f) M.f = { tipo:tipoArea(a), bloco:a && a.nivel_1 ? a.nivel_1 : "", pav:a && a.nivel_2 ? a.nivel_2 : "", nome:a && !areaDeBloco(a) ? a.descricao : "" };
  const F = M.f, casa = OBRA().config.tipo === "casa", trava = a && a.sub_etapa !== 1 && !adm;
  const locs = DB.locais.filter(l => l.id_obra === S.obraId).sort((x, y) => x.nivel1.localeCompare(y.nivel1, undefined, { numeric:true }));
  if(F.bloco === "todos" && F.tipo === "hall") F.pav = "todos";
  const loc = localById(+F.bloco), pavs = loc && loc.niveis2 ? loc.niveis2.split(", ").filter(Boolean) : [];
  const lote = F.tipo !== "geral" && (F.bloco === "todos" || F.pav === "todos"), nLote = lote ? areasEmLote(F).length : 0;
  const prev = F.tipo === "geral" ? "" : nomeAutoArea({ tipo:F.tipo, nivel_1:+F.bloco, nivel_2:+F.pav });
  const tipos = Object.entries(TIPOS_AREA).filter(([k]) => k !== "hall" || !casa);
  return `<div class="modal" role="dialog" aria-modal="true"><div class="scrim" data-act="locfechar"></div><div class="box sm"><div class="mhead"><b class="t h2">${a ? "Editar área comum" : "Adicionar área comum"}</b><button class="iconbtn" data-act="locfechar" aria-label="Fechar">${IC.close}</button></div>
    <div class="mbody"><div class="field"><label>Tipo</label><div class="seg ac-tipo">${tipos.map(([k, t]) => `<button class="${F.tipo === k ? "on" : ""}" data-act="actipo" data-v="${k}" ${trava ? "disabled" : ""}>${t}</button>`).join("")}</div>
      ${trava ? `<span class="small muted">O tipo só muda enquanto a área está na Liberação Local.</span>` : ""}</div>
    ${F.tipo === "geral" ? `<div class="field"><label for="ac-nome">Nome da área comum</label><input class="inp" id="ac-nome" data-acf="nome" value="${esc(F.nome)}" placeholder="Ex.: Salão de Festas"></div>`
      : `<div class="row2"><div class="field"><label for="ac-bl">${casa ? "Quadra" : "Bloco"}</label><select class="inp" id="ac-bl" data-acf="bloco"><option value="">Selecione</option>${a ? "" : `<option value="todos" ${F.bloco === "todos" ? "selected" : ""}>Todos os ${casa ? "quadras" : "blocos"}</option>`}${locs.map(l => `<option value="${l.id}" ${+F.bloco === l.id ? "selected" : ""}>${esc(l.nivel1)}</option>`).join("")}</select></div>
        ${F.tipo === "hall" ? `<div class="field"><label for="ac-pav">Pavimento</label><select class="inp" id="ac-pav" data-acf="pav" ${pavs.length || F.bloco === "todos" ? "" : "disabled"}><option value="">Selecione</option>${a ? "" : `<option value="todos" ${F.pav === "todos" ? "selected" : ""}>Todos os pavimentos</option>`}${pavs.map((p, i) => `<option value="${i + 1}" ${+F.pav === i + 1 ? "selected" : ""}>${esc(p)}</option>`).join("")}</select></div>` : ""}</div>
      <div class="small muted">${lote ? `Vai criar <b>${nLote} ${TIPOS_AREA[F.tipo].toLowerCase()}${nLote === 1 ? "" : "s"}</b>${nLote ? `: ${esc(areasEmLote(F).slice(0, 3).map(x => x.descricao).join(", "))}${nLote > 3 ? "..." : ""}` : " (todos já existem)"}` : `Nome: <b>${prev && F.bloco && (F.tipo !== "hall" || F.pav) ? esc(prev) : "escolha o " + (casa ? "quadra" : "bloco") + (F.tipo === "hall" ? " e o pavimento" : "")}</b>`}</div>
      <span class="small muted">${TIPOS_AREA[F.tipo]} passa só por Liberação Local, Vistoria Qualidade e Correções de Obra. Vistoria Arquitetura e Síndico ficam N/A.</span>`}
    ${a && !podeExcluir ? `<span class="small muted">Só dá para excluir áreas comuns que ainda estão na Liberação Local.</span>` : ""}
    ${a && adm && a.sub_etapa !== 1 && M.del ? `<div class="aviso-box forte">Esta área já está em <b>${esc(ETAPA_AC[a.sub_etapa].n)}</b>. O histórico dela some das telas. Não dá para desfazer.</div>` : ""}</div>
    <div class="mfoot">${podeExcluir ? `<button class="btn ${M.del ? "bad" : "ghost"}" data-act="acdel">${M.del ? "Confirmar exclusão" : "Excluir"}</button><span class="spacer"></span>` : ""}<button class="btn ghost" data-act="locfechar">Cancelar</button><button class="btn primary" data-act="acsalvar">Salvar</button></div></div></div>`;
}
// cadastro rápido: o tipo em todos os pavimentos (hall) e/ou todos os blocos; pula o que já existe
function areasEmLote(F){
  const locs = F.bloco === "todos" ? DB.locais.filter(l => l.id_obra === S.obraId) : [localById(+F.bloco)].filter(Boolean), out = [];
  locs.forEach(l => { const pavs = F.tipo === "hall" ? (F.pav === "todos" ? (l.niveis2 || "").split(", ").filter(Boolean).map((_, i) => i + 1) : [+F.pav].filter(Boolean)) : [null];
    pavs.forEach(p => { const n = { tipo:F.tipo, nivel_1:l.id, nivel_2:p }; n.descricao = nomeAutoArea(n);
      if(!DB.areas.some(x => x.id_obra === S.obraId && x.descricao.toLowerCase() === n.descricao.toLowerCase())) out.push(n); }); });
  return ordenarAreas(out);
}
function salvarArea(){
  const M = S.loc.modal, F = M.f, a = M.id ? DB.areas.find(z => z.id === M.id) : null;
  if(!a && F.tipo !== "geral" && (F.bloco === "todos" || F.pav === "todos")){
    const L = areasEmLote(F); if(!L.length){ toast("Aviso", "Nada para criar", "Todos já estão cadastrados."); return; }
    L.forEach(n => DB.areas.push({ id:nextId("areas"), id_obra:S.obraId, ...n, sub_etapa:1, rep_vistoria_qualidade:"", rep_vistoria_arq:"", agendamento:"", rep_vistoria_sindico:"" }));
    saveDB(); S.loc.modal = null; toast("Sucesso", `${L.length} área(s) comum(ns) criada(s)`, L.length > 1 ? `${L[0].descricao} ... ${L.at(-1).descricao}` : L[0].descricao); return; }
  const novo = { tipo:F.tipo, nivel_1:F.tipo === "geral" ? null : +F.bloco || null, nivel_2:F.tipo === "hall" ? +F.pav || null : null };
  if(F.tipo === "geral"){ novo.descricao = (F.nome || "").trim(); if(!novo.descricao){ toast("Erro", "Informe o nome da área comum"); return; } }
  else { if(!novo.nivel_1){ toast("Erro", "Escolha o bloco"); return; } if(F.tipo === "hall" && !novo.nivel_2){ toast("Erro", "Escolha o pavimento do hall"); return; } novo.descricao = nomeAutoArea(novo); }
  if(DB.areas.some(x => x.id_obra === S.obraId && x !== a && x.descricao.toLowerCase() === novo.descricao.toLowerCase())){ toast("Erro", "Já existe uma área comum com esse nome", novo.descricao); return; }
  if(a) Object.assign(a, novo);
  else DB.areas.push({ id:nextId("areas"), id_obra:S.obraId, ...novo, sub_etapa:1, rep_vistoria_qualidade:"", rep_vistoria_arq:"", agendamento:"", rep_vistoria_sindico:"" });
  saveDB(); S.loc.modal = null; toast("Sucesso", "Área comum salva", novo.descricao);
}
// bloco renomeado/pavimentos mudados: atualiza o nome das áreas dele
function renomearAreasDoBloco(lid){ DB.areas.forEach(a => { if(a.nivel_1 === lid && areaDeBloco(a)){ const n = nomeAutoArea(a); if(n !== a.descricao) a.descricao = n; } }); }

/* ---------- indicadores (Visão Unidades, só em "Etapa atual (todas)") ---------- */
const AC_COR_ETAPA = { 1:1, 2:4, 3:41, 4:5, 5:6, 6:7, 7:11 };
const corArea = a => rgba(COR_ETAPA[AC_COR_ETAPA[a.sub_etapa]] || RGB.neutral, .55);
const tileArea = (a, txt, larga) => `<button class="tile tile-ac${larga ? " larga" : ""}" style="background:${corArea(a)};border:0${larga ? ";grid-column:1/-1" : ""}" data-act="abrirac" data-id="${a.id}" title="${esc(a.descricao)}: ${esc((ETAPA_AC[a.sub_etapa] || {}).n || "")}">${esc(txt)}</button>`;
// linhas do bloco com o hall no fim do seu pavimento; cobertura em cima e entorno embaixo (largura toda)
function linhasBlocoComAreas(ub, b){
  const ac = DB.areas.filter(a => a.id_obra === S.obraId && areaDeBloco(a) && nivel1Nome(a) === b);
  const halls = ac.filter(a => tipoArea(a) === "hall"), rows = {};
  ub.forEach(x => { const k = x.nivel_2 || 0; (rows[k] = rows[k] || { u:[], h:[] }).u.push(x); });
  halls.forEach(a => { const k = a.nivel_2 || 0; (rows[k] = rows[k] || { u:[], h:[] }).h.push(a); });
  const linhas = Object.keys(rows).map(Number).sort((a, b) => b - a).map(k => ({ u:rows[k].u.sort((a, b) => numUnd(a.unidade) - numUnd(b.unidade)), h:rows[k].h }));
  return { linhas, cob:ac.filter(a => tipoArea(a) === "cobertura"), ent:ac.filter(a => tipoArea(a) === "entorno") };
}
// bloco "Áreas gerais": mesma largura dos blocos da obra; duas por linha quando o nome cabe, senão uma
function blocoAreasGeraisHTML(cols){
  const L = ordenarAreas(DB.areas.filter(a => a.id_obra === S.obraId && !areaDeBloco(a))); if(!L.length) return "";
  cols = Math.max(4, cols || 8); const esq = Math.ceil(cols / 2), cabe = Math.floor(cols / 2) * 7.5;   // ~7,5 letras por coluna
  let lado = 0;   // 0 = começo da linha, 1 = metade direita livre
  const tile = a => { const larga = a.descricao.length > cabe; let gc;
    if(larga){ gc = "1 / -1"; lado = 0; } else if(lado === 0){ gc = `1 / span ${esq}`; lado = 1; } else { gc = `${esq + 1} / -1`; lado = 0; }
    return `<button class="tile tile-ac" style="background:${corArea(a)};border:0;grid-column:${gc}" data-act="abrirac" data-id="${a.id}" title="${esc(a.descricao)}: ${esc((ETAPA_AC[a.sub_etapa] || {}).n || "")}">${esc(a.descricao)}</button>`; };
  return `<div class="bloco bloco-ac"><div class="tiles" data-cols="${cols}" style="grid-template-columns:repeat(${cols},var(--tw0))">${L.map(tile).join("")}</div><h3>${GRUPO_GERAL} (${L.length})</h3></div>`;
}

/* ---------- cliques ---------- */
Object.assign(ACOES_EXTRA, {
  actipo(el){ const F = S.loc.modal && S.loc.modal.f; if(F){ F.tipo = el.dataset.v; if(F.tipo === "geral" || (F.tipo !== "hall" && F.pav === "todos")) F.pav = ""; } },
  acfilbloco(el){ const b = el.dataset.b, L = S.acFil || []; S.acFil = L.includes(b) ? L.filter(x => x !== b) : [...L, b]; if(S.acLote) S.acLote.q = []; },
  aclimpar(){ S.acFil = []; }
});
INPUT_EXTRA.push((t, ev) => {
  if(t.dataset.acf && S.loc.modal && S.loc.modal.f){ S.loc.modal.f[t.dataset.acf] = t.value; if(t.dataset.acf === "bloco") S.loc.modal.f.pav = t.value === "todos" ? "todos" : ""; return t.tagName === "SELECT" ? "render" : true; }
  return false;
});
