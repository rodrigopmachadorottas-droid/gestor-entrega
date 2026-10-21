/* =====================================================================
   PDF dos Indicadores · A4 deitado, baixado direto (sem a tela de imprimir)
   O usuário escolhe as visões (e, na Visão Unidades, as etapas). Cada
   etapa/visão vira uma página; a Visão Unidades se divide em mais páginas
   se os blocos não couberem legíveis numa só. As páginas são montadas em
   HTML, fotografadas (html2canvas) e juntadas num PDF (jsPDF).
   ===================================================================== */
const PDF_W = 1062, PDF_H = 733, PDF_GAP = 14;      // A4 deitado menos 8 mm de margem, em px (96 dpi)
const PDF_VISOES = [["unid","Visão Unidades"],["geral","Visão Geral"],["aprov","Visão Aprovações"],["usuarios","Dados por usuário"],["cef","Vistoria Qualidade (CEF)"]];

/* ---------- carregamento das bibliotecas (só quando gera o PDF) ---------- */
function carregarScript(src){ return new Promise((ok, falha) => { if(document.querySelector(`script[src="${src}"]`)) return ok(); const s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = () => falha(new Error("Não foi possível carregar " + src)); document.head.appendChild(s); }); }
async function libsPdf(){ await carregarScript("js/vendor/html2canvas.min.js"); await carregarScript("js/vendor/jspdf.umd.min.js"); }

/* ---------- popup de configuração ---------- */
function abrirPdfCfg(){ const v = { "Visão Unidades":"unid", "Visão Geral":"geral", "Visão Aprovações":"aprov", "Visão Ações":"usuarios" }[S.ind.visao] || "unid";
  const ops = indEtapas(), etapa = ops.some(o => o.id === S.ind.etapa) ? S.ind.etapa : ops[0].id;
  S.pdfCfg = { visoes:{ unid:v === "unid", geral:v === "geral", aprov:v === "aprov", usuarios:v === "usuarios" }, etapas:[etapa], rep:!!S.ind.rep }; }
function popupPdfCfg(){
  const C = S.pdfCfg, ops = indEtapas(), lider = can(ME(), "admin", "lider");
  const vis = PDF_VISOES.filter(([k]) => k !== "usuarios" || lider);
  const nPag = (C.visoes.unid ? C.etapas.length : 0) + ["geral","aprov","usuarios","cef"].filter(k => C.visoes[k]).length;
  const cefB = C.visoes.cef ? cefBlocosObra() : [], cefSel = C.visoes.cef ? (C.cefBlocos || (C.cefBlocos = [...cefB])) : [];
  return `<div class="modal" role="dialog" aria-modal="true" aria-label="Gerar PDF"><div class="scrim" data-act="pdfcfgfechar"></div><div class="box sm2">
    <div class="mhead"><div class="t"><b class="conf-t">Gerar PDF</b><div class="small muted">${esc(OBRA().nome)} · A4 deitado · cada visão (ou etapa) em uma página</div></div><button class="iconbtn" data-act="pdfcfgfechar" aria-label="Fechar">${IC.close}</button></div>
    <div class="mbody"><div class="field"><label>Visões</label>${vis.map(([k, l]) => `<label class="chk"><input type="checkbox" data-pdfv="${k}" ${C.visoes[k] ? "checked" : ""}>${l}</label>`).join("")}</div>
      ${C.visoes.unid ? `<div class="field"><div class="row"><label style="margin:0">Etapas da Visão Unidades</label><span class="spacer"></span><button class="linkbtn" data-act="pdfetapas">${C.etapas.length === ops.length ? "Desmarcar todas" : "Marcar todas"}</button></div>
        <div class="pdf-etapas">${ops.map(o => `<label class="chk"><input type="checkbox" data-pdfe="${o.id}" ${C.etapas.includes(o.id) ? "checked" : ""}>${esc(o.nome)}</label>`).join("")}</div>
        <label class="chk"><input type="checkbox" data-pdfrep="1" ${C.rep ? "checked" : ""}>Considerar repetição (Aprovado 1°, Aprovado 2°...) nas etapas que têm</label></div>` : ""}
      ${C.visoes.cef ? `<div class="field"><label>Blocos do relatório da Vistoria Qualidade (CEF)</label>${cefB.length ? `<div class="pdf-etapas">${cefB.map(b => `<label class="chk"><input type="checkbox" data-pdfcb="${esc(b)}" ${cefSel.includes(b) ? "checked" : ""}>${esc(b)}</label>`).join("")}</div>` : `<span class="small muted">Nenhuma unidade passou pela Vistoria Qualidade ainda.</span>`}
        <span class="small muted">Sai em um PDF separado (A4 em pé): por unidade, cada vistoria com o checklist, as fotos dos itens reprovados e as correções.</span></div>` : ""}
      <span class="small muted">Os filtros de blocos e de período que estão ligados nos Indicadores valem também para o PDF.</span></div>
    <div class="mfoot"><span class="small muted">${nPag ? `${nPag} página(s) ou mais` : "Escolha pelo menos uma visão"}</span><span class="spacer"></span><button class="btn primary btn-ic" data-act="pdfgerar" ${nPag ? "" : "disabled"}>${IC.pdf}Baixar PDF</button></div></div></div>`;
}

/* ---------- páginas ---------- */
function cabecalhoPdf(titulo, sub){
  return `<header class="pdf-h"><img src="${LOGOS.preta}" alt=""><div><b>${esc(OBRA().nome)} · ${esc(titulo)}</b><span>${sub} · gerado em ${fmtDTL(new Date())} por ${esc(nomeUsuario(REAL_USER))}</span></div></header>`;
}
function caixaMedida(){
  document.getElementById("print")?.remove();
  const box = document.createElement("div"); box.id = "print"; box.className = "medindo"; document.body.appendChild(box); return box;
}
// Visão Unidades de uma etapa: devolve 1 ou mais páginas (HTML)
function paginasUnidades(op, rep){
  const obra = OBRA(), corr = corrigidosSet(), blocos = blocosInd(), us = unidadesInd().filter(x => blocos.includes(nivel1Nome(x)));
  if(!blocos.length) return [];
  const stAll = us.map(x => statusUnd(x, op, corr, rep)), pct = (n, t) => t ? ` (${Math.round(n / t * 100)}%)` : "";
  const itens = itensLegenda(op, stAll, rep), corPdf = s => (itens.find(i => i.l === s) || { cor:corItem(op, s) }).cor;
  const blocoHTML = b => {
    const ub = us.filter(x => nivel1Nome(x) === b), linhas = linhasBloco(ub, obra.config), cols = Math.max(1, ...linhas.map(r => r.length));
    const st = ub.map(x => statusUnd(x, op, corr, rep));
    const tiles = linhas.map(r => r.map(x => `<div style="background:${corPdf(statusUnd(x, op, corr, rep))}">${esc(x.unidade.replace(/^(AP|CASA) /, ""))}</div>`).join("")
      + (r.length < cols ? "<span></span>".repeat(cols - r.length) : "")).join("");
    return `<div class="pdf-b"><div class="pdf-tiles" style="grid-template-columns:repeat(${cols},40px)">${tiles}</div>
      <h4>${esc(b)} <span>(${ub.length})</span></h4>
      <div class="lg">${itens.map(i => { const n = st.filter(s => s === i.l).length; return n ? `<span><i style="background:${i.cor}"></i>${esc(i.l)} ${n}</span>` : ""; }).join("")}</div></div>`;
  };
  const sub = `Etapa: <b>${esc(op.nome)}</b>${rep ? " (considerando repetição)" : ""} · ${blocos.length} ${obra.config.tipo === "casa" ? "quadras" : "blocos"} · ${us.length} unidades`;
  const leg2 = `<div class="pdf-leg">${itens.map(i => `<span><i style="background:${i.cor}"></i>${esc(i.l)}: <b>${i.n}</b>${pct(i.n, stAll.length)}</span>`).join("")}</div>`;
  const box = caixaMedida();
  box.innerHTML = `<div class="pdf-page" style="height:auto">${cabecalhoPdf("Visão Unidades", sub)}${leg2}</div><div class="pdf-grid medir">${blocos.map(blocoHTML).join("")}</div>`;
  const els = [...box.querySelectorAll(".pdf-grid.medir .pdf-b")];
  const bw = Math.max(...els.map(e => e.offsetWidth)), bh = Math.max(...els.map(e => e.offsetHeight));
  const H = PDF_H - box.querySelector(".pdf-page").offsetHeight - 8, W = PDF_W, n = els.length;
  box.remove();
  const escala = (c, r) => Math.min((W - PDF_GAP * (c - 1)) / (c * bw), (H - PDF_GAP * (r - 1)) / (r * bh));
  let best = null;
  for(let c = 1; c <= n; c++){ const r = Math.ceil(n / c), s = escala(c, r); if(!best || s > best.s) best = { c, r, s }; }
  let grupos;
  if(best.s >= 0.6) grupos = [{ c: best.c, s: Math.min(best.s, 2.2), itens: blocos }];
  else {
    const alvo = 0.8, c = Math.max(1, Math.floor((W + PDF_GAP) / (bw * alvo + PDF_GAP))), rp = Math.max(1, Math.floor((H + PDF_GAP) / (bh * alvo + PDF_GAP)));
    const s = Math.min(escala(c, rp), 1.4), por = c * rp; grupos = [];
    for(let i = 0; i < n; i += por) grupos.push({ c, s, itens: blocos.slice(i, i + por) });
  }
  return grupos.map((g, i) => {
    const linhasN = Math.ceil(g.itens.length / g.c), gw = g.c * bw + (g.c - 1) * PDF_GAP, gh = linhasN * bh + (linhasN - 1) * PDF_GAP;
    const left = Math.max(0, (W - gw * g.s) / 2);
    return `<section class="pdf-page">${cabecalhoPdf("Visão Unidades" + (grupos.length > 1 ? ` (${i + 1}/${grupos.length})` : ""), sub)}${leg2}
      <div class="pdf-area"><div class="pdf-grid" style="grid-template-columns:repeat(${g.c},${bw}px);grid-auto-rows:${bh}px;gap:${PDF_GAP}px;width:${gw}px;height:${gh}px;left:${left}px;transform:scale(${g.s.toFixed(3)})">${g.itens.map(blocoHTML).join("")}</div></div></section>`;
  });
}
// visões em tabela: o conteúdo é encaixado (reduzido ou ampliado) na área da página
function paginaConteudo(titulo, sub, html){
  return `<section class="pdf-page">${cabecalhoPdf(titulo, sub)}<div class="pdf-area"><div class="pdf-fit">${html}</div></div></section>`;
}
function dadosPorUsuarioHTML(){
  const I = S.ind, bl = new Set(blocosInd()), ini = I.ini ? new Date(I.ini + "T00:00") : null, fim = I.fim ? new Date(I.fim + "T23:59:59") : null;
  const um = new Map(unidadesObra().map(x => [x.id, x]));
  const T = DB.tarefas.filter(t => t.id_obra === S.obraId && um.has(t.id_unidade) && bl.has(nivel1Nome(um.get(t.id_unidade))) && (!ini || new Date(t.data) >= ini) && (!fim || new Date(t.data) <= fim));
  const acoes = ["liberar","aprovar","reprovar","corrigir","finalizar","agendar","cancelar"].filter(a => T.some(t => t.acao === a));
  const autores = [...new Set(T.map(t => t.autor))].map(a => ({ a, n: T.filter(t => t.autor === a).length })).sort((x, y) => y.n - x.n);
  if(!T.length) return `<div class="panel empty"><b>Nenhuma movimentação no período</b></div>`;
  return `<div class="panel"><table class="list"><thead><tr><th>Usuário</th>${acoes.map(c => `<th class="n">${c}</th>`).join("")}<th class="n">Total</th></tr></thead><tbody>
    ${autores.map(r => `<tr><td>${esc(nomeUsuario(r.a))}</td>${acoes.map(c => `<td class="n">${T.filter(t => t.autor === r.a && t.acao === c).length || ""}</td>`).join("")}<td class="n"><b>${r.n}</b></td></tr>`).join("")}</tbody>
    <tfoot><tr><td>Total</td>${acoes.map(c => `<td class="n">${T.filter(t => t.acao === c).length}</td>`).join("")}<td class="n">${T.length}</td></tr></tfoot></table></div>`;
}
function periodoTxt(){ const I = S.ind; return I.ini || I.fim ? `Período: ${I.ini ? fmtData(new Date(I.ini + "T00:00")) : "início"} até ${I.fim ? fmtData(new Date(I.fim + "T00:00")) : "hoje"}` : "Todo o período"; }

/* ---------- gerar e baixar ---------- */
async function gerarPdf(){
  const C = S.pdfCfg, ops = indEtapas(), obra = OBRA();
  const paginas = [];
  if(C.visoes.unid) ops.filter(o => C.etapas.includes(o.id)).forEach(op => paginas.push(...paginasUnidades(op, !!C.rep && repSuporta(op))));
  if(C.visoes.geral) paginas.push(paginaConteudo("Visão Geral", S.ind.geralModo === "acum" ? "Acumulado: unidades que já passaram por cada etapa" : "Número de unidades por fase e etapa (situação atual)", indGeral()));
  if(C.visoes.aprov) paginas.push(paginaConteudo("Visão Aprovações", "Unidades aprovadas por etapa e tentativa", indAprovacoes()));
  if(C.visoes.usuarios && can(ME(), "admin", "lider")) paginas.push(paginaConteudo("Dados por usuário", periodoTxt(), dadosPorUsuarioHTML()));
  if(!paginas.length){ toast("Aviso", "Nada para gerar", "Escolha uma visão com blocos visíveis."); return; }
  S.pdfCfg = null; S.carregando = "Preparando o PDF..."; render();
  try{
    await libsPdf();
    const box = caixaMedida(); box.className = "gerando";
    const pdf = new window.jspdf.jsPDF({ orientation: "landscape", unit: "mm", format: "a4", compress: true });
    for(let i = 0; i < paginas.length; i++){
      S.carregando = `Gerando o PDF (página ${i + 1} de ${paginas.length})...`; const ov = document.querySelector(".loading"); if(ov) ov.lastChild.textContent = S.carregando;
      box.innerHTML = paginas[i];
      const pg = box.firstElementChild, fit = pg.querySelector(".pdf-fit");
      if(fit){ const area = pg.querySelector(".pdf-area"), aw = area.clientWidth, ah = area.clientHeight, w = fit.scrollWidth, h = fit.scrollHeight;
        const s = Math.min(aw / w, ah / h, 1.5); fit.style.transform = `scale(${s.toFixed(3)})`; fit.style.left = Math.max(0, (aw - w * s) / 2) + "px"; }
      await new Promise(r => setTimeout(r, 30));
      const canvas = await window.html2canvas(pg, { scale: 2, backgroundColor: "#ffffff", logging: false, useCORS: true });
      if(i) pdf.addPage("a4", "landscape");
      pdf.addImage(canvas.toDataURL("image/jpeg", 0.9), "JPEG", 8, 8, 281, 194);
    }
    box.remove();
    pdf.save(`Gestor de Entrega - ${obra.nome} - ${fmtData(new Date()).replace(/\//g, "-")}.pdf`);
    toast("Sucesso", "PDF baixado", `${paginas.length} página(s)`);
  }catch(e){ console.error(e); toast("Erro", "Não foi possível gerar o PDF", msgErro(e)); document.getElementById("print")?.remove(); }
  S.carregando = ""; render();
}

/* ---------- Relatório da Vistoria Qualidade (CEF) · A4 em pé, por unidade ---------- */
const cefVistorias = u => DB.tarefas.filter(t => t.id_unidade === u.id && t.coluna === "rep_vistoria_at" && (t.acao === "aprovar" || t.acao === "reprovar")).sort((a, b) => a.data.localeCompare(b.data));
function cefBlocosObra(){ return [...new Set(unidadesObra().filter(u => cefVistorias(u).length).map(nivel1Nome))].sort(); }
// foto → dataURL (para o jsPDF), com tamanho original para manter a proporção
async function cefImagem(f){
  try{ let src = f.url || "";
    if(!src && f.path){ if(!FOTO_URL[f.path]){ const { data } = await sb.storage.from("anexos").createSignedUrl(f.path, 600); FOTO_URL[f.path] = data && data.signedUrl || "erro"; } src = FOTO_URL[f.path]; }
    if(!src || src === "erro") return null;
    if(!/^data:/.test(src)){ const b = await (await fetch(src)).blob(); src = await new Promise(ok => { const r = new FileReader(); r.onload = () => ok(r.result); r.readAsDataURL(b); }); }
    const img = await new Promise((ok, falha) => { const i = new Image(); i.onload = () => ok(i); i.onerror = falha; i.src = src; });
    const c = document.createElement("canvas"), k = Math.min(1, 900 / Math.max(img.width, img.height)); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
    const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
    return { d:c.toDataURL("image/jpeg", 0.8), w:c.width, h:c.height };
  }catch(e){ return null; }
}
async function gerarPdfCef(blocos){
  const obra = OBRA(), us = ordenarUnidades(unidadesObra().filter(u => blocos.includes(nivel1Nome(u)) && cefVistorias(u).length));
  if(!us.length){ toast("Aviso", "Nenhuma unidade para o relatório", "Escolha blocos com unidades já vistoriadas."); return; }
  S.carregando = "Preparando o relatório da Vistoria Qualidade..."; render();
  try{
    await carregarScript("js/vendor/jspdf.umd.min.js");
    const pdf = new window.jspdf.jsPDF({ orientation:"portrait", unit:"mm", format:"a4", compress:true });
    const W = 210, M = 14, CW = W - 2 * M, BOT = 284; let y = M;
    const txt = (t, x, sz = 9, st = "normal", cor = [40, 40, 40], w = CW) => { pdf.setFont("helvetica", st); pdf.setFontSize(sz); pdf.setTextColor(...cor); const L = pdf.splitTextToSize(String(t || ""), w); pdf.text(L, x, y + sz * 0.35); return L.length * sz * 0.42; };
    const espaco = h => { if(y + h > BOT){ pdf.addPage(); y = M; cab(); } };
    const cab = () => { txt(`${obra.nome} · Relatório de Vistoria de Qualidade`, M, 8, "bold", [120, 120, 120]); pdf.setFont("helvetica", "normal"); pdf.text(`gerado em ${fmtDTL(new Date())}`, W - M, y + 2.8, { align:"right" }); pdf.setDrawColor(220); pdf.line(M, y + 5, W - M, y + 5); y += 9; };
    const fotos = async (L, x0) => { if(!L || !L.length) return; let x = x0; const H = 38;
      for(const f of L){ const im = await cefImagem(f); if(!im) continue; const w = Math.min(55, H * im.w / im.h), h = w * im.h / im.w;
        if(x + w > W - M){ x = x0; y += H + 3; } espaco(h + 3); pdf.addImage(im.d, "JPEG", x, y, w, h); x += w + 3; }
      y += H + 4; };
    // capa
    txt("Relatório de Vistoria de Qualidade", M, 18, "bold"); y += 10;
    txt(obra.nome, M, 13, "bold", [255, 145, 20]); y += 8;
    txt(`Blocos: ${blocos.join(", ")} · ${us.length} unidades vistoriadas`, M, 10); y += 6;
    txt(`Gerado em ${fmtDTL(new Date())} por ${nomeUsuario(REAL_USER)}`, M, 9, "normal", [110, 110, 110]); y += 8;
    txt("Para cada unidade: as vistorias da Qualidade em ordem, o resultado de cada item do checklist (construtivo/habitabilidade ou acabamento), as fotos e comentários dos itens reprovados e o registro da correção de cada não conformidade.", M, 9, "normal", [80, 80, 80]); y += 14;
    for(let k = 0; k < us.length; k++){
      const u = us[k]; S.carregando = `Montando o relatório (unidade ${k + 1} de ${us.length})...`; const ov = document.querySelector(".loading"); if(ov) ov.lastChild.textContent = S.carregando;
      pdf.addPage(); y = M; cab();
      y += txt(`${nivel1Nome(u)}${nivel2Nome(u) ? " · " + nivel2Nome(u) : ""} · ${u.unidade}`, M, 14, "bold"); y += 1;
      y += txt(`Situação atual da Vistoria Qualidade: ${u.rep_vistoria_at || "-"}`, M, 9, "normal", [90, 90, 90]) + 3;
      const T = DB.tarefas.filter(t => t.id_unidade === u.id && t.coluna === "rep_vistoria_at").sort((a, b) => a.data.localeCompare(b.data));
      for(const t of cefVistorias(u)){
        espaco(20); pdf.setFillColor(t.acao === "aprovar" ? 226 : 252, t.acao === "aprovar" ? 242 : 228, t.acao === "aprovar" ? 227 : 226); pdf.rect(M, y, CW, 8, "F"); y += 1.5;
        txt(`${t.repeticao ? t.repeticao + "ª " : ""}vistoria · ${fmtDTL(new Date(t.data))} · ${nomeUsuario(t.autor)} · ${t.acao === "aprovar" ? "APROVADA" : "REPROVADA"}`, M + 2, 10, "bold"); y += 9;
        const ck = Array.isArray(t.checklist) ? t.checklist : null;
        if(!ck){ y += txt(`Vistoria sem checklist registrado.${t.obs ? " Obs.: " + t.obs : ""}`, M, 9, "italic", [100, 100, 100]) + 4; continue; }
        const prox = T.find(x => x.data > t.data && x.acao !== "corrigir"), corr = T.filter(x => x.acao === "corrigir" && x.data > t.data && (!prox || x.data < prox.data));
        for(const x of ck){ const p = ckProb(x), cat = x.cat || (x.r === "acabamento" ? "acabamento" : "construtivo");
          espaco(7); pdf.setDrawColor(235); pdf.line(M, y + 5, W - M, y + 5);
          txt(x.item, M + 1, 9, p ? "bold" : "normal", [40, 40, 40], 110); txt(CK_CAT_CURTO[cat] || "", M + 115, 8, "normal", [110, 110, 110], 30);
          txt(p ? "Reprovado" : x.h ? "Aprovado antes" : "Aprovado", M + 150, 9, "bold", p ? [198, 40, 40] : [46, 125, 50], 32); y += 6.5;
          if(!p) continue;
          if(x.com){ espaco(6); y += txt(`Problema: ${x.com}`, M + 4, 8.5, "italic", [70, 70, 70], CW - 4) + 1.5; }
          await fotos(x.fotos, M + 4);
          let k2 = null; for(const c of corr){ const z = (c.checklist || []).find(q => q.item === x.item && q.r === "cor"); if(z){ k2 = { c, z }; break; } }
          if(k2){ espaco(8); y += txt(`Correção em ${fmtDTL(new Date(k2.c.data))} por ${nomeUsuario(k2.c.autor)}${k2.z.com ? ": " + k2.z.com : ""}`, M + 4, 8.5, "bold", [21, 101, 192], CW - 4) + 1.5; await fotos(k2.z.fotos, M + 4); }
          else if(corr.length){ espaco(6); y += txt(`Correção em ${fmtDTL(new Date(corr[0].data))} por ${nomeUsuario(corr[0].autor)} (sem registro por item)`, M + 4, 8.5, "normal", [21, 101, 192], CW - 4) + 2; }
          else { espaco(6); y += txt("Correção pendente", M + 4, 8.5, "bold", [230, 120, 0]) + 2; }
        }
        y += 4;
      }
    }
    const n = pdf.getNumberOfPages(); for(let i = 1; i <= n; i++){ pdf.setPage(i); pdf.setFont("helvetica", "normal"); pdf.setFontSize(8); pdf.setTextColor(140); pdf.text(`${i} / ${n}`, W - M, 292, { align:"right" }); }
    pdf.save(`Vistoria Qualidade (CEF) - ${obra.nome} - ${blocos.join(", ")} - ${fmtData(new Date()).replace(/\//g, "-")}.pdf`);
    toast("Sucesso", "Relatório da Vistoria Qualidade baixado", `${us.length} unidades · ${n} páginas`);
  }catch(e){ console.error(e); toast("Erro", "Não foi possível gerar o relatório", msgErro(e)); }
  S.carregando = ""; render();
}
