/* =====================================================================
   API · liga o app ao Supabase
   A tela continua mexendo no objeto DB (como no protótipo). Depois de cada
   alteração, saveDB() chama API.commit(), que:
     1) manda as AÇÕES do fluxo (aprovar, reprovar, agendar...) pela função
        registrar_acao do banco, que confere permissão e conflito;
     2) compara o DB com a última foto do servidor e grava só o que mudou
        (cadastros: clientes, locais, unidades, áreas, horários, config da obra).
   ===================================================================== */
const CFG = window.GE_CONFIG || {};
const MODO_DEMO = !(CFG.SUPABASE_URL && CFG.SUPABASE_ANON_KEY);
let sb = null;

const TABS = {
  obras:    { ins: null, upd: ["ordem","nome","cidade","ativa","foto_url","config"] },
  clientes: { ins: ["id","nome","email","telefone","criado_por"], upd: ["nome","email","telefone"] },
  locais:   { ins: ["id","id_obra","nivel1","niveis2"], upd: ["nivel1","niveis2"] },
  horarios: { ins: ["id","id_obra","segunda","terca","quarta","quinta","sexta","sabado"], upd: ["segunda","terca","quarta","quinta","sexta","sabado"] },
  unidades: { ins: ["id","id_obra","nivel_1","nivel_2","unidade","modulo","id_cliente","prioridade"], upd: ["nivel_1","nivel_2","unidade","modulo","id_cliente","prioridade"] },
  areas:    { ins: ["id","id_obra","descricao"], upd: ["descricao"] }
};
const ORDEM_INS = ["clientes","locais","unidades","areas","horarios"];
const ORDEM_DEL = ["unidades","areas","horarios","locais","clientes"];
const HUES = [24,200,12,160,36,90,280,220,190];

const API = { fila: [], snap: {}, ids: {}, reservando: {}, cadeia: Promise.resolve(), ocupado: 0, tmp: 0, carregadoEm: 0 };

/* ---------- ganchos usados pelo resto do app ---------- */
function aoAcao(a){ if(!MODO_DEMO) API.fila.push(a); }
function saveDB(){ if(MODO_DEMO){ salvarLocal(); return; } API.commit(); }
function nextId(t){
  if(MODO_DEMO) return nextIdLocal(t);
  if(t==="tarefas"||t==="tarefas_ac") return --API.tmp;          // o servidor dá o número definitivo
  const pool = API.ids[t] || (API.ids[t] = []);
  if(pool.length < 5) API.reservar(t);
  return pool.length ? pool.shift() : --API.tmp;                  // raro: sem número reservado ainda
}

/* ---------- utilidades ---------- */
const esperar = ms => new Promise(r => setTimeout(r, ms));
const valCol = v => JSON.stringify(v === undefined ? null : v);
function fotoLinha(t, r){ const o = {}; TABS[t].upd.forEach(c => o[c] = valCol(r[c])); return o; }
function msgErro(e){
  const m = String((e && (e.message || e.error_description || e.msg)) || e || "");
  if(/Failed to fetch|NetworkError|network/i.test(m)) return "Sem conexão com a internet. Tente de novo.";
  if(/conflito/i.test(m)) return "Outra pessoa alterou este item antes de você.";
  if(/sem_permissao|permission denied|row-level security|Sem permissão/i.test(m)) return "Você não tem permissão para fazer isso.";
  if(/sem_acesso/i.test(m)) return "Seu acesso não permite esta obra.";
  if(/foreign key/i.test(m) && /locais/i.test(m)) return "Este local ainda tem unidades. Exclua ou mova as unidades antes.";
  if(/foreign key/i.test(m)) return "Este registro está ligado a outros e não pode ser excluído.";
  if(/duplicate key/i.test(m)) return "Já existe um registro igual.";
  if(/JWT|token/i.test(m)) return "Sua sessão expirou. Entre de novo.";
  return m.replace(/^[a-z_]+: /,"") || "Erro desconhecido";
}
function indicadorSalvando(){
  const el = document.getElementById("salvando"); if(!el) return;
  el.hidden = !(API.ocupado > 0);
}
function normTarefa(t){
  if(!t) return t;
  t.data = new Date(t.data).toISOString();
  ["obs","coluna","agendamento","autor"].forEach(k => { if(t[k] == null) t[k] = ""; });
  if(t.anexos == null) delete t.anexos;
  if(t.checklist == null) delete t.checklist;
  if(t.assinatura == null) delete t.assinatura;
  return t;
}

/* ---------- leitura ---------- */
async function lerTudo(tabela, colunas = "*", ordem = "id"){
  const out = [];
  for(let i = 0; ; i += 1000){
    const { data, error } = await sb.from(tabela).select(colunas).order(ordem).range(i, i + 999);
    if(error) throw error;
    out.push(...data);
    if(data.length < 1000) break;
  }
  return out;
}

API.carregar = async function(comPassos){
  const ROT = { obras:"as obras", obra_acessos:"os acessos às obras", clientes:"os clientes", locais:"os blocos e pavimentos", horarios:"os horários de vistoria",
    unidades:"as unidades", tarefas_lista:"o histórico de tarefas", areas:"as áreas comuns", tarefas_ac:"as tarefas das áreas comuns", perfis_publicos:"os usuários" };
  const falta = new Set(Object.keys(ROT));
  const aviso = () => { if(!comPassos) return; const f = [...falta]; passo(f.length ? `Carregando ${ROT[f.at(-1)]}... (${10 - f.length} de 10)` : "Montando as telas..."); };
  const ler = (t, c, o) => lerTudo(t, c, o).then(r => { falta.delete(t); aviso(); return r; });
  aviso();
  const [obras, acessos, clientes, locais, horarios, unidades, tarefas, areas, tarefas_ac, pessoas] = await Promise.all([
    ler("obras"), ler("obra_acessos", "*", "obra_id"), ler("clientes"), ler("locais"), ler("horarios"),
    ler("unidades"), ler("tarefas_lista"), ler("areas"), ler("tarefas_ac"), ler("perfis_publicos", "*", "login")
  ]);
  let laudos = [];
  try{ laudos = await lerTudo("laudos"); }catch(_){ /* banco ainda sem a 06_atualizacao: segue sem laudos */ }
  const P = S.perfil;
  const usuarios = pessoas.map((p, i) => ({ id: i + 1, login: p.login, nome: p.nome, foto: p.foto || "", perms: p.funcoes || [] }));
  const eu = { id: 0, login: P.login, nome: P.nome, email: P.email, foto: P.foto || "", perms: P.funcoes || [] };
  const k = usuarios.findIndex(x => x.login === P.login);
  if(k >= 0) usuarios[k] = { ...usuarios[k], ...eu, id: usuarios[k].id }; else usuarios.push(eu);
  DB = {
    v: 1, seq: {}, usuarios,
    obras: obras.map((o, i) => ({ ...o, hue: HUES[i % HUES.length],
      usuarios: acessos.filter(a => a.obra_id === o.id).map(a => a.login).join(", ") })),
    clientes, locais, horarios, unidades, areas,
    tarefas: tarefas.map(normTarefa), tarefas_ac: tarefas_ac.map(normTarefa), laudos
  };
  API.tirarFoto();
  API.carregadoEm = Date.now();
  ["clientes","locais","unidades","areas","horarios"].forEach(t => API.reservar(t));
};

API.tirarFoto = function(){
  Object.keys(TABS).forEach(t => { API.snap[t] = new Map(DB[t].map(r => [r.id, fotoLinha(t, r)])); });
};

API.recarregar = async function(avisar, silencioso){
  await API.cadeia;                                   // espera gravações em andamento
  if(!silencioso){ S.carregando = "Sincronizando..."; render(); }
  try{
    await API.carregar();
    if(S.obraId && !obraById(S.obraId)){ S.obraId = null; S.screen = "home"; }
    if(S.popup && S.popup.tipo === "und" && !DB.unidades.some(u => u.id === S.popup.id)) S.popup = null;
    if(S.popup && S.popup.tipo === "ac" && !DB.areas.some(a => a.id === S.popup.id)) S.popup = null;
    if(S.cli.und && !DB.unidades.some(u => u.id === S.cli.und)) S.cli.und = null;
    if(S.cli.edit && S.cli.edit !== "novo" && !clienteById(S.cli.edit)) S.cli.edit = null;
    if(S.loc.localId && S.loc.localId !== "ac" && !localById(S.loc.localId)) S.loc.localId = null;
    if(avisar) toast("Sucesso", "Informações sincronizadas");
  }catch(e){ if(!silencioso) toast("Erro", "Não foi possível sincronizar", msgErro(e)); }
  S.carregando = "";
  if(!silencioso || telaLivre()) render();
};
// nada aberto em que um redesenho possa atrapalhar quem está digitando
function telaLivre(){ return !(S.conf || S.ag || S.loc.modal || S.hor || S.cli.edit != null || S.cli.novo || S.lote.on || S.senhaModal || S.loc.cfgAberta); }

// Ao voltar para a aba depois de um tempo, atualiza sozinho (se não houver nada aberto)
API.autoAtualizar = function(){
  if(MODO_DEMO || S.auth.tela || !DB) return;
  if(Date.now() - API.carregadoEm < 120000) return;
  if(API.fila.length || API.ocupado || !telaLivre()) return;
  API.recarregar(false, true);
};

/* ---------- números de ID reservados ---------- */
API.reservar = function(t){
  if(MODO_DEMO || API.reservando[t]) return;
  API.reservando[t] = sb.rpc("reservar_ids", { p_tabela: t, p_n: 20 }).then(({ data, error }) => {
    if(!error && data) (API.ids[t] = API.ids[t] || []).push(...data);
  }).finally(() => { API.reservando[t] = null; });
};
async function idReal(t){
  const { data, error } = await sb.rpc("reservar_ids", { p_tabela: t, p_n: 1 });
  if(error) throw error;
  return data[0];
}
function trocarId(t, velho, novo){
  const r = DB[t].find(x => x.id === velho); if(r) r.id = novo;
  if(t === "clientes"){ DB.unidades.forEach(u => { if(u.id_cliente === velho) u.id_cliente = novo; }); if(S.cli.edit === velho) S.cli.edit = novo; }
  if(t === "locais"){ DB.unidades.forEach(u => { if(u.nivel_1 === velho) u.nivel_1 = novo; }); if(S.loc.localId === velho) S.loc.localId = novo; }
  if(t === "unidades"){ if(S.popup && S.popup.tipo === "und" && S.popup.id === velho) S.popup.id = novo; if(S.cli.und === velho) S.cli.und = novo; }
  if(t === "areas"){ if(S.popup && S.popup.tipo === "ac" && S.popup.id === velho) S.popup.id = novo; }
}

/* ---------- gravação ---------- */
API.commit = function(){
  API.ocupado++; indicadorSalvando();
  API.cadeia = API.cadeia
    .then(() => API._commit())
    .then(() => { if(!S.auth.tela && !S.loc.modal && !S.senhaModal) render(); })   // mostra id/autor/anexos oficiais
    .catch(e => API.falha(e))
    .finally(() => { API.ocupado--; indicadorSalvando(); });
  return API.cadeia;
};

API._commit = async function(){
  // 1) ações do fluxo, na ordem em que foram feitas
  while(API.fila.length){ await API.enviarAcao(API.fila[0]); API.fila.shift(); }

  // 2) inclusões (em lote; números que faltam são reservados de uma vez)
  for(const t of ORDEM_INS){
    const novos = DB[t].filter(r => !API.snap[t].has(r.id));
    if(!novos.length) continue;
    const temp = novos.filter(r => r.id < 0);
    for(let i = 0; i < temp.length; i += 200){
      const parte = temp.slice(i, i + 200);
      const { data, error } = await sb.rpc("reservar_ids", { p_tabela: t, p_n: parte.length });
      if(error) throw error;
      parte.forEach((r, k) => trocarId(t, r.id, data[k]));
    }
    const linhas = novos.map(r => { const o = {}; TABS[t].ins.forEach(c => { if(r[c] !== undefined) o[c] = r[c]; });
      if(t === "clientes" && !o.criado_por) o.criado_por = REAL_USER; return o; });
    for(let i = 0; i < linhas.length; i += 500){
      const { error } = await sb.from(t).insert(linhas.slice(i, i + 500), { defaultToNull: false });
      if(error) throw error;
    }
    novos.forEach(r => API.snap[t].set(r.id, fotoLinha(t, r)));
  }
  // 3) alterações (só os campos que mudaram)
  for(const t of Object.keys(TABS)){
    for(const r of DB[t]){
      const antes = API.snap[t].get(r.id); if(!antes) continue;
      const agora = fotoLinha(t, r), patch = {};
      TABS[t].upd.forEach(c => { if(antes[c] !== agora[c]) patch[c] = r[c] === undefined ? null : r[c]; });
      if(!Object.keys(patch).length) continue;
      const { data, error } = await sb.from(t).update(patch).eq("id", r.id).select("id");
      if(error) throw error;
      if(!data.length) throw new Error("sem_permissao");
      API.snap[t].set(r.id, agora);
    }
  }
  // 4) exclusões
  for(const t of ORDEM_DEL){
    const vivos = new Set(DB[t].map(r => r.id));
    for(const id of [...API.snap[t].keys()]){
      if(vivos.has(id)) continue;
      const { data, error } = await sb.from(t).delete().eq("id", id).select("id");
      if(error) throw error;
      if(!data.length) throw new Error("sem_permissao");
      API.snap[t].delete(id);
    }
  }
};

API.enviarAcao = async function(a){
  const t = a.tarefa, reg = a.reg;
  let anexos = null;
  if(t.anexos && t.anexos.length){
    anexos = [];
    for(const x of t.anexos){
      if(x.path){ anexos.push(x); continue; }
      if(!x.file){ anexos.push({ nome: x.nome, tamanho: x.tam }); continue; }
      const limpo = x.nome.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\w.\-]+/g, "_").slice(-80);
      const path = `${reg.id_obra}/${reg.id}/${Date.now()}-${limpo}`;
      const { error } = await sb.storage.from("anexos").upload(path, x.file, { upsert: false, contentType: x.file.type || undefined });
      if(error) throw error;
      anexos.push({ nome: x.nome, tamanho: x.tam, path });
    }
  }
  const { data, error } = await sb.rpc("registrar_acao", {
    p_tipo: a.tipo, p_id: reg.id, p_acao: a.acao, p_coluna: a.col || "",
    p_antes: a.antes, p_depois: a.depois,
    p_tarefa: { etapa_antiga: t.etapa_antiga, etapa_nova: t.etapa_nova, obs: t.obs || "", repeticao: t.repeticao,
                agendamento: t.agendamento || "", anexos, checklist: t.checklist || null, assinatura: t.assinatura || null, laudo: a.laudo || null }
  });
  if(error) throw error;
  const srv = normTarefa(data.tarefa);
  Object.keys(t).forEach(k => delete t[k]);           // troca a tarefa local pela oficial (id, autor e hora do servidor)
  Object.assign(t, srv);
  if(srv.assinatura) t.tem_assinatura = true;
  if(a.laudoLocal && data.laudo) Object.assign(a.laudoLocal, data.laudo);
};

API.falha = async function(e){
  const conflito = /conflito/i.test(String(e && e.message));
  API.fila = [];
  if(conflito) toast("Aviso", "Alguém mexeu neste item antes de você", "Os dados foram atualizados. Confira e refaça a ação, se ainda fizer sentido.");
  else toast("Erro", "Não foi possível salvar", msgErro(e));
  console.error(e);
  try{ await API.carregar(); }catch(_){}
  S.conf = null;
  render();
};

/* ---------- arquivos ---------- */
API.abrirAnexo = async function(path){
  const w = window.open("", "_blank");
  const { data, error } = await sb.storage.from("anexos").createSignedUrl(path, 300);
  if(error){ if(w) w.close(); toast("Erro", "Não foi possível abrir o anexo", msgErro(error)); return; }
  if(w) w.location = data.signedUrl; else location.href = data.signedUrl;
};
API.verAssinatura = async function(id){
  const t = DB.tarefas.find(x => x.id === id); if(!t) return;
  const { data, error } = await sb.from("tarefas").select("assinatura").eq("id", id).single();
  if(error){ toast("Erro", "Não foi possível abrir a assinatura", msgErro(error)); return; }
  t.assinatura = data.assinatura; render();
};

/* ---------- administração de usuários ---------- */
API.carregarUsuarios = async function(){
  const [perfis, acessos, antigas] = await Promise.all([
    lerTudo("perfis", "*", "criado_em"), lerTudo("obra_acessos", "*", "obra_id"), lerTudo("funcoes_antigas", "*", "login")
  ]);
  S.usrData = { perfis, acessos, antigas };
};
API.usrPendentes = () => S.usrData ? S.usrData.perfis.filter(p => p.status === "pendente" || p.pedido_senha).length : 0;
API.admin = async function(fn, args){
  const { error } = await sb.rpc(fn, args);
  if(error) throw error;
  await API.carregarUsuarios();
};

/* ---------- preferências, foto do usuário e foto da obra ---------- */
API.salvarPrefs = async function(p){
  S.perfil = S.perfil || {}; S.perfil.prefs = { ...(S.perfil.prefs || {}), ...p };
  if(MODO_DEMO){ try{ localStorage.setItem("ge-prefs", JSON.stringify(S.perfil.prefs)); }catch(_){} return; }
  const { error } = await sb.rpc("salvar_prefs", { p });
  if(error) toast("Erro", "Não foi possível salvar a preferência", msgErro(error));
};
// reduz a imagem no navegador antes de enviar (JPEG)
function reduzirImagem(file, maxW, maxH, quadrado){
  return new Promise((ok, falha) => {
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => {
      let sx = 0, sy = 0, sw = img.width, sh = img.height;
      if(quadrado){ const m = Math.min(sw, sh); sx = (sw - m) / 2; sy = (sh - m) / 2; sw = sh = m; }
      const k = Math.min(1, maxW / sw, maxH / sh), w = Math.round(sw * k), h = Math.round(sh * k);
      const c = document.createElement("canvas"); c.width = w; c.height = h;
      const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, w, h); g.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
      URL.revokeObjectURL(url);
      c.toBlob(b => b ? ok({ blob: b, dataUrl: c.toDataURL("image/jpeg", 0.82) }) : falha(new Error("imagem inválida")), "image/jpeg", 0.82);
    };
    img.onerror = () => { URL.revokeObjectURL(url); falha(new Error("Não deu para ler esta imagem.")); };
    img.src = url;
  });
}
async function enviarFoto(caminho, blob){
  const { error } = await sb.storage.from("fotos").upload(caminho, blob, { contentType: "image/jpeg", upsert: false });
  if(error) throw error;
  return sb.storage.from("fotos").getPublicUrl(caminho).data.publicUrl;
}
API.trocarMinhaFoto = async function(file){
  const r = await reduzirImagem(file, 320, 320, true);
  let url = r.dataUrl;
  if(!MODO_DEMO){
    url = await enviarFoto(`perfis/${S.perfil.id}/${Date.now()}.jpg`, r.blob);
    const { error } = await sb.rpc("salvar_foto", { p_url: url }); if(error) throw error;
  }
  S.perfil = S.perfil || {}; S.perfil.foto = url;
  const eu = userByLogin(REAL_USER); if(eu) eu.foto = url;
  if(MODO_DEMO) salvarLocal();
};
API.removerMinhaFoto = async function(){
  if(!MODO_DEMO){ const { error } = await sb.rpc("salvar_foto", { p_url: null }); if(error) throw error; }
  if(S.perfil) S.perfil.foto = ""; const eu = userByLogin(REAL_USER); if(eu) eu.foto = "";
  if(MODO_DEMO) salvarLocal();
};
API.trocarFotoObra = async function(obra, file){
  const r = await reduzirImagem(file, 1000, 1000, false);
  obra.foto_url = MODO_DEMO ? r.dataUrl : await enviarFoto(`obras/${obra.id}/${Date.now()}.jpg`, r.blob);
  saveDB();
};

/* ---------- laudos ---------- */
API.laudoRecebido = async function(L, obs, arq){
  let anexos = null;
  if(arq){
    if(MODO_DEMO) anexos = [{ nome: arq.name, tamanho: arq.size }];
    else {
      const limpo = arq.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w.\-]+/g, "_").slice(-80);
      const path = `${L.id_obra}/${L.id_unidade}/laudo-${Date.now()}-${limpo}`;
      const { error } = await sb.storage.from("anexos").upload(path, arq, { upsert: false, contentType: arq.type || undefined });
      if(error) throw error;
      anexos = [{ nome: arq.name, tamanho: arq.size, path }];
    }
  }
  if(MODO_DEMO){ Object.assign(L, { status: "recebido", recebido_em: new Date().toISOString(), recebido_por: REAL_USER, obs: obs || "", anexos }); salvarLocal(); return; }
  const { data, error } = await sb.rpc("laudo_recebido", { p_id: L.id, p_obs: obs || "", p_anexos: anexos });
  if(error) throw error;
  Object.assign(L, data);
};
