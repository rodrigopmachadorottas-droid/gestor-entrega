/* =====================================================================
   ANÁLISE FINANCEIRA por unidade (admin ou função Financeiro)
   Unidade com cliente começa "Pendente" (nunca em branco). Liberado e
   Bloqueado pedem um motivo. Dá para editar na tabela ou importar uma
   planilha (Bloco, Unidade, Status, Motivo): a importação só preenche a
   tabela; nada é gravado antes de clicar em Salvar.
   ===================================================================== */
const FIN_STATUS = ["Pendente", "Liberado", "Bloqueado"];
const FIN_MOTIVOS = { Liberado:["Quitado, não necessita termo", "Termo assinado", "Permuta"], Bloqueado:["Pendente assinatura do termo", "Pendente assinatura financiamento", "Inadimplente"] };
const finStatus = u => u.financeiro_status || (u.id_cliente ? "Pendente" : "");
const podeFinanceiro = u => can(u, "admin", "financeiro");
const normTxt = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

function finRasc(){ return (S.fin = S.fin || { busca:"", filtro:"todos", rasc:{}, imp:null }); }
const finAtual = x => { const r = finRasc().rasc[x.id]; return r || { status:finStatus(x), motivo:x.financeiro_motivo || "" }; };
const finMudou = x => { const r = finRasc().rasc[x.id]; return !!r && (r.status !== finStatus(x) || r.motivo !== (x.financeiro_motivo || "")); };

function telaFinanceiro(){
  const F = finRasc(), q = F.busca.trim().toLowerCase();
  const todas = ordenarUnidades(unidadesObra().filter(x => !/^HALL/i.test(x.unidade)));
  const sit = x => x.id_cliente ? finAtual(x).status : "Sem cliente";
  const cnt = k => todas.filter(x => k === "todos" || sit(x) === k).length;
  const lista = todas.filter(x => (F.filtro === "todos" || sit(x) === F.filtro) && (!q || bateBusca(x, q) || (clienteById(x.id_cliente) || { nome:"" }).nome.toLowerCase().includes(q)));
  const mud = todas.filter(finMudou).length;
  const right = `<button class="tb-btn" data-act="finimp" title="Importar uma planilha com o status financeiro">${IC.upload}<span>Importar planilha</span></button>
    <button class="tb-btn" data-act="finsalvar" ${mud ? "" : "disabled"}>${IC.check}<span>Salvar${mud ? ` (${mud})` : ""}</span></button>`;
  const chip = (k, t, cls) => `<button class="chip ${F.filtro === k ? "on" : ""}" data-act="finfiltro" data-v="${k}">${cls ? `<i class="dot ${cls}"></i>` : ""}${t} <b class="tnum">${cnt(k)}</b></button>`;
  const linha = x => { const c = clienteById(x.id_cliente), a = finAtual(x), mot = FIN_MOTIVOS[a.status] || [];
    return `<tr class="${finMudou(x) ? "mod" : ""}"><td>${esc(nivel1Nome(x))}</td><td><b>${esc(x.unidade)}</b></td><td class="l">${c ? esc(tituloCase(c.nome)) : `<span class="muted">Sem cliente</span>`}</td>
      <td>${c ? `<select class="inp fin-sel st-${a.status.toLowerCase()}" data-finst="${x.id}" aria-label="Status de ${esc(x.unidade)}">${FIN_STATUS.map(s => `<option ${s === a.status ? "selected" : ""}>${s}</option>`).join("")}</select>` : "-"}</td>
      <td>${c && mot.length ? `<select class="inp fin-sel ${a.motivo ? "" : "falta"}" data-finmot="${x.id}" aria-label="Motivo de ${esc(x.unidade)}"><option value="">Escolha o motivo</option>${mot.map(m => `<option ${m === a.motivo ? "selected" : ""}>${esc(m)}</option>`).join("")}${a.motivo && !mot.includes(a.motivo) ? `<option value="${esc(a.motivo)}" selected>${esc(a.motivo)} (antigo, fora da lista)</option>` : ""}</select>` : `<span class="muted">-</span>`}</td></tr>`; };
  return topbar("Análise Financeira", right) + `<main class="screen fin">
    <div class="row fin-top">${buscaBox("finBusca", F.busca, "Pesquisar unidade ou cliente")}<div class="hor-cfgs">${chip("todos", "Todas")}${chip("Pendente", "Pendente", "fs-warn")}${chip("Liberado", "Liberado", "fs-ok")}${chip("Bloqueado", "Bloqueado", "fs-bad")}${chip("Sem cliente", "Sem cliente", "fs-neu")}</div>
      ${mud ? `<span class="spacer"></span><button class="btn sm ghost" data-act="findesfazer">Desfazer alterações</button>` : ""}</div>
    ${lista.length ? `<div class="panel fin-tab"><table class="list"><thead><tr><th>Bloco</th><th>Unidade</th><th>Cliente</th><th>Status</th><th>Motivo</th></tr></thead><tbody>${lista.map(linha).join("")}</tbody></table></div>`
      : `<div class="panel empty"><b>Nenhuma unidade</b><span>Mude o filtro ou a busca.</span></div>`}
    <span class="small muted">Unidade com cliente começa como Pendente. Liberado e Bloqueado precisam de motivo. As alterações só valem depois de Salvar.</span></main>${F.imp ? popupFinImp() : ""}`;
}

/* ---------- importação ---------- */
const COLS_FIN = { bloco:["bloco","quadra","torre"], unidade:["unidade","apto","apartamento","casa","und"], status:["status","situacao","situacaofinanceira","analisefinanceira","financeiro"], motivo:["motivo","observacao","obs"] };
async function lerPlanilhaFin(file){
  const I = finRasc().imp; Object.assign(I, { lendo:true, arq:file.name, erro:"", linhas:null }); render();
  try{
    await carregarScript("js/vendor/xlsx.full.min.js");
    const wb = XLSX.read(await file.arrayBuffer(), { type:"array" }), ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { header:1, defval:"", raw:false });
    const h = rows.findIndex(r => r.some(c => COLS_FIN.unidade.includes(normCab(c))) && r.some(c => COLS_FIN.status.includes(normCab(c))));
    if(h < 0) throw new Error('Não encontrei as colunas "Unidade" e "Status" na primeira aba. Use o modelo.');
    const cab = rows[h].map(normCab), idx = {}; Object.entries(COLS_FIN).forEach(([k, al]) => { idx[k] = cab.findIndex(c => al.includes(c)); });
    const vistas = new Set();
    I.linhas = rows.slice(h + 1).map((r, i) => [r, h + i + 2]).filter(([r]) => r.some(c => String(c).trim())).map(([r, lin]) => {
      const g = k => idx[k] >= 0 ? String(r[idx[k]] ?? "").trim() : "";
      const o = { lin, bloco:g("bloco"), unidade:g("unidade"), status:"", motivo:"", erros:[], avisos:[] };
      const u = acharUnidade(o.bloco, o.unidade);
      if(!o.unidade) o.erros.push("sem unidade"); else if(u === "varias") o.erros.push("unidade em mais de um bloco: informe o bloco"); else if(!u) o.erros.push("unidade não encontrada");
      else if(!u.id_cliente) o.erros.push("unidade sem cliente"); else if(vistas.has(u.id)) o.erros.push("unidade repetida"); else { o.und = u; vistas.add(u.id); }
      const st = FIN_STATUS.find(s => normTxt(s) === normTxt(g("status")));
      if(!st) o.erros.push(g("status") ? `status "${g("status")}" inválido` : "sem status"); else o.status = st;
      if(st && st !== "Pendente"){ const m = g("motivo"), op = FIN_MOTIVOS[st], ok = op.find(x => normTxt(x) === normTxt(m)) || (m && op.find(x => normTxt(x).includes(normTxt(m)) || normTxt(m).includes(normTxt(x))));
        if(!m) o.erros.push("falta o motivo"); else if(!ok) o.erros.push(`motivo inválido para ${st}`); else o.motivo = ok; }
      if(o.und && !o.erros.length && o.status === finStatus(o.und) && o.motivo === (o.und.financeiro_motivo || "")) o.igual = true;
      return o; });
    if(!I.linhas.length) throw new Error("A planilha não tem linhas abaixo dos títulos.");
  }catch(e){ I.erro = msgErro(e); }
  I.lendo = false; render();
}
function popupFinImp(){
  const I = S.fin.imp, L = I.linhas, ok = L ? L.filter(o => !o.erros.length && !o.igual) : [], err = L ? L.filter(o => o.erros.length) : [], igual = L ? L.filter(o => o.igual) : [];
  const mots = Object.entries(FIN_MOTIVOS).map(([s, l]) => l.map(m => `<tr><td>${s}</td><td>${esc(m)}</td></tr>`).join("")).join("");
  return `<div class="modal" role="dialog" aria-modal="true" aria-label="Importar análise financeira"><div class="scrim" data-act="finimpfechar"></div><div class="box tall">
    <div class="mhead"><div class="t"><b class="conf-t">Importar análise financeira</b><div class="small muted">Obra ${esc(OBRA().nome)}</div></div><button class="iconbtn" data-act="finimpfechar" aria-label="Fechar">${IC.close}</button></div>
    <div class="mbody"><div class="imp-help"><b>Padrão da planilha</b> <span class="small muted">(primeira aba)</span>
      <table class="imp-tab"><thead><tr><th>Bloco</th><th>Unidade *</th><th>Status *</th><th>Motivo</th></tr></thead><tbody><tr><td>A</td><td>101</td><td>Liberado</td><td>Termo assinado</td></tr><tr><td>B</td><td>204</td><td>Pendente</td><td></td></tr></tbody></table>
      <details class="small"><summary>Motivos válidos</summary><table class="imp-tab"><tbody>${mots}</tbody></table><span class="muted">Pendente não tem motivo.</span></details>
      <span class="small muted">O modelo já vem com todas as unidades com cliente desta obra e o status atual: é só preencher e importar. Nada é gravado até você clicar em Salvar na tela.</span>
      <div class="row" style="margin-top:8px"><button class="btn sm ghost" data-act="finmodelo">Baixar modelo</button><label class="btn sm primary">${IC.upload}${I.arq ? "Trocar arquivo" : "Escolher arquivo"}<input type="file" id="fin-arq" accept=".xlsx,.xls,.csv" hidden></label>${I.arq ? `<span class="small">${esc(I.arq)}</span>` : ""}</div></div>
    ${I.lendo ? `<div class="row"><span class="spin" aria-hidden="true"></span>Lendo a planilha...</div>` : ""}${I.erro ? `<div class="auth-msg bad">${esc(I.erro)}</div>` : ""}
    ${L ? `<div class="imp-res"><span class="pill s-ok">${ok.length} alteração(ões)</span>${igual.length ? `<span class="pill s-neutral">${igual.length} sem mudança</span>` : ""}${err.length ? `<span class="pill s-bad">${err.length} com erro</span>` : ""}</div>
      <div class="imp-scroll"><table class="imp-tab"><thead><tr><th>Linha</th><th>Unidade</th><th>Status</th><th>Motivo</th><th>Situação</th></tr></thead><tbody>
      ${L.map(o => `<tr class="${o.erros.length ? "err" : o.igual ? "dup" : ""}"><td>${o.lin}</td><td>${o.und ? esc(nivel1Nome(o.und) + " · " + o.und.unidade) : esc([o.bloco, o.unidade].filter(Boolean).join(" "))}</td><td>${esc(o.status)}</td><td>${esc(o.motivo)}</td>
        <td>${o.erros.length ? esc("Erro: " + o.erros.join(", ")) : o.igual ? "Sem mudança" : "Ok"}</td></tr>`).join("")}</tbody></table></div>` : ""}</div>
    ${ok.length ? `<div class="mfoot"><span class="small muted">As linhas com erro ficam de fora.</span><span class="spacer"></span><button class="btn primary" data-act="finimpok">Levar ${ok.length} para a tabela</button></div>` : ""}</div></div>`;
}
async function baixarModeloFin(){
  try{
    await carregarScript("js/vendor/xlsx.full.min.js");
    const us = ordenarUnidades(unidadesObra().filter(x => x.id_cliente && !/^HALL/i.test(x.unidade)));
    const ws = XLSX.utils.aoa_to_sheet([["Bloco", "Unidade", "Cliente", "Status", "Motivo"], ...us.map(x => [nivel1Nome(x).replace(/^(Bloco|Quadra) /, ""), x.unidade.replace(/^(AP|CASA) /, ""), tituloCase((clienteById(x.id_cliente) || {}).nome || ""), finStatus(x), x.financeiro_motivo || ""])]);
    ws["!cols"] = [{ wch:8 }, { wch:10 }, { wch:34 }, { wch:12 }, { wch:36 }];
    const wm = XLSX.utils.aoa_to_sheet([["Status", "Motivo"], ["Pendente", "(sem motivo)"], ...Object.entries(FIN_MOTIVOS).flatMap(([s, l]) => l.map(m => [s, m]))]); wm["!cols"] = [{ wch:12 }, { wch:36 }];
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Financeiro"); XLSX.utils.book_append_sheet(wb, wm, "Motivos válidos");
    XLSX.writeFile(wb, `financeiro-${normTxt(OBRA().nome).replace(/ /g, "-")}.xlsx`);
  }catch(e){ toast("Erro", "Não foi possível gerar o modelo", msgErro(e)); }
}

/* ---------- gravar ---------- */
API.salvarFinanceiro = async function(itens){
  if(MODO_DEMO){
    itens.forEach(it => { const x = DB.unidades.find(u => u.id === it.id); x.financeiro_status = it.status; x.financeiro_motivo = it.status === "Pendente" ? "" : it.motivo;
      DB.tarefas.push({ id:nextId("tarefas"), id_obra:x.id_obra, id_unidade:x.id, acao:"financeiro", etapa_antiga:x.sub_etapa, etapa_nova:x.sub_etapa, obs:it.status + (x.financeiro_motivo ? " · " + x.financeiro_motivo : ""), repeticao:null, coluna:"financeiro", autor:S.user, data:new Date().toISOString(), agendamento:"" }); });
    salvarLocal(); return;
  }
  for(let i = 0; i < itens.length; i += 500){
    const { data, error } = await sb.rpc("salvar_financeiro", { p_itens:itens.slice(i, i + 500) });
    if(error) throw error;
    (data || []).forEach(r => { const x = DB.unidades.find(u => u.id === r.linha.id); if(x){ x.financeiro_status = r.linha.financeiro_status; x.financeiro_motivo = r.linha.financeiro_motivo; } DB.tarefas.push(normTarefa(r.tarefa)); });
  }
};
async function salvarFin(){
  const us = unidadesObra().filter(finMudou), itens = us.map(x => ({ id:x.id, ...finAtual(x) }));
  const falta = itens.find(it => it.status !== "Pendente" && !it.motivo);
  if(falta){ const x = us.find(u => u.id === falta.id); toast("Erro", "Falta o motivo", `${nivel1Nome(x)} · ${x.unidade} (${falta.status})`); return; }
  S.carregando = "Salvando a análise financeira..."; render();
  try{ await API.salvarFinanceiro(itens); S.fin.rasc = {}; toast("Sucesso", `${itens.length} unidade(s) atualizada(s)`); }
  catch(e){ toast("Erro", "Não foi possível salvar", msgErro(e)); }
  S.carregando = "";
}

Object.assign(ACOES_EXTRA, {
  finfiltro(el){ finRasc().filtro = el.dataset.v; },
  findesfazer(){ finRasc().rasc = {}; },
  finsalvar(){ return salvarFin(); },
  finimp(){ finRasc().imp = { arq:null, linhas:null, erro:"", lendo:false }; carregarScript("js/vendor/xlsx.full.min.js").catch(() => {}); },
  finimpfechar(){ S.fin.imp = null; },
  finmodelo(){ baixarModeloFin(); },
  finimpok(){ const F = S.fin; let n = 0; F.imp.linhas.filter(o => !o.erros.length && !o.igual).forEach(o => { F.rasc[o.und.id] = { status:o.status, motivo:o.motivo }; n++; });
    F.imp = null; F.filtro = "todos"; toast("Sucesso", `${n} unidade(s) preenchida(s) na tabela`, "Confira e clique em Salvar para gravar."); }
});
INPUT_EXTRA.push((t, ev) => {
  if(t.dataset.bind === "finBusca"){ finRasc().busca = t.value; return "render"; }
  if(t.dataset.finst != null && ev === "change"){ const x = DB.unidades.find(u => u.id === +t.dataset.finst), a = finAtual(x), st = t.value;
    finRasc().rasc[x.id] = { status:st, motivo:(FIN_MOTIVOS[st] || []).includes(a.motivo) ? a.motivo : "" }; return "render"; }
  if(t.dataset.finmot != null && ev === "change"){ const x = DB.unidades.find(u => u.id === +t.dataset.finmot); finRasc().rasc[x.id] = { ...finAtual(x), motivo:t.value }; return "render"; }
  if(t.id === "fin-arq" && ev === "change" && t.files[0]){ lerPlanilhaFin(t.files[0]); t.value = ""; return true; }
  return false;
});
