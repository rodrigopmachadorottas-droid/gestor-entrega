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
// filtro da tela Áreas comuns: "" (todas), "geral" ou o id do bloco
const passaFiltroArea = a => !S.acBloco ? true : S.acBloco === "geral" ? !areaDeBloco(a) : a.nivel_1 === +S.acBloco;
function filtroAreasHTML(){
  const bl = [...new Set(DB.areas.filter(a => a.id_obra === S.obraId && areaDeBloco(a)).map(a => a.nivel_1))].map(localById).filter(Boolean)
    .sort((x, y) => x.nivel1.localeCompare(y.nivel1, undefined, { numeric:true }));
  if(!bl.length) return "";
  return `<div class="ac-fil"><label for="ac-bloco" class="small"><b>Mostrar</b></label><select class="inp sf" id="ac-bloco" data-acbloco>
    <option value="">Todas as áreas</option>${bl.map(l => `<option value="${l.id}" ${+S.acBloco === l.id ? "selected" : ""}>${esc(l.nivel1)}</option>`).join("")}<option value="geral" ${S.acBloco === "geral" ? "selected" : ""}>Áreas gerais</option></select></div>`;
}

/* ---------- cadastro (tela Obra > Áreas comuns) ---------- */
function modalArea(){
  const M = S.loc.modal, a = M.id ? DB.areas.find(z => z.id === M.id) : null, adm = can(ME(), "admin"), podeExcluir = a && (a.sub_etapa === 1 || adm);
  if(!M.f) M.f = { tipo:tipoArea(a), bloco:a && a.nivel_1 ? a.nivel_1 : "", pav:a && a.nivel_2 ? a.nivel_2 : "", nome:a && !areaDeBloco(a) ? a.descricao : "" };
  const F = M.f, casa = OBRA().config.tipo === "casa", trava = a && a.sub_etapa !== 1 && !adm;
  const locs = DB.locais.filter(l => l.id_obra === S.obraId).sort((x, y) => x.nivel1.localeCompare(y.nivel1, undefined, { numeric:true }));
  const loc = localById(+F.bloco), pavs = loc && loc.niveis2 ? loc.niveis2.split(", ").filter(Boolean) : [];
  const prev = F.tipo === "geral" ? "" : nomeAutoArea({ tipo:F.tipo, nivel_1:+F.bloco, nivel_2:+F.pav });
  const tipos = Object.entries(TIPOS_AREA).filter(([k]) => k !== "hall" || !casa);
  return `<div class="modal" role="dialog" aria-modal="true"><div class="scrim" data-act="locfechar"></div><div class="box sm"><div class="mhead"><b class="t h2">${a ? "Editar área comum" : "Adicionar área comum"}</b><button class="iconbtn" data-act="locfechar" aria-label="Fechar">${IC.close}</button></div>
    <div class="mbody"><div class="field"><label>Tipo</label><div class="seg ac-tipo">${tipos.map(([k, t]) => `<button class="${F.tipo === k ? "on" : ""}" data-act="actipo" data-v="${k}" ${trava ? "disabled" : ""}>${t}</button>`).join("")}</div>
      ${trava ? `<span class="small muted">O tipo só muda enquanto a área está na Liberação Local.</span>` : ""}</div>
    ${F.tipo === "geral" ? `<div class="field"><label for="ac-nome">Nome da área comum</label><input class="inp" id="ac-nome" data-acf="nome" value="${esc(F.nome)}" placeholder="Ex.: Salão de Festas"></div>`
      : `<div class="row2"><div class="field"><label for="ac-bl">${casa ? "Quadra" : "Bloco"}</label><select class="inp" id="ac-bl" data-acf="bloco"><option value="">Selecione</option>${locs.map(l => `<option value="${l.id}" ${+F.bloco === l.id ? "selected" : ""}>${esc(l.nivel1)}</option>`).join("")}</select></div>
        ${F.tipo === "hall" ? `<div class="field"><label for="ac-pav">Pavimento</label><select class="inp" id="ac-pav" data-acf="pav" ${pavs.length ? "" : "disabled"}><option value="">Selecione</option>${pavs.map((p, i) => `<option value="${i + 1}" ${+F.pav === i + 1 ? "selected" : ""}>${esc(p)}</option>`).join("")}</select></div>` : ""}</div>
      <div class="small muted">Nome: <b>${prev && F.bloco && (F.tipo !== "hall" || F.pav) ? esc(prev) : "escolha o " + (casa ? "quadra" : "bloco") + (F.tipo === "hall" ? " e o pavimento" : "")}</b></div>
      <span class="small muted">${TIPOS_AREA[F.tipo]} passa só por Liberação Local, Vistoria Qualidade e Correções de Obra. Vistoria Arquitetura e Síndico ficam N/A.</span>`}
    ${a && !podeExcluir ? `<span class="small muted">Só dá para excluir áreas comuns que ainda estão na Liberação Local.</span>` : ""}
    ${a && adm && a.sub_etapa !== 1 && M.del ? `<div class="aviso-box forte">Esta área já está em <b>${esc(ETAPA_AC[a.sub_etapa].n)}</b>. O histórico dela some das telas. Não dá para desfazer.</div>` : ""}</div>
    <div class="mfoot">${podeExcluir ? `<button class="btn ${M.del ? "bad" : "ghost"}" data-act="acdel">${M.del ? "Confirmar exclusão" : "Excluir"}</button><span class="spacer"></span>` : ""}<button class="btn ghost" data-act="locfechar">Cancelar</button><button class="btn primary" data-act="acsalvar">Salvar</button></div></div></div>`;
}
function salvarArea(){
  const M = S.loc.modal, F = M.f, a = M.id ? DB.areas.find(z => z.id === M.id) : null;
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
function blocoAreasGeraisHTML(){
  const L = ordenarAreas(DB.areas.filter(a => a.id_obra === S.obraId && !areaDeBloco(a))); if(!L.length) return "";
  return `<div class="bloco bloco-ac"><div class="tiles" data-cols="4" style="grid-template-columns:repeat(4,var(--tw0))">${L.map(a => tileArea(a, a.descricao, true)).join("")}</div><h3>Áreas comuns (${L.length})</h3></div>`;
}

/* ---------- cliques ---------- */
Object.assign(ACOES_EXTRA, {
  actipo(el){ const F = S.loc.modal && S.loc.modal.f; if(F) F.tipo = el.dataset.v; }
});
INPUT_EXTRA.push((t, ev) => {
  if(t.dataset.acf && S.loc.modal && S.loc.modal.f){ S.loc.modal.f[t.dataset.acf] = t.value; if(t.dataset.acf === "bloco") S.loc.modal.f.pav = ""; return t.tagName === "SELECT" ? "render" : true; }
  if(t.hasAttribute && t.hasAttribute("data-acbloco")){ S.acBloco = t.value; if(S.acLote) S.acLote.q = []; return "render"; }
  return false;
});
