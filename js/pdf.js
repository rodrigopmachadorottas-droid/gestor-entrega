/* =====================================================================
   PDF dos Indicadores · A4 deitado, baixado direto (sem a tela de imprimir)
   O usuário escolhe as visões (e, na Visão Unidades, as etapas). Cada
   etapa/visão vira uma página; a Visão Unidades se divide em mais páginas
   se os blocos não couberem legíveis numa só. As páginas são montadas em
   HTML, fotografadas (html2canvas) e juntadas num PDF (jsPDF).
   ===================================================================== */
const PDF_COR = { ok:"rgba(76,175,80,.42)", bad:"rgba(244,67,54,.40)", info:"rgba(46,126,223,.38)", warn:"rgba(255,152,0,.42)" };
const corPdf = s => PDF_COR[stClass(s)] || "#D1D0D0";
const PDF_W = 1062, PDF_H = 733, PDF_GAP = 14;      // A4 deitado menos 8 mm de margem, em px (96 dpi)
const PDF_VISOES = [["unid","Visão Unidades"],["geral","Visão Geral"],["aprov","Visão Aprovações"],["usuarios","Dados por usuário"]];

/* ---------- carregamento das bibliotecas (só quando gera o PDF) ---------- */
function carregarScript(src){ return new Promise((ok, falha) => { if(document.querySelector(`script[src="${src}"]`)) return ok(); const s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = () => falha(new Error("Não foi possível carregar " + src)); document.head.appendChild(s); }); }
async function libsPdf(){ await carregarScript("js/vendor/html2canvas.min.js"); await carregarScript("js/vendor/jspdf.umd.min.js"); }

/* ---------- popup de configuração ---------- */
function abrirPdfCfg(){ S.pdfCfg = { visoes:{ unid:true, geral:false, aprov:false, usuarios:false }, etapas:[S.ind.etapa] }; }
function popupPdfCfg(){
  const C = S.pdfCfg, ops = indEtapas(), lider = can(ME(), "admin", "lider");
  const vis = PDF_VISOES.filter(([k]) => k !== "usuarios" || lider);
  const nPag = (C.visoes.unid ? C.etapas.length : 0) + ["geral","aprov","usuarios"].filter(k => C.visoes[k]).length;
  return `<div class="modal" role="dialog" aria-modal="true" aria-label="Gerar PDF"><div class="scrim" data-act="pdfcfgfechar"></div><div class="box sm2">
    <div class="mhead"><div class="t"><b class="conf-t">Gerar PDF</b><div class="small muted">${esc(OBRA().nome)} · A4 deitado · cada visão (ou etapa) em uma página</div></div><button class="iconbtn" data-act="pdfcfgfechar" aria-label="Fechar">${IC.close}</button></div>
    <div class="mbody"><div class="field"><label>Visões</label>${vis.map(([k, l]) => `<label class="chk"><input type="checkbox" data-pdfv="${k}" ${C.visoes[k] ? "checked" : ""}>${l}</label>`).join("")}</div>
      ${C.visoes.unid ? `<div class="field"><div class="row"><label style="margin:0">Etapas da Visão Unidades</label><span class="spacer"></span><button class="linkbtn" data-act="pdfetapas">${C.etapas.length === ops.length ? "Desmarcar todas" : "Marcar todas"}</button></div>
        <div class="pdf-etapas">${ops.map(o => `<label class="chk"><input type="checkbox" data-pdfe="${o.id}" ${C.etapas.includes(o.id) ? "checked" : ""}>${esc(o.nome)}</label>`).join("")}</div></div>` : ""}
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
function paginasUnidades(op){
  const obra = OBRA(), corr = corrigidosSet(), blocos = blocosInd(), us = unidadesInd().filter(x => blocos.includes(nivel1Nome(x))), leg = LEGENDAS[op.tipo];
  if(!blocos.length) return [];
  const stAll = us.map(x => statusInd(x, op, corr)), pct = (n, t) => t ? ` (${Math.round(n / t * 100)}%)` : "";
  const blocoHTML = b => {
    const ub = us.filter(x => nivel1Nome(x) === b), linhas = linhasBloco(ub, obra.config), cols = Math.max(1, ...linhas.map(r => r.length));
    const st = ub.map(x => statusInd(x, op, corr));
    const tiles = linhas.map(r => r.map(x => `<div style="background:${corPdf(statusInd(x, op, corr))}">${esc(x.unidade.replace(/^(AP|CASA) /, ""))}</div>`).join("")
      + (r.length < cols ? "<span></span>".repeat(cols - r.length) : "")).join("");
    return `<div class="pdf-b"><div class="pdf-tiles" style="grid-template-columns:repeat(${cols},40px)">${tiles}</div>
      <h4>${esc(b)} <span>(${ub.length})</span></h4>
      <div class="lg">${leg.map(l => { const n = st.filter(s => s === l).length; return n ? `<span><i style="background:${corPdf(l)}"></i>${esc(l)} ${n}</span>` : ""; }).join("")}</div></div>`;
  };
  const sub = `Etapa: <b>${esc(op.nome)}</b> · ${blocos.length} ${obra.config.tipo === "casa" ? "quadras" : "blocos"} · ${us.length} unidades`;
  const leg2 = `<div class="pdf-leg">${leg.map(l => { const n = stAll.filter(s => s === l).length; return `<span><i style="background:${corPdf(l)}"></i>${esc(l)}: <b>${n}</b>${pct(n, stAll.length)}</span>`; }).join("")}</div>`;
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
  if(C.visoes.unid) ops.filter(o => C.etapas.includes(o.id)).forEach(op => paginas.push(...paginasUnidades(op)));
  if(C.visoes.geral) paginas.push(paginaConteudo("Visão Geral", "Número de unidades por fase e etapa", indGeral()));
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
