/* =====================================================================
   INDICADORES · VISÃO UNIDADES: status de cada unidade na etapa escolhida,
   cores, legenda (com ou sem repetição) e as explicações (tooltip).
   Usado na tela e no PDF.
   ===================================================================== */
const RGB = { ok:[76,175,80], bad:[244,67,54], info:[46,126,223], warn:[255,152,0], neutral:[142,141,140], prev:[214,120,0] };
const COR_ETAPA = { 1:[150,160,172], 2:[110,135,165], 3:[80,105,140], 4:[90,165,240], 41:[50,125,215], 5:[255,196,90], 6:[255,150,50], 7:[235,105,95], 8:[180,145,235], 9:[140,95,210], 10:[120,200,130], 11:[56,142,60] };
const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const alfaRep = n => n >= 4 ? .95 : [0, .3, .55, .78][n] || .38;
// etapas em que a "Etapa atual" tem repetição: coluna que conta as vezes
const REP_ETAPA = { 4:"rep_vistoria_at", 41:"rep_vistoria_previa", 5:"agendamento", 6:"rep_vistoria_cliente" };
const ORIGEM_CORR = u => has(u.rep_vistoria_cliente, "Reprovado") ? "Vistoria Cliente" : has(u.rep_vistoria_previa, "Reprovado") ? "Vistoria Prévia" : "Vistoria Qualidade";

function basesInd(op){
  const cfg = OBRA().config;
  switch(op.tipo){
    case "rep": return ["Não Liberado", "Pendente", "Aprovado", "Reprovado"];
    case "ag": return ["Não Liberado", "Pendente", "Agendado", "Concluído"];
    case "fin": return ["Não Liberado", "Pendente", "Finalizado"];
    case "corr": return ["N/A", "Pendente · Vistoria Qualidade", ...(cfg.previa ? ["Pendente · Vistoria Prévia"] : []), "Pendente · Vistoria Cliente", "Corrigido"];
    case "finsit": return ["Sem cliente", "Pendente", "Liberado", "Bloqueado"];
    case "atual": return ETAPAS.filter(e => e.c !== 41 || cfg.previa).map(e => e.n);
  }
  return [];
}
const repSuporta = op => op && ["rep", "ag", "atual"].includes(op.tipo);
// status da unidade na etapa (com " 2°" no fim quando considera a repetição)
function statusUnd(u, op, corr, rep){
  let b, n = 0;
  switch(op.tipo){
    case "fin": b = u.sub_etapa < 3 ? "Não Liberado" : u.sub_etapa === 3 ? "Pendente" : "Finalizado"; break;
    case "ag": { const v = u.agendamento; b = blank(v) ? "Não Liberado" : v === "Pendente" ? "Pendente" : has(v, "/") ? "Agendado" : "Concluído";
      if(rep && (b === "Pendente" || b === "Agendado")) n = repN(u.rep_vistoria_cliente) || 1; break; }
    case "corr": b = u.sub_etapa === 7 ? "Pendente · " + ORIGEM_CORR(u) : corr.has(u.id) ? "Corrigido" : "N/A"; break;
    case "finsit": b = u.id_cliente ? finStatus(u) : "Sem cliente"; break;
    case "atual": { const e = ETAPA[u.sub_etapa]; b = e ? e.n : "?"; const c = REP_ETAPA[u.sub_etapa];
      if(rep && c) n = c === "agendamento" ? (repN(u.rep_vistoria_cliente) || 1) : repN(u[c]); break; }
    default: { const v = u[op.coluna]; b = blank(v) ? "Não Liberado" : has(v, "Pendente") ? "Pendente" : has(v, "Aprovado") ? "Aprovado" : "Reprovado"; if(rep && b !== "Não Liberado") n = repN(v); }
  }
  return n ? `${b} ${n}°` : b;
}
const separaRep = l => { const m = /^(.*) (\d+)°$/.exec(l); return m ? [m[1], +m[2]] : [l, 0]; };
function corItem(op, l){
  const [b, n] = separaRep(l);
  if(op.tipo === "atual"){ const e = ETAPAS.find(x => x.n === b); return rgba(e ? COR_ETAPA[e.c] : RGB.neutral, n ? alfaRep(n) : .55); }
  let c;
  if(op.tipo === "corr") c = b === "N/A" ? null : b === "Corrigido" ? RGB.ok : /Cliente/.test(b) ? RGB.bad : /Prévia/.test(b) ? RGB.prev : RGB.warn;
  else if(op.tipo === "finsit") c = { Pendente:RGB.warn, Liberado:RGB.ok, Bloqueado:RGB.bad }[b] || null;
  else { const k = stClass(b); c = k ? RGB[k] : null; }
  if(!c) return rgba(RGB.neutral, .28);
  return rgba(c, n ? alfaRep(n) : .4);
}
// itens da legenda, na ordem: base sem repetição, ou cada repetição que existe
function itensLegenda(op, sts, rep){
  const L = [];
  basesInd(op).forEach(b => {
    const reps = rep ? [...new Set(sts.filter(s => separaRep(s)[0] === b && separaRep(s)[1]).map(s => separaRep(s)[1]))].sort((x, y) => x - y) : [];
    if(reps.length) reps.forEach(n => L.push(`${b} ${n}°`)); else L.push(b);
  });
  return L.map(l => ({ l, cor:corItem(op, l), n:sts.filter(s => s === l).length, tip:tipItem(op, l) }));
}

/* ---------- explicações (tooltip) ---------- */
const DESC_ETAPA = { 1:"Ainda falta liberar algum teste de instalações.", 2:"Todos os testes liberados; aguardando a aprovação de todos.", 3:"Testes aprovados; aguardando a obra finalizar a unidade.",
  4:"Aguardando a vistoria da Qualidade.", 41:"Aguardando a vistoria prévia.", 5:"Aguardando o RC agendar a vistoria com o cliente.", 6:"Vistoria com o cliente agendada; aguardando o resultado.",
  7:"Reprovada em uma vistoria; a obra está corrigindo as pendências.", 8:"Aguardando a análise financeira.", 9:"Em negociação financeira com o cliente.", 10:"Pronta para a entrega das chaves.", 11:"Unidade entregue ao cliente." };
function tipItem(op, l){
  const [b, n] = separaRep(l), teste = (op.coluna || "").startsWith("rep_teste_"), oq = teste ? "teste" : "vistoria", nm = op.nome;
  const vez = n ? (teste ? ` É a ${n}ª tentativa do teste.` : ` É a ${n}ª vistoria.`) : "";
  if(op.tipo === "atual"){ const e = ETAPAS.find(x => x.n === b); return `${DESC_ETAPA[e && e.c] || ""}${n ? (e && (e.c === 5) ? ` Será a ${n}ª vistoria com o cliente.` : ` É a ${n}ª vez nesta etapa.`) : ""}`; }
  if(op.tipo === "finsit") return { "Sem cliente":"A unidade ainda não tem cliente vinculado, então não há análise financeira.", Pendente:"Tem cliente e a análise financeira ainda não foi concluída.",
    Liberado:"Financeiro liberado: pode seguir para a entrega das chaves.", Bloqueado:"Financeiro bloqueado: há pendência do cliente (veja o motivo na unidade)." }[b] || "";
  if(op.tipo === "corr"){ if(b === "N/A") return "Nunca passou por correções de obra."; if(b === "Corrigido") return "Já passou por correções de obra e elas foram concluídas.";
    const o = b.split(" · ")[1]; return `Reprovada na ${o}; a obra está corrigindo as pendências. Depois volta ${o === "Vistoria Cliente" ? "para o agendamento com o cliente" : `para a ${o}`}.`; }
  if(op.tipo === "fin") return { "Não Liberado":"A unidade ainda não aprovou todos os testes de instalações.", Pendente:"Todos os testes aprovados; aguardando a obra finalizar a unidade.", Finalizado:"A obra já finalizou a unidade e liberou para a vistoria da Qualidade." }[b] || "";
  if(op.tipo === "ag") return { "Não Liberado":"A unidade ainda não foi liberada para agendar a vistoria com o cliente.", Pendente:`Liberada; aguardando o RC agendar a vistoria com o cliente.${n > 1 ? ` Será a ${n}ª vistoria.` : ""}`,
    Agendado:`Vistoria com o cliente marcada e ainda não feita.${n > 1 ? ` É a ${n}ª vistoria.` : ""}`, Concluído:"A vistoria com o cliente foi feita e aprovada." }[b] || "";
  if(b === "Não Liberado") return teste ? "A unidade ainda não foi liberada para este teste." : `A unidade nunca chegou nesta etapa (${nm}).`;
  if(b === "Pendente") return (teste ? "Liberada para o teste e aguardando o resultado." : "Liberada para a vistoria e aguardando o resultado.") + vez;
  if(b === "Aprovado") return n ? `Aprovada na ${n}ª ${teste ? "tentativa" : "vistoria"}.` : `Já foi aprovada ${teste ? "no teste" : "na vistoria"}.`;
  if(b === "Reprovado") return `Reprovada${n ? ` na ${n}ª ${teste ? "tentativa" : "vistoria"}` : ""}; aguardando a obra corrigir as pendências.`;
  return "";
}
const legendaHTML = (itens, total, zeros) => itens.filter(i => zeros || i.n).map(i => `<span class="lg-it" tabindex="0" data-tip="${esc(i.tip)}"><i class="dot" style="background:${i.cor}"></i>${esc(i.l)}: <b class="tnum">${i.n}</b>${i.n && total ? ` <span class="muted tnum">(${Math.round(i.n / total * 100)}%)</span>` : ""}</span>`).join("");

/* ---------- tooltip bonito (um só, posicionado pelo JS para não sair da tela) ---------- */
(function(){
  let el = null, alvo = null;
  const mostrar = t => {
    const txt = t.getAttribute("data-tip"); if(!txt) return;
    if(!el){ el = document.createElement("div"); el.className = "tip"; el.setAttribute("role", "tooltip"); document.body.appendChild(el); }
    alvo = t; el.textContent = txt; el.classList.add("on");
    const r = t.getBoundingClientRect(), w = el.offsetWidth, h = el.offsetHeight;
    let x = r.left + r.width / 2 - w / 2; x = Math.max(8, Math.min(x, innerWidth - w - 8));
    let y = r.top - h - 10, baixo = false; if(y < 8){ y = r.bottom + 10; baixo = true; }
    el.style.left = x + "px"; el.style.top = y + "px"; el.classList.toggle("baixo", baixo);
    el.style.setProperty("--ax", Math.max(12, Math.min(w - 12, r.left + r.width / 2 - x)) + "px");
  };
  const esconder = () => { if(el) el.classList.remove("on"); alvo = null; };
  document.addEventListener("mouseover", e => { const t = e.target.closest && e.target.closest("[data-tip]"); if(t && (t !== alvo || !el.classList.contains("on"))) mostrar(t); else if(!t && alvo) esconder(); });
  document.addEventListener("focusin", e => { const t = e.target.closest && e.target.closest("[data-tip]"); if(t) mostrar(t); });
  document.addEventListener("focusout", esconder);
  document.addEventListener("scroll", esconder, true);
  document.addEventListener("click", e => { const t = e.target.closest && e.target.closest("[data-tip]"); if(t && "ontouchstart" in window){ alvo === t ? esconder() : mostrar(t); } });
})();

Object.assign(ACOES_EXTRA, { indrep(){ S.ind.rep = !S.ind.rep; } });
