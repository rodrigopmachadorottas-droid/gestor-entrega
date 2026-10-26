/* =====================================================================
   FLUXOGRAMA (Unidades e Áreas comuns)
   Desenho vindo do app de fluxogramas do Rodrigo (exportado para o
   Power Apps). Aqui: etapa em que a pessoa logada pode fazer alguma ação
   = laranja; as outras = cinza; o que não existe nesta obra (teste que a
   obra não faz, vistoria prévia) fica apagadinho. Acima de cada etapa,
   o cargo responsável.
   ===================================================================== */
const FX = { laranja:"#FF9114", cinza:"#E3E3E3", verde:"#4CAF50", vermelho:"#F44336", azul:"#2E7EDF", txt:"#323130", sub:"#706F6E" };
const FX_ICON = {
  ok:`<path d='M3.2 6.3 L5.2 8.3 L8.9 4' fill='none' stroke='#fff' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'/>`,
  av:`<path d='M3 6 H9 M6.4 3.4 L9 6 L6.4 8.6' fill='none' stroke='#fff' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/>`,
  x:`<path d='M3.8 3.8 L8.2 8.2 M8.2 3.8 L3.8 8.2' fill='none' stroke='#fff' stroke-width='1.6' stroke-linecap='round'/>`
};
const FX_ESTILO = `<style>.tt{font-family:sans-serif;font-size:10.5px;font-weight:600;text-anchor:middle;}.rr{font-family:sans-serif;font-size:9px;font-weight:600;}.ln{stroke:#706F6E;stroke-width:1.6;fill:none;}.lnd{stroke:#ADADAC;stroke-width:1.6;fill:none;stroke-dasharray:6,5;}</style>
  <defs><marker id='a1' viewBox='0 0 12 12' refX='8.6' refY='6' markerWidth='8.5' markerHeight='8.5' orient='auto-start-reverse'><path d='M3.5 3 L8.6 6 L3.5 9' fill='none' stroke='#706F6E' stroke-width='1.35' stroke-linecap='round' stroke-linejoin='round'/></marker>
  <marker id='a2' viewBox='0 0 12 12' refX='8.6' refY='6' markerWidth='8.5' markerHeight='8.5' orient='auto-start-reverse'><path d='M3.5 3 L8.6 6 L3.5 9' fill='none' stroke='#ADADAC' stroke-width='1.35' stroke-linecap='round' stroke-linejoin='round'/></marker></defs>`;
// linha reta com "curvinha" igual ao desenho original: só os pontos-chave
const fxH = (x1, y, x2) => `M ${x1} ${y} L ${x2} ${y}`;
const fxV = (x, y1, y2) => `M ${x} ${y1} L ${x} ${y2}`;

/* ---------- desenho (dados do fluxograma) ---------- */
// caixa: [x, y, rótulo (| quebra linha), chave, cargo embaixo?]
function fxDefsUnidade(){
  return {
    vb:[75, -16, 2211, 534],
    linhas:[
      ["ln", fxH(331, 243, 376), ["lib", "t"]],
      ["ln", "M 391 228 L 391 189 Q 391 182 398 182 L 430 182", ["lib", "aguafria"]],
      ["ln", fxH(406, 243, 430), ["lib", "eletrico"]],
      ["lnd", "M 391 258 L 391 297 Q 391 304 398 304 L 431 304", ["lib", "dreno"]],
      ["lnd", "M 391 258 L 391 358 Q 391 365 398 365 L 430 365", ["lib", "gas"]],
      ["ln", "M 391 228 L 391 128 Q 391 121 398 121 L 430 121", ["lib", "esgoto"]],
      ["ln", "M 590 182 L 626 182 Q 633 182 633 189 L 633 228", ["aguafria", "fin"]],
      ["ln", fxH(590, 243, 618), ["eletrico", "fin"]],
      ["lnd", "M 591 304 L 626 304 Q 633 304 633 297 L 633 258", ["dreno", "fin"]],
      ["lnd", "M 590 365 L 626 365 Q 633 365 633 358 L 633 258", ["gas", "fin"]],
      ["ln", "M 590 121 L 626 121 Q 633 121 633 128 L 633 228", ["esgoto", "fin"]],
      ["ln", fxH(648, 243, 675), ["fin"]],
      ["ln", fxH(835, 243, 885), ["fin", "vq"]],
      ["ln", fxV(965, 266, 310), ["vq", "c13"]],
      ["ln", fxV(1027, 310, 266), ["c13", "vq"]],
      ["lnd", fxH(1045, 243, 1090), ["vq", "previa"]],
      ["ln", fxV(1170, 266, 310), ["previa", "c11"]],
      ["ln", fxV(1232, 310, 266), ["c11", "previa"]],
      ["ln", fxH(1250, 243, 1295), ["previa", "ag"]],
      ["ln", fxH(1455, 243, 1510), ["ag", "vc"]],
      ["ln", fxV(1375, 310, 266), ["c7", "ag"]],
      ["ln", "M 1590 266 L 1590 326 Q 1590 333 1583 333 L 1455 333", ["vc", "c7"]],
      ["ln", fxH(1670, 243, 1716), ["vc", "neg"]],
      ["ln", "M 1731 258 L 1731 277 Q 1731 284 1738 284 L 1850 284", ["vc", "neg"]],
      ["ln", "M 1731 228 L 1731 215 Q 1731 208 1738 208 L 2060 208", ["vc"]],
      ["ln", fxH(2010, 284, 2045), ["neg", "chaves"]],
      ["ln", fxV(2125, 261, 230), ["chaves"]]
    ],
    caixas:[
      [171, 220, "Liberação de Testes", "lib"],
      [430, 98, "Teste Esgoto", "esgoto"],
      [430, 159, "Teste Água Fria", "aguafria"],
      [430, 220, "Teste Elétrico", "eletrico"],
      [431, 281, "Teste Dreno Ar", "dreno"],
      [430, 342, "Teste Gás", "gas"],
      [675, 220, "Finalizando Unidade", "fin"],
      [885, 220, "Vistoria Qualidade", "vq"],
      [885, 310, "Correções Obra", "c13", true],
      [1090, 220, "Vistoria Prévia", "previa"],
      [1090, 310, "Correções Obra", "c11", true],
      [1295, 220, "Agendamento|com Cliente", "ag"],
      [1295, 310, "Correção Obra", "c7"],
      [1510, 220, "Vistoria Cliente", "vc"],
      [1850, 261, "Negociação Financeira", "neg"],
      [2045, 261, "Entrega de Chaves", "chaves", true]
    ],
    losangos:[["M 391 228 L 406 243 L 391 258 L 376 243 Z", ["t"]], ["M 633 228 L 648 243 L 633 258 L 618 243 Z", ["fin"]]],
    extra:`<path d='M 1731 228 L 1746 243 L 1731 258 L 1716 243 Z' fill='none' stroke='#323130' stroke-width='1.8'/><text x='1731' y='247.5' text-anchor='middle' style='font-family:sans-serif;font-size:13px;font-weight:700;fill:#323130;'>?</text>
      <rect x='2060' y='186' width='130' height='44' rx='22' fill='#323130'/><text x='2125' y='212' class='tt' fill='#ffffff'>Concluída</text>
      <text x='450' y='420' style='font-family:sans-serif;font-size:14px;font-weight:700;fill:#323130;'>Validação Técnica</text>
      <text x='1789' y='276' class='rr' text-anchor='middle' fill='#706F6E'>Unidade Bloqueada</text><text x='1788' y='200' class='rr' text-anchor='middle' fill='#706F6E'>Unidade Liberada</text>`,
    bolas:[
      [331, 243, "ok", ["lib"]], [590, 121, "ok", ["esgoto"]], [590, 182, "ok", ["aguafria"]], [590, 243, "ok", ["eletrico"]], [591, 304, "ok", ["dreno"]], [590, 365, "ok", ["gas"]],
      [835, 243, "ok", ["fin"]], [965, 266, "x", ["vq"]], [1027, 310, "ok", ["c13"]], [1045, 243, "ok", ["vq", "previa"]], [1170, 266, "x", ["previa"]], [1232, 310, "ok", ["c11"]],
      [1250, 243, "ok", ["previa"]], [1455, 243, "av", ["ag"]], [1375, 291, "ok", ["c7"]], [1590, 266, "x", ["vc"]], [1670, 243, "ok", ["vc"]], [2010, 284, "ok", ["neg"]], [2125, 261, "av", ["chaves"]]
    ]
  };
}
function fxDefsArea(){
  return {
    vb:[839, 144, 1250, 280],
    linhas:[
      ["ln", fxH(1049, 243, 1096)], ["ln", fxH(1256, 243, 1301)], ["ln", fxH(1461, 243, 1506)], ["ln", fxH(1666, 243, 1707)], ["ln", fxH(1867, 243, 1909)],
      ["ln", fxV(1176, 266, 310)], ["ln", fxV(1238, 310, 266)], ["ln", fxV(1381, 266, 310)], ["ln", fxV(1443, 310, 266)], ["ln", fxV(1586, 266, 310)], ["ln", fxV(1648, 310, 266)],
      ["ln", "M 1787 266 L 1787 326 Q 1787 333 1780 333 L 1666 333"]
    ],
    caixas:[
      [889, 220, "Liberação Local", "lib"], [1096, 220, "Vistoria Qualidade", "vq"], [1301, 220, "Vistoria Arquitetura", "arq"],
      [1506, 220, "Agendamento com|Síndico", "ag"], [1707, 220, "Vistoria do Síndico", "sind"],
      [1096, 310, "Correções Obra", "corr", true], [1301, 310, "Correções Obra", "corr", true], [1506, 310, "Correções Obra", "corr", true]
    ],
    losangos:[],
    extra:`<rect x='1909' y='221' width='130' height='44' rx='22' fill='#323130'/><text x='1974' y='247' class='tt' fill='#ffffff'>Concluída</text>`,
    bolas:[[1049, 243, "ok"], [1256, 243, "ok"], [1461, 243, "ok"], [1666, 243, "av"], [1867, 243, "ok"], [1176, 266, "x"], [1238, 310, "ok"], [1381, 266, "x"], [1443, 310, "ok"], [1586, 266, "x"], [1648, 310, "ok"], [1787, 266, "x"]]
  };
}
// cargo responsável e quem pode agir em cada etapa
const FX_CARGO_UND = { lib:[["obra"], "Obra"], esgoto:[["instalacoes"], "Instalações"], aguafria:[["instalacoes"], "Instalações"], eletrico:[["instalacoes"], "Instalações"],
  dreno:[["instalacoes"], "Instalações"], gas:[["instalacoes"], "Instalações"], fin:[["obra"], "Obra"], vq:[["qualidade"], "Qualidade"], c13:[["obra"], "Obra"],
  previa:[["qualidade"], "Qualidade"], c11:[["obra"], "Obra"], ag:[["rc"], "RC"], c7:[["obra"], "Obra"], vc:[["qualidade", "obra"], "Qualidade · Obra"],
  neg:[["financeiro"], "Financeiro"], chaves:[["rc"], "RC"] };
const FX_CARGO_AC = { lib:[["obra"], "Obra"], vq:[["qualidade"], "Qualidade"], arq:[["arquitetura"], "Arquitetura"], ag:[["rc"], "RC"], sind:[["qualidade"], "Qualidade"], corr:[["obra"], "Obra"] };

function fxSvg(tipo, escala){
  const und = tipo === "und", D = und ? fxDefsUnidade() : fxDefsArea(), C = und ? FX_CARGO_UND : FX_CARGO_AC, u = ME(), cfg = OBRA().config;
  // existe nesta obra? (testes que a obra não faz e vistoria prévia ficam apagados)
  const existe = k => !und ? true : TESTES.some(t => t.k === k) ? cfg.testes.includes(k) : (k === "previa" || k === "c11") ? !!cfg.previa : true;
  const op = ks => (ks || []).every(existe) ? 1 : 0.4;
  const pode = k => can(u, "admin") || can(u, ...C[k][0]);
  const [vx, vy, vw, vh] = D.vb;
  const linhas = D.linhas.map(([c, d, ks]) => `<g opacity='${op(ks)}'><path class='${c}' d='${d}' marker-end='url(#${c === "lnd" ? "a2" : "a1"})'/></g>`).join("");
  const losangos = D.losangos.map(([d, ks]) => `<g opacity='${op(ks)}'><path d='${d}' fill='#323130'/></g>`).join("");
  const caixas = D.caixas.map(([x, y, rot, k, embaixo]) => {
    const on = pode(k) && existe(k), L = rot.split("|"), cor = on ? FX.laranja : FX.cinza, tc = on ? "#ffffff" : FX.txt;
    const cargo = `<text ${embaixo ? "x='0' y='58' text-anchor='start'" : "x='160' y='-7' text-anchor='end'"} class='rr' fill='${on ? FX.laranja : FX.sub}'>${esc(C[k][1])}</text>`;
    const txt = L.length > 1 ? `<text x='80' y='21' class='tt' fill='${tc}'>${esc(L[0])}</text><text x='80' y='35' class='tt' fill='${tc}'>${esc(L[1])}</text>` : `<text x='80' y='27' class='tt' fill='${tc}'>${esc(L[0])}</text>`;
    return `<g transform='translate(${x},${y})' opacity='${existe(k) ? 1 : 0.4}'>${cargo}<rect x='0' y='0' width='160' height='46' rx='4' fill='${cor}'/>${txt}</g>`; }).join("");
  const bolas = D.bolas.map(([cx, cy, ic, ks]) => `<g opacity='${op(ks)}'><circle cx='${cx}' cy='${cy}' r='9' fill='${ic === "x" ? FX.vermelho : ic === "av" ? FX.azul : FX.verde}'/><g transform='translate(${cx - 6},${cy - 6})'>${FX_ICON[ic]}</g></g>`).join("");
  return `<svg width='${Math.round(vw * escala)}' height='${Math.round(vh * escala)}' style='width:${Math.round(vw * escala)}px;height:${Math.round(vh * escala)}px' viewBox='${vx} ${vy} ${vw} ${vh}' xmlns='http://www.w3.org/2000/svg' role='img' aria-label='Fluxograma ${und ? "das unidades" : "das áreas comuns"}'>${FX_ESTILO}${linhas}${losangos}${caixas}${D.extra}${bolas}</svg>`;
}

/* ---------- popup com zoom ---------- */
function popupFluxo(){
  const F = S.fluxo, und = F.tipo === "und", esc2 = F.zoom / 100;
  return `<div class="modal" role="dialog" aria-modal="true" aria-label="Fluxograma"><div class="scrim" data-act="fluxofechar"></div><div class="box tall fluxo">
    <div class="mhead"><div class="t"><b class="conf-t">Fluxograma · ${und ? "Unidades" : "Áreas comuns"}</b><div class="small muted">${esc(OBRA().nome)}</div></div><button class="iconbtn" data-act="fluxofechar" aria-label="Fechar">${IC.close}</button></div>
    <div class="fluxo-bar"><label class="fluxo-zoom">${IC.search}<span>Zoom</span><input type="range" min="40" max="200" step="10" value="${F.zoom}" data-fluxozoom aria-label="Zoom"><b class="tnum" id="fluxo-pct">${F.zoom}%</b></label>
      <span class="fluxo-leg"><i style="background:${FX.laranja}"></i>Você pode agir<i style="background:${FX.cinza}"></i>Outros cargos${und ? `<i class="apagado"></i>Não se aplica a esta obra` : ""}</span></div>
    <div class="mbody fluxo-area" id="fluxo-area" data-keep-scroll><div class="fluxo-tela" id="fluxo-tela">${fxSvg(F.tipo, esc2)}</div></div></div></div>`;
}
function abrirFluxo(tipo){ const w = window.innerWidth; S.fluxo = { tipo, zoom:w < 700 ? 60 : tipo === "und" ? 80 : 110 }; S.menuAcoes = false; S.menuAc = false; }

/* ---------- liberar áreas comuns em lote ---------- */
const acLiberaveis = () => DB.areas.filter(a => a.id_obra === S.obraId && blank(a.rep_vistoria_qualidade));
function acLoteBar(){
  const n = S.acLote.q.length, todas = acLiberaveis().length;
  return `<div class="lotebar"><b>Liberar áreas em lote</b><span class="small">Toque nas áreas para marcar. ${n} selecionada(s).</span>${n ? `<button class="linkbtn small" data-act="aclotelimpar">Limpar</button>` : todas ? `<button class="linkbtn small" data-act="aclotetodas">Marcar todas (${todas})</button>` : ""}<span class="spacer"></span>
    <button class="btn ghost sm" data-act="aclotecancel">Cancelar</button><button class="btn primary sm" data-act="aclotesalvar" ${n ? "" : "disabled"}>Liberar ${n || ""}</button></div>`;
}

Object.assign(ACOES_EXTRA, {
  fluxound(){ abrirFluxo("und"); },
  fluxoac(){ abrirFluxo("ac"); },
  fluxofechar(){ S.fluxo = null; },
  menuac(){ S.menuAc = !S.menuAc; },
  acloteon(){ S.menuAc = false; if(!acLiberaveis().length){ toast("Aviso", "Nenhuma área para liberar", "Todas já foram liberadas para a Vistoria Qualidade."); return; } S.acLote = { on:true, q:[] }; },
  aclotecancel(){ S.acLote = null; },
  aclotelimpar(){ S.acLote.q = []; },
  aclotetodas(){ S.acLote.q = acLiberaveis().map(a => a.id); },
  aclotecel(el, id, e){ if(e) e.stopPropagation(); const q = S.acLote.q, i = q.indexOf(id); if(i >= 0) q.splice(i, 1); else q.push(id); },
  aclotesalvar(){ let n = 0; S.acLote.q.forEach(id => { const a = DB.areas.find(x => x.id === id); if(a && blank(a.rep_vistoria_qualidade)){ executarAcaoAC(a, "liberar", "", { autor:S.user, obs:"Liberação em lote" }); n++; } });
    saveDB(); S.acLote = null; toast("Sucesso", `${n} área(s) liberada(s) para a Vistoria Qualidade`); }
});
INPUT_EXTRA.push((t, ev) => {
  if(!t.hasAttribute || !t.hasAttribute("data-fluxozoom") || !S.fluxo) return false;
  S.fluxo.zoom = +t.value; const tela = document.getElementById("fluxo-tela"), p = document.getElementById("fluxo-pct");
  if(tela) tela.innerHTML = fxSvg(S.fluxo.tipo, S.fluxo.zoom / 100); if(p) p.textContent = S.fluxo.zoom + "%";
  return true;
});
document.addEventListener("keydown", e => { if(e.key !== "Escape" || !S.fluxo) return; e.stopImmediatePropagation(); S.fluxo = null; render(); }, true);
