/* =====================================================================
   MODO MANUTENÇÃO
   O admin liga em Configurações Admin > Modo manutenção. Quem não é admin
   vê o app desfocado com um aviso por cima (título e texto do admin) e a
   contagem até a volta. Admin continua usando normalmente (com uma faixa
   avisando que a manutenção está ligada). Se "liberar sozinho" estiver
   marcado, o app volta no horário marcado sem precisar desligar.
   Fica em config_global.manutencao; a função status_manutencao() deixa
   ler mesmo antes do login (SQL 14).
   ===================================================================== */
const MANUT_PADRAO = () => ({ on:false, titulo:"Em manutenção", texto:"Estamos trazendo os dados do app antigo para cá. O Gestor de Entrega volta a funcionar no horário abaixo.", ate:"", auto:true });
let MANUT = null, _manutBloqueado = false;
async function lerManutencao(){
  if(MODO_DEMO){ MANUT = (DB.config && DB.config.manutencao) || null; return; }
  try{ const { data, error } = await sb.rpc("status_manutencao"); if(!error) MANUT = data && typeof data === "object" && "on" in data ? data : null; }catch(_){}
}
function manutAtiva(){ const m = MANUT; if(!m || !m.on) return false; if(m.auto && m.ate && new Date(m.ate) <= new Date()) return false; return true; }
const souAdminReal = () => { const u = REAL_USER && userByLogin(REAL_USER); return !!(u && can(u, "admin")); };
function manutBloqueia(){
  if(!manutAtiva()) return false;
  if(S.auth.tela) return S.auth.tela !== "carregando" && !S.manutEntrar;   // tela de login: dá para o admin entrar
  return !souAdminReal();
}
const DIAS_SEMANA = ["domingo","segunda-feira","terça-feira","quarta-feira","quinta-feira","sexta-feira","sábado"];
const dataVolta = d => `${DIAS_SEMANA[d.getDay()]}, ${fmtData(d)} às ${pad(d.getHours())}:${pad(d.getMinutes())}`;
function contadorHTML(){
  const m = MANUT, fim = m && m.ate ? new Date(m.ate) : null; if(!fim) return "";
  let s = Math.max(0, Math.ceil((fim - new Date()) / 1000));
  if(!s) return `<b class="manut-ja">Voltamos em instantes</b>`;
  const min = Math.ceil(s / 60), d = Math.floor(min / 1440), h = Math.floor(min % 1440 / 60), mi = min % 60;
  const cx = (n, t) => `<div><b class="tnum">${pad(n)}</b><span>${t}</span></div>`;
  return cx(d, d === 1 ? "dia" : "dias") + cx(h, h === 1 ? "hora" : "horas") + cx(mi, mi === 1 ? "minuto" : "minutos");
}
function manutHTML(){
  const m = MANUT, fim = m.ate ? new Date(m.ate) : null;
  return `<div class="manut" role="dialog" aria-modal="true" aria-labelledby="manut-t"><div class="manut-box">
    <img class="manut-logo" src="${isDark() ? LOGOS.branca : LOGOS.preta}" alt="Gestor de Entrega">
    <h1 id="manut-t">${esc(m.titulo || "Em manutenção")}</h1>
    ${m.texto ? `<p>${esc(m.texto).replace(/\n/g, "<br>")}</p>` : ""}
    ${fim ? `<div class="manut-cont" id="manut-cont" aria-live="polite">${contadorHTML()}</div><span class="small muted">Previsão de volta: ${dataVolta(fim)}</span>` : ""}
    ${S.auth.tela ? `<button class="linkbtn small manut-adm" data-act="manutentrar">Sou administrador, entrar</button>` : `<button class="linkbtn small manut-adm" data-act="sair">Sair</button>`}
  </div></div>`;
}
// faixa para o admin enquanto a manutenção está ligada
const manutFaixa = () => manutAtiva() && !S.auth.tela && souAdminReal()
  ? `<div class="manut-faixa">${IC.lock}<span>Modo manutenção ligado: só administradores conseguem usar o app${MANUT.ate ? ` até ${dataVolta(new Date(MANUT.ate))}` : ""}.</span><button class="linkbtn" data-act="manutcfg">Configurar</button></div>` : "";
// aplica no render (chamado no fim do render principal)
function manutAplicar(h){
  const bloq = manutBloqueia();
  if(_manutBloqueado && !bloq && !S.auth.tela && !souAdminReal()){ location.reload(); return h; }   // acabou a manutenção: recarrega com os dados novos
  _manutBloqueado = bloq;
  document.documentElement.classList.toggle("manut-on", bloq);
  return bloq ? `<div class="manut-fundo" inert aria-hidden="true">${h}</div>${manutHTML()}` : h + manutFaixa() + (S.manutCfg ? popupManutCfg() : "");
}

/* ---------- configuração (admin) ---------- */
function abrirManutCfg(){
  const m = { ...MANUT_PADRAO(), ...(MANUT || {}) }, d = m.ate ? new Date(m.ate) : (() => { const x = new Date(); x.setHours(x.getHours() + 1, 0, 0, 0); return x; })();
  S.manutCfg = { on:!!m.on, titulo:m.titulo, texto:m.texto, auto:m.auto !== false, dia:isoData(d), hora:`${pad(d.getHours())}:${pad(d.getMinutes())}` };
  S.adminPanel = false;
}
function popupManutCfg(){
  const C = S.manutCfg;
  return `<div class="modal" role="dialog" aria-modal="true" aria-label="Modo manutenção"><div class="scrim" data-act="manutfechar"></div><div class="box sm2">
    <div class="mhead"><div class="t"><b class="conf-t">Modo manutenção</b><div class="small muted">Quem não é administrador vê o aviso por cima do app e não consegue usar nada</div></div><button class="iconbtn" data-act="manutfechar" aria-label="Fechar">${IC.close}</button></div>
    <div class="mbody">
      <div class="pc-lote ${C.on ? "" : "off"}"><label class="sw"><input type="checkbox" data-mc="on" ${C.on ? "checked" : ""}><span></span></label><div><b>${C.on ? "Ligado" : "Desligado"}</b><div class="small muted">${C.on ? "Só administradores conseguem usar o app." : "Todo mundo usa normalmente."}</div></div></div>
      <div class="field"><label for="mc-tit">Título</label><input class="inp" id="mc-tit" data-mc="titulo" value="${esc(C.titulo)}" maxlength="80"></div>
      <div class="field"><label for="mc-txt">Texto</label><textarea class="inp" id="mc-txt" data-mc="texto" rows="3" maxlength="500">${esc(C.texto)}</textarea></div>
      <div class="row2"><div class="field"><label for="mc-dia">Volta no dia</label><input class="inp" type="date" id="mc-dia" data-mc="dia" value="${esc(C.dia)}"></div>
        <div class="field"><label for="mc-hora">às</label><input class="inp" type="time" id="mc-hora" data-mc="hora" value="${esc(C.hora)}"></div></div>
      <label class="chk"><input type="checkbox" data-mc="auto" ${C.auto ? "checked" : ""}>Liberar sozinho quando chegar esse horário</label>
      <span class="small muted">${C.auto ? "No horário, o aviso some e o app recarrega para todo mundo." : "No horário, o aviso fica \"Voltamos em instantes\" até você desligar aqui."} Quem estiver com o app aberto é bloqueado em até 1 minuto depois de ligar.</span></div>
    <div class="mfoot"><button class="btn ghost" data-act="manutver">Ver como fica</button><span class="spacer"></span><button class="btn primary btn-ic" data-act="manutsalvar">${IC.check}Salvar</button></div></div></div>`;
}
const manutDoForm = () => { const C = S.manutCfg, d = C.dia && C.hora ? new Date(`${C.dia}T${C.hora}`) : null;
  return { on:C.on, titulo:(C.titulo || "").trim() || "Em manutenção", texto:(C.texto || "").trim(), ate:d && !isNaN(d) ? d.toISOString() : "", auto:C.auto }; };

Object.assign(ACOES_EXTRA, {
  manutcfg(){ if(!souAdminReal()) return; abrirManutCfg(); },
  manutfechar(){ S.manutCfg = null; },
  manutentrar(){ S.manutEntrar = true; },
  manutver(){ const salvo = MANUT; MANUT = { ...manutDoForm(), on:true, auto:false };
    const html = manutHTML(); MANUT = salvo;
    const el = document.createElement("div"); el.className = "manut-prev"; el.innerHTML = html.replace('data-act="sair"', 'data-act="manutprevfechar"').replace(/>Sair</, ">Fechar a prévia<").replace('data-act="manutentrar"', 'data-act="manutprevfechar"');
    document.body.appendChild(el); },
  manutprevfechar(){ document.querySelectorAll(".manut-prev").forEach(e => e.remove()); },
  async manutsalvar(){ const m = manutDoForm();
    if(m.on && !m.ate){ toast("Erro", "Informe o dia e a hora em que o app volta"); return; }
    if(m.on && m.auto && new Date(m.ate) <= new Date()){ toast("Erro", "O horário de volta já passou", "Mude a data/hora ou desmarque \"Liberar sozinho\"."); return; }
    S.carregando = "Salvando..."; render();
    try{ await API.salvarConfig("manutencao", m); MANUT = m; S.manutCfg = null; toast("Sucesso", m.on ? "Modo manutenção ligado" : "Modo manutenção desligado", m.on ? `Volta ${dataVolta(new Date(m.ate))}` : "Todo mundo já pode usar."); }
    catch(e){ toast("Erro", "Não foi possível salvar", /status_manutencao|config_global/.test(String(e && e.message)) ? "Rode o 14_atualizacao_2.1.24.sql no Supabase." : msgErro(e)); }
    S.carregando = ""; }
});
INPUT_EXTRA.push((t, ev) => {
  if(!t.dataset.mc || !S.manutCfg) return false;
  const k = t.dataset.mc; S.manutCfg[k] = t.type === "checkbox" ? t.checked : t.value;
  return t.type === "checkbox" && ev === "change" ? "render" : true;
});
document.addEventListener("keydown", e => { if(e.key !== "Escape") return;
  const p = document.querySelector(".manut-prev"); if(p){ e.stopImmediatePropagation(); p.remove(); return; }
  if(S.manutCfg){ e.stopImmediatePropagation(); S.manutCfg = null; render(); } }, true);

// contador (a cada segundo, só o número) e conferência no servidor (a cada minuto)
setInterval(() => {
  const c = document.getElementById("manut-cont"); if(c) c.innerHTML = contadorHTML();
  if(_manutBloqueado && !manutAtiva()) render();   // passou do horário com "liberar sozinho"
}, 1000);
setInterval(async () => {
  if(!MODO_DEMO && !sb) return;
  const antes = JSON.stringify(MANUT); await lerManutencao();
  if(JSON.stringify(MANUT) !== antes) render();
}, 60000);
