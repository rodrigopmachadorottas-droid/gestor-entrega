/* =====================================================================
   GESTÃO (admin e rotina)
   1) Minhas pendências: filtro das unidades em que a pessoa tem uma ação.
   2) Ações em lote: qualquer ação liberada para lote na configuração dos
      campos (só se o popup tiver apenas Observações).
   3) Exportar dados (Excel) e backup completo (JSON).
   4) Obras: criar, renomear, ordenar e ativar/inativar.
   ===================================================================== */

/* ---------- 1) MINHAS PENDÊNCIAS ---------- */
const TODAS_FASES = { extras:true, f1:true, f2:true, f3:true };
// a unidade tem alguma ação para mim (cancelar não conta como pendência)
const minhaPendencia = x => !ehHall(x) && secoesUnidade(x, ME(), TODAS_FASES).some(s => s.acts.some(a => a.a !== "cancelar"));

/* ---------- 2) AÇÕES EM LOTE ---------- */
const camposSimples = def => def.every(c => c.tipo === "obs");
const lotePadrao = key => /^rep_teste_[a-z]+:liberar$/.test(key);
function loteHabilitado(key){ if(exigeFotos(key)) return false; const c = cfgPopups()[key]; const on = c && typeof c.lote === "boolean" ? c.lote : lotePadrao(key); return on && camposSimples(camposDe(key)); }
const NOMES_LOTE = { liberar:"Liberar", aprovar:"Aprovar", reprovar:"Reprovar", corrigir:"Pendências corrigidas", finalizar:"Finalizar", aprovarDireto:"Aprovar direto", cancelar:"Cancelar" };
// células onde cada ação em lote pode ser feita agora: {acao: Map("id|chave" → {id, k, col})}
function loteElegiveis(){
  const out = {};
  unidadesObra().forEach(x => secoesUnidade(x, ME(), TODAS_FASES).forEach(s => s.acts.forEach(a => {
    if(a.a === "agendar" || !loteHabilitado(`${s.key}:${a.a}`)) return;
    (out[a.a] || (out[a.a] = new Map())).set(x.id + "|" + s.key, { id:x.id, k:s.key, col:s.col }); })));
  return out;
}
const loteDisponivel = () => Object.keys(loteElegiveis()).length > 0;
function loteBarHTML(){
  const L = S.lote, E = L.el || {}, acoes = Object.keys(E), n = L.q.length;
  return `<div class="lotebar"><b>Ações em lote</b>
    <select class="inp lote-sel" data-lote-acao aria-label="Ação">${acoes.map(a => `<option value="${a}" ${a === L.a ? "selected" : ""}>${esc(NOMES_LOTE[a] || a)} (${E[a].size})</option>`).join("")}</select>
    <span class="small">${L.a ? "Toque nas células marcadas para escolher." : ""} ${n} selecionada(s).</span>${n ? `<button class="linkbtn small" data-act="lotelimpar">Limpar</button>` : `<button class="linkbtn small" data-act="lotetodas">Marcar todas</button>`}<span class="spacer"></span>
    <button class="btn ghost sm" data-act="lotecancel">Cancelar</button><button class="btn primary sm" data-act="lotesalvar" ${n ? "" : "disabled"}>${esc(NOMES_LOTE[L.a] || "Executar")} ${n || ""}</button></div>`;
}
// célula da tabela no modo lote
function loteCelula(x, c, v){
  const L = S.lote, E = L.el && L.a && L.el[L.a], k = c.k; if(!E || !k) return null;
  const item = E.get(x.id + "|" + k); if(!item) return null;
  const q = L.q.some(z => z.id === x.id && z.col === k);
  return `<td class="c-st ${q ? "queued" : stClass(v) + " lote-ok"}" data-act="lotecell" data-id="${x.id}" data-col="${k}" style="cursor:copy">${q ? esc(NOMES_LOTE[L.a] || "") : esc(v)}</td>`;
}
function iniciarLote(){ const el = loteElegiveis(), acoes = Object.keys(el); S.lote = { on:true, q:[], el, a:acoes.includes("liberar") ? "liberar" : acoes[0] || null, conf:null }; S.menuAcoes = false; }
function popupLoteConf(){
  const L = S.lote, keys = [...new Set(L.q.map(z => `${z.col}:${L.a}`))], obs = keys.map(k => camposDe(k).find(c => c.tipo === "obs")).filter(Boolean), obrig = obs.some(c => c.obrig);
  return `<div class="modal" role="dialog" aria-modal="true" aria-label="Confirmar ação em lote"><div class="scrim" data-act="loteconffechar"></div><div class="box sm2">
    <div class="mhead"><div class="t"><b class="conf-t">${esc(NOMES_LOTE[L.a] || L.a)} em lote</b><div class="small muted">${L.q.length} item(ns) · ${[...new Set(L.q.map(z => z.id))].length} unidade(s)</div></div><button class="iconbtn" data-act="loteconffechar" aria-label="Fechar">${IC.close}</button></div>
    <div class="mbody">${obs.length ? `<div class="field"><label for="lote-obs">Observações${obrig ? ` <span class="obr">*</span>` : ""}</label><textarea class="inp" id="lote-obs" rows="3" placeholder="${obrig ? "Obrigatório" : "Opcional"} · vai em todas as tarefas">${esc(L.conf.obs)}</textarea></div>` : `<span class="muted">Confirma a ação nos itens selecionados?</span>`}</div>
    <div class="mfoot"><button class="btn primary" data-act="loteexec">${esc(NOMES_LOTE[L.a] || "Confirmar")} ${L.q.length}</button></div></div></div>`;
}
function executarLote(){
  const L = S.lote, obsTxt = (L.conf.obs || "").trim();
  const obrig = [...new Set(L.q.map(z => `${z.col}:${L.a}`))].some(k => (camposDe(k).find(c => c.tipo === "obs") || {}).obrig);
  if(obrig && !obsTxt){ toast("Erro", "Preencha as observações"); return; }
  let n = 0, pulou = 0;
  L.q.forEach(({ id, col }) => { const x = DB.unidades.find(u => u.id === id); if(!x){ pulou++; return; }
    const s = secoesUnidade(x, ME(), TODAS_FASES).find(z => z.key === col); if(!s || !s.acts.some(a => a.a === L.a) || !loteHabilitado(`${col}:${L.a}`)){ pulou++; return; }
    executarAcao(x, L.a, s.col, { autor:S.user, obs:obsTxt || "Ação em lote" }); n++; });
  saveDB(); S.lote = { on:false, q:[] };
  toast("Sucesso", `${n} ação(ões) feita(s) em lote`, pulou ? `${pulou} item(ns) mudaram antes e ficaram de fora` : "");
}

/* ---------- 3) EXPORTAR / BACKUP ---------- */
function abrirExport(){ S.exp = { obra:S.obraId || "", json:false }; S.adminPanel = false; }
function popupExport(){
  const E = S.exp, obras = [...DB.obras].sort((a, b) => a.ordem - b.ordem);
  return `<div class="modal" role="dialog" aria-modal="true" aria-label="Exportar dados"><div class="scrim" data-act="expfechar"></div><div class="box sm2">
    <div class="mhead"><div class="t"><b class="conf-t">Exportar dados</b><div class="small muted">Planilha Excel com unidades, histórico, áreas comuns, clientes e laudos</div></div><button class="iconbtn" data-act="expfechar" aria-label="Fechar">${IC.close}</button></div>
    <div class="mbody"><div class="field"><label for="exp-obra">Obra</label><select class="inp" id="exp-obra" data-exp="obra"><option value="">Todas as obras</option>${obras.map(o => `<option value="${o.id}" ${+E.obra === o.id ? "selected" : ""}>${esc(o.nome)}</option>`).join("")}</select></div>
      <label class="chk"><input type="checkbox" data-exp="json" ${E.json ? "checked" : ""}>Baixar também o backup completo (arquivo .json)</label>
      <span class="small muted">A planilha é para consultar e guardar. O backup .json tem todos os dados como estão no app (sem as assinaturas e os arquivos anexados, que ficam no Supabase) e serve para reconstruir os dados se precisar.</span></div>
    <div class="mfoot"><button class="btn primary btn-ic" data-act="expgerar">${IC.download}Baixar</button></div></div></div>`;
}
async function gerarExport(){
  const E = S.exp, oid = E.obra ? +E.obra : null, nObra = o => (obraById(o) || {}).nome || o;
  const fo = r => oid == null || r.id_obra === oid, dt = s => s ? fmtDTL(new Date(s)) : "";
  S.carregando = "Gerando a planilha..."; render();
  try{
    await carregarScript("js/vendor/xlsx.full.min.js");
    const um = new Map(DB.unidades.map(u => [u.id, u])), am = new Map(DB.areas.map(a => [a.id, a]));
    const unidades = DB.unidades.filter(fo).filter(u => !ehHall(u)).map(u => { const c = clienteById(u.id_cliente) || {}; 
      return { Obra:nObra(u.id_obra), Bloco:nivel1Nome(u), Pavimento:nivel2Nome(u), Unidade:u.unidade, Etapa:(ETAPA[u.sub_etapa] || {}).n || "", Cliente:c.nome || "", Telefone:c.telefone || "", "E-mail":c.email || "",
        "Teste Esgoto":u.rep_teste_esgoto, "Teste Água Fria":u.rep_teste_aguafria, "Teste Dreno":u.rep_teste_dreno, "Teste Gás":u.rep_teste_gas, "Teste Elétrico":u.rep_teste_eletrico,
        "Vistoria Qualidade":u.rep_vistoria_at, "Vistoria Prévia":u.rep_vistoria_previa, "Agendamento":u.agendamento, "Vistoria Cliente":u.rep_vistoria_cliente,
        Financeiro:finStatus(u), "Motivo financeiro":u.financeiro_motivo || "" }; });
    const hist = DB.tarefas.filter(fo).map(t => { const u = um.get(t.id_unidade) || {}; return { Obra:nObra(t.id_obra), Bloco:u.id ? nivel1Nome(u) : "", Unidade:u.unidade || "", Data:dt(t.data), Ação:t.acao, Coluna:t.coluna, "Etapa antes":(ETAPA[t.etapa_antiga] || {}).n || "", "Etapa depois":(ETAPA[t.etapa_nova] || {}).n || "",
      Repetição:t.repeticao ?? "", Observação:t.obs || "", Autor:nomeUsuario(t.autor), Agendamento:t.agendamento || "", Respostas:(t.campos || []).map(c => `${c.r}: ${c.v}`).join(" | "),
      Checklist:(t.checklist || []).filter(c => c.p ?? c.r !== "ok").map(c => `${c.item} (${c.rl || c.r})`).join(", "), Anexos:(t.anexos || []).map(a => a.nome).join(", ") }; });
    const areas = DB.areas.filter(fo).map(a => ({ Obra:nObra(a.id_obra), Área:a.descricao, Tipo:TIPOS_AREA[tipoArea(a)], Etapa:(ETAPA_AC[a.sub_etapa] || {}).n || "", "Vistoria Qualidade":a.rep_vistoria_qualidade, "Vistoria Arquitetura":a.rep_vistoria_arq, Agendamento:a.agendamento, "Vistoria Síndico":a.rep_vistoria_sindico }));
    const histAc = DB.tarefas_ac.filter(fo).map(t => ({ Obra:nObra(t.id_obra), Área:(am.get(t.id_local) || {}).descricao || "", Data:dt(t.data), Ação:t.acao, Coluna:t.coluna, Observação:t.obs || "", Autor:nomeUsuario(t.autor), Agendamento:t.agendamento || "" }));
    const clientes = DB.clientes.filter(c => oid == null || c.id_obra === oid).map(c => ({ Obra:c.id_obra ? nObra(c.id_obra) : "(sem obra)", Nome:c.nome, Telefone:c.telefone, "E-mail":c.email, Unidades:DB.unidades.filter(u => u.id_cliente === c.id).map(u => u.unidade).join(", ") }));
    const laudos = (DB.laudos || []).filter(fo).map(L => { const u = um.get(L.id_unidade) || {}; return { Obra:nObra(L.id_obra), Unidade:u.unidade || "", Engenheiro:L.engenheiro, Status:L.status, "Criado em":dt(L.criado_em), "Recebido em":dt(L.recebido_em), Observação:L.obs || "" }; });
    const wb = XLSX.utils.book_new(), add = (nome, L) => { const ws = XLSX.utils.json_to_sheet(L.length ? L : [{ "(vazio)":"" }]); XLSX.utils.book_append_sheet(wb, ws, nome); };
    add("Unidades", unidades); add("Histórico unidades", hist); add("Áreas comuns", areas); add("Histórico áreas", histAc); add("Clientes", clientes); add("Laudos", laudos);
    const dia = fmtData(new Date()).replace(/\//g, "-"), nome = oid ? `Gestor de Entrega - ${nObra(oid)} - ${dia}` : `Gestor de Entrega - todas as obras - ${dia}`;
    XLSX.writeFile(wb, nome + ".xlsx");
    if(E.json){ const dados = { gerado_em:new Date().toISOString(), por:REAL_USER, versao:VERSAO, obra:oid,
        obras:DB.obras.filter(o => oid == null || o.id === oid), locais:DB.locais.filter(fo), unidades:DB.unidades.filter(fo), areas:DB.areas.filter(fo), clientes:DB.clientes.filter(c => oid == null || c.id_obra === oid || c.id_obra == null),
        tarefas:DB.tarefas.filter(fo).map(({ assinatura, ...t }) => t), tarefas_ac:DB.tarefas_ac.filter(fo).map(({ assinatura, ...t }) => t), horarios:DB.horarios.filter(fo), horarios_excecoes:(DB.horarios_excecoes || []).filter(fo), laudos:(DB.laudos || []).filter(fo), config:DB.config || {} };
      const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify(dados)], { type:"application/json" })); a.download = `backup ${nome}.json`; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000); }
    S.exp = null; toast("Sucesso", "Dados exportados", nome);
  }catch(e){ toast("Erro", "Não foi possível exportar", msgErro(e)); }
  S.carregando = "";
}

/* ---------- 4) OBRAS (admin) ---------- */
function abrirObrasAdm(){ S.oadm = { nova:null }; S.adminPanel = false; S.voltarOadm = S.obraId ? S.screen : "home"; S.screen = "obrasadm"; S.nav = false; S.popup = null; }
function telaObrasAdm(){
  const O = S.oadm, L = [...DB.obras].sort((a, b) => a.ordem - b.ordem), N = O.nova;
  const head = `<header class="topbar"><button class="iconbtn" data-act="oadmvoltar" aria-label="Voltar">${IC.back}</button><h1>Obras</h1>${N ? "" : `<button class="tb-btn" data-act="oadmnova">${IC.plus}<span>Nova obra</span></button>`}</header><div class="topspace"></div>`;
  const form = N ? `<section class="panel oadm-nova"><h2 class="h3" style="margin:0">Nova obra</h2><div class="row2"><div class="field"><label for="oadm-nome">Nome</label><input class="inp" id="oadm-nome" data-oadm="nome" value="${esc(N.nome)}" placeholder="Ex.: Porto Aurora"></div>
      <div class="field"><label for="oadm-cid">Cidade</label><input class="inp" id="oadm-cid" data-oadm="cidade" value="${esc(N.cidade)}" placeholder="Ex.: Curitiba, PR"></div></div>
      <div class="field"><label>Tipo</label><div class="seg" style="align-self:flex-start"><button class="${N.tipo === "predio" ? "on" : ""}" data-act="oadmtipo" data-v="predio">Prédio</button><button class="${N.tipo === "casa" ? "on" : ""}" data-act="oadmtipo" data-v="casa">Casas</button></div></div>
      <span class="small muted">Depois de criar, entre na obra e cadastre os blocos em Obra, os horários e, em Configurações Gerais, a foto e os testes. Ninguém além dos admins vê a obra até você dar acesso em Usuários.</span>
      <div class="row"><span class="spacer"></span><button class="btn ghost" data-act="oadmcancelar">Cancelar</button><button class="btn primary" data-act="oadmcriar">Criar obra</button></div></section>` : "";
  const nU = o => DB.unidades.filter(u => u.id_obra === o.id && !ehHall(u)).length;
  return head + `<main class="screen oadm"><div class="oadm-wrap">${form}
    <section class="panel oadm-lista"><div class="oadm-h small muted"><span>Ordem</span><span>Nome</span><span>Cidade</span><span>Unidades</span><span>Ativa</span></div>
      ${L.map((o, i) => `<div class="oadm-row ${o.ativa === false ? "inativa" : ""}"><span class="oadm-ord"><button class="iconbtn" data-act="oadmmov" data-id="${o.id}" data-d="-1" aria-label="Subir" ${i ? "" : "disabled"}>${IC.chevU}</button><button class="iconbtn" data-act="oadmmov" data-id="${o.id}" data-d="1" aria-label="Descer" ${i < L.length - 1 ? "" : "disabled"}>${IC.chevD}</button></span>
        <input class="inp" data-oedit="nome" data-id="${o.id}" value="${esc(o.nome)}" aria-label="Nome"><input class="inp" data-oedit="cidade" data-id="${o.id}" value="${esc(o.cidade || "")}" aria-label="Cidade">
        <span class="tnum muted">${nU(o)}</span><label class="sw"><input type="checkbox" data-oedit="ativa" data-id="${o.id}" ${o.ativa !== false ? "checked" : ""}><span></span></label></div>`).join("")}
      <span class="small muted">Obra inativa some da tela inicial para quem não é admin. Nada é apagado.</span></section></div></main>`;
}
API.criarObra = async function(o){
  if(MODO_DEMO){ o.id = Math.max(0, ...DB.obras.map(x => x.id)) + 1; DB.obras.push(o); salvarLocal(); return o; }
  const { data, error } = await sb.from("obras").insert({ nome:o.nome, cidade:o.cidade, ordem:o.ordem, ativa:true, config:o.config }).select().single();
  if(error) throw error;
  const nova = { ...data, hue:HUES[DB.obras.length % HUES.length], usuarios:"" }; DB.obras.push(nova);
  API.snap.obras && API.snap.obras.set(nova.id, fotoLinha("obras", nova)); return nova;
};

/* ---------- cliques ---------- */
Object.assign(ACOES_EXTRA, {
  exportar(){ if(!can(userByLogin(REAL_USER), "admin")) return; abrirExport(); },
  expfechar(){ S.exp = null; },
  expgerar(){ return gerarExport(); },
  obrasadm(){ if(!can(userByLogin(REAL_USER), "admin")) return; abrirObrasAdm(); },
  oadmvoltar(){ S.oadm = null; S.screen = S.obraId ? (S.voltarOadm || "unidades") : "home"; },
  oadmnova(){ S.oadm.nova = { nome:"", cidade:"", tipo:"predio" }; setTimeout(() => { const i = document.getElementById("oadm-nome"), f = document.activeElement; if(i && (!f || !/INPUT|TEXTAREA|SELECT/.test(f.tagName))) i.focus(); }, 30); },
  oadmcancelar(){ S.oadm.nova = null; },
  oadmtipo(el){ S.oadm.nova.tipo = el.dataset.v; },
  async oadmcriar(){ const N = S.oadm.nova, nome = (N.nome || "").trim(); if(!nome){ toast("Erro", "Informe o nome da obra"); return; }
    if(DB.obras.some(o => o.nome.toLowerCase() === nome.toLowerCase())){ toast("Erro", "Já existe uma obra com esse nome"); return; }
    const cfg = { tipo:N.tipo, testes:["esgoto","aguafria","dreno","gas","eletrico"], previa:false, aprovarDireto:false, ...(N.tipo === "casa" ? { casasPorLinha:8 } : {}) };
    S.carregando = "Criando a obra..."; render();
    try{ const o = await API.criarObra({ nome, cidade:(N.cidade || "").trim(), ordem:Math.max(0, ...DB.obras.map(x => x.ordem || 0)) + 1, ativa:true, config:cfg }); S.oadm.nova = null; toast("Sucesso", "Obra criada", o.nome); }
    catch(e){ toast("Erro", "Não foi possível criar a obra", msgErro(e)); }
    S.carregando = ""; },
  oadmmov(el){ const L = [...DB.obras].sort((a, b) => a.ordem - b.ordem), i = L.findIndex(o => o.id === +el.dataset.id), j = i + +el.dataset.d; if(j < 0 || j >= L.length) return;
    [L[i], L[j]] = [L[j], L[i]]; L.forEach((o, k) => { o.ordem = k + 1; }); saveDB(); },
  // ações em lote
  loteon(){ iniciarLote(); if(!S.lote.a){ S.lote = { on:false, q:[] }; toast("Aviso", "Nenhuma ação em lote disponível agora"); } },
  lotelimpar(){ S.lote.q = []; },
  lotetodas(){ const E = S.lote.el[S.lote.a]; if(E) S.lote.q = [...E.values()].map(z => ({ id:z.id, col:z.k })); },
  lotesalvar(){ if(S.lote.q.length) S.lote.conf = { obs:"" }; },
  loteconffechar(){ S.lote.conf = null; },
  loteexec(){ executarLote(); }
});
INPUT_EXTRA.push((t, ev) => {
  if(t.dataset.exp && S.exp){ S.exp[t.dataset.exp] = t.type === "checkbox" ? t.checked : t.value; return true; }
  if(t.dataset.oadm && S.oadm && S.oadm.nova){ S.oadm.nova[t.dataset.oadm] = t.value; return true; }
  if(t.dataset.oedit && ev === "change"){ const o = obraById(+t.dataset.id); if(!o) return true; const f = t.dataset.oedit;
    if(f === "ativa") o.ativa = t.checked; else { const v = t.value.trim(); if(!v && f === "nome"){ toast("Erro", "A obra precisa de um nome"); return "render"; } o[f] = v; }
    saveDB(); toast("Sucesso", "Obra atualizada", o.nome); return "render"; }
  if(t.dataset.oedit) return true;
  if(t.hasAttribute && t.hasAttribute("data-lote-acao") && ev === "change"){ S.lote.a = t.value; S.lote.q = []; return "render"; }
  if(t.id === "lote-obs" && S.lote && S.lote.conf){ S.lote.conf.obs = t.value; return true; }
  return false;
});
