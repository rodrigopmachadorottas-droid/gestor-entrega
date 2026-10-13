/* =====================================================================
   APELIDOS ("como você quer ser chamado") e a frase da tela inicial
   Cada pessoa tem uma lista de apelidos (padrão: o primeiro nome). A frase
   muda conforme a hora e o dia da semana, igual ao app antigo, e escolhe
   um dos apelidos ao acaso. A pessoa edita os seus no perfil; o admin
   edita os de qualquer um em Usuários.
   ===================================================================== */
const primeiroNome = nome => String(nome || "").trim().split(/\s+/)[0] || "";
function apelidosDe(p){ const L = (p && Array.isArray(p.apelidos) ? p.apelidos : []).filter(Boolean); return L.length ? L : [primeiroNome(p && p.nome)].filter(Boolean); }
function meusApelidos(){
  if(MODO_DEMO){ try{ const L = JSON.parse(localStorage.getItem("ge-apelidos") || "null"); if(L && L.length) return L; }catch(_){} return [primeiroNome(ME().nome)]; }
  return apelidosDe({ ...(S.perfil || {}), nome:(S.perfil && S.perfil.nome) || ME().nome });
}

/* ---------- frase da tela inicial (regras editáveis pelo admin em "Definir frases") ---------- */
const sorteia = L => L[Math.floor(Math.random() * L.length)];
// padrão = as regras do Power Apps. @apelido vira o apelido sorteado da pessoa.
const FRASES_PADRAO = () => ({
  dias:[
    { id:"seg", nome:"Segunda-feira", dias:[1], chance:67, frases:["Segundouuu, @apelido!", "A temida segunda-feira né, @apelido?"] },
    { id:"sex", nome:"Sexta-feira", dias:[5], chance:67, frases:["Sextoooou, @apelido!", "Sextou, @apelido! Quem fez, fez..."] },
    { id:"fds", nome:"Fim de semana", dias:[6, 0], chance:67, frases:["Trabalhando no fim de semana, @apelido?", "Até no fim de semana, @apelido?"] }],
  horarios:[
    { id:"cedo", nome:"Bem cedo", ini:"00:00", fim:"08:29", frases:["Bom dia, @apelido! Acordou cedo hein?", "Cedinho hein, @apelido!", "Primeiro a chegar, @apelido?", "Bom dia, @apelido! Madrugou hoje.", "Que disposição, @apelido!"] },
    { id:"manha", nome:"Manhã", ini:"08:30", fim:"11:59", frases:["Bom dia, @apelido!", "Bora começar, @apelido!", "E aí, @apelido? Bom dia!", "Cadê o café, @apelido?", "Bom dia, @apelido! Bora render."] },
    { id:"almoco", nome:"Almoço", ini:"12:00", fim:"13:09", frases:["Já almoçou, @apelido?", "Bora de almoço, @apelido?", "Hora do rango, @apelido!", "Bateu a fome, @apelido?", "Pausa pro almoço, @apelido!"] },
    { id:"tarde1", nome:"Pós-almoço", ini:"13:10", fim:"15:59", frases:["Boa tarde, @apelido!", "Segurando a soneca, @apelido?", "Pós-almoço bateu, @apelido?", "Sono batendo, @apelido?", "Um café resolve, @apelido?"] },
    { id:"tarde2", nome:"Acabando o dia", ini:"16:00", fim:"17:59", frases:["Reta final, @apelido!", "Já deu né? Deixa um pouco pra amanhã, @apelido.", "Fim de expediente, @apelido?", "Aguenta firme, @apelido!", "Fechando o dia, @apelido?"] },
    { id:"noite", nome:"Noite", ini:"18:00", fim:"23:59", frases:["Trabalhando essas horas, @apelido?", "Ainda por aqui, @apelido?", "Boa noite, @apelido! Vai descansar.", "Workaholic hein, @apelido?", "Madrugando, @apelido?"] }]
});
const cfgFrases = () => { const c = DB.config && DB.config.frases; return c && Array.isArray(c.horarios) ? c : FRASES_PADRAO(); };
const hhmm = d => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const noIntervalo = (t, r) => r.ini <= r.fim ? t >= r.ini && t <= r.fim : t >= r.ini || t <= r.fim;   // aceita intervalo que vira a meia-noite
const comApelido = (f, nome) => String(f).replace(/@apelido/gi, nome);
// devolve {txt, regra}: primeiro tenta as regras de dia (cada uma com a sua chance); se não sair, usa a do horário
function fraseDoDia(nome, agora = new Date(), cfg = cfgFrases()){
  for(const r of cfg.dias || []){
    if(!(r.dias || []).includes(agora.getDay()) || !(r.frases || []).length) continue;
    if(Math.random() * 100 < (r.chance ?? 67)) return { txt:comApelido(sorteia(r.frases), nome), regra:r.nome };
  }
  const t = hhmm(agora), h = (cfg.horarios || []).find(r => (r.frases || []).length && noIntervalo(t, r));
  return h ? { txt:comApelido(sorteia(h.frases), nome), regra:h.nome } : { txt:`Olá, ${nome}!`, regra:"padrão" };
}
// a frase fica a mesma enquanto não muda a faixa de horário (não troca a cada clique)
function periodoDoDia(d = new Date()){ const t = hhmm(d); return (cfgFrases().horarios || []).findIndex(r => noIntervalo(t, r)); }
function saudacaoHome(){
  const L = S.user === REAL_USER ? meusApelidos() : apelidosDe(ME()), d = new Date();
  const k = [d.toDateString(), periodoDoDia(d), S.user, L.join("|"), JSON.stringify(cfgFrases()).length].join("#");
  if(!S.saud || S.saud.k !== k){ const f = fraseDoDia(sorteia(L), d); S.saud = { k, txt:f.txt, regra:f.regra }; }
  return S.saud.txt;
}

/* ---------- editor de apelidos (perfil e Usuários) ---------- */
function apelidosEditor(lista, alvo){
  return `<div class="apel">${lista.map((a, i) => `<span class="apel-chip"><span class="apel-t" data-act="apeledit" data-alvo="${esc(alvo)}" data-i="${i}" title="Clique para editar">${esc(a)}</span>
      <button data-act="apeldel" data-alvo="${esc(alvo)}" data-i="${i}" aria-label="Remover ${esc(a)}" ${lista.length <= 1 ? "disabled title=\"Precisa ter pelo menos um\"" : ""}>${IC.close}</button></span>`).join("")}
    <form class="apel-add" data-apel="${esc(alvo)}"><input class="inp" id="apel-in-${esc(alvo)}" maxlength="30" placeholder="Novo apelido" autocomplete="off" value="${S.apelIn && S.apelIn.alvo === alvo ? esc(S.apelIn.v) : ""}"><button class="btn sm ghost btn-ic" type="submit">${IC.plus}Adicionar</button></form></div>`;
}
function listaApelidos(alvo){ if(alvo === "eu") return [...meusApelidos()]; const p = (S.usrData && S.usrData.perfis || []).find(x => x.id === alvo); return p ? [...apelidosDe(p)] : []; }
async function salvarApelidos(alvo, L){
  L = [...new Set(L.map(s => s.trim().slice(0, 30)).filter(Boolean))].slice(0, 10);
  if(!L.length){ toast("Erro", "Precisa ter pelo menos um apelido"); return; }
  try{
    if(MODO_DEMO){ try{ localStorage.setItem("ge-apelidos", JSON.stringify(L)); }catch(_){} }
    else{ const id = alvo === "eu" ? S.perfil.id : alvo; const { error } = await sb.rpc("salvar_apelidos", { p_id:id, p_apelidos:L }); if(error) throw error;
      if(alvo === "eu" || (S.perfil && id === S.perfil.id)) S.perfil.apelidos = L;
      const p = (S.usrData && S.usrData.perfis || []).find(x => x.id === id); if(p) p.apelidos = L; }
    toast("Sucesso", "Apelidos salvos", L.join(", "));
  }catch(e){ toast("Erro", "Não foi possível salvar os apelidos", /salvar_apelidos|apelidos/.test(String(e && e.message)) ? "Rode o 09_atualizacao_2.1.8.sql no Supabase." : msgErro(e)); }
  render();
}
Object.assign(ACOES_EXTRA, {
  apeldel(el){ const L = listaApelidos(el.dataset.alvo); if(L.length <= 1) return; L.splice(+el.dataset.i, 1); return salvarApelidos(el.dataset.alvo, L); },
  apeledit(el){ const alvo = el.dataset.alvo, L = listaApelidos(alvo), v = L[+el.dataset.i];
    S.apelIn = { alvo, v }; S.apelTroca = L.length > 1 ? null : v;   // com um só, troca ao adicionar o novo
    if(L.length <= 1){ toast("Aviso", "Edite o texto e clique em Adicionar"); setTimeout(() => { const i = document.getElementById("apel-in-" + alvo); if(i) i.focus(); }, 30); return; }
    L.splice(+el.dataset.i, 1); return salvarApelidos(alvo, L).then(() => setTimeout(() => { const i = document.getElementById("apel-in-" + alvo); if(i) i.focus(); }, 30)); }
});
document.addEventListener("submit", e => {
  const f = e.target.closest && e.target.closest("form[data-apel]"); if(!f) return; e.preventDefault();
  const alvo = f.dataset.apel, inp = f.querySelector("input"), v = (inp.value || "").trim(); if(!v) return;
  let L = listaApelidos(alvo); if(S.apelTroca){ L = L.filter(x => x !== S.apelTroca); S.apelTroca = null; }
  if(L.some(x => x.toLowerCase() === v.toLowerCase())){ toast("Aviso", "Esse apelido já está na lista"); return; }
  S.apelIn = null; salvarApelidos(alvo, [...L, v]);
});
