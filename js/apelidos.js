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

/* ---------- frase da tela inicial (mesma lógica do Power Apps) ---------- */
const sorteia = L => L[Math.floor(Math.random() * L.length)];
function fraseDoDia(nome, agora = new Date()){
  const h = agora.getHours(), m = agora.getMinutes(), dia = agora.getDay(); // 0 dom ... 6 sáb
  const sortDia = 1 + Math.floor(Math.random() * 3), n = nome;
  // segunda, sexta e fim de semana: 2 em 3 vezes usa a frase do dia; na outra, a do horário
  if(dia === 1 && sortDia < 3) return [`Segundouuu, ${n}!`, `A temida segunda-feira né, ${n}?`][sortDia - 1];
  if(dia === 5 && sortDia < 3) return [`Sextoooou, ${n}!`, `Sextou, ${n}! Quem fez, fez...`][sortDia - 1];
  if((dia === 0 || dia === 6) && sortDia < 3) return [`Trabalhando no fim de semana, ${n}?`, `Até no fim de semana, ${n}?`][sortDia - 1];
  if(h < 8 || (h === 8 && m < 30)) return sorteia([`Bom dia, ${n}! Acordou cedo hein?`, `Cedinho hein, ${n}!`, `Primeiro a chegar, ${n}?`, `Bom dia, ${n}! Madrugou hoje.`, `Que disposição, ${n}!`]);
  if(h < 12) return sorteia([`Bom dia, ${n}!`, `Bora começar, ${n}!`, `E aí, ${n}? Bom dia!`, `Cadê o café, ${n}?`, `Bom dia, ${n}! Bora render.`]);
  if(h === 12 || (h === 13 && m < 10)) return sorteia([`Já almoçou, ${n}?`, `Bora de almoço, ${n}?`, `Hora do rango, ${n}!`, `Bateu a fome, ${n}?`, `Pausa pro almoço, ${n}!`]);
  if(h < 16) return sorteia([`Boa tarde, ${n}!`, `Segurando a soneca, ${n}?`, `Pós-almoço bateu, ${n}?`, `Sono batendo, ${n}?`, `Um café resolve, ${n}?`]);
  if(h < 18) return sorteia([`Reta final, ${n}!`, `Já deu né? Deixa um pouco pra amanhã, ${n}.`, `Fim de expediente, ${n}?`, `Aguenta firme, ${n}!`, `Fechando o dia, ${n}?`]);
  return sorteia([`Trabalhando essas horas, ${n}?`, `Ainda por aqui, ${n}?`, `Boa noite, ${n}! Vai descansar.`, `Workaholic hein, ${n}?`, `Madrugando, ${n}?`]);
}
// a frase fica a mesma enquanto não muda o período do dia (não troca a cada clique)
function periodoDoDia(d = new Date()){ const h = d.getHours(), m = d.getMinutes(); return h < 8 || (h === 8 && m < 30) ? 0 : h < 12 ? 1 : h === 12 || (h === 13 && m < 10) ? 2 : h < 16 ? 3 : h < 18 ? 4 : 5; }
function saudacaoHome(){
  const L = S.user === REAL_USER ? meusApelidos() : apelidosDe(ME()), d = new Date();
  const k = [d.toDateString(), periodoDoDia(d), S.user, L.join("|")].join("#");
  if(!S.saud || S.saud.k !== k) S.saud = { k, txt:fraseDoDia(sorteia(L), d) };
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
