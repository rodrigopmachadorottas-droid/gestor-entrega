/* =====================================================================
   PDF da Visão Unidades (Indicadores) · A4 deitado
   Monta todos os blocos numa área de impressão, escolhe o número de
   colunas e o tamanho que mais preenchem a folha e abre "Imprimir"
   (o usuário escolhe "Salvar como PDF"). Se não couber legível numa
   folha só, divide em várias páginas.
   ===================================================================== */
const PDF_COR = { ok:"rgba(76,175,80,.42)", bad:"rgba(244,67,54,.40)", info:"rgba(46,126,223,.38)", warn:"rgba(255,152,0,.42)" };
const corPdf = s => PDF_COR[stClass(s)] || "#D1D0D0";
const PDF_W = 1062, PDF_H = 733, PDF_GAP = 14;      // A4 deitado menos 8 mm de margem, em px (96 dpi)

function gerarPdfUnidades(opcoes = {}){
  const I = S.ind, op = indEtapas().find(o => o.id === I.etapa), obra = OBRA();
  const corr = corrigidosSet(), blocos = blocosInd(), us = unidadesInd().filter(x => blocos.includes(nivel1Nome(x))), leg = LEGENDAS[op.tipo];
  if(!blocos.length){ toast("Aviso", "Nenhum bloco para gerar o PDF"); return; }
  const stAll = us.map(x => statusInd(x, op, corr));
  const pct = (n, t) => t ? ` (${Math.round(n / t * 100)}%)` : "";

  const blocoHTML = b => {
    const ub = us.filter(x => nivel1Nome(x) === b), rows = {};
    ub.forEach(x => { (rows[x.nivel_2] = rows[x.nivel_2] || []).push(x); });
    const ks = Object.keys(rows).map(Number).sort((a, c) => c - a), cols = Math.max(1, ...ks.map(k => rows[k].length));
    const st = ub.map(x => statusInd(x, op, corr));
    const tiles = ks.map(k => rows[k].sort((a, c) => numUnd(a.unidade) - numUnd(c.unidade))
      .map(x => `<div style="background:${corPdf(statusInd(x, op, corr))}">${esc(x.unidade.replace(/^(AP|CASA) /, ""))}</div>`).join("")
      + (rows[k].length < cols ? "<span></span>".repeat(cols - rows[k].length) : "")).join("");
    return `<div class="pdf-b"><div class="pdf-tiles" style="grid-template-columns:repeat(${cols},40px)">${tiles}</div>
      <h4>${esc(b)} <span>(${ub.length})</span></h4>
      <div class="lg">${leg.map(l => { const n = st.filter(s => s === l).length; return n ? `<span><i style="background:${corPdf(l)}"></i>${esc(l)} ${n}</span>` : ""; }).join("")}</div></div>`;
  };
  const cab = `<header class="pdf-h"><img src="${LOGOS.preta}" alt=""><div><b>${esc(obra.nome)} · Visão Unidades</b>
      <span>Etapa: <b>${esc(op.nome)}</b> · ${blocos.length} ${obra.config.tipo === "casa" ? "quadras" : "blocos"} · ${us.length} unidades · gerado em ${fmtDTL(new Date())} por ${esc(nomeUsuario(REAL_USER))}</span></div></header>
    <div class="pdf-leg">${leg.map(l => { const n = stAll.filter(s => s === l).length; return `<span><i style="background:${corPdf(l)}"></i>${esc(l)}: <b>${n}</b>${pct(n, stAll.length)}</span>`; }).join("")}</div>`;

  // 1) mede os blocos no tamanho natural
  document.getElementById("print")?.remove();
  const box = document.createElement("div"); box.id = "print"; box.className = "medindo";
  box.innerHTML = `<div class="pdf-page" style="height:auto">${cab}</div><div class="pdf-grid medir">${blocos.map(blocoHTML).join("")}</div>`;
  document.body.appendChild(box);
  const els = [...box.querySelectorAll(".pdf-grid.medir .pdf-b")];
  const bw = Math.max(...els.map(e => e.offsetWidth)), bh = Math.max(...els.map(e => e.offsetHeight));
  const H = PDF_H - box.querySelector(".pdf-page").offsetHeight - 6, W = PDF_W, n = els.length;

  // 2) escolhe colunas e escala que mais preenchem uma folha
  const escala = (c, r) => Math.min((W - PDF_GAP * (c - 1)) / (c * bw), (H - PDF_GAP * (r - 1)) / (r * bh));
  let best = null;
  for(let c = 1; c <= n; c++){ const r = Math.ceil(n / c), s = escala(c, r); if(!best || s > best.s) best = { c, r, s }; }
  let paginas;
  if(best.s >= 0.6){
    paginas = [{ c: best.c, s: Math.min(best.s, 2.2), itens: blocos }];
  } else {                                            // não fica legível numa folha: várias páginas a ~80%
    const alvo = 0.8;
    const c = Math.max(1, Math.floor((W + PDF_GAP) / (bw * alvo + PDF_GAP)));
    const rp = Math.max(1, Math.floor((H + PDF_GAP) / (bh * alvo + PDF_GAP)));
    const s = Math.min(escala(c, rp), 1.4), por = c * rp;
    paginas = [];
    for(let i = 0; i < n; i += por) paginas.push({ c, s, itens: blocos.slice(i, i + por) });
  }

  // 3) monta as páginas definitivas
  box.className = "";
  box.innerHTML = paginas.map((p, i) => `<section class="pdf-page">${cab.replace("</b>\n", paginas.length > 1 ? ` · página ${i + 1} de ${paginas.length}</b>\n` : "</b>\n")}
    <div class="pdf-area"><div class="pdf-grid" style="grid-template-columns:repeat(${p.c},${bw}px);gap:${PDF_GAP / p.s}px;zoom:${p.s.toFixed(3)}">${p.itens.map(blocoHTML).join("")}</div></div></section>`).join("");

  if(opcoes.semImprimir) return paginas;
  const tituloAntes = document.title;
  document.title = `Indicadores ${obra.nome} - ${op.nome} - ${fmtData(new Date()).replace(/\//g, "-")}`;
  const limpar = () => { document.title = tituloAntes; box.remove(); window.removeEventListener("afterprint", limpar); };
  window.addEventListener("afterprint", limpar);
  setTimeout(() => window.print(), 50);
  return paginas;
}
