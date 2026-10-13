/* =====================================================================
   DEFINIR FRASES (admin) · regras da frase da tela inicial
   1) Regras de dia da semana: se o dia bate, sorteia pela chance (%).
   2) Se nenhuma sair, usa a faixa de horário que contém a hora atual.
   Nas frases, @apelido vira um apelido sorteado da pessoa.
   Fica em config_global ("frases") e vale para todo mundo.
   ===================================================================== */
const DIAS_CURTOS = [[1,"Seg"],[2,"Ter"],[3,"Qua"],[4,"Qui"],[5,"Sex"],[6,"Sáb"],[0,"Dom"]];
const DIAS_NOMES = { 0:"Domingo", 1:"Segunda", 2:"Terça", 3:"Quarta", 4:"Quinta", 5:"Sexta", 6:"Sábado" };

function abrirFrasesCfg(){
  const n = new Date();
  S.fcfg = { rasc:JSON.parse(JSON.stringify(cfgFrases())), sujo:false, teste:{ dia:n.getDay(), hora:hhmm(n), nome:sorteia(meusApelidos()), res:null } };
  S.adminPanel = false; S.voltarFcfg = S.obraId ? S.screen : "home"; S.screen = "frases"; S.nav = false; S.popup = null;
}
// minutos do dia sem nenhuma faixa (para avisar)
function buracosHorario(H){
  const coberto = new Array(1440).fill(false), min = t => { const [h, m] = String(t || "").split(":").map(Number); return h * 60 + m; };
  H.forEach(r => { if(!/^\d{2}:\d{2}$/.test(r.ini) || !/^\d{2}:\d{2}$/.test(r.fim)) return; let a = min(r.ini), b = min(r.fim);
    if(a <= b) for(let i = a; i <= b; i++) coberto[i] = true; else { for(let i = a; i < 1440; i++) coberto[i] = true; for(let i = 0; i <= b; i++) coberto[i] = true; } });
  const out = []; let ini = null; const fmt = i => `${pad(Math.floor(i / 60))}:${pad(i % 60)}`;
  for(let i = 0; i <= 1440; i++){ const vazio = i < 1440 && !coberto[i]; if(vazio && ini === null) ini = i; if(!vazio && ini !== null){ out.push(`${fmt(ini)}–${fmt(i - 1)}`); ini = null; } }
  return out;
}
function telaFrases(){
  const F = S.fcfg, R = F.rasc, T = F.teste, buracos = buracosHorario(R.horarios);
  const head = `<header class="topbar"><button class="iconbtn" data-act="fcfgvoltar" aria-label="Voltar">${IC.back}</button><h1>Definir frases</h1>
    <button class="tb-btn" data-act="fcfgsalvar" ${F.sujo ? "" : "disabled"}>${IC.check}<span>Salvar alterações</span></button></header><div class="topspace"></div>`;
  const txt = (k, i, f, v, ph = "") => `<input class="inp" data-frk="${k}" data-fri="${i}" data-frf="${f}" value="${esc(v)}" placeholder="${esc(ph)}">`;
  const frases = (k, i, L) => `<div class="field"><label>Frases (uma por linha · ${L.length})</label><textarea class="inp" rows="${Math.min(8, Math.max(3, L.length + 1))}" data-frk="${k}" data-fri="${i}" data-frf="frases">${esc(L.join("\n"))}</textarea></div>`;
  const dias = R.dias.map((r, i) => `<div class="pc-card fr-card"><div class="pc-ch"><span class="pc-tipo">Dia da semana</span><span class="spacer"></span>
      <button class="iconbtn" data-act="frdel" data-k="dias" data-i="${i}" aria-label="Remover regra">${IC.trash}</button></div>
    <div class="fr-row"><div class="field" style="flex:1"><label>Nome</label>${txt("dias", i, "nome", r.nome)}</div>
      <div class="field" style="width:120px"><label>Chance (%)</label><input class="inp tnum" type="number" min="0" max="100" data-frk="dias" data-fri="${i}" data-frf="chance" value="${r.chance ?? 67}"></div></div>
    <div class="field"><label>Dias</label><div class="fr-dias">${DIAS_CURTOS.map(([d, l]) => `<button class="${(r.dias || []).includes(d) ? "on" : ""}" data-act="frdia" data-i="${i}" data-d="${d}" aria-pressed="${(r.dias || []).includes(d)}">${l}</button>`).join("")}</div></div>
    ${frases("dias", i, r.frases || [])}</div>`).join("");
  const horas = R.horarios.map((r, i) => `<div class="pc-card fr-card"><div class="pc-ch"><span class="pc-tipo">Faixa de horário</span><span class="spacer"></span>
      <button class="iconbtn" data-act="frmov" data-i="${i}" data-d="-1" aria-label="Subir" ${i ? "" : "disabled"}>${IC.chevU}</button><button class="iconbtn" data-act="frmov" data-i="${i}" data-d="1" aria-label="Descer" ${i < R.horarios.length - 1 ? "" : "disabled"}>${IC.chevD}</button>
      <button class="iconbtn" data-act="frdel" data-k="horarios" data-i="${i}" aria-label="Remover faixa">${IC.trash}</button></div>
    <div class="fr-row"><div class="field" style="flex:1"><label>Nome</label>${txt("horarios", i, "nome", r.nome)}</div>
      <div class="field"><label>Das</label><input class="inp tnum" type="time" data-frk="horarios" data-fri="${i}" data-frf="ini" value="${esc(r.ini)}"></div>
      <div class="field"><label>Até</label><input class="inp tnum" type="time" data-frk="horarios" data-fri="${i}" data-frf="fim" value="${esc(r.fim)}"></div></div>
    ${frases("horarios", i, r.frases || [])}</div>`).join("");
  return head + `<main class="screen frcfg">
    <section class="panel fr-intro"><div><b>Como funciona</b><p class="small muted" style="margin:4px 0 0">Primeiro o app tenta as regras de <b>dia da semana</b>, na ordem: se o dia bate, sorteia pela chance (ex.: 67% = 2 em 3 vezes). Se nenhuma sair, usa a <b>faixa de horário</b> da hora atual. Escreva <code>@apelido</code> onde entra o apelido da pessoa (sorteado entre os dela). A frase fica fixa dentro da mesma faixa; você (admin) pode clicar na frase da tela inicial para sortear outra.</p></div>
      <button class="btn sm ghost" data-act="frpadrao">Voltar ao padrão</button></section>
    <section class="panel fr-teste"><b>Testar</b><div class="fr-row">
      <div class="field"><label>Dia</label><select class="inp" data-frt="dia">${[1,2,3,4,5,6,0].map(d => `<option value="${d}" ${+T.dia === d ? "selected" : ""}>${DIAS_NOMES[d]}</option>`).join("")}</select></div>
      <div class="field"><label>Hora</label><input class="inp tnum" type="time" data-frt="hora" value="${esc(T.hora)}"></div>
      <div class="field" style="flex:1"><label>Apelido</label><input class="inp" data-frt="nome" value="${esc(T.nome)}"></div>
      <button class="btn primary" data-act="frtestar" style="align-self:end">Sortear</button></div>
      ${T.res ? `<div class="fr-res"><b>${esc(T.res.txt)}</b><span class="small muted">Regra: ${esc(T.res.regra)}</span></div>` : ""}</section>
    <div class="fr-cols"><section class="fr-col"><div class="row"><h2 class="h3" style="margin:0">Dias da semana</h2><span class="spacer"></span><button class="btn sm ghost btn-ic" data-act="frnovo" data-k="dias">${IC.plus}Nova regra</button></div>${dias || `<div class="panel empty"><b>Nenhuma regra de dia</b></div>`}</section>
      <section class="fr-col"><div class="row"><h2 class="h3" style="margin:0">Faixas de horário</h2><span class="spacer"></span><button class="btn sm ghost btn-ic" data-act="frnovo" data-k="horarios">${IC.plus}Nova faixa</button></div>
        ${buracos.length ? `<div class="aviso-box">Sem faixa: <b>${esc(buracos.join(", "))}</b>. Nesses horários aparece "Olá, @apelido!".</div>` : ""}${horas}</section></div></main>`;
}
function validarFrases(R){
  for(const r of R.dias){ if(!String(r.nome || "").trim()) return "Uma regra de dia está sem nome"; if(!(r.dias || []).length) return `"${r.nome}": marque pelo menos um dia`; if(!(r.frases || []).length) return `"${r.nome}": escreva pelo menos uma frase`; }
  for(const r of R.horarios){ if(!String(r.nome || "").trim()) return "Uma faixa está sem nome"; if(!/^\d{2}:\d{2}$/.test(r.ini) || !/^\d{2}:\d{2}$/.test(r.fim)) return `"${r.nome}": preencha os horários`; if(!(r.frases || []).length) return `"${r.nome}": escreva pelo menos uma frase`; }
  return null;
}
const marcaSujo = () => { S.fcfg.sujo = true; S.fcfg.sair = false; const b = document.querySelector("[data-act=fcfgsalvar]"); if(b) b.disabled = false; };

Object.assign(ACOES_EXTRA, {
  frasescfg(){ if(!can(userByLogin(REAL_USER), "admin")) return; abrirFrasesCfg(); },
  fcfgvoltar(){ if(S.fcfg.sujo && !S.fcfg.sair){ S.fcfg.sair = true; toast("Aviso", "Há alterações não salvas", "Toque em voltar de novo para sair sem salvar."); return; } S.fcfg = null; S.screen = S.obraId ? (S.voltarFcfg || "unidades") : "home"; },
  frdia(el){ const r = S.fcfg.rasc.dias[+el.dataset.i], d = +el.dataset.d; r.dias = (r.dias || []).includes(d) ? r.dias.filter(x => x !== d) : [...(r.dias || []), d]; marcaSujo(); },
  frnovo(el){ const k = el.dataset.k, L = S.fcfg.rasc[k];
    L.push(k === "dias" ? { id:"d" + Date.now().toString(36), nome:"Nova regra", dias:[], chance:50, frases:["Olá, @apelido!"] } : { id:"h" + Date.now().toString(36), nome:"Nova faixa", ini:"00:00", fim:"00:59", frases:["Olá, @apelido!"] }); marcaSujo(); },
  frdel(el){ S.fcfg.rasc[el.dataset.k].splice(+el.dataset.i, 1); marcaSujo(); },
  frmov(el){ const L = S.fcfg.rasc.horarios, i = +el.dataset.i, j = i + +el.dataset.d; if(j < 0 || j >= L.length) return; [L[i], L[j]] = [L[j], L[i]]; marcaSujo(); },
  frpadrao(){ S.fcfg.rasc = FRASES_PADRAO(); marcaSujo(); },
  frtestar(){ const T = S.fcfg.teste, d = new Date(), [h, m] = String(T.hora || "09:00").split(":").map(Number);
    d.setDate(d.getDate() + ((+T.dia - d.getDay() + 7) % 7)); d.setHours(h || 0, m || 0, 0, 0); T.res = fraseDoDia(T.nome || "Fulano", d, S.fcfg.rasc); },
  async fcfgsalvar(){ const R = S.fcfg.rasc, e = validarFrases(R); if(e){ toast("Erro", "Corrija antes de salvar", e); return; }
    S.carregando = "Salvando..."; render();
    try{ await API.salvarConfig("frases", JSON.parse(JSON.stringify(R))); S.fcfg.sujo = false; S.saud = null; toast("Sucesso", "Frases salvas", "Valem para todo mundo a partir de agora."); }
    catch(err){ toast("Erro", "Não foi possível salvar", msgErro(err)); }
    S.carregando = ""; },
  refrase(){ if(can(userByLogin(REAL_USER), "admin")) S.saud = null; }
});
INPUT_EXTRA.push(t => {
  if(!S.fcfg) return false;
  if(t.dataset.frt){ S.fcfg.teste[t.dataset.frt] = t.value; return true; }
  if(t.dataset.frk){ const r = S.fcfg.rasc[t.dataset.frk][+t.dataset.fri], f = t.dataset.frf;
    if(f === "frases") r.frases = t.value.split("\n").map(x => x.trim()).filter(Boolean);
    else if(f === "chance") r.chance = Math.max(0, Math.min(100, parseInt(t.value) || 0));
    else r[f] = t.value;
    marcaSujo(); return (f === "ini" || f === "fim") && t.type === "time" && document.activeElement !== t ? "render" : true; }
  return false;
});
