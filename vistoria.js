/* =====================================================================
   VISTORIA COM CHECKLIST
   Toda etapa que tem checklist vira a ação "Vistoriar": a pessoa marca cada
   item como Aprovado ou Reprovado e só no fim decide Aprovar ou Reprovar.
   - Cada item é Construtivo/habitabilidade ou Acabamento (o admin define).
   - Item reprovado pede foto (tirar ou enviar) e comentário opcional.
   - Construtivo reprovado obriga a reprovar a etapa; só acabamento
     reprovado deixa aprovar mesmo assim (fica registrado).
   - Revistoria: só os itens reprovados na vistoria anterior.
   - Corrigir: mostra os itens reprovados com as fotos (evidência) e pede
     a foto de cada correção.
   - O checklist preenchido abre de qualquer etapa (Ver checklist).
   Formato gravado na tarefa (coluna checklist):
     vistoria: [{item, cat, r:"ok"|"rep", p, fotos:[{nome,tam,path}], com, h?}]
               h = já aprovado em vistoria anterior (não foi vistoriado de novo)
     correção: [{item, cat, r:"cor", p:false, fotos, com, ref:<id da reprova>}]
   ===================================================================== */
const CK_CAT = { construtivo:"Construtivo / habitabilidade", acabamento:"Acabamento" };
const CK_CAT_CURTO = { construtivo:"Construtivo", acabamento:"Acabamento" };
// categoria inicial dos itens padrão (o admin muda em Configurar campos)
const CK_CAT_PADRAO = { "Pintura (paredes e teto)":"acabamento", "Revestimentos e rejuntes":"acabamento", "Pisos e rodapés":"acabamento", "Esquadrias e vidros":"construtivo",
  "Portas e ferragens":"acabamento", "Louças e metais":"acabamento", "Instalações elétricas":"construtivo", "Instalações hidráulicas":"construtivo",
  "Impermeabilização (box e sacada)":"construtivo", "Limpeza final":"acabamento" };
// itens sempre como [{t, cat}] (aceita o formato antigo, que era só o texto)
const ckItens = c => (c.itens || []).map(x => typeof x === "string" ? { t:x, cat:CK_CAT_PADRAO[x] || "construtivo" } : { t:String(x.t || ""), cat:x.cat === "acabamento" ? "acabamento" : "construtivo" });
const chaveCfg = (ctx, sec, a) => ctx === "ac" ? `ac:${sec}:${a}` : `${sec}:${a}`;
const ehVistoria = (ctx, sec) => camposDe(chaveCfg(ctx, sec, "vistoriar")).some(c => c.tipo === "checklist");
// a correção de uma etapa com checklist pede fotos: não dá para fazer em lote
const exigeFotos = key => { const m = /^(ac:)?(.+):corrigir$/.exec(key); return !!m && ehVistoria(m[1] ? "ac" : "und", m[2]); };

// nas seções do popup, Aprovar + Reprovar viram um botão só: Vistoriar
function vistAplicar(s, ctx){
  if(!s.acts.some(a => a.a === "aprovar") || !s.acts.some(a => a.a === "reprovar") || !ehVistoria(ctx, s.key)) return s;
  const acts = [];
  s.acts.forEach(a => { if(a.a === "aprovar") acts.push({ a:"vistoriar", l:"Vistoriar", k:"info" }); else if(a.a !== "reprovar") acts.push(a); });
  return { ...s, acts, vist:true };
}

/* ---------- tarefas de vistoria de uma unidade/área ---------- */
const tarefasDe = (ctx, id) => ctx === "ac" ? DB.tarefas_ac.filter(t => t.id_local === id) : DB.tarefas.filter(t => t.id_unidade === id);
const tarefaPorId = (ctx, id) => (ctx === "ac" ? DB.tarefas_ac : DB.tarefas).find(t => t.id === id);
const ckProb = x => x.p != null ? !!x.p : x.r !== "ok";
// última reprova com checklist nesta coluna (base da correção e da revistoria)
function ultimaReprova(ctx, reg, col){
  return tarefasDe(ctx, reg.id).filter(t => t.coluna === col && t.acao === "reprovar" && Array.isArray(t.checklist) && t.checklist.some(ckProb))
    .sort((a, b) => a.data.localeCompare(b.data)).at(-1) || null;
}
// itens da vistoria de agora: na revistoria, só os que foram reprovados na anterior
function itensVistoria(c, ctx, reg, col){
  const n = repN(reg[col]) || 1, base = n > 1 ? ultimaReprova(ctx, reg, col) : null;
  if(!base) return { itens:ckItens(c), revis:false };
  return { itens:base.checklist.map(x => ({ t:x.item, cat:x.cat || (x.r === "acabamento" ? "acabamento" : "construtivo"), h:!ckProb(x) })), revis:true, base };
}

/* ---------- fotos ---------- */
const FOTO_URL = {}, _fotoPend = new Set(); let _fotoTimer = null, FOTOS_TELA = [];
function fotoSrc(f){
  if(!f) return ""; if(f.url) return f.url; if(!f.path) return "";
  if(FOTO_URL[f.path]) return FOTO_URL[f.path];
  if(!MODO_DEMO && typeof sb !== "undefined"){ _fotoPend.add(f.path); if(!_fotoTimer) _fotoTimer = setTimeout(carregarFotos, 0); }
  return "";
}
async function carregarFotos(){
  const L = [..._fotoPend]; _fotoPend.clear(); _fotoTimer = null; if(!L.length) return;
  try{ const { data, error } = await sb.storage.from("anexos").createSignedUrls(L, 3600); if(error) throw error;
    (data || []).forEach(d => { FOTO_URL[d.path] = d.signedUrl || "erro"; }); L.forEach(p => { if(!FOTO_URL[p]) FOTO_URL[p] = "erro"; }); }
  catch(e){ L.forEach(p => { FOTO_URL[p] = "erro"; }); }
  render();
}
function fotoThumb(f, del){
  const i = FOTOS_TELA.push(f) - 1, src = fotoSrc(f);
  return `<span class="fth"><button type="button" class="fth-b" data-act="fotover" data-fi="${i}" aria-label="Ver foto">${src && src !== "erro" ? `<img src="${esc(src)}" alt="" loading="lazy">` : `<span class="fth-ph">${src === "erro" ? "!" : ""}</span>`}</button>${del ? `<button type="button" class="x" data-act="fotodel" data-k="${del.k}" data-j="${del.j}" aria-label="Remover foto">×</button>` : ""}</span>`;
}
const fotosLista = L => L && L.length ? `<div class="fotos-th">${L.map(f => fotoThumb(f)).join("")}</div>` : "";
// fotos de um item no formulário (chave "ck|campo|item" ou "cor|item")
function fotosForm(F, k){
  const [tp, a, b] = k.split("|");
  if(tp === "cor"){ const c = (F.cor = F.cor || {}); return (c[a] = c[a] || { fotos:[], com:"" }); }
  const x = (F.ckx = F.ckx || {}), y = (x[a] = x[a] || {}); return (y[b] = y[b] || { fotos:[], com:"" });
}
function fotosEditor(F, k, rotulo){
  const L = fotosForm(F, k).fotos;
  return `<div class="fotos-ed">${L.length ? `<div class="fotos-th">${L.map((f, j) => fotoThumb(f, { k, j })).join("")}</div>` : ""}
    <div class="fotos-bt"><label class="btn sm ghost btn-ic">${IC.camera}Tirar foto<input type="file" accept="image/*" capture="environment" data-foto="${k}" hidden></label>
      <label class="btn sm ghost btn-ic">${IC.upload}Enviar foto<input type="file" accept="image/*" multiple data-foto="${k}" hidden></label>
      <span class="small ${L.length ? "muted" : "t-bad"}">${L.length ? `${L.length} foto${L.length > 1 ? "s" : ""}` : `${rotulo} (obrigatória)`}</span></div></div>`;
}
async function adicionarFotos(k, files){
  const F = formAtual(); if(!F) return;
  const alvo = fotosForm(F, k).fotos;
  for(const f of files){
    if(!/^image\//.test(f.type || "")){ toast("Erro", "Envie uma imagem", f.name); continue; }
    try{ const r = await reduzirImagem(f, 1600, 1600, false), nome = (f.name || "foto").replace(/\.[^.]+$/, "") + ".jpg";
      alvo.push(MODO_DEMO ? { nome, tam:r.blob.size, url:r.dataUrl } : { nome, tam:r.blob.size, file:new File([r.blob], nome, { type:"image/jpeg" }), url:URL.createObjectURL(r.blob) }); }
    catch(e){ toast("Erro", "Não deu para usar esta foto", msgErro(e)); }
  }
  render();
}
const fotoGravar = f => MODO_DEMO ? { nome:f.nome, tam:f.tam, url:f.url } : { ...f };

/* ---------- formulário: Vistoriar ---------- */
const ckDe = (F, c) => (F.ck[c.id] = F.ck[c.id] || {});
function ckItensForm(c, F){ return (F.ckIt && F.ckIt[c.id]) || ckItens(c).map(x => ({ ...x })); }
function ckFormHTML(c, F, ctx){
  const L = ckItensForm(c, F), ck = ckDe(F, c), ativos = L.map((x, i) => [x, i]).filter(([x]) => !x.h), herd = L.filter(x => x.h);
  const marc = ativos.filter(([, i]) => ck[i]).length, rep = ativos.filter(([, i]) => ck[i] === "rep");
  const linha = ([x, i]) => { const v = ck[i], cx = (F.ckx && F.ckx[c.id] && F.ckx[c.id][i]) || { com:"" };
    return `<div class="ckv-it ${v === "rep" ? "rep" : v === "ok" ? "ok" : ""}"><div class="ckv-top"><span class="ckv-t">${esc(x.t)} <span class="ckcat ${x.cat}">${CK_CAT_CURTO[x.cat]}</span></span>
      <div class="seg ck" role="group" aria-label="${esc(x.t)}"><button type="button" class="${v === "ok" ? "on ck-ok" : ""}" data-act="ckset" data-id="${c.id}" data-i="${i}" data-v="ok">Aprovado</button><button type="button" class="${v === "rep" ? "on ck-construtivo" : ""}" data-act="ckset" data-id="${c.id}" data-i="${i}" data-v="rep">Reprovado</button></div></div>
      ${v === "rep" ? `<div class="ckv-rep">${fotosEditor(F, `ck|${c.id}|${i}`, "Foto do problema")}<input class="inp" data-ckcom="${c.id}|${i}" value="${esc(cx.com || "")}" placeholder="Comentário (opcional)" aria-label="Comentário sobre ${esc(x.t)}"></div>` : ""}</div>`; };
  return `<div class="field ckv"><div class="row"><b>${esc(c.rotulo)}${c.obrig ? ` <span class="obr">*</span>` : ""}</b><span class="spacer"></span>${c.todos && marc < ativos.length ? `<button type="button" class="btn sm" data-act="ckall" data-id="${c.id}">Marcar restantes como aprovado</button>` : ""}</div>
    ${c.ajuda ? `<span class="small muted">${esc(c.ajuda)}</span>` : ""}
    ${F.ckRevis ? `<div class="ckv-revis small">Revistoria: só ${ativos.length === 1 ? "o item que foi reprovado" : `os ${ativos.length} itens que foram reprovados`} na vistoria anterior.${herd.length ? ` Os outros ${herd.length} já estão aprovados: ${esc(herd.map(x => x.t).join(", "))}.` : ""}</div>` : ""}
    <div class="ckv-list">${ativos.map(linha).join("")}</div>
    <span class="small muted tnum">${marc} de ${ativos.length} itens marcados${rep.length ? ` · ${rep.length} reprovado${rep.length > 1 ? "s" : ""}` : ""}</span></div>`;
}
// situação das marcações (para os botões Aprovar/Reprovar do rodapé)
function ckEstado(def, F){
  const c = def.find(x => x.tipo === "checklist"); if(!c) return null;
  const L = ckItensForm(c, F), ck = ckDe(F, c), at = L.map((x, i) => [x, i]).filter(([x]) => !x.h);
  const rep = at.filter(([, i]) => ck[i] === "rep");
  return { total:at.length, marc:at.filter(([, i]) => ck[i]).length, rep:rep.length, constr:rep.some(([x]) => x.cat === "construtivo") };
}
function ckValidar(c, F, dec){
  const L = ckItensForm(c, F), ck = ckDe(F, c), at = L.map((x, i) => [x, i]).filter(([x]) => !x.h);
  if(at.some(([, i]) => !ck[i])) return "Marque todos os itens do checklist (Aprovado ou Reprovado)";
  const rep = at.filter(([, i]) => ck[i] === "rep");
  for(const [x, i] of rep) if(!fotosForm(F, `ck|${c.id}|${i}`).fotos.length) return `Falta a foto do problema: ${x.t}`;
  if(dec === "aprovar" && rep.some(([x]) => x.cat === "construtivo")) return "Tem item construtivo/habitabilidade reprovado: a etapa precisa ser reprovada";
  if(dec === "reprovar" && !rep.length) return "Para reprovar, marque pelo menos um item como Reprovado";
  return null;
}
function ckColetar(c, F){
  const ck = ckDe(F, c);
  return ckItensForm(c, F).map((x, i) => { if(x.h) return { item:x.t, cat:x.cat, r:"ok", p:false, h:true };
    const rep = ck[i] === "rep", fx = rep ? fotosForm(F, `ck|${c.id}|${i}`) : null;
    return rep ? { item:x.t, cat:x.cat, r:"rep", p:true, fotos:fx.fotos.map(fotoGravar), com:(fx.com || "").trim() } : { item:x.t, cat:x.cat, r:"ok", p:false }; });
}

/* ---------- formulário: Corrigir (itens reprovados + foto da correção) ---------- */
function ckCorrHTML(c, F){
  const b = c.base, rep = b.checklist.map((x, i) => [x, i]).filter(([x]) => ckProb(x));
  return `<div class="field ckv"><b>Itens reprovados na ${b.repeticao ? b.repeticao + "ª " : ""}vistoria <span class="obr">*</span></b>
    <span class="small muted">Reprovada em ${fmtDT(new Date(b.data))} por ${esc(nomeUsuario(b.autor))}. Para cada item, envie a foto de como ficou depois de corrigido.</span>
    <div class="ckv-list">${rep.map(([x, i]) => { const cr = fotosForm(F, `cor|${i}`);
      return `<div class="ckv-it rep"><div class="ckv-top"><span class="ckv-t">${esc(x.item)} <span class="ckcat ${x.cat || "construtivo"}">${CK_CAT_CURTO[x.cat] || esc(x.rl || "Problema")}</span></span></div>
        <div class="ckv-ev"><span class="small muted">Problema${x.com ? `: <i>${esc(x.com)}</i>` : ""}</span>${fotosLista(x.fotos) || `<span class="small muted">Sem foto (vistoria antiga)</span>`}</div>
        <div class="ckv-rep"><b class="small">Correção</b>${fotosEditor(F, `cor|${i}`, "Foto da correção")}<input class="inp" data-corcom="${i}" value="${esc(cr.com || "")}" placeholder="Comentário sobre a correção (opcional)" aria-label="Comentário da correção de ${esc(x.item)}"></div></div>`; }).join("")}</div></div>`;
}
function ckCorrValidar(c, F){
  for(const [x, i] of c.base.checklist.map((x, i) => [x, i]).filter(([x]) => ckProb(x))) if(!fotosForm(F, `cor|${i}`).fotos.length) return `Falta a foto da correção: ${x.item}`;
  return null;
}
function ckCorrColetar(c, F){
  return c.base.checklist.map((x, i) => [x, i]).filter(([x]) => ckProb(x)).map(([x, i]) => { const cr = fotosForm(F, `cor|${i}`);
    return { item:x.item, cat:x.cat || "construtivo", r:"cor", p:false, fotos:cr.fotos.map(fotoGravar), com:(cr.com || "").trim(), ref:c.base.id }; });
}

/* ---------- resumo no histórico e visualização do checklist ---------- */
function ckResumoNovo(ck, tid, ctx){
  const ver = tid != null ? ` <button class="linkbtn ck-ver" data-act="ckver" data-id="${tid}" data-ctx="${ctx || "und"}">Ver checklist</button>` : "";
  if(ck.some(x => x.r === "cor")){ const nf = ck.reduce((s, x) => s + (x.fotos || []).length, 0);
    return `<div class="obs">Correção de ${ck.length} ite${ck.length > 1 ? "ns" : "m"} reprovado${ck.length > 1 ? "s" : ""}${nf ? ` · ${nf} foto${nf > 1 ? "s" : ""}` : ""} ·${ver}</div>`; }
  const prob = ck.filter(ckProb), herd = ck.filter(x => x.h).length;
  const nC = prob.filter(x => (x.cat || x.r) === "construtivo").length, nA = prob.filter(x => (x.cat || x.r) === "acabamento").length;
  const det = prob.length ? `<b style="color:var(--bad-t)">${prob.length} reprovado${prob.length > 1 ? "s" : ""}</b>${nC || nA ? ` (${[nC ? `${nC} construtivo${nC > 1 ? "s" : ""}` : "", nA ? `${nA} acabamento` : ""].filter(Boolean).join(", ")})` : ""}: ${esc(prob.map(x => x.item).join(", "))}` : "todos aprovados";
  return `<div class="obs">Checklist: ${ck.length - herd} ite${ck.length - herd > 1 ? "ns" : "m"} vistoriado${ck.length - herd > 1 ? "s" : ""}${herd ? ` (+${herd} já aprovado${herd > 1 ? "s" : ""})` : ""} · ${det} ·${ver}</div>`;
}
function popupCkVer(){
  const V = S.ckVer, t0 = tarefaPorId(V.ctx, V.id); if(!t0) return "";
  // abrindo uma correção, mostra a vistoria que ela corrigiu
  const refId = t0.checklist && t0.checklist.find(x => x.ref) ? t0.checklist.find(x => x.ref).ref : null;
  const t = refId ? (tarefaPorId(V.ctx, refId) || t0) : t0;
  const reg = V.ctx === "ac" ? DB.areas.find(a => a.id === t.id_local) : DB.unidades.find(u => u.id === t.id_unidade);
  const titulo = V.ctx === "ac" ? (reg ? reg.descricao : "") : reg ? `${nivel1Nome(reg)} · ${reg.unidade}` : "";
  const etapa = (secoesTitulo(V.ctx, t.coluna)) + (t.repeticao ? ` · ${t.repeticao}ª vistoria` : "");
  // correções feitas depois desta vistoria (antes da próxima)
  const T = tarefasDe(V.ctx, t.id_unidade ?? t.id_local).filter(x => x.coluna === t.coluna).sort((a, b) => a.data.localeCompare(b.data));
  const prox = T.find(x => x.data > t.data && x.acao !== "corrigir");
  const corr = T.filter(x => x.acao === "corrigir" && x.data > t.data && (!prox || x.data < prox.data));
  const corrDe = item => { for(const c of corr){ const y = (c.checklist || []).find(z => z.item === item && z.r === "cor"); if(y) return { c, y }; } return null; };
  const dec = t.acao === "aprovar" ? `<span class="pill s-ok">Aprovada</span>` : t.acao === "reprovar" ? `<span class="pill s-bad">Reprovada</span>` : "";
  const itens = (t.checklist || []).map(x => { const p = ckProb(x), cat = x.cat || (x.r === "acabamento" ? "acabamento" : x.r === "construtivo" ? "construtivo" : "");
    const k = corrDe(x.item);
    return `<div class="ckv-it ${p ? "rep" : "ok"}"><div class="ckv-top"><span class="ckv-t">${esc(x.item)} ${cat ? `<span class="ckcat ${cat}">${CK_CAT_CURTO[cat]}</span>` : ""}</span>
        <span class="pill ${p ? "s-bad" : "s-ok"}">${p ? "Reprovado" : x.h ? "Aprovado antes" : "Aprovado"}</span></div>
      ${p ? `<div class="ckv-ev">${x.com ? `<span class="small"><i>${esc(x.com)}</i></span>` : ""}${fotosLista(x.fotos) || `<span class="small muted">Sem foto</span>`}</div>` : ""}
      ${k ? `<div class="ckv-cor"><span class="small"><b>Corrigido</b> em ${fmtDT(new Date(k.c.data))} por ${esc(nomeUsuario(k.c.autor))}${k.y.com ? `: <i>${esc(k.y.com)}</i>` : ""}</span>${fotosLista(k.y.fotos)}</div>` : ""}</div>`; }).join("");
  const nP = (t.checklist || []).filter(ckProb).length;
  return `<div class="modal ckver" role="dialog" aria-modal="true" aria-label="Checklist"><div class="scrim" data-act="ckverfechar"></div><div class="box tall">
    <div class="mhead"><div class="t"><b class="conf-t">Checklist · ${esc(etapa)}</b><div class="small muted">${esc(titulo)} · ${fmtDT(new Date(t.data))} · ${esc(nomeUsuario(t.autor))}</div></div>${dec}<button class="iconbtn" data-act="ckverfechar" aria-label="Fechar">${IC.close}</button></div>
    <div class="mbody" id="mb-ckver" data-keep-scroll>${t.obs && !nP ? `<div class="small muted">${esc(t.obs)}</div>` : ""}<div class="ckv-list">${itens}</div></div></div></div>`;
}
function secoesTitulo(ctx, col){
  const T = { rep_vistoria_at:"Vistoria Qualidade", rep_vistoria_previa:"Vistoria Prévia", rep_vistoria_cliente:"Vistoria do Cliente", rep_vistoria_qualidade:"Vistoria Qualidade", rep_vistoria_arq:"Vistoria Arquitetura", rep_vistoria_sindico:"Vistoria do Síndico" };
  if(T[col]) return T[col]; const te = TESTES.find(x => x.col === col); return te ? te.nome : col || "";
}
const fotoLightbox = () => { const src = fotoSrc(S.fotoVer);
  return `<div class="lightbox" role="dialog" aria-modal="true" aria-label="Foto" data-act="fotofechar">${src && src !== "erro" ? `<img src="${esc(src)}" alt="">` : `<span class="muted">Carregando...</span>`}<button class="iconbtn" data-act="fotofechar" aria-label="Fechar">${IC.close}</button></div>`; };

/* ---------- upload das fotos antes de gravar a tarefa ---------- */
async function enviarFotosChecklist(reg, ck){
  if(!Array.isArray(ck)) return;
  let k = 0;
  for(const x of ck){ if(!x.fotos) continue;
    for(let j = 0; j < x.fotos.length; j++){ const f = x.fotos[j]; if(f.path || !f.file) { delete f.url; continue; }
      const path = `${reg.id_obra}/${reg.id}/ck-${Date.now()}-${k++}.jpg`;
      const { error } = await sb.storage.from("anexos").upload(path, f.file, { upsert:false, contentType:"image/jpeg" });
      if(error) throw error;
      x.fotos[j] = { nome:f.nome, tam:f.tam, path }; } }
}

/* ---------- cliques e campos ---------- */
Object.assign(ACOES_EXTRA, {
  ckver(el){ S.ckVer = { id:+el.dataset.id, ctx:el.dataset.ctx || "und" }; },
  ckverfechar(){ S.ckVer = null; },
  fotover(el){ const f = FOTOS_TELA[+el.dataset.fi]; if(f) S.fotoVer = f; },
  fotofechar(el, id, e){ if(e && e.target.tagName === "IMG") return; S.fotoVer = null; },
  fotodel(el){ const F = formAtual(); if(!F) return; const L = fotosForm(F, el.dataset.k).fotos, f = L[+el.dataset.j]; if(f && f.url && /^blob:/.test(f.url)) URL.revokeObjectURL(f.url); L.splice(+el.dataset.j, 1); }
});
INPUT_EXTRA.push((t, ev) => {
  if(t.dataset.foto){ if(ev === "change" && t.files && t.files.length){ const fs = [...t.files]; t.value = ""; adicionarFotos(t.dataset.foto, fs); } return true; }
  if(t.dataset.ckcom){ const F = formAtual(); if(F){ const [c, i] = t.dataset.ckcom.split("|"); fotosForm(F, `ck|${c}|${i}`).com = t.value; } return true; }
  if(t.dataset.corcom != null){ const F = formAtual(); if(F) fotosForm(F, `cor|${t.dataset.corcom}`).com = t.value; return true; }
  return false;
});
document.addEventListener("keydown", e => { if(e.key !== "Escape" || !(S.fotoVer || S.ckVer)) return; e.stopImmediatePropagation(); if(S.fotoVer) S.fotoVer = null; else S.ckVer = null; render(); }, true);
